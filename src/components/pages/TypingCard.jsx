import ExternalLink from "../ExternalLink";
import BrailleSpinner from "../BrailleSpinner";
import { useState, useEffect } from "react";

const API_BASE = "https://api.monkeytype.com";
const apiKey = import.meta.env.VITE_APE_KEY;

const CACHE_KEY = "monkeyTypeStatsCache";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

function getResponseData(responseJson) {
  if (!responseJson || typeof responseJson !== "object") {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(responseJson, "data")) {
    return responseJson.data;
  }

  return null;
}

function MonkeyTypeStats() {
  const [personalBests, setPersonalBests] = useState(null);
  const [speedHistogram, setSpeedHistogram] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        setPersonalBests(data);
        return;
      }
    }

    // Fetch new data if no cache or cache is expired
    fetchPersonalBests();
    //fetchSpeedHistogram();
  }, []);

  async function fetchPersonalBests() {
    setLoading(true);
    setError(null);
    // Don't reset personalBests here since we might have cached data

    try {
      const personalBestsRes = await fetch(
        `${API_BASE}/users/personalBests?mode=time&mode2=60`,
        {
          headers: {
            Authorization: `ApeKey ${apiKey}`,
          },
        },
      );

      if (!personalBestsRes.ok) {
        const err = await personalBestsRes.json();
        throw new Error(err.message || "Request failed");
      }

      const personalBestsJson = await personalBestsRes.json();
      const responseData = getResponseData(personalBestsJson);

      if (!Array.isArray(responseData)) {
        throw new Error("Unexpected personal bests response format");
      }

      setPersonalBests(responseData);

      // Cache the data with timestamp
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: responseData,
          timestamp: Date.now(),
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  //   async function fetchSpeedHistogram() {
  //     setLoading(true);
  //     setError(null);
  //     setSpeedHistogram(null);

  //     try {
  //       const response = await fetch(
  //         `${API_BASE}/public/speedHistogram?language=english_5k&mode=time&mode2=60`,
  //         {
  //           headers: {
  //             Authorization: `ApeKey ${apiKey}`,
  //           },
  //         },
  //       );

  //       if (!response.ok) {
  //         const err = await response.json();
  //         throw new Error(err.message || "Request failed");
  //       }

  //       const histogramJson = await response.json();
  //       const responseData = getResponseData(histogramJson);

  //       if (Array.isArray(responseData)) {
  //         setSpeedHistogram(responseData);
  //       } else if (responseData && typeof responseData === "object") {
  //         setSpeedHistogram(
  //           Object.entries(responseData).map(([wpm, count]) => ({
  //             wpm: Number(wpm),
  //             count: Number(count),
  //           })),
  //         );
  //       } else {
  //         throw new Error("Unexpected speed histogram response format");
  //       }
  //     } catch (err) {
  //       setError(err.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  return (
    <div className="mt-6 mb-6 font-mono max-w-[600px]">
      {loading && <BrailleSpinner />}

      {error && <p className="text-red-500">Error: {error}</p>}

      {personalBests && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-secondary)]">
              <th className="text-left p-1.5">Date</th>
              <th className="text-left p-1.5">WPM</th>
              <th className="text-left p-1.5">Accuracy</th>
              <th className="text-left p-1.5">Raw</th>
            </tr>
          </thead>
          <tbody>
            {personalBests.map((pb, i) => (
              <tr key={i} className="border-b border-[var(--border-secondary)]">
                <td className="">
                  {new Date(pb.timestamp).toLocaleDateString()}
                </td>
                <td className="p-1.5">{pb.wpm.toFixed(1)}</td>
                <td className="p-1.5">{pb.acc.toFixed(1)}%</td>
                <td className="p-1.5">{pb.raw.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* {speedHistogram && speedHistogram.length !== 0 && (
        <div className="mt-4">
          <h3 className="font-bold text-lg">Speed Histogram</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Distribution of my typing speeds across all tests.
          </p>
          <div className="flex items-end gap-1 mt-2 h-48">
            {speedHistogram.map((entry, i) => (
              <div
                key={i}
                className="bg-[var(--accent)]"
                style={{
                  height: `${(entry.count / speedHistogram.reduce((max, e) => Math.max(max, e.count), 0)) * 100}%`,
                }}
                title={`${entry.wpm} WPM: ${entry.count} tests`}
              />
            ))}
          </div>
        </div>
      )}

      {speedHistogram && speedHistogram.length === 0 && (
        <p>No speed histogram data available.</p>
      )} */}

      {!loading && !error && !personalBests && !speedHistogram && (
        <p>No typing data available.</p>
      )}
    </div>
  );
}

function TypingCard() {
  return (
    <>
      <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default overflow-y-auto">
        <div className="flex flex-col">
          <h2 className="font-bold text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
            Typing Statistics.
          </h2>
          <div className="mt-3 ml-2">
            <p className="text-base mb-4">
              Since I'm on my computer all day, I might as well be improving my
              typing skills!
            </p>
            <p className="mb-2">
              <strong>Layout:</strong> I type in
              <ExternalLink text="Colemak" link={"https://colemak.com/"} />
            </p>
            <p>
              <strong>Keyboard:</strong> I use a MonsGeek M1 with KTT Kang
              Whites V3s lubed with Krytox 205g0 and modded with the force break
              mod, PE foam mod and polyfill mod.
            </p>
            <MonkeyTypeStats />
            <ExternalLink
              text="monkeytype profile"
              link={"https://monkeytype.com/profile/tyooou"}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default TypingCard;
