import { useEffect, useState } from "react";
import ExternalLink from "../ExternalLink";

function formatMonthYear(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);
  return `${month} '${year}`;
}

function Experience({ role, company, location, description, start, end = "Present", link, logo }) {
  return (
    <>
      <div className="flex flex-col mb-4 space-y-2 border-l-4 border-[var(--border-secondary)] pl-6">
        <p className="font-bold">{role} @{link && <ExternalLink text={company} link={link} />}</p>
        <div className="text-sm text-[var(--text-secondary)]">
          {formatMonthYear(start)} to {formatMonthYear(end)} - {location}
        </div>
        <p className="text-sm">{description}</p>
      </div>
    </>
  );
}

function ExperienceCard() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExperiences() {
      try {
        const response = await fetch(import.meta.env.BASE_URL + "/experience.json");
        if (!response.ok) throw new Error("Failed to load experiences");
        const data = await response.json();
        setExperiences(data);
      } catch (err) {
        setExperiences([]);
      } finally {
        setLoading(false);
      }
    }
    fetchExperiences();
  }, []);

  return (
    <>
      <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default">
        <div className="flex flex-col">
          <h2 className="font-bold text-8xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
            Experience.
          </h2>
          <div className="mt-6 ml-2 max-w-4xl">
            <p className="text-2xl sm:text-lg md:text-xl mb-2">
              The amazing groups and companies I've learnt from and grown with!
            </p>
            <div className="flex flex-col mt-6 gap-3 scroll overflow-y-auto max-h-[70vh] pr-2">
              {loading ? (
                <span>Loading...</span>
              ) : (
                experiences.map((exp, idx) => (
                  <Experience key={exp.company + exp.role + idx} {...exp} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ExperienceCard;
