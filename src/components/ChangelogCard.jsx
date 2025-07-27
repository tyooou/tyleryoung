import { useState, useEffect } from "react";
import fm from "front-matter";

function ChangelogCard({ toggleSidebar }) {
  const [releaseNotes, setReleaseNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllReleaseNotes() {
      try {
        // Load the versions list
        const versionsResponse = await fetch("releaseNotes/versions.json");
        if (!versionsResponse.ok) {
          console.error("Failed to load versions list");
          return;
        }

        const { versions } = await versionsResponse.json();
        const allReleases = [];

        for (const version of versions) {
          try {
            const response = await fetch(`releaseNotes/${version}.md`);
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
        console.log(allReleases);
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
      <div className="w-full h-full p-5 font-mono">
        <h2 className="font-bold text-9xl">Changelog.</h2>
        <div className="border-l-4 border-[var(--border-secondary)] pl-6 mt-4">
          <p>Loading release notes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full p-5 font-mono flex flex-col">
        <h2 className="font-bold text-9xl flex-shrink-0">Changelog.</h2>

        <div className="flex-1 overflow-y-auto mt-4">
          {releaseNotes.map((release, index) => (
            <div
              key={release.version}
              className="border-l-4 border-[var(--border-secondary)] pl-6 mb-6"
            >
              <h4 className="text-xl font-bold">
                {release.version}
                <span className="ml-4 text-xs text-[var(--bg-quaternary)]">
                  {release.date}
                </span>
              </h4>
              <p className="text-base">{release.title}</p>

              {release.completed.length > 0 && (
                <ul className="list-disc mt-3">
                  <span className="font-bold text-base">Completed:</span>
                  {release.completed.map((item, itemIndex) => (
                    <li key={itemIndex} className="ml-6 text-base">
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {release.planned.length > 0 && (
                <ul className="list-disc mt-3">
                  <span className="font-bold text-base">Planned:</span>
                  {release.planned.map((item, itemIndex) => (
                    <li key={itemIndex} className="ml-6 text-base">
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
