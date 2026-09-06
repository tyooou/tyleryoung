import { Globe, Images } from "lucide-react";
import ExternalLink from "../ExternalLink";
import { useExternalLinkConfirm } from "../../lib/useExternalLinkConfirm";
import CustomScrollbar from "../CustomScrollbar";

function ExtracurricularEntryCard({ extracurricular, onOpenPhotos }) {
  const { handleClick: handleExternalClick, modal: externalLinkModal } =
    useExternalLinkConfirm();
  if (!extracurricular) return null;
  const { role, organisation, position, description, link, tags, photos, slug } =
    extracurricular;

  return (
    <CustomScrollbar className="font-mono select-none cursor-default p-3 sm:p-5">
      {externalLinkModal}
      <h2 className="font-bold text-4xl sm:text-3xl md:text-4xl lg:text-5xl flex-shrink-0">
        {role}
      </h2>
      <p className="text-xl sm:text-2xl mt-2 ml-2 font-bold text-[var(--text-secondary)]">
        {organisation}
      </p>
      <div className="ml-2 mt-4 max-w-2xl select-text cursor-text">
        {position && <p className="text-base text-[var(--text-secondary)]">{position}</p>}
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
        {description ? (
          <p className="text-base whitespace-pre-line leading-relaxed mt-4">{description}</p>
        ) : (
          <p className="text-base text-[var(--text-secondary)] mt-4">(fill in)</p>
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
    </CustomScrollbar>
  );
}

export default ExtracurricularEntryCard;
