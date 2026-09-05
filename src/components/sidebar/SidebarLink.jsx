function SidebarLink({
  text,
  subtitle,
  updatePage,
  updateSidebar,
  projectName,
  icon,
  indent = 0,
  isActive = false,
}) {
  const handleClick = () => {
    updatePage(projectName || text);
    if (window.innerWidth < 768) {
      updateSidebar(false);
    }
  };

  return (
    <a
      className={`font-mono text-lg sm:text-xs px-5 py-2 block w-full group relative cursor-pointer border-l-2 ${
        isActive
          ? "border-transparent text-[var(--accent)] bg-[var(--bg-tertiary)] font-semibold"
          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)]"
      }`}
      style={
        indent
          ? { paddingLeft: `${1.25 + indent * 1}rem` }
          : undefined
      }
      onClick={handleClick}
    >
      <span className="flex items-center w-full min-w-0">
        {icon && <span className="mr-2 flex items-center shrink-0">{icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate">{text}</span>
          {subtitle && (
            <span className="block truncate text-xs sm:text-[10px] text-[var(--text-secondary)]">
              {subtitle}
            </span>
          )}
        </span>
      </span>
    </a>
  );
}

export default SidebarLink;
