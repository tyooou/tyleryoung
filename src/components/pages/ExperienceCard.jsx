import { useEffect, useState } from "react";
import ExternalLink from "../ExternalLink";
import TechStack from "./project/TechStack";
import BrailleSpinner from "../BrailleSpinner";

function formatMonthYear(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);
  return `${month} '${year}`;
}

function Experience({
  role,
  company,
  location,
  description,
  start,
  end = "Present",
  link,
  logo,
  techStack,
}) {
  return (
    <>
      <div className="flex flex-col mb-4 space-y-1 sm:space-y-2 border-[var(--border-secondary)] pr-2 w-full">
        <p className="font-bold text-base">
          {role} @{link && <ExternalLink text={company} link={link} />}
        </p>
        <div className="text-base text-[var(--text-secondary)]">
          {formatMonthYear(start)} to {formatMonthYear(end)} - {location}
        </div>
        <p className="text-base">{description}</p>
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
        const response = await fetch(
          import.meta.env.BASE_URL + "experience.json",
        );
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

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 200);
    return () => clearInterval(interval);
  }, [loading]);

  return (
    <>
      <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default overflow-y-auto">
        <div className="flex flex-col">
          <h2 className="font-bold text-5xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Experience.
          </h2>
          <p className="text-base md:text-xl mt-3 ml-2">
            The amazing groups and companies I've learnt from and grown with!
          </p>
          <div className="flex flex-col ml-2 mt-6 gap-3 scroll sm:overflow-y-auto sm:max-h-[70vh] pr-2">
            {loading ? (
              <BrailleSpinner />
            ) : experiences.length > 0 ? (
              experiences.map((exp, idx) => (
                <Experience key={exp.company + exp.role + idx} {...exp} />
              ))
            ) : (
              <p className="">No experiences found :(</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ExperienceCard;
