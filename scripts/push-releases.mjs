#!/usr/bin/env node
// One-off: adds new `release` docs and bumps every existing one's `order`
// by 2 to make room. Not part of any recurring sync — run manually with
// SANITY_WRITE_TOKEN set (e.g. in .env.local).
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

const NEW_RELEASES = [
  {
    version: "v1.7.0",
    date: "05/09/2026",
    title: "tyouAI: an in-browser AI chat panel, plus an integrated terminal.",
    order: 0,
    completed: [
      "Added tyouAI, an AI chat panel that runs an LLM entirely client-side via WebGPU, in a Web Worker so generation never blocks the UI. Desktop-only, and not loaded at all on unsupported browsers.",
      "Added a real integrated terminal with ls/cd-style commands over a virtual filesystem built from the same CMS data the sidebar uses, with multiple sessions and split view.",
      "Both panels are wired into the header toggle buttons, the command palette, and the guided tour.",
      "Code blocks in tyouAI's replies and LeetCode write-ups are now syntax highlighted.",
    ],
    planned: [
      "Add new, better and more impressive projects.",
      "Design revamp (?)",
    ],
  },
  {
    version: "v1.6.5",
    date: "30/08/2026",
    title: "Rebrand touch-ups and editor polish.",
    order: 1,
    completed: [
      "Replaced the footer/tab favicon with a new brand mark, and the loading spinner with a matching animation.",
      "Added a visitor counter to the header.",
      "Fixed the theme switcher animating every element's colour transition from the previous theme instead of swapping instantly.",
      "Fixed the tab bar's scrollbar thumb not tracking the AI/terminal panels opening, the sidebar resizing, or split-view ratio changes.",
      "LeetCode heatmap now rings today's cell and shows upcoming days as a dashed placeholder instead of leaving them blank.",
      "Fixed a tab-indented bullet list in LeetCode write-ups rendering as a code block instead of a list.",
      "Automated the LeetCode sync workflow and dropped client-side stats caching in favour of syncing stats straight into Sanity.",
    ],
    planned: [
      "Add new, better and more impressive projects.",
      "Add an AI companion that glazes me.",
      "Design revamp (?)",
    ],
  },
];

async function main() {
  const existing = await client.fetch('*[_type == "release"]{_id, order}');
  const tx = client.transaction();
  for (const doc of existing) {
    tx.patch(doc._id, { set: { order: doc.order + NEW_RELEASES.length } });
  }
  for (const release of NEW_RELEASES) {
    tx.create({ _type: "release", ...release });
  }
  await tx.commit();
  console.log(`Bumped ${existing.length} existing releases, created ${NEW_RELEASES.length} new ones.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
