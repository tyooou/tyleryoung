function SidebarLink({ text, updatePage, updateSidebar, projectName }) {
  const handleClick = () => {
    updatePage(projectName || text);
    if (window.innerWidth < 768) {
      updateSidebar(false);
    }
  };

  return (
    <a
      className="font-mono text-lg sm:text-xs hover:bg-[var(--bg)] px-10 sm:px-5 py-1 inline-block group relative cursor-pointer"
      onClick={handleClick}
    >
      <span className="inline-block transition-transform duration-200 group-hover:translate-x-2">
        {text}
      </span>

      <span className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        →
      </span>
    </a>
  );
}

export default SidebarLink;
