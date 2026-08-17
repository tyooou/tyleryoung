import { useState, useEffect } from "react";
import { sanityClient } from "../../lib/sanityClient";

function VersionCard({ release }) {
  return (
    <div
      key={release.version}
      className="border-l-3 border-[var(--border-secondary)] pl-0 pl-6"
    >
      <h4 className="text-sm font-bold">
        {release.version}
        <span className="inline ml-4 text-sm text-[var(--bg-quaternary)]">
          {release.date}
        </span>
      </h4>
      <p className="text-sm">{release.title}</p>

      {release.completed.length > 0 && (
        <ul className="list-disc mt-3">
          <span className="font-bold text-sm">
            Completed:
          </span>
          {release.completed.map((item, itemIndex) => (
            <li
              key={itemIndex}
              className="ml-4 text-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      )}

      {release.planned.length > 0 && (
        <ul className="list-disc mt-3">
          <span className="font-bold text-sm">
            Planned:
          </span>
          {release.planned.map((item, itemIndex) => (
            <li
              key={itemIndex}
              className="ml-4 text-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ChangelogCard() {
  const [releaseNotes, setReleaseNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVersion, setActiveVersion] = useState(null);

  useEffect(() => {
    async function loadAllReleaseNotes() {
      try {
        const allReleases = await sanityClient.fetch(`
          *[_type == "release"] | order(order asc){
            version, date, title,
            "completed": coalesce(completed, []),
            "planned": coalesce(planned, [])
          }
        `);

        setReleaseNotes(allReleases);

        if (allReleases.length > 0) {
          setActiveVersion(allReleases[0].version);
        }
      } catch (error) {
        console.error("Failed to load release notes:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAllReleaseNotes();
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
      <p>{frames[frame]}</p>
    );
  }

  return (
    <>
      <div className="w-full h-full p-3 sm:p-5 font-mono flex flex-col select-none cursor-default overflow-y-auto">
        <h2 className="font-bold text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl flex-shrink-0">
          Changelog.
        </h2>
        <div className="ml-2 mt-6">
          <p className="text-base mb-2">
            All notable changes to this project will be documented in this file.
          </p>

          {loading && (
            <BrailleSpinner />
          )}

          {releaseNotes.length === 0 && !loading && (
            <p className="text-sm sm:text-base mt-4">
              No release notes available.
            </p>
          )}

          {releaseNotes.length > 0 && !loading && (
            <>
              <div className="mt-3 mb-6 space-x-2">
                {releaseNotes.map((release) => (
                  <button
                  key={release.version}
                  onClick={() => setActiveVersion(release.version)}
                  className={`rounded mt-2 px-2 py-1 border border-[var(--border)] text-sm ${
                    activeVersion === release.version
                      ? "font-bold bg-[var(--bg-quaternary)]"
                      : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                    }`}
                  >
                    {release.version}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto pb-10 sm:pb-4">
                {releaseNotes
                .filter((release) => release.version === activeVersion)
                .map((release) => (
                  <VersionCard key={release.version} release={release} />
                ))}
              </div>
            </>
          )}
         </div>
      </div>
    </>
  );
}

export default ChangelogCard;
