function ExternalLink({ text, link, hover = true, icon, onClick }) {
  return (
    <a
      className={`group inline-flex items-center gap-2 ${hover ? "hover:bg-[var(--bg-secondary)] p-2" : ""}`}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
    >
      {icon}
      <span className="font-bold">{text}</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 -ml-1">
        [↗]
      </span>
    </a>
  );
}

export default ExternalLink;
