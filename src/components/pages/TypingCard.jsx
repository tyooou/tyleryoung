import ExternalLink from "../ExternalLink";
import Scribble from "../Scribble";
import StatTile from "../StatTile";
import { Keyboard } from "lucide-react";
import { useState, useEffect } from "react";

// Alpha keys only (no numbers/modifiers) — enough to see how the two
// layouts differ. Each row is indented a bit further than the last to
// mimic a real keyboard's stagger.
const COLEMAK_ROWS = [
  ["Q", "W", "F", "P", "G", "J", "L", "U", "Y", ";"],
  ["A", "R", "S", "T", "D", "H", "N", "E", "I", "O"],
  ["Z", "X", "C", "V", "B", "K", "M"],
];

const QWERTY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

function KeyboardLayout({ label, rows }) {
  return (
    <div>
      <p className="text-sm font-bold mb-2 text-[var(--text-secondary)]">
        {label}
      </p>
      <div className="flex flex-col gap-1">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex gap-1"
            style={{ marginLeft: `${i * 1}rem` }}
          >
            {row.map((key) => (
              <div
                key={key}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-[var(--border-secondary)] rounded bg-[var(--bg-tertiary)] text-xs font-bold shrink-0"
              >
                {key}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const API_BASE = "https://api.monkeytype.com";
const apiKey = import.meta.env.VITE_APE_KEY;

const CACHE_KEY = "monkeyTypeStatsCache";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const DURATIONS = [15, 30, 60, 120];

function getResponseData(responseJson) {
  if (!responseJson || typeof responseJson !== "object") {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(responseJson, "data")) {
    return responseJson.data;
  }

  return null;
}

const FETCH_TIMEOUT_MS = 10000;

// The typing page mounts alongside a burst of other data fetches (Sanity
// queries, images), and MonkeyType's API has occasionally just hung under
// that concurrent load rather than erroring — a bare fetch() with no
// timeout would leave the whole Promise.all (and the loading spinner)
// stuck forever, so every request gets its own hard cutoff.
async function fetchMonkeyType(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `ApeKey ${apiKey}` },
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Request failed");
    }
    return getResponseData(await res.json());
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function formatHours(seconds) {
  return `${(seconds / 3600).toFixed(1)}h`;
}

function MonkeyTypeStats() {
  const [stats, setStats] = useState(null);
  const [bestsByDuration, setBestsByDuration] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        setStats(data.stats);
        setBestsByDuration(data.bestsByDuration);
        return;
      }
    }

    // Dev-mode StrictMode mounts this twice; ignoring the stale run's
    // result once cancelled keeps it from clobbering the live one.
    let cancelled = false;
    fetchAll(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, []);

  async function fetchAll(isCancelled) {
    setLoading(true);
    setError(null);

    try {
      const [statsData, ...bestsResults] = await Promise.all([
        fetchMonkeyType("/users/stats"),
        ...DURATIONS.map((d) =>
          fetchMonkeyType(`/users/personalBests?mode=time&mode2=${d}`),
        ),
      ]);
      if (isCancelled()) return;

      const bestsData = {};
      DURATIONS.forEach((d, i) => {
        const entries = bestsResults[i];
        bestsData[d] =
          Array.isArray(entries) && entries.length > 0
            ? entries.reduce((best, e) => (e.wpm > best.wpm ? e : best))
            : null;
      });

      setStats(statsData);
      setBestsByDuration(bestsData);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: { stats: statsData, bestsByDuration: bestsData },
          timestamp: Date.now(),
        }),
      );
    } catch (err) {
      if (!isCancelled()) setError(err.message);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }

  const bestOverall = bestsByDuration
    ? Object.values(bestsByDuration).reduce(
        (best, e) => (e && (!best || e.wpm > best.wpm) ? e : best),
        null,
      )
    : null;

  return (
    <div className="mt-6 mb-6 font-mono">
      {loading && <Scribble />}

      {error && <p className="text-red-500">Error: {error}</p>}

      {stats && (
        <ul className="animate-content-in flex flex-wrap gap-6 mb-6">
          <StatTile
            label="Best WPM"
            value={bestOverall ? bestOverall.wpm.toFixed(0) : "—"}
          />
          <StatTile label="Tests Completed" value={stats.completedTests} />
          <StatTile label="Tests Started" value={stats.startedTests} />
          <StatTile label="Time Typing" value={formatHours(stats.timeTyping)} />
        </ul>
      )}

      {bestsByDuration && (
        <table className="w-full max-w-[600px] border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-secondary)]">
              <th className="text-left p-1.5">Duration</th>
              <th className="text-left p-1.5">WPM</th>
              <th className="text-left p-1.5">Accuracy</th>
              <th className="text-left p-1.5">Raw</th>
              <th className="text-left p-1.5">Date</th>
            </tr>
          </thead>
          <tbody>
            {DURATIONS.map((d) => {
              const pb = bestsByDuration[d];
              return (
                <tr key={d} className="border-b border-[var(--border-secondary)]">
                  <td className="p-1.5">{d}s</td>
                  {pb ? (
                    <>
                      <td className="p-1.5">{pb.wpm.toFixed(1)}</td>
                      <td className="p-1.5">{pb.acc.toFixed(1)}%</td>
                      <td className="p-1.5">{pb.raw.toFixed(1)}</td>
                      <td className="p-1.5 text-[var(--text-secondary)]">
                        {new Date(pb.timestamp).toLocaleDateString()}
                      </td>
                    </>
                  ) : (
                    <td className="p-1.5 text-[var(--text-secondary)]" colSpan={4}>
                      No data
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!loading && !error && !stats && <p>No typing data available.</p>}
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
          <p className="text-base md:text-xl mt-6 ml-2">
            Since I'm on my computer all day, I might as well be improving my
            typing skills!
          </p>
          <div className="mt-6 ml-2">
            <p>
              <strong>Keyboard:</strong> I use a MonsGeek M1 with KTT Kang
              Whites V3s lubed with Krytox 205g0 and modded with the force break
              mod, PE foam mod and polyfill mod.
            </p>
            <div className="mt-6 mb-2">
              <p className="font-bold text-lg mb-1">Keyboard Layout</p>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Colemak (what I actually type on) next to standard QWERTY for
                comparison.
              </p>
              <div className="flex flex-col sm:flex-row gap-8">
                <KeyboardLayout label="Colemak" rows={COLEMAK_ROWS} />
                <KeyboardLayout label="QWERTY" rows={QWERTY_ROWS} />
              </div>
            </div>
            <MonkeyTypeStats />
            <ExternalLink
              text="monkeytype profile"
              link={"https://monkeytype.com/profile/tyooou"}
              icon={<Keyboard size={16} className="text-[var(--text-secondary)]" />}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default TypingCard;
