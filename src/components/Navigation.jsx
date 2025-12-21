function Navigation({ updatePage, deleteTab, openTabs, page }) {

  return (
    <>
      <nav className="flex justify-between bg-[var(--bg-quaternary)] text-[var(--text)] select-none border-b border-[var(--border-secondary)]">
        <div className="sm:hidden flex items-center space-x-2 px-4 py-3 border-r border-[var(--border-secondary)] bg-[var(--bg)] -mb-5 border-b-0">
          <button
            className="font-mono text-lg truncate overflow-hidden whitespace-nowrap max-w-[200px]"
            onClick={() => updatePage(page)}
          >
            {`${page.replace(/ /g, "-")}.txt`}
          </button>
        </div>

        <div className="hidden sm:flex">
          {openTabs.map((tab, index) => (
            <div
              key={index}
              className={`flex items-center space-x-2 px-2 py-1.5 border-r border-[var(--border-secondary)]  ${
                tab === page
                  ? "bg-[var(--bg)] -mb-px border-b-0"
                  : "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              <button
                className={`font-mono text-xs truncate overflow-hidden whitespace-nowrap max-w-[150px] ${
                  tab === page ? "" : "cursor-pointer"
                }`}
                onClick={() => updatePage(`${tab}`)}
              >
                {`${tab.replace(/ /g, "-")}.txt`}
              </button>
              {tab != "bibliography" && (
                <span
                  className={`hover:bg-[var(--bg-secondary)] cursor-pointer text-mono text-xs px-1 rounded-sm ${
                    tab === page
                      ? "hover:bg-[var(--bg-secondary)]"
                      : "hover:bg-[var(--bg-tertiary)]"
                  }`}
                  onClick={() => deleteTab(`${tab}`)}
                >
                  ×
                </span>
              )}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}

export default Navigation;
