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
    fetchWithTimeout("https://leetcode-stats-api.herokuapp.com/tyooou", { timeout: 5000 })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        const calendar = data.submissionCalendar || {};
        setSubmissionCalendar(calendar);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      })
      .catch((err) => {
        setStats(false); // indicate failure
        setSubmissionCalendar({});
        console.error(err);
      });
  }, []);

  function BrailleSpinner() {
    const frames = [
      '\u280B', // ⠋
      '\u2819', // ⠙
      '\u2839', // ⠹
      '\u2838', // ⠸
      '\u283C', // ⠼
      '\u2834', // ⠴
      '\u2826', // ⠦
      '\u2827', // ⠧
      '\u2807', // ⠇
      '\u280F', // ⠏
    ];
    const [frame, setFrame] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => {
        setFrame(f => (f + 1) % frames.length);
      }, 80);
      return () => clearInterval(interval);
    }, []);
    return (
      <p className="text-2xl mt-6">{frames[frame]}</p>
    );
  }

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

            {stats === null ?
            <BrailleSpinner /> :
            stats === false ? (
              <p className="mt-6">No stats found :(</p>
            ) : (
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

// Add fetchWithTimeout helper below component
function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(id));
}


