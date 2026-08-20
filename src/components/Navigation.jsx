import { useEffect, useRef, useState } from "react";

function faviconUrl(link) {
  try {
    const { hostname } = new URL(link);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return null;
  }
}

function TabLabel({
  tab,
  friends,
  quickLinks,
  leetcodeProblems,
  experiences,
  extracurriculars,
  books,
  blogPosts,
}) {
  const browserLink =
    friends.find((f) => f.name === tab) ||
    quickLinks.find((q) => q.name === tab);
  if (browserLink) {
    const favicon = faviconUrl(browserLink.link);
    return (
      <span className="flex items-center gap-1.5 min-w-0">
        {favicon && (
          <img src={favicon} alt="" className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="truncate">{browserLink.name}</span>
      </span>
    );
  }
  const problem = leetcodeProblems.find((p) => p.path === tab);
  if (problem) {
    return <>{`${problem.number}. ${problem.title.replace(/ /g, "-")}.txt`}</>;
  }
  const experience = experiences.find((exp) => exp.slug === tab);
  if (experience) {
    return (
      <>
        {`${experience.role}-@-${experience.company}`.replace(/ /g, "-") +
          ".txt"}
      </>
    );
  }
  const extracurricular = extracurriculars.find((item) => item.slug === tab);
  if (extracurricular) {
    return <>{`${extracurricular.title.replace(/ /g, "-")}.txt`}</>;
  }
  const book = books.find((b) => b.slug === tab);
  if (book) {
    return <>{`${book.title.replace(/ /g, "-")}.txt`}</>;
  }
  const post = blogPosts.find((p) => p.slug === tab);
  if (post) {
    return <>{`${post.title.replace(/ /g, "-")}.txt`}</>;
  }
  return <>{`${tab.replace(/ /g, "-")}.txt`}</>;
}

function Navigation({
  pane,
  onSwitchTab,
  onDeleteTab,
  onTabDragStart,
  onTabDragEnd,
  friends,
  leetcodeProblems,
  experiences = [],
  extracurriculars = [],
  books = [],
  blogPosts = [],
  quickLinks = [],
}) {
  const { id: paneId, openTabs, page } = pane;
  const tabsRef = useRef(null);
  // Native scrollbars either overlay the row (covering tab text) or are too
  // fat to make "way thinner" — so the real scrollbar is hidden entirely and
  // this mock thumb tracks scroll position instead. It's absolutely
  // positioned just below the tab row, floating over the content card
  // rather than reserving its own layout space (so nothing shifts).
  const [scrollbar, setScrollbar] = useState({
    visible: false,
    leftPercent: 0,
    widthPercent: 1,
  });

  const updateScrollbar = () => {
    const el = tabsRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const scrollable = scrollWidth > clientWidth + 1;
    const widthPercent = scrollable ? clientWidth / scrollWidth : 1;
    const leftPercent = scrollable
      ? (scrollLeft / (scrollWidth - clientWidth)) * (1 - widthPercent)
      : 0;
    setScrollbar({ visible: scrollable, leftPercent, widthPercent });
  };

  useEffect(() => {
    updateScrollbar();
    window.addEventListener("resize", updateScrollbar);
    return () => window.removeEventListener("resize", updateScrollbar);
  }, [openTabs]);

  return (
    <>
      <nav className="hidden md:flex justify-between min-w-0 bg-[var(--bg-quaternary)] text-[var(--text)] select-none">
        <div className="sm:hidden flex items-center space-x-2 px-4 py-3 border-r border-[var(--border-secondary)] bg-[var(--bg)] -mb-5 border-b-0">
          <button
            className="font-mono text-lg truncate overflow-hidden whitespace-nowrap max-w-[200px]"
            onClick={() => onSwitchTab(paneId, page)}
          >
            <TabLabel
              tab={page}
              friends={friends}
              quickLinks={quickLinks}
              leetcodeProblems={leetcodeProblems}
              experiences={experiences}
              extracurriculars={extracurriculars}
              books={books}
              blogPosts={blogPosts}
            />
          </button>
        </div>

        <div className="group relative flex flex-col min-w-0">
          <div
            ref={tabsRef}
            onScroll={updateScrollbar}
            className="tabs-scroll flex items-start min-w-0 overflow-x-auto overflow-y-hidden"
          >
            {openTabs.map((tab, index) => (
              <div
                key={index}
                draggable={tab !== "bibliography"}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  onTabDragStart(paneId, tab);
                }}
                onDragEnd={onTabDragEnd}
                className={`flex items-center space-x-2 px-2 pt-2 pb-[9px] border-r border-[var(--border-secondary)] shrink-0 ${
                  tab === page
                    ? "bg-[var(--bg)] border-b border-b-[var(--bg)]"
                    : "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                <button
                  className={`font-mono text-xs truncate overflow-hidden whitespace-nowrap max-w-[150px] ${
                    tab === page ? "" : "cursor-pointer"
                  }`}
                  onClick={() => onSwitchTab(paneId, tab)}
                >
                  <TabLabel
                    tab={tab}
                    friends={friends}
                    quickLinks={quickLinks}
                    leetcodeProblems={leetcodeProblems}
                    experiences={experiences}
                    extracurriculars={extracurriculars}
                    books={books}
                    blogPosts={blogPosts}
                  />
                </button>
                {tab != "bibliography" && (
                  <span
                    className={`hover:bg-[var(--bg-secondary)] cursor-pointer text-mono text-xs px-1 rounded-sm ${
                      tab === page
                        ? "hover:bg-[var(--bg-secondary)]"
                        : "hover:bg-[var(--bg-tertiary)]"
                    }`}
                    onClick={() => onDeleteTab(paneId, tab)}
                  >
                    ×
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="absolute top-full left-0 right-0 h-[3px] z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {scrollbar.visible && (
              <div
                className="absolute top-0 h-full rounded-full bg-[var(--border-secondary)]"
                style={{
                  left: `${scrollbar.leftPercent * 100}%`,
                  width: `${scrollbar.widthPercent * 100}%`,
                }}
              />
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navigation;
