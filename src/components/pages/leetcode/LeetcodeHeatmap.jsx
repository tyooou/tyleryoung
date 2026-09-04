import { useState, useEffect, useCallback } from "react";

function LeetcodeHeatmap({ submissionCalendar, months = 3 }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Window is centered on `currentMonth`, split as evenly as possible
  // before/after it — e.g. 3 months = [-1, 0, +1], 4 months = [-1, 0, +1, +2].
  const monthsBefore = Math.floor((months - 1) / 2);
  const monthsAfter = months - 1 - monthsBefore;

  const generateMonthHeatmap = useCallback((submissionCalendar, monthDate) => {
    const startMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() - monthsBefore,
      1
    );
    const endMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + monthsAfter + 1,
      0
    );

    const startDate = new Date(startMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const heatmapGrid = [];
    const currentDate = new Date(startDate);

    let totalDays = 0;
    while (currentDate <= endMonth || totalDays % 7 !== 0) {
      const isInRange = currentDate >= startMonth && currentDate <= endMonth;

      const now = new Date();
      const isInFuture = currentDate > now;

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
        isValid: isInRange,
        isInFuture: isInFuture,
        // Compared by calendar date, not timestamp — every cell here is at
        // local midnight while `now` is the actual current time, so a
        // direct equality check would never match.
        isToday: currentDate.toDateString() === now.toDateString(),
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
  }, [monthsBefore, monthsAfter]);

  useEffect(() => {
    if (Object.keys(submissionCalendar).length > 0) {
      generateMonthHeatmap(submissionCalendar, currentMonth);
    }
  }, [currentMonth, submissionCalendar, months, generateMonthHeatmap]);

  const getHeatmapStyle = (day) => {
    if (!day) return { backgroundColor: "transparent" };
    if (day.count === 0) return { backgroundColor: "var(--bg)" };
    if (day.count <= 3) return { backgroundColor: "var(--heatmap1)" };
    if (day.count <= 6) return { backgroundColor: "var(--heatmap2)" };
    if (day.count <= 9) return { backgroundColor: "var(--heatmap3)" };
    return { backgroundColor: "var(--heatmap4)" };
  };

  const changeMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      const proposedDate = new Date(newDate);
      proposedDate.setMonth(proposedDate.getMonth() + direction * months);

      const now = new Date();
      if (direction > 0 && proposedDate > now) {
        return prev;
      }

      return proposedDate;
    });
  };

  // Helper to format month/year as "Mon 'yy"
  function formatMonthYear(date) {
    return (
      date.toLocaleDateString("en-US", { month: "short" }) +
      " '" +
      date.getFullYear().toString().slice(-2)
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-xl font-bold ml-13 mr-4">
          {formatMonthYear(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() - monthsBefore),
          )}
          {" - "}
          {formatMonthYear(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthsAfter),
          )}
          {" Activity"}
        </h3>
          <button
            onClick={() => changeMonth(-1)}
            className="px-2 py-0.5 text-sm font-mono bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-2 py-0.5 text-sm font-mono bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded"
          >
            Present
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="px-2 py-0.5 text-sm font-mono bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded"
          >
            →
          </button>
   
      </div>
      <div className="flex items-start gap-1">
        <div className="flex flex-col gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="w-8 h-12 flex items-center justify-center text-xs text-[var(--text-secondary)] font-bold"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="flex gap-3 ml-3">
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

                // Outside the displayed months entirely — the padding days
                // that align the first and last weeks to Sun-Sat. Those
                // belong to another window, so they stay blank.
                if (!day.isValid) {
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className="w-10 h-10"
                      style={{ opacity: 0, pointerEvents: "none" }}
                    />
                  );
                }

                // Inside the window but not here yet. Drawn as an empty
                // dashed outline rather than left blank, so the grid keeps
                // its full shape and a pending day reads differently from
                // a day that genuinely had no submissions.
                if (day.isInFuture) {
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className="w-10 h-10 rounded border border-dashed border-[var(--border-secondary)] opacity-50 pointer-events-none"
                      title={`${day.date.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}: upcoming`}
                    />
                  );
                }

                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    // Today gets an accent-coloured outer ring rather than a
                    // different fill, so it stands out without lying about
                    // how many submissions the day actually has.
                    className={`w-10 h-10 rounded border border-[var(--border)] relative group cursor-pointer ${
                      day.isToday
                        ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg)]"
                        : ""
                    }`}
                    style={{
                      ...getHeatmapStyle(day),
                    }}
                    title={`${day.date.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}: ${day.count} submissions${day.isToday ? " (today)" : ""}`}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--bg-quaternary)] text-[var(--text)] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 flex flex-col justify-center items-center text-center">
                      {day.date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      <br />
                      {day.count} submissions
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LeetcodeHeatmap;
