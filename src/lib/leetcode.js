const OWNER = "tyooou";
const REPO = "leetcode";
const BRANCH = "main";

export const PROFILE_URL = `https://leetcode.com/u/${OWNER}/`;

// Difficulty colors — theme-scoped CSS vars (see themes.css) rather than
// LeetCode's own fixed brand hex, so Easy/Medium/Hard read as a native part
// of whichever theme is active instead of a fixed green/yellow/red overlay.
export const DIFFICULTY_COLOR = {
  Easy: "var(--difficulty-easy)",
  Medium: "var(--difficulty-medium)",
  Hard: "var(--difficulty-hard)",
};

// Matches files like "2026/08/877. Stone Game.md" -> year/month subfolders
// only, excluding README.md and any dotfile-config directories (.obsidian, etc).
const PROBLEM_PATH_RE = /^(\d{4})\/(\d{2})\/(\d+)\.\s*(.+)\.md$/;

export function rawUrl(path) {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${encodeURI(path)}`;
}

// Pulls the problem list straight from GitHub — only used by
// scripts/sync-leetcode.mjs to seed Sanity. The live site reads the
// (much cheaper, unauthenticated-rate-limit-free) synced copy from Sanity
// instead of hitting this on every page load.
export async function fetchLeetcodeProblemsFromGitHub(token) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  );
  if (!res.ok) return [];
  const data = await res.json();
  const problems = (data.tree || [])
    .filter((entry) => entry.type === "blob")
    .map((entry) => {
      const match = entry.path.match(PROBLEM_PATH_RE);
      if (!match) return null;
      const [, year, month, number, title] = match;
      return { path: entry.path, year, month, number: Number(number), title };
    })
    .filter(Boolean);

  problems.sort((a, b) => {
    if (a.year !== b.year) return b.year.localeCompare(a.year);
    if (a.month !== b.month) return b.month.localeCompare(a.month);
    return a.number - b.number;
  });

  return problems;
}

// Obsidian shows a tab-indented "- item" as an ordinary bullet, but
// CommonMark counts a leading tab as four columns of indentation and reads
// the line as an *indented code block* — which is why those bullets were
// rendering as literal source, backticks and `**bold**` markers and all,
// inside a grey code box. The vault writes them this way throughout (94
// across 37 of the 40 files checked, always exactly one tab, in callouts
// after the "> " marker as well).
//
// The tab is decorative, not structural: no line in the vault uses two, so
// there is no real hierarchy to preserve, and the Constraints callouts mix
// an untabbed first bullet with tabbed siblings that mean the same level.
// Dropping the indentation entirely is what keeps those siblings level —
// converting to two spaces instead put them at the first bullet's content
// column, which CommonMark reads as a nested list under it.
function normaliseTabIndentedLists(markdown) {
  return markdown.replace(
    /^((?:> ?)*)\t+(?=(?:[-*+]|\d+[.)])\s)/gm,
    (_, quoteMarkers) => quoteMarkers,
  );
}

export async function fetchProblemMarkdown(path) {
  const res = await fetch(rawUrl(path));
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return normaliseTabIndentedLists(await res.text());
}

// LeetCode's submissionCalendar keys are unix-second timestamps, one per
// active day — bucketing by whole UTC days (rather than trusting exact
// midnight alignment) and looking for consecutive day-buckets is what
// "streak" actually means here, regardless of any intra-day offset in the
// timestamps themselves.
export function computeStreaks(submissionCalendar) {
  const dayIndices = [
    ...new Set(
      Object.entries(submissionCalendar)
        .filter(([, count]) => count > 0)
        .map(([timestamp]) => Math.floor(Number(timestamp) / 86400)),
    ),
  ].sort((a, b) => a - b);

  if (dayIndices.length === 0) return { longest: 0, current: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dayIndices.length; i++) {
    run = dayIndices[i] === dayIndices[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const todayIndex = Math.floor(Date.now() / 1000 / 86400);
  const lastActiveIndex = dayIndices[dayIndices.length - 1];
  let current = 0;
  // Only counts as "current" if the streak is still alive (last active day
  // was today or yesterday) — otherwise it's a run that already ended.
  if (todayIndex - lastActiveIndex <= 1) {
    current = 1;
    for (let i = dayIndices.length - 1; i > 0; i--) {
      if (dayIndices[i] - dayIndices[i - 1] !== 1) break;
      current += 1;
    }
  }

  return { longest, current };
}
