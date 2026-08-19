import ExternalLink from "../ExternalLink";

function ExtracurricularEntryCard({ extracurricular }) {
  if (!extracurricular) return null;
  const { title, description, link, photos } = extracurricular;

  return (
    <div className="w-full h-full p-3 sm:p-5 font-mono flex flex-col select-none cursor-default overflow-y-auto">
      <h2 className="font-bold text-4xl sm:text-3xl md:text-4xl lg:text-5xl flex-shrink-0">
        {title}
      </h2>
      {link && (
        <p className="text-xl sm:text-2xl mt-2 ml-2 font-bold text-[var(--text-secondary)]">
          <ExternalLink text="Visit website" link={link} />
        </p>
      )}
      <div className="ml-2 mt-4 max-w-3xl select-text cursor-text">
        {description ? (
          <p className="text-base whitespace-pre-line leading-relaxed">{description}</p>
        ) : (
          <p className="text-base text-[var(--text-secondary)]">(fill in)</p>
        )}
      </div>
      {photos?.length > 0 && (
        <div className="ml-2 mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-4xl">
          {photos.map((photo, index) => (
            <img
              key={photo.url || index}
              src={photo.url}
              alt={photo.alt || title}
              className="w-full h-40 object-cover rounded border border-[var(--border-secondary)]"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ExtracurricularEntryCard;
