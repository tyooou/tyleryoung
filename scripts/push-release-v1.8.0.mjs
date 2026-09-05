#!/usr/bin/env node
// One-off: adds the v1.8.0 release doc and bumps every existing one's
// `order` by 1 to make room. Not part of any recurring sync — run manually
// with SANITY_WRITE_TOKEN set (e.g. in .env.local).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

const NEW_RELEASE = {
  version: "v1.8.0",
  date: "05/09/2026",
  title: "Photo-gallery tabs, a smarter editor gutter, and pane/sidebar polish.",
  order: 0,
  completed: [
    "Each experience's photos now open as their own tab with a prev/next viewer and thumbnail strip, instead of an inline grid squeezed onto the entry page.",
    "The editor's line-number gutter now tracks each open page's real scroll height and position instead of showing a fixed static count.",
    "Split panes now animate open and closed, the active pane's current tab is visually distinguished, and reopening a tab that's already open in another pane focuses it instead of duplicating it.",
    "The sidebar file tree and activity bar now highlight whichever tab is currently open, and folder sections animate open/closed instead of snapping.",
    "The terminal's LeetCode directory is now organized into year/month folders instead of one flat list.",
    "tyouAI's chat history list now shows relative timestamps and animates open/closed.",
    "The visitor counter now shows the count inline instead of only on hover, alongside a general accent-colour polish across the sidebar, tab bar, terminal, and chat panel.",
  ],
  planned: [
    "Add new, better and more impressive projects.",
    "Design revamp (?)",
  ],
};

async function main() {
  const existing = await client.fetch('*[_type == "release"]{_id, order}');
  const tx = client.transaction();
  for (const doc of existing) {
    tx.patch(doc._id, { set: { order: doc.order + 1 } });
  }
  tx.create({ _type: "release", ...NEW_RELEASE });
  await tx.commit();
  console.log(`Bumped ${existing.length} existing releases, created 1 new one.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
