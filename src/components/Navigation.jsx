import { useEffect, useRef, useState } from "react";
import TyGlyph from "./TyGlyph";

// Matches the CSS animation-out duration in index.css — a closing tab has
// to stay in the DOM this long after its × is clicked so animate-tab-out
// can actually play, before it's really removed from openTabs.
const TAB_CLOSE_ANIMATION_MS = 160;

// Falls back to the site's own "ty." favicon when a link's site icon
// can't be resolved, instead of a generic placeholder.
const FALLBACK_FAVICON = "/favicon.svg";

// Capitalizes the first letter of each word only, leaving the rest of the
// word untouched so acronyms/brand casing (e.g. "IBM", "GitHub") survive.
// Uses \p{L} (Unicode letters) rather than \w so accented word starts
// (e.g. "Résumé") aren't misread as a new word at the accented letter.
function titleCase(str) {
  return str.replace(
    /(^|[^\p{L}\p{N}])(\p{L})/gu,
    (_, sep, letter) => sep + letter.toUpperCase(),
  );
}

function faviconUrl(link) {
  try {
    const { hostname } = new URL(link);
    // DuckDuckGo's icon service always resolves with a generic fallback
    // icon instead of 404ing, unlike Google's s2/favicons endpoint.
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } catch {
    return null;
  }
}

