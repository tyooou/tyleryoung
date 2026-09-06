import { Globe, Images } from "lucide-react";
import ExternalLink from "../ExternalLink";
import TechStack from "./project/TechStack";
import { useExternalLinkConfirm } from "../../lib/useExternalLinkConfirm";
import CustomScrollbar from "../CustomScrollbar";

function formatMonthYear(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);
  return `${month} '${year}`;
}

function ExperienceEntryCard({ experience, onOpenPhotos }) {
  const { handleClick: handleExternalClick, modal: externalLinkModal } =
    useExternalLinkConfirm();
  if (!experience) return null;
  const { role, company, location, description, start, end, link, tags, techStack, photos, slug } =
    experience;

  return (
    <CustomScrollbar
      overflowClassName="overflow-visible sm:overflow-y-auto"
      className="font-mono select-none cursor-default"
    >
      {externalLinkModal}
      <div className="p-3 sm:p-5">
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
                onClick={handleExternalClick(link)}
              />
            </p>
          )}
          {photos?.length > 0 && (
            <p className="mt-2">
              <button
                type="button"
                onClick={() => onOpenPhotos(`${slug}-photos`)}
                className="cursor-pointer text-left group inline-flex items-center gap-2 hover:bg-[var(--bg-secondary)] p-2"
              >
                <Images size={16} className="text-[var(--text-secondary)]" />
                <span className="font-bold">
                  View photos ({photos.length})
                </span>
              </button>
            </p>
          )}
        </div>
      </div>
    </CustomScrollbar>
  );
}

export default ExperienceEntryCard;
