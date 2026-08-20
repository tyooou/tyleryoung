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
  const { title, description, link, graphics, photos } = extracurricular;
  const hasGallery = graphics?.length > 0 || photos?.length > 0;

  return (
    <div className="flex flex-col sm:flex-row w-full h-full font-mono select-none cursor-default sm:overflow-hidden">
      <div className="flex-1 sm:flex-2 p-3 sm:p-5 sm:overflow-y-auto">
        <h2 className="font-bold text-4xl sm:text-3xl md:text-4xl lg:text-5xl flex-shrink-0">
          {title}
        </h2>
        {link && (
          <p className="text-xl sm:text-2xl mt-2 ml-2 font-bold text-[var(--text-secondary)]">
            <ExternalLink
              text="Visit website"
              link={link}
              icon={<Globe size={18} className="text-[var(--text-secondary)]" />}
            />
          </p>
        )}
        <div className="ml-2 mt-4 max-w-2xl select-text cursor-text">
          {description ? (
            <p className="text-base whitespace-pre-line leading-relaxed">{description}</p>
          ) : (
            <p className="text-base text-[var(--text-secondary)]">(fill in)</p>
          )}
        </div>
      </div>
      {hasGallery && (
        <div className="flex-1 sm:flex-3 p-3 sm:p-5 sm:pt-6 sm:overflow-y-auto flex flex-col gap-8">
          <MasonryGallery title="Graphics" photos={graphics} altFallback={`${title} graphic`} />
          <MasonryGallery title="Photos" photos={photos} altFallback={title} />
        </div>
      )}
    </div>
  );
}

export default ExtracurricularEntryCard;
