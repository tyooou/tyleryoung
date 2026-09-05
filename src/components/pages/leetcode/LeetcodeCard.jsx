import { useEffect, useState } from "react";
import { Code2 } from "lucide-react";
import Scribble from "../../Scribble";
import ExternalLink from "../../ExternalLink";
import StatTile from "../../StatTile";
import { sanityClient } from "../../../lib/sanityClient";
import { PROFILE_URL, DIFFICULTY_COLOR, computeStreaks } from "../../../lib/leetcode";
import { useExternalLinkConfirm } from "../../../lib/useExternalLinkConfirm";
import LeetcodeHeatmap from "./LeetcodeHeatmap";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Cards fit roughly this many times over before the "Latest Solved" column
// runs taller than the heatmap's fixed 7-day-row height (heading + 7 rows
// of cells stays constant regardless of how many months are shown, since
// showing more months only makes the heatmap wider, not taller).
const LATEST_SOLVED_COUNT = 4;

function LeetcodeCard({ leetcodeProblems = [], updatePage = () => {}, sidebarPanelOpen }) {
  const { handleClick: handleExternalClick, modal: externalLinkModal } =
    useExternalLinkConfirm();
  const [stats, setStats] = useState(null); // null = loading, false = failed
  const [submissionCalendar, setSubmissionCalendar] = useState({});

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type == "leetcodeStats"][0]{ totalSolved, easySolved, mediumSolved, hardSolved, submissionCalendar }`,
      )
      .then((doc) => {
        if (!doc) throw new Error("No leetcodeStats document found");
        const calendar = JSON.parse(doc.submissionCalendar || "{}");
        const data = { ...doc, submissionCalendar: calendar };
        setStats(data);
        setSubmissionCalendar(calendar);
      })
      .catch((err) => {
        setStats(false);
        setSubmissionCalendar({});
        console.error(err);
      });
  }, []);

  const streaks = computeStreaks(submissionCalendar);
  const latestSolved = [...leetcodeProblems]
    .filter((problem) => problem.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, LATEST_SOLVED_COUNT);

  return (
    <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default overflow-y-auto">
      {externalLinkModal}
      <h2 className="font-bold text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
        Leetcode.
      </h2>
      <p className="text-base md:text-xl mt-3 ml-2">
        My journey to get better everyday — my LeetCode progress at a glance.
      </p>

      {/* Same ExternalLink the per-problem pages use, rather than a
          hand-rolled anchor — so both "View on LeetCode" links share one
          look and one behaviour. */}
      <div className="ml-2 mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <ExternalLink
          text="View on LeetCode"
          link={PROFILE_URL}
          icon={<Code2 size={14} />}
          onClick={handleExternalClick(PROFILE_URL)}
        />
      </div>

      <div className="ml-2 mt-6">
        {stats === null ? (
          <Scribble />
        ) : stats === false ? (
          <p className="text-sm text-[var(--text-secondary)]">No stats available :(</p>
        ) : (
          <div className="animate-content-in">
            <ul className="flex flex-wrap gap-8 mb-10">
              <StatTile label="Total Solved" value={stats.totalSolved} />
              <StatTile label="Easy" value={stats.easySolved} />
              <StatTile label="Medium" value={stats.mediumSolved} />
              <StatTile label="Hard" value={stats.hardSolved} />
              <StatTile label="Longest Streak" value={`${streaks.longest}d`} />
              <StatTile label="Current Streak" value={`${streaks.current}d`} />
            </ul>

            <div className="flex flex-wrap gap-4 items-start">
              <LeetcodeHeatmap
                submissionCalendar={submissionCalendar}
                months={sidebarPanelOpen ? 3 : 4}
              />

              <div className="flex-1 min-w-[200px]">
                <p className="text-xl font-bold mb-3">Latest Solved</p>
                <div className="flex flex-col gap-3">
                  {latestSolved.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">
                      No solved problems yet.
                    </p>
                  ) : (
                    latestSolved.map((problem) => {
                      const color = DIFFICULTY_COLOR[problem.difficulty];
                      return (
                        <button
                          key={problem.path}
                          onClick={() => updatePage(problem.path)}
                          className="group flex flex-col gap-1 border border-[var(--border-secondary)] rounded p-3 hover:bg-[var(--bg-secondary)] text-left cursor-pointer"
                        >
                          <p className="text-sm break-words underline decoration-transparent group-hover:decoration-current transition-colors">
                            {problem.number}. {problem.title}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                            <span>{formatDate(problem.date)}</span>
                            {problem.difficulty && (
                              <span
                                className="px-1.5 rounded border font-bold"
                                style={
                                  color
                                    ? {
                                        color,
                                        borderColor: color,
                                        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                                      }
                                    : undefined
                                }
                              >
                                {problem.difficulty}
                              </span>
                            )}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeetcodeCard;
