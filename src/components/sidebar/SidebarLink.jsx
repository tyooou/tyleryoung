function SidebarLink({
  text,
  subtitle,
  updatePage,
  updateSidebar,
  projectName,
  icon,
  indent = 0,
}) {
  const handleClick = () => {
    updatePage(projectName || text);
    if (window.innerWidth < 768) {
      updateSidebar(false);
    }
  };

  return (
    <a
      className="font-mono text-lg sm:text-xs hover:bg-[var(--bg)] px-5 py-2 block w-full group relative cursor-pointer"
      style={indent ? { paddingLeft: `${1.25 + indent * 1}rem` } : undefined}
      onClick={handleClick}
    >
      <span className="flex items-center w-full min-w-0">
        {icon && (
          <span className="mr-2 flex items-center shrink-0 transition-transform duration-200 group-hover:translate-x-2">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1 transition-transform duration-200 group-hover:translate-x-2">
          <span className="block truncate">{text}</span>
          {subtitle && (
            <span className="block truncate text-xs sm:text-[10px] text-[var(--text-secondary)]">
              {subtitle}
            </span>
          )}
        </span>
        <span className="ml-auto shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          →
        </span>
      </span>
    </a>
  );
}

export default SidebarLink;
