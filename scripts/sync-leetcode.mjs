#!/usr/bin/env node
// Pulls the problem list from the tyooou/leetcode GitHub repo and syncs it
// into Sanity as leetcodeProblem docs. Re-run this whenever new write-ups
// are pushed to that repo — the live site reads from Sanity, not GitHub, so
// nothing shows up until this has run. Safe to run repeatedly: matches by a
// deterministic _id derived from the file path, and removes any Sanity docs
// for problems that no longer exist in the repo (renamed/deleted).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";
import fm from "front-matter";
import { fetchLeetcodeProblemsFromGitHub, fetchProblemMarkdown } from "../src/lib/leetcode.js";

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

function idForPath(problemPath) {
  return `leetcodeProblem-${problemPath.replace(/[^a-zA-Z0-9]/g, "-")}`;
}

async function main() {
  const problems = await fetchLeetcodeProblemsFromGitHub(process.env.GITHUB_TOKEN);
  if (problems.length === 0) {
    console.error("No problems found on GitHub — aborting without touching Sanity.");
    process.exit(1);
  }

  // The git tree listing only gives us path/year/month/number/title — pull
  // the actual solve date and difficulty out of each write-up's frontmatter
  // (raw.githubusercontent.com, so this doesn't touch the API rate limit).
  const enriched = await Promise.all(
    problems.map(async (problem) => {
      try {
        const raw = await fetchProblemMarkdown(problem.path);
        const { attributes } = fm(raw);
        const date =
          attributes.date instanceof Date
            ? attributes.date.toISOString().slice(0, 10)
            : attributes.date || undefined;
        return { ...problem, date, difficulty: attributes.difficulty || undefined };
      } catch {
        return problem;
      }
    }),
  );

  const tx = client.transaction();
  for (const problem of enriched) {
    tx.createOrReplace({
      _id: idForPath(problem.path),
      _type: "leetcodeProblem",
      ...problem,
    });
  }
  await tx.commit();
  console.log(`Synced ${enriched.length} problems.`);

  const currentIds = new Set(enriched.map((p) => idForPath(p.path)));
  const existing = await client.fetch(`*[_type == "leetcodeProblem"]{ _id }`);
  const staleIds = existing.map((d) => d._id).filter((id) => !currentIds.has(id));
  if (staleIds.length > 0) {
    await client.delete({ query: `*[_id in $ids]`, params: { ids: staleIds } });
    console.log(`Removed ${staleIds.length} stale problem(s) no longer in the repo.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
