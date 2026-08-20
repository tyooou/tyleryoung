import { Globe } from "lucide-react";
import ExternalLink from "../ExternalLink";
import TechStack from "./project/TechStack";
import ExperiencePhotoGrid from "./ExperiencePhotoGrid";

function formatMonthYear(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);
  return `${month} '${year}`;
}

function ExperienceEntryCard({ experience }) {
  if (!experience) return null;
  const { role, company, location, description, start, end, link, tags, techStack, photos } =
    experience;

  return (
    <div className="flex flex-col sm:flex-row w-full h-full font-mono select-none cursor-default sm:overflow-hidden">
      <div className="flex-1 sm:flex-2 p-3 sm:p-5 sm:overflow-y-auto">
        <h2 className="font-bold text-4xl sm:text-3xl md:text-4xl lg:text-5xl flex-shrink-0">
          {role}
        </h2>
        <p className="text-xl sm:text-2xl mt-2 ml-2 font-bold text-[var(--text-secondary)]">
          {company}
        </p>
        <div className="ml-2 mt-4 max-w-2xl">
          <p className="text-base text-[var(--text-secondary)]">
            {formatMonthYear(start)} to {end ? formatMonthYear(end) : "Present"}
            {location ? ` — ${location}` : ""}
          </p>
          {tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {description && (
            <p className="text-base mt-4 whitespace-pre-line leading-relaxed">{description}</p>
          )}
          {techStack?.length > 0 && (
            <div className="mt-6">
              <TechStack techStack={techStack} />
            </div>
          )}
          {link && (
            <p className="mt-6">
              <ExternalLink
                text="Visit website"
                link={link}
                icon={<Globe size={16} className="text-[var(--text-secondary)]" />}
              />
            </p>
          )}
        </div>
      </div>
      {photos?.length > 0 && (
        <div className="flex-1 sm:flex-3 p-6 pl-3 sm:pl-6 h-96 sm:h-full overflow-hidden">
          <ExperiencePhotoGrid photos={photos} alt={role} />
        </div>
      )}
    </div>
  );
}

export default ExperienceEntryCard;
