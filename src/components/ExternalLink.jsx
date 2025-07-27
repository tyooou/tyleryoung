function ExternalLink({ text, link, hover = true }) {
  return (
    <a
      className={`group ${hover ? "hover:bg-[var(--bg-secondary)] p-2" : ""}`}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="font-bold">{text}</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1">
        [↗]
      </span>
    </a>
  );
}

export default ExternalLink;
