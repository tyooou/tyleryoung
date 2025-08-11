import { useState, useEffect } from "react";
import fm from "front-matter";

function ChangelogCard() {
  const [releaseNotes, setReleaseNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVersion, setActiveVersion] = useState(null);

  useEffect(() => {
    async function loadAllReleaseNotes() {
      try {
        // Load the versions list
        const versionsResponse = await fetch(
          import.meta.env.BASE_URL + "/releaseNotes/versions.json"
        );
        if (!versionsResponse.ok) {
          console.error("Failed to load versions list");
          return;
        }

        const { versions } = await versionsResponse.json();
        const allReleases = [];

        for (const version of versions) {
          try {
            const response = await fetch(
              import.meta.env.BASE_URL + `/releaseNotes/${version}.md`
            );
            if (!response.ok) continue;

            const raw = await response.text();
            const { attributes: data, body: content } = fm(raw);

            // Parse the markdown content
            const sections = content.split("## ").filter(Boolean);
            const completed =
              sections
                .find((s) => s.startsWith("Completed"))
                ?.split("\n")
                .slice(1)
                .filter((line) => line.trim().startsWith("-"))
                .map((line) => line.trim().substring(2)) || [];
            const planned =
              sections
                .find((s) => s.startsWith("Planned"))
                ?.split("\n")
                .slice(1)
                .filter((line) => line.trim().startsWith("-"))
                .map((line) => line.trim().substring(2)) || [];

            allReleases.push({
              version: data.version,
              date: data.date,
              title: data.title,
              completed,
              planned,
            });
          } catch (error) {
            console.error(`Failed to load ${version}:`, error);
          }
        }

        // Sort by version (newest first)
        allReleases.sort((a, b) => {
          const versionA = a.version.replace("v", "").split(".").map(Number);
          const versionB = b.version.replace("v", "").split(".").map(Number);

          for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
            const numA = versionA[i] || 0;
            const numB = versionB[i] || 0;
            if (numA !== numB) return numB - numA; // Descending order
          }
          return 0;
        });

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

  if (loading) {
    return (
      <div className="w-full h-full p-3 sm:p-5 font-mono">
        <h2 className="font-bold text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
          Changelog.
        </h2>
        <div className="border-l-4 border-[var(--border-secondary)] pl-6 mt-4">
          <p className="text-sm sm:text-base">Loading release notes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full p-3 sm:p-5 font-mono flex flex-col select-none cursor-default">
        <h2 className="font-bold text-7xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl flex-shrink-0">
          Changelog.
        </h2>

        {/* Version tabs */}
        <div className="mt-4 mb-4">
          {releaseNotes.map((release) => (
            <button
              key={release.version}
              onClick={() => setActiveVersion(release.version)}
              className={`rounded px-2 py-1 ${
                activeVersion === release.version
                  ? "font-bold bg-[var(--bg-tertiary)]"
                  : "hover:bg-[var(--bg-secondary)]"
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
              <div
                key={release.version}
                className="border-l-4 border-[var(--border-secondary)] pl-4 sm:pl-6"
              >
                <h4 className="text-xl sm:text-xl font-bold">
                  {release.version}
                  <span className="block sm:inline sm:ml-4 text-sm sm:text-xs text-[var(--bg-quaternary)]">
                    {release.date}
                  </span>
                </h4>
                <p className="text-base sm:text-base">{release.title}</p>

                {release.completed.length > 0 && (
                  <ul className="list-disc mt-3">
                    <span className="font-bold text-base sm:text-base">
                      Completed:
                    </span>
                    {release.completed.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="ml-4 sm:ml-6 text-base sm:text-base"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {release.planned.length > 0 && (
                  <ul className="list-disc mt-3">
                    <span className="font-bold text-base sm:text-base">
                      Planned:
                    </span>
                    {release.planned.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="ml-4 sm:ml-6 text-base sm:text-base"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

export default ChangelogCard;