function Favicon({ link, className }) {
  const [failed, setFailed] = useState(false);
  const url = failed ? FALLBACK_FAVICON : faviconUrl(link) || FALLBACK_FAVICON;
  return (
    <img
      src={url}
      alt=""
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
    />
  );
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
  if (tab === "bibliography") {
    return (
      <span className="flex items-center gap-2.5 min-w-0 pl-1 pr-1">
        <TyGlyph />
        <span className="truncate font-bold">Welcome</span>
      </span>
    );
  }
  const browserLink =
    friends.find((f) => f.name === tab) ||
    quickLinks.find((q) => q.name === tab);
  if (browserLink) {
    return (
      <span className="flex items-center gap-1.5 min-w-0">
        <Favicon link={browserLink.link} className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{titleCase(browserLink.name)}</span>
      </span>
    );
  }
  const problem = leetcodeProblems.find((p) => p.path === tab);
  if (problem) {
    return <>{`LC${problem.number}.md`}</>;
  }
  const experience = experiences.find((exp) => exp.slug === tab);
  if (experience) {
    return <>{`${titleCase(experience.company).replace(/ /g, "-")}.txt`}</>;
  }
  const extracurricular = extracurriculars.find((item) => item.slug === tab);
  if (extracurricular) {
    return (
      <>
        {`${titleCase(extracurricular.organisation).replace(/ /g, "-")}.txt`}
      </>
    );
  }
  const book = books.find((b) => b.slug === tab);
  if (book) {
    return <>{`${titleCase(book.title).replace(/ /g, "-")}.txt`}</>;
  }
  const post = blogPosts.find((p) => p.slug === tab);
  if (post) {
    return <>{`${titleCase(post.title).replace(/ /g, "-")}.txt`}</>;
  }
  return <>{`${titleCase(tab).replace(/ /g, "-")}.txt`}</>;
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
  // Measured starting width per closing tab (px) — needed because a CSS
  // transition can't animate to/from an intrinsic "auto" width, only
  // between two concrete numbers.
  const [closingWidths, setClosingWidths] = useState({});
  // Flips true one frame after the tab starts closing, driving the actual
  // width -> 0 transition so the tabs after it slide left as it collapses,
  // instead of them jumping the instant it's removed from openTabs.
  const [collapsing, setCollapsing] = useState({});

  const handleDeleteTab = (tab, tabEl) => {
    const width = tabEl?.getBoundingClientRect().width ?? 0;
    setClosingWidths((prev) => ({ ...prev, [tab]: width }));
    // Two rAFs: the first lets the browser paint the tab at its just-set
    // starting width (a style declared and changed in the same frame never
    // animates — there's nothing to tween from), the second then flips the
    // target so the transition actually has two distinct frames to run
    // between.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCollapsing((prev) => ({ ...prev, [tab]: true }));
      });
    });
    setTimeout(() => {
      onDeleteTab(paneId, tab);
      setClosingWidths((prev) => {
        const next = { ...prev };
        delete next[tab];
        return next;
      });
      setCollapsing((prev) => {
        const next = { ...prev };
        delete next[tab];
        return next;
      });
    }, TAB_CLOSE_ANIMATION_MS);
  };
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

  // A ResizeObserver on the row itself, not a window resize listener: most
  // of what changes this row's width never resizes the window at all — the
  // AI panel opening or closing, the sidebar toggling or being dragged, the
  // split-view ratio moving. With only the window listener the thumb kept
  // whatever width it had when the tabs last changed, so it stayed visible
  // (and the wrong size) after the panel gave the row its space back. The
  // observer also covers real window resizes, since those change this
  // element's width too — and it fires throughout the panel's open/close
  // transition, so the thumb tracks the animation rather than snapping at
  // the end.
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    updateScrollbar();
    const observer = new ResizeObserver(updateScrollbar);
    observer.observe(el);
    return () => observer.disconnect();
  }, [openTabs]);

  // Keeps the active tab in view — switching to (or opening) a tab that's
  // scrolled off either edge of the tab bar shouldn't leave it hidden.
  // Manual scrollBy math rather than scrollIntoView so this can never touch
  // vertical/page scroll, only the tab row's own horizontal scroll.
  useEffect(() => {
    const container = tabsRef.current;
    const activeEl = container?.querySelector("[data-active-tab]");
    if (!container || !activeEl) return;
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    if (activeRect.left < containerRect.left) {
      container.scrollBy({
        left: activeRect.left - containerRect.left,
        behavior: "smooth",
      });
    } else if (activeRect.right > containerRect.right) {
      container.scrollBy({
        left: activeRect.right - containerRect.right,
        behavior: "smooth",
      });
    }
  }, [page, openTabs]);

  return (
    <>
      <nav
        data-tour="tab-bar"
        className="hidden md:flex justify-between min-w-0 bg-[var(--bg-quaternary)] text-[var(--text)] select-none"
      >
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

        <div className="group relative flex flex-1 flex-col min-w-0">
          <div
            ref={tabsRef}
            onScroll={updateScrollbar}
            className="tabs-scroll flex items-start min-w-0 overflow-x-auto overflow-y-hidden"
          >
            {openTabs.map((tab) => {
              const closingWidth = closingWidths[tab];
              const isClosing = closingWidth !== undefined;
              const isCollapsing = isClosing && collapsing[tab];
              return (
              <div
                key={tab}
                data-tab-item
                data-active-tab={tab === page ? "true" : undefined}
                data-tour={tab !== "bibliography" ? "draggable-tab" : undefined}
                draggable={tab !== "bibliography" && !isClosing}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  onTabDragStart(paneId, tab);
                }}
                onDragEnd={onTabDragEnd}
                style={
                  isClosing
                    ? {
                        width: isCollapsing ? 0 : closingWidth,
                        opacity: isCollapsing ? 0 : 1,
                        paddingLeft: isCollapsing ? 0 : undefined,
                        paddingRight: isCollapsing ? 0 : undefined,
                        borderRightWidth: isCollapsing ? 0 : undefined,
                        overflow: "hidden",
                        pointerEvents: "none",
                        transition: `width ${TAB_CLOSE_ANIMATION_MS}ms ease, opacity ${TAB_CLOSE_ANIMATION_MS}ms ease, padding ${TAB_CLOSE_ANIMATION_MS}ms ease, border-width ${TAB_CLOSE_ANIMATION_MS}ms ease`,
                      }
                    : undefined
                }
                className={`flex items-center space-x-2 px-2 pt-2 pb-[9px] border-r border-[var(--border-secondary)] shrink-0 ${
                  isClosing ? "" : "animate-tab-in"
                } ${
                  tab === page
                    ? "bg-[var(--bg)] border-b-2 border-b-[var(--bg)]"
                    : "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border-b border-b-[var(--border-secondary)]"
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
                    onClick={(e) =>
                      handleDeleteTab(tab, e.currentTarget.closest("[data-tab-item]"))
                    }
                  >
                    ×
                  </span>
                )}
              </div>
              );
            })}
            <div
              aria-hidden="true"
              className="flex-1 min-w-0 self-stretch border-b border-[var(--border-secondary)]"
            />
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
