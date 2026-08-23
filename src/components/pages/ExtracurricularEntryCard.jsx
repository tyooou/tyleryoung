import { Globe } from "lucide-react";
import ExternalLink from "../ExternalLink";
import MasonryPhoto from "../MasonryPhoto";

function MasonryGallery({ title, photos, altFallback }) {
  if (!photos?.length) return null;
  return (
    <div>
      <p className="font-bold text-lg mb-3">{title}</p>
      <div className="columns-2 lg:columns-3 gap-3">
        {photos.map((photo, index) => (
          <MasonryPhoto key={photo.url || index} src={photo.url} alt={photo.alt || altFallback} />
        ))}
      </div>
    </div>
  );
}

function ExtracurricularEntryCard({ extracurricular }) {
  if (!extracurricular) return null;
  const { role, organisation, position, description, link, tags, graphics, photos } =
    extracurricular;
  const hasGallery = graphics?.length > 0 || photos?.length > 0;

  return (
    <div className="w-full h-full font-mono select-none cursor-default overflow-y-auto p-3 sm:p-5">
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
            />
          </p>
        )}
      </div>
      {hasGallery && (
        <div className="mt-8 flex flex-col gap-8">
          <MasonryGallery title="Graphics" photos={graphics} altFallback={`${organisation} graphic`} />
          <MasonryGallery title="Photos" photos={photos} altFallback={organisation} />
        </div>
      )}
    </div>
  );
}

export default ExtracurricularEntryCard;
