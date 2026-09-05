import { useEffect, useState } from "react";
import { Github, Tag } from "lucide-react";
import Scribble from "../Scribble";
import StatTile from "../StatTile";
import { useExternalLinkConfirm } from "../../lib/useExternalLinkConfirm";
import {
  fetchContributorStats,
  fetchLatestCommits,
  aggregateStatsByYear,
  aggregateStatsByMonth,
  totalStats,
  REPO_URL,
} from "../../lib/githubStats";

const STATS_CACHE_KEY = "githubStatsCache";
const COMMITS_CACHE_KEY = "githubLatestCommitsCache";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

function readCache(key) {
  const cached = localStorage.getItem(key);
  if (!cached) return undefined;
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp >= CACHE_DURATION) return undefined;
  return data;
}

function writeCache(key, data) {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
}

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function ChangelogOverviewCard({ releases = [], updatePage = () => {} }) {
  const { handleClick: handleExternalClick, modal: externalLinkModal } =
    useExternalLinkConfirm();
  const [yearStats, setYearStats] = useState(null); // null = loading, [] = empty/failed
  const [monthStats, setMonthStats] = useState([]);
  const [latestCommits, setLatestCommits] = useState(null); // null = loading, [] = failed/empty

  useEffect(() => {
    const cachedYear = readCache(STATS_CACHE_KEY);
    const cachedMonth = readCache(`${STATS_CACHE_KEY}-monthly`);
    if (cachedYear && cachedMonth) {
      setYearStats(cachedYear);
      setMonthStats(cachedMonth);
    } else {
      fetchContributorStats()
        .then((contributorStats) => {
          const byYear = aggregateStatsByYear(contributorStats);
          const byMonth = aggregateStatsByMonth(contributorStats);
          setYearStats(byYear);
          setMonthStats(byMonth);
          writeCache(STATS_CACHE_KEY, byYear);
          writeCache(`${STATS_CACHE_KEY}-monthly`, byMonth);
        })
        .catch(() => setYearStats([]));
    }

    const cachedCommits = readCache(COMMITS_CACHE_KEY);
    if (cachedCommits !== undefined) {
      setLatestCommits(cachedCommits);
    } else {
      fetchLatestCommits(5)
        .then((commits) => {
          setLatestCommits(commits);
          writeCache(COMMITS_CACHE_KEY, commits);
        })
        .catch(() => setLatestCommits([]));
    }
  }, []);

  const totals = yearStats ? totalStats(yearStats) : null;
  const maxYearCommits = yearStats?.length ? Math.max(...yearStats.map((y) => y.commits)) : 0;
  const maxMonthCommits = monthStats.length ? Math.max(...monthStats.map((m) => m.commits)) : 0;
  const latestRelease = releases[0];

  return (
    <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default overflow-y-auto">
      {externalLinkModal}
      <h2 className="font-bold text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
        Changelog.
      </h2>
      <p className="text-base md:text-xl mt-3 ml-2">
        How this site has grown over the years, straight from its own git history.
      </p>

      <div className="ml-2 mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleExternalClick(REPO_URL)}
          className="group flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text)]"
        >
          <Github size={14} />
          <span className="underline decoration-transparent group-hover:decoration-current transition-colors">
            View on GitHub
          </span>
        </a>
        {latestRelease && (
          <button
            onClick={() => updatePage(latestRelease.version)}
            className="group flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
          >
            <Tag size={14} />
            <span className="underline decoration-transparent group-hover:decoration-current transition-colors">
              Latest: {latestRelease.version}
            </span>
          </button>
        )}
      </div>

      <div className="ml-2 mt-6">
        {yearStats === null ? (
          <Scribble />
        ) : yearStats.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No stats available :(</p>
        ) : (
          <>
            <ul className="animate-content-in flex flex-wrap gap-8 mb-8">
              <StatTile label="Commits" value={totals.commits} />
              <StatTile label="Lines Added" value={totals.additions} />
              <StatTile label="Lines Removed" value={totals.deletions} />
              <StatTile label="Lines of Code" value={totals.additions - totals.deletions} />
            </ul>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 max-w-5xl">
              {monthStats.length > 0 && (
                <div>
                  <p className="font-bold text-lg mb-3">Commit Volume</p>
                  <div className="flex items-end gap-2 h-64 sm:h-72 overflow-x-auto pb-1">
                    {monthStats.map((m) => (
                      <div
                        key={`${m.year}-${m.month}`}
                        className="group relative flex flex-col items-center gap-1 shrink-0 h-full"
                      >
                        <div className="w-7 flex-1 flex items-end bg-[var(--bg-tertiary)] rounded overflow-hidden">
                          <div
                            className="w-full bg-[var(--text-secondary)] group-hover:bg-[var(--text)] transition-colors"
                            style={{
                              height: `${maxMonthCommits ? (m.commits / maxMonthCommits) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)] whitespace-nowrap shrink-0">
                          {monthLabel(m.year, m.month)}
                        </span>
                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded px-1.5 py-0.5 pointer-events-none whitespace-nowrap z-10">
                          {m.commits} commits
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="font-bold text-lg mb-3">Latest Commits</p>
                <div className="flex flex-col gap-2 h-64 sm:h-72 overflow-y-auto pr-1">
                  {latestCommits === null ? (
                    <Scribble />
                  ) : latestCommits.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">
                      No commit data available.
                    </p>
                  ) : (
                    latestCommits.map((commit) => (
                      <a
                        key={commit.sha}
                        href={commit.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleExternalClick(commit.html_url)}
                        className="group flex flex-col gap-1 border border-[var(--border-secondary)] rounded p-3 hover:bg-[var(--bg-secondary)] shrink-0"
                      >
                        <p className="text-sm break-words underline decoration-transparent group-hover:decoration-current transition-colors">
                          {commit.commit.message.split("\n")[0]}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {commit.sha?.slice(0, 7)} —{" "}
                          {new Date(commit.commit.author.date).toLocaleDateString()}
                        </p>
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>

            <p className="font-bold text-lg mb-3">By Year</p>
            <div className="flex flex-col gap-2 max-w-2xl mb-6">
              {yearStats.map((year) => (
                <div key={year.year} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-sm text-[var(--text-secondary)]">
                    {year.year}
                  </span>
                  <div className="flex-1 h-4 bg-[var(--bg-tertiary)] rounded overflow-hidden">
                    <div
                      className="h-full bg-[var(--text-secondary)]"
                      style={{
                        width: `${maxYearCommits ? (year.commits / maxYearCommits) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-xs text-right text-[var(--text-secondary)]">
                    {year.commits} commits
                  </span>
                  <span className="w-20 shrink-0 text-xs text-right text-green-600">
                    +{year.additions.toLocaleString()}
                  </span>
                  <span className="w-20 shrink-0 text-xs text-right text-red-500">
                    -{year.deletions.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChangelogOverviewCard;
