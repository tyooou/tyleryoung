import { useState, useEffect } from "react";
import LeetcodeStat from "./LeetcodeStat";

function LeetcodeCard() {
  const [stats, setStats] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

  useEffect(() => {
    if (Object.keys(submissionCalendar).length > 0) {
      generateMonthHeatmap(submissionCalendar, currentMonth);
    }
  }, [currentMonth, submissionCalendar]);

  const generateMonthHeatmap = (submissionCalendar, monthDate) => {
    const startMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() - 1,
      1
    );
    const endMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 3,
      0
    );

    const startDate = new Date(startMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const heatmapGrid = [];
    const currentDate = new Date(startDate);

    let totalDays = 0;
    while (currentDate <= endMonth || totalDays % 7 !== 0) {
      const isInFourMonthRange =
        currentDate >= startMonth && currentDate <= endMonth;

      const timestamp = Math.floor(currentDate.getTime() / 1000).toString();
      const timestampNum = Math.floor(currentDate.getTime() / 1000);

      let submissionCount =
        submissionCalendar[timestamp] || submissionCalendar[timestampNum] || 0;

      if (submissionCount === 0) {
        for (let offset = -12; offset <= 12; offset++) {
          const adjustedTimestamp = timestampNum + offset * 3600;
          const adjustedSubmissions =
            submissionCalendar[adjustedTimestamp] ||
            submissionCalendar[adjustedTimestamp.toString()];
          if (adjustedSubmissions > 0) {
            submissionCount = adjustedSubmissions;
            break;
          }
        }
      }

      heatmapGrid.push({
        date: new Date(currentDate),
        count: submissionCount,
        isValid: isInFourMonthRange,
      });

      currentDate.setDate(currentDate.getDate() + 1);
      totalDays++;
    }

    const weeks = Math.ceil(heatmapGrid.length / 7);
    const gridByWeeks = [];

    for (let week = 0; week < weeks; week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const index = week * 7 + day;
        if (index < heatmapGrid.length) {
          weekData.push(heatmapGrid[index]);
        } else {
          weekData.push(null);
        }
      }
      gridByWeeks.push(weekData);
    }

    setHeatmapData(gridByWeeks);
  };

  const getHeatmapStyle = (day) => {
    if (!day) return { backgroundColor: "transparent" };
    if (day.count === 0) return { backgroundColor: "#f3f4f6" };
    if (day.count <= 2) return { backgroundColor: "#bbf7d0" };
    if (day.count <= 4) return { backgroundColor: "#4ade80" };
    if (day.count <= 6) return { backgroundColor: "#16a34a" };
    return { backgroundColor: "#15803d" };
  };

  const changeMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      const proposedDate = new Date(newDate);
      proposedDate.setMonth(proposedDate.getMonth() + direction * 4);

      const now = new Date();
      if (direction > 0 && proposedDate > now) {
        return prev;
      }

      return proposedDate;
    });
  };

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
                <LeetcodeStat label="E" stat={stats.easySolved} />
                <LeetcodeStat label="M" stat={stats.mediumSolved} />
                <LeetcodeStat label="H" stat={stats.hardSolved} />
                <LeetcodeStat label="Ranking" stat={stats.ranking} />
              </ul>

              <div className="mt-6 ml-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">
                    {new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 2
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    Activity
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="px-2 py-1 text-sm font-mono bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => changeMonth(1)}
                      className="px-2 py-1 text-sm font-mono bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      →
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <div className="flex flex-col gap-1 pt-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          key={day}
                          className="w-8 h-12 flex items-center justify-center text-xs text-gray-500"
                        >
                          {day}
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex gap-3">
                    {heatmapData.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-3">
                        {week.map((day, dayIndex) => {
                          if (!day) {
                            return (
                              <div
                                key={`${weekIndex}-${dayIndex}`}
                                className="w-10 h-10"
                              />
                            );
                          }

                          if (!day.isValid) {
                            return (
                              <div
                                key={`${weekIndex}-${dayIndex}`}
                                className="w-10 h-10"
                                style={{ opacity: 0, pointerEvents: "none" }}
                              />
                            );
                          }

                          return (
                            <div
                              key={`${weekIndex}-${dayIndex}`}
                              className="w-10 h-10 rounded border relative group cursor-pointer"
                              style={{
                                ...getHeatmapStyle(day),
                                border: "1px solid #d1d5db",
                              }}
                              title={`${day.date.toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}: ${day.count} submissions`}
                            >
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                {day.date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                                : {day.count} submissions
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default LeetcodeCard;
