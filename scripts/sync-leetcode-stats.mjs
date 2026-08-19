#!/usr/bin/env node
// Pulls solved-problem counts and the submission calendar straight from
// LeetCode's own GraphQL API and syncs them into Sanity as the singleton
// leetcodeStats doc. leetcode.com/graphql sends no CORS headers, so the
// browser can't call it directly — the live site reads this synced copy
// instead. Re-run periodically (e.g. a scheduled GitHub Action) to keep it
// fresh; the client also caches its read for an hour on top of that.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const LEETCODE_USERNAME = "tyooou";
const STATS_DOC_ID = "leetcodeStats";

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

async function queryLeetcodeGraphQL(query, variables) {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: `https://leetcode.com/${LEETCODE_USERNAME}/`,
      "User-Agent": "Mozilla/5.0",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LeetCode GraphQL request failed: ${res.status}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(`LeetCode GraphQL error: ${errors[0].message}`);
  return data;
}

async function fetchSolvedCounts() {
  const data = await queryLeetcodeGraphQL(
    `query userSessionProgress($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum { difficulty count }
        }
      }
    }`,
    { username: LEETCODE_USERNAME },
  );
  const byDifficulty = Object.fromEntries(
    data.matchedUser.submitStats.acSubmissionNum.map((entry) => [entry.difficulty, entry.count]),
  );
  return {
    totalSolved: byDifficulty.All || 0,
    easySolved: byDifficulty.Easy || 0,
    mediumSolved: byDifficulty.Medium || 0,
    hardSolved: byDifficulty.Hard || 0,
  };
}

// Covers the current year and the previous one so the heatmap's ~4-month
// window (see LeetcodeHeatmap.jsx) still has data even when "now" (at view
// time, which can be later than sync time) falls near a year boundary.
async function fetchSubmissionCalendar() {
  const currentYear = new Date().getFullYear();
  const merged = {};
  for (const year of [currentYear - 1, currentYear]) {
    const data = await queryLeetcodeGraphQL(
      `query userProfileCalendar($username: String!, $year: Int) {
        matchedUser(username: $username) {
          userCalendar(year: $year) { submissionCalendar }
        }
      }`,
      { username: LEETCODE_USERNAME, year },
    );
    const calendar = data.matchedUser?.userCalendar;
    if (calendar?.submissionCalendar) {
      Object.assign(merged, JSON.parse(calendar.submissionCalendar));
    }
  }
  return merged;
}

async function main() {
  const [solvedCounts, submissionCalendar] = await Promise.all([
    fetchSolvedCounts(),
    fetchSubmissionCalendar(),
  ]);

  await client.createOrReplace({
    _id: STATS_DOC_ID,
    _type: "leetcodeStats",
    ...solvedCounts,
    submissionCalendar: JSON.stringify(submissionCalendar),
  });

  console.log(`Synced stats: ${solvedCounts.totalSolved} solved.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
