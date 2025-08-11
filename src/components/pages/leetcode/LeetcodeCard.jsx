import { useState, useEffect } from "react";
import LeetcodeStat from "./LeetcodeStat";
import LeetcodeHeatmap from "./LeetcodeHeatmap";

function LeetcodeCard() {
  const [stats, setStats] = useState(null);
  const [submissionCalendar, setSubmissionCalendar] = useState({});

  useEffect(() => {
    fetch("https://leetcode-stats-api.herokuapp.com/tyooou")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        const calendar = data.submissionCalendar || {};
        setSubmissionCalendar(calendar);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <div className="w-full h-full p-5 font-mono select-none cursor-default">
        <div className="flex flex-col">
          <h2 className="font-bold text-9xl">Leetcode.</h2>
          <p className="text-2xl sm:text-lg md:text-xl mt-3 ml-2 mb-2">
            I love to challenge my technical skills with puzzles.{" "}
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>Check here for my Leetcode
            progress!
          </p>
          {!stats && <p className="ml-2">Loading...</p>}
          {stats && (
            <>
              <ul className="flex space-x-4 ml-2">
                <LeetcodeStat label="Total Solved" stat={stats.totalSolved} />
                <LeetcodeStat label="Easy" stat={stats.easySolved} />
                <LeetcodeStat label="Medium" stat={stats.mediumSolved} />
                <LeetcodeStat label="Hard" stat={stats.hardSolved} />
              </ul>

              <LeetcodeHeatmap submissionCalendar={submissionCalendar} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default LeetcodeCard;
