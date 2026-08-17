#!/usr/bin/env node
// One-time migration: copies the existing public/*.json content, project
// READMEs, and release notes into a Sanity project. Run manually, once,
// after the Sanity project exists and SANITY_WRITE_TOKEN /
// VITE_SANITY_PROJECT_ID / VITE_SANITY_DATASET are set (e.g. in .env.local).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const { VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET, SANITY_WRITE_TOKEN } = process.env;
if (!VITE_SANITY_PROJECT_ID || !SANITY_WRITE_TOKEN) {
  console.error(
    "Missing VITE_SANITY_PROJECT_ID and/or SANITY_WRITE_TOKEN — set them in .env.local before running this script.",
  );
  process.exit(1);
}

const client = createClient({
  projectId: VITE_SANITY_PROJECT_ID,
  dataset: VITE_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: SANITY_WRITE_TOKEN,
  useCdn: false,
});

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), "utf-8"));
}

async function seedBooks() {
  const books = readJson("public/books.json");
  for (const book of books) {
    await client.create({ _type: "book", ...book });
  }
  console.log(`Seeded ${books.length} books.`);
}

async function seedFriends() {
  const friends = readJson("public/friends.json");
  for (const friend of friends) {
    await client.create({ _type: "friend", ...friend });
  }
  console.log(`Seeded ${friends.length} friends.`);
}

async function seedExperience() {
  const experience = readJson("public/experience.json");
  for (const entry of experience) {
    await client.create({ _type: "experience", ...entry });
  }
  console.log(`Seeded ${experience.length} experience entries.`);
}

async function seedPages() {
  const pages = readJson("public/pages.json");
  for (const page of pages) {
    await client.create({ _type: "page", ...page });
  }
  console.log(`Seeded ${pages.length} pages.`);
}

async function uploadMediaFile(slug, filename) {
  const filePath = path.join(root, "public/projects", slug, filename);
  const stream = fs.createReadStream(filePath);
  const asset = await client.assets.upload("file", stream, { filename });
  return { _type: "file", _key: filename, asset: { _type: "reference", _ref: asset._id } };
}

async function seedProjects() {
  const { activeProjects } = readJson("public/projects/projects.json");
  const projectsDir = path.join(root, "public/projects");
  const slugs = fs
    .readdirSync(projectsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  for (const slug of slugs) {
    const readmePath = path.join(projectsDir, slug, "README.md");
    if (!fs.existsSync(readmePath)) continue;
    const raw = fs.readFileSync(readmePath, "utf-8");
    const { data, content } = matter(raw);

    const media = [];
    for (const filename of data.media || []) {
      console.log(`  uploading ${slug}/${filename}...`);
      media.push(await uploadMediaFile(slug, filename));
    }

    await client.create({
      _type: "project",
      name: { _type: "slug", current: data.name || slug },
      title: data.title,
      subtitle: data.subtitle,
      body: content.trim(),
      techStack: data.techStack || [],
      code: data.code,
      preview: data.preview,
      active: activeProjects.includes(slug),
      media,
    });
    console.log(`Seeded project "${slug}".`);
  }
}

async function seedReleases() {
  const { versions } = readJson("public/releaseNotes/versions.json");
  for (let i = 0; i < versions.length; i++) {
    const slug = versions[i];
    const raw = fs.readFileSync(path.join(root, "public/releaseNotes", `${slug}.md`), "utf-8");
    const { data, content } = matter(raw);
    const sections = content.split("## ").filter(Boolean);
    const extractList = (name) =>
      sections
        .find((s) => s.startsWith(name))
        ?.split("\n")
        .slice(1)
        .filter((line) => line.trim().startsWith("-"))
        .map((line) => line.trim().substring(2)) || [];

    await client.create({
      _type: "release",
      version: data.version,
      date: data.date,
      title: data.title,
      completed: extractList("Completed"),
      planned: extractList("Planned"),
      order: versions.length - 1 - i, // last entry in the list (newest) -> order 0
    });
  }
  console.log(`Seeded ${versions.length} releases.`);
}

async function main() {
  await seedBooks();
  await seedFriends();
  await seedExperience();
  await seedPages();
  await seedReleases();
  await seedProjects();
  console.log(
    "\nDone. Review the documents in Sanity Studio (/admin) before deleting the old public/ data files.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
