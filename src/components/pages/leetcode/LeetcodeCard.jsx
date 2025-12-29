import { useState, useEffect } from "react";
import LeetcodeStat from "./LeetcodeStat";
import LeetcodeHeatmap from "./LeetcodeHeatmap";

const CACHE_KEY = "leetcodeStatsCache";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

function LeetcodeCard() {
  const [stats, setStats] = useState(null);
  const [submissionCalendar, setSubmissionCalendar] = useState({});

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        setStats(data);
        setSubmissionCalendar(data.submissionCalendar || {});
        return;
      }
    }
    fetch("https://leetcode-stats-api.herokuapp.com/tyooou")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        const calendar = data.submissionCalendar || {};
        setSubmissionCalendar(calendar);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <div className="w-full h-full p-5 font-mono select-none cursor-default">
        <div className="flex flex-col">
          <h2 className="font-bold text-9xl">Leetcode.</h2>
          <div className="mt-3 ml-2">
            <p className="text-2xl sm:text-lg md:text-xl mb-2">
              My journey to get better everyday - my Leetcode progress at a
              glance. <br className="hidden sm:block" />
            </p>

            {!stats && <p className="mt-6">Loading...</p>}
            {stats && (
              <div className="mt-6">
                <ul className="flex space-x-4">
                  <LeetcodeStat label="Total Solved" stat={stats.totalSolved} />
                  <LeetcodeStat label="Easy" stat={stats.easySolved} />
                  <LeetcodeStat label="Medium" stat={stats.mediumSolved} />
                  <LeetcodeStat label="Hard" stat={stats.hardSolved} />
                </ul>

                <LeetcodeHeatmap submissionCalendar={submissionCalendar} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default LeetcodeCard;
