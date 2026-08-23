import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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

const Sidebar = forwardRef(function Sidebar(
  {
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
  },
  ref,
) {
  const visiblePages = pages
    .filter((p) => p.enabled)
    .sort((a, b) => a.order - b.order);

  const [activeActivity, setActiveActivity] = useState(() => {
    const saved = localStorage.getItem("sidebarActiveActivity");
    if (saved === null) return "bibliography";
    try {
      return JSON.parse(saved);
    } catch {
      return "bibliography";
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
  // activity bar itself stays put on desktop. On mobile the whole thing
  // still slides away together as one overlay (see the container's
  // translate classes below), so this same effective width correctly
  // zeroes out either way.
  const panelOpen = state && activeActivity !== null;
  // window.innerWidth is real/physical screen pixels, unaffected by the
  // site-wide CSS zoom in index.css — but this result gets applied as a
  // width on an element that inherits that zoom, so it'd get shrunk a
  // second time when rendered unless converted to the same "layout" pixel
  // space zoom itself operates in first (same fix as ZoomedIframe/
  // TourOverlay). Without this, the mobile panel fell visibly short of the
  // full remaining width next to the activity bar.
  const pageZoom =
    parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  const effectiveWidth = panelOpen
    ? isMobile
      ? viewportWidth / pageZoom - ACTIVITY_BAR_WIDTH
      : panelWidth
    : 0;

  useEffect(() => {
    onPanelWidthChange?.(effectiveWidth);
  }, [effectiveWidth, onPanelWidthChange]);

  useEffect(() => {
    localStorage.setItem("sidebarPanelWidth", String(panelWidth));
  }, [panelWidth]);

  useEffect(() => {
    localStorage.setItem(
      "sidebarActiveActivity",
      JSON.stringify(activeActivity),
    );
  }, [activeActivity]);

  const handleSelectActivity = (id) => {
    // On mobile the panel now spans the full screen and closes via swipe
    // instead — re-tapping the active icon switching sections is easy to
    // trigger by accident on a touch target this size, so it no longer
    // closes the panel there (desktop keeps the toggle-closed behavior).
    if (isMobile && activeActivity === id) return;
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

  // Swipe-to-close on mobile — the resize handle's drag-to-close only
  // understands mouse events (see ResizeHandle), so it never worked on a
  // real touch device there anyway, and the panel is no longer meant to be
  // user-resized on mobile (it always spans full width). Only horizontal
  // distance is checked, so a vertical scroll through panel content doesn't
  // get mistaken for a close swipe.
  const touchStartXRef = useRef(null);
  const MIN_SWIPE_DISTANCE = 50;
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (!isMobile || touchStartXRef.current === null) return;
    const distance = touchStartXRef.current - e.changedTouches[0].clientX;
    if (distance > MIN_SWIPE_DISTANCE) updateSidebar(false);
    touchStartXRef.current = null;
  };

  // Lets callers outside this component (the header's toggle button, the
  // tour) open/toggle the panel without knowing about activeActivity —
  // `updateSidebar` alone only flips the outer `state` prop, which does
  // nothing if activeActivity is null (panel already collapsed via an
  // activity bar icon click), leaving the panel stuck closed.
  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        if (activeActivity === null) setActiveActivity(lastActivityRef.current);
        updateSidebar(true);
      },
      toggle: () => {
        if (panelOpen) {
          updateSidebar(false);
        } else {
          if (activeActivity === null)
            setActiveActivity(lastActivityRef.current);
          updateSidebar(true);
        }
      },
    }),
    [panelOpen, activeActivity, updateSidebar],
  );

  return (
    <div
      className={`font-mono fixed left-0 top-[57px] sm:top-[35px] bottom-[37px] sm:bottom-[33px] sm:translate-x-0 flex flex-row bg-[var(--bg-secondary)] text-[var(--text)] transition-transform duration-300 select-none z-30 ${state ? "translate-x-0" : "-translate-x-full"}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
      {/* Desktop only — on mobile the panel always spans full width (not
          user-resizable) and closes via swipe instead; this also sidesteps
          ResizeHandle only understanding mouse events, which never worked
          on a real touch device anyway.
          Always rendered on desktop — including while closed, so the
          collapsed edge can still be grabbed and dragged back open. It's an
          invisible hit-target (see ResizeHandle) either way, so there's
          nothing extra to show; only the drag behavior changes.
          When open, it's centered on the panel/content boundary (normal
          resize-grip feel). When closed, that same boundary sits right at
          the ActivityBar's own edge — centering it there would have this
          8px-wide hit zone overlap the last 4px of every activity icon
          button underneath (it's z-20, so it'd win the hit test), hijacking
          plain icon clicks into resize-drags. Anchoring it to the right
          instead keeps the whole hit zone off the ActivityBar entirely. */}
      {!isMobile && (
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
      )}
    </div>
  );
});

export default Sidebar;
