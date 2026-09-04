#!/usr/bin/env node
// Used by the sync-leetcode GitHub Action, which polls every 30 minutes but
// should only actually re-sync once the last sync is more than 24h old.
// leetcodeStats is a singleton doc (see sync-leetcode-stats.mjs) that gets
// createOrReplace'd on every successful stats sync, so its _updatedAt is a
// reliable "last synced at" marker — no separate state needs to be stored.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const STATS_DOC_ID = "leetcodeStats";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

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

const { VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET } = process.env;
if (!VITE_SANITY_PROJECT_ID) {
  throw new Error("Missing VITE_SANITY_PROJECT_ID — set it in .env.local before running this script.");
}

const client = createClient({
  projectId: VITE_SANITY_PROJECT_ID,
  dataset: VITE_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false, // freshness matters here, not speed
});

const updatedAt = await client.fetch(`*[_id == "${STATS_DOC_ID}"][0]._updatedAt`);
const ageMs = updatedAt ? Date.now() - new Date(updatedAt).getTime() : Infinity;
const needed = ageMs > MAX_AGE_MS;

console.log(
  updatedAt
    ? `Last synced ${(ageMs / (60 * 60 * 1000)).toFixed(1)}h ago.`
    : "Never synced.",
);
console.log(needed ? "Sync needed." : "Sync not needed yet.");

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `needed=${needed}\n`);
}
