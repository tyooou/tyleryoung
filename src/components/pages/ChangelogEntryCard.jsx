function ChangelogEntryCard({ release }) {
  if (!release) return null;

  return (
    <div className="w-full h-full p-3 sm:p-5 font-mono flex flex-col select-none cursor-default overflow-y-auto">
      <h2 className="font-bold text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl flex-shrink-0">
        {release.version}
      </h2>
      <div className="ml-2 mt-6">
        <p className="text-base text-[var(--text-secondary)]">{release.date}</p>
        <p className="text-base mt-2 mb-6">{release.title}</p>

        {release.completed?.length > 0 && (
          <ul className="list-disc mt-3">
            <span className="font-bold text-sm">Completed:</span>
            {release.completed.map((item, idx) => (
              <li key={idx} className="ml-4 text-sm">
                {item}
              </li>
            ))}
          </ul>
        )}

        {release.planned?.length > 0 && (
          <ul className="list-disc mt-3">
            <span className="font-bold text-sm">Planned:</span>
            {release.planned.map((item, idx) => (
              <li key={idx} className="ml-4 text-sm">
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ChangelogEntryCard;
