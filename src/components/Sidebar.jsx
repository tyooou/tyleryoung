import { useEffect, useRef, useState } from "react";
import ActivityBar from "./sidebar/ActivityBar";
import ActivityPanel from "./sidebar/ActivityPanel";
import ResizeHandle from "./ResizeHandle";
import {
  MIN_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  DEFAULT_PANEL_WIDTH,
  SNAP_CLOSE_THRESHOLD,
  ACTIVITY_BAR_WIDTH,
} from "../lib/sidebarConstants";

function Sidebar({
  updatePage,
  updateSidebar,
  state,
  projects,
  pages,
  releases,
  friends,
  leetcodeProblems,
  experiences,
  extracurriculars,
  books,
  blogPosts,
  quickLinks,
  onPanelWidthChange,
  onPanelResizingChange,
}) {
  const visiblePages = pages
    .filter((p) => p.enabled)
    .sort((a, b) => a.order - b.order);

  const [activeActivity, setActiveActivity] = useState(() => {
    const saved = localStorage.getItem("sidebarActiveActivity");
    if (saved === null) return "experience";
    try {
      return JSON.parse(saved);
    } catch {
      return "experience";
    }
  });
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = Number(localStorage.getItem("sidebarPanelWidth"));
    return saved >= MIN_PANEL_WIDTH && saved <= MAX_PANEL_WIDTH
      ? saved
      : DEFAULT_PANEL_WIDTH;
  });
  // Below this, the sidebar becomes a full-screen overlay (see the
  // container's mobile translate classes below) — the panel should fill
  // whatever's left of that overlay rather than use the desktop draggable
  // width, or content peeks through on the right on narrow screens.
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = viewportWidth < 768;
  const [isDragging, setIsDragging] = useState(false);
  const startWidthRef = useRef(panelWidth);
  const liveWidthRef = useRef(panelWidth);
  // Tracks the last non-null activeActivity so a drag-to-reopen (starting
  // from a fully closed state, where activeActivity may have been nulled
  // out) has something real to show as it's pulled out, instead of an
  // empty panel.
  const lastActivityRef = useRef(activeActivity);
  useEffect(() => {
    if (activeActivity) lastActivityRef.current = activeActivity;
  }, [activeActivity]);

  // The header's open/close button (`state`) only hides the panel — the
  // activity bar itself stays put on desktop, VS Code-style. On mobile the
  // whole thing still slides away together as one overlay (see the
  // container's translate classes below), so this same effective width
  // correctly zeroes out either way.
  const panelOpen = state && activeActivity !== null;
  const effectiveWidth = panelOpen
    ? isMobile
      ? viewportWidth - ACTIVITY_BAR_WIDTH
      : panelWidth
    : 0;

  useEffect(() => {
    onPanelWidthChange?.(effectiveWidth);
  }, [effectiveWidth, onPanelWidthChange]);

  useEffect(() => {
    localStorage.setItem("sidebarPanelWidth", String(panelWidth));
  }, [panelWidth]);

  useEffect(() => {
    localStorage.setItem("sidebarActiveActivity", JSON.stringify(activeActivity));
  }, [activeActivity]);

  const handleSelectActivity = (id) => {
    const next = activeActivity === id ? null : id;
    setActiveActivity(next);
    // Dragging the resize handle closed calls updateSidebar(false) (see
    // onDragEnd below) without touching activeActivity, so `state` can be
    // false while an activity is still "selected" — without this, clicking
    // an activity bar icon afterward would flip activeActivity but panelOpen
    // (state && activeActivity !== null) would stay false, and the panel
    // would never actually reopen.
    if (next !== null) updateSidebar(true);
  };

  return (
    <div
      className={`font-mono fixed left-0 top-[57px] sm:top-[35px] bottom-[37px] sm:bottom-[33px] sm:translate-x-0 flex flex-row bg-[var(--bg-secondary)] text-[var(--text)] transition-transform duration-300 select-none z-30 ${state ? "translate-x-0" : "-translate-x-full"}`}
    >
      <ActivityBar
        pages={visiblePages}
        activeActivity={activeActivity}
        onSelectActivity={handleSelectActivity}
        updatePage={updatePage}
        updateSidebar={updateSidebar}
        quickLinks={quickLinks}
      />
      <ActivityPanel
        activeActivity={activeActivity}
        pages={visiblePages}
        projects={projects}
        releases={releases}
        friends={friends}
        leetcodeProblems={leetcodeProblems}
        experiences={experiences}
        extracurriculars={extracurriculars}
        books={books}
        blogPosts={blogPosts}
        updatePage={updatePage}
        updateSidebar={updateSidebar}
        width={effectiveWidth}
        animateWidth={!isDragging}
      />
      {/* Always rendered — including while closed, so the collapsed edge can
          still be grabbed and dragged back open, VS Code-style. It's an
          invisible hit-target (see ResizeHandle) either way, so there's
          nothing extra to show; only the drag behavior changes.
          When open, it's centered on the panel/content boundary (normal
          resize-grip feel). When closed, that same boundary sits right at
          the ActivityBar's own edge — centering it there would have this
          8px-wide hit zone overlap the last 4px of every activity icon
          button underneath (it's z-20, so it'd win the hit test), hijacking
          plain icon clicks into resize-drags. Anchoring it to the right
          instead keeps the whole hit zone off the ActivityBar entirely. */}
      <ResizeHandle
        className="absolute top-0 h-full w-2 z-20"
        style={{
          left: `${ACTIVITY_BAR_WIDTH + effectiveWidth}px`,
          transform: panelOpen ? "translateX(-50%)" : "translateX(0)",
        }}
        onDragStart={() => {
          if (!panelOpen) {
            // Starting from fully closed: restore whatever activity was
            // last shown (so there's real content to reveal) and start the
            // width at 0 rather than the stale last-open width, so it
            // visibly grows from nothing as it's pulled out instead of
            // popping open instantly.
            if (activeActivity === null)
              setActiveActivity(lastActivityRef.current);
            if (!state) updateSidebar(true);
            setPanelWidth(0);
            startWidthRef.current = 0;
            // A plain click (mousedown+mouseup, no real movement) never
            // calls onDrag, so without this, onDragEnd's snap-close check
            // below would see whatever liveWidthRef was left over from the
            // last real drag — not the 0 this gesture actually started at —
            // and fail to detect "that wasn't a drag," leaving the panel
            // stuck open-but-0-width instead of cleanly closed.
            liveWidthRef.current = 0;
          } else {
            startWidthRef.current = panelWidth;
          }
          setIsDragging(true);
          onPanelResizingChange?.(true);
        }}
        onDrag={(deltaX) => {
          const next = Math.min(
            MAX_PANEL_WIDTH,
            Math.max(0, startWidthRef.current + deltaX),
          );
          liveWidthRef.current = next;
          setPanelWidth(next);
        }}
        onDragEnd={() => {
          setIsDragging(false);
          onPanelResizingChange?.(false);
          if (liveWidthRef.current < SNAP_CLOSE_THRESHOLD) {
            updateSidebar(false);
            setPanelWidth(DEFAULT_PANEL_WIDTH);
          }
        }}
      />
    </div>
  );
}

export default Sidebar;
