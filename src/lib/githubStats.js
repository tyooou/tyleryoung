const REPO_OWNER = "tyooou";
const REPO_NAME = "tyleryoung";

export const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;

export async function fetchLatestCommits(count = 3) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=${count}`,
  );
  if (!res.ok) return [];
  return res.json();
}

async function fetchContributorStatsOnce() {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/stats/contributors`,
  );
  if (res.status === 202) return null; // GitHub is still computing these
  if (!res.ok) throw new Error(`GitHub stats request failed: ${res.status}`);
  return res.json();
}

// GitHub computes repo stats asynchronously — an uncached request returns
// 202 with an empty body while it works in the background, so poll a few
// times (with backoff) before giving up. A single attempt failing outright
// (network hiccup, or GitHub occasionally omitting CORS headers on the
// interim 202 itself) shouldn't abort the whole poll — only give up after
// every attempt has failed.
export async function fetchContributorStats() {
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const data = await fetchContributorStatsOnce();
      if (data) return data;
    } catch (err) {
      lastError = err;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
  }
  if (lastError) throw lastError;
  return [];
}

// Buckets weekly per-contributor stats into per-year totals across every
// contributor, newest year first.
export function aggregateStatsByYear(contributorStats) {
  const yearMap = new Map();
  for (const contributor of contributorStats) {
    for (const week of contributor.weeks || []) {
      if (!week.c && !week.a && !week.d) continue;
      const year = new Date(week.w * 1000).getFullYear();
      const entry = yearMap.get(year) || { year, commits: 0, additions: 0, deletions: 0 };
      entry.commits += week.c;
      entry.additions += week.a;
      entry.deletions += week.d;
      yearMap.set(year, entry);
    }
  }
  return [...yearMap.values()].sort((a, b) => b.year - a.year);
}

// Same weekly data, bucketed by calendar month instead — filled in so
// inactive months still show up as zero-height bars rather than gaps.
export function aggregateStatsByMonth(contributorStats) {
  const monthMap = new Map();
  for (const contributor of contributorStats) {
    for (const week of contributor.weeks || []) {
      const date = new Date(week.w * 1000);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;
      const entry = monthMap.get(key) || { year, month, commits: 0, additions: 0, deletions: 0 };
      entry.commits += week.c;
      entry.additions += week.a;
      entry.deletions += week.d;
      monthMap.set(key, entry);
    }
  }
  const entries = [...monthMap.values()].sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );
  if (entries.length === 0) return [];

  const filled = [];
  const cursor = new Date(entries[0].year, entries[0].month, 1);
  const end = new Date(entries[entries.length - 1].year, entries[entries.length - 1].month, 1);
  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const existing = entries.find((e) => e.year === year && e.month === month);
    filled.push(existing || { year, month, commits: 0, additions: 0, deletions: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return filled;
}

export function totalStats(yearStats) {
  return yearStats.reduce(
    (totals, year) => ({
      commits: totals.commits + year.commits,
      additions: totals.additions + year.additions,
      deletions: totals.deletions + year.deletions,
    }),
    { commits: 0, additions: 0, deletions: 0 },
  );
}
