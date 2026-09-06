import { useState, useEffect, useRef } from "react";
import { sanityClient } from "./lib/sanityClient";
import Sidebar from "./components/Sidebar";
import BibliographyCard from "./components/pages/BibliographyCard";
import PaneView from "./components/PaneView";
import ResizeHandle from "./components/ResizeHandle";
import Footer from "./components/Footer";
import ExperienceCard from "./components/pages/ExperienceCard";
import OpenSourceCard from "./components/pages/OpenSourceCard";
import LibraryOverviewCard from "./components/pages/LibraryOverviewCard";
import { useTheme } from "./lib/theme";
import SearchBar from "./components/SearchBar";
import AiChatPanel from "./components/AiChatPanel";
import TerminalPanel from "./components/TerminalPanel";
import { describeActiveTab } from "./lib/activeTabContext";
// Cheap capability check only — web-llm itself is dynamically imported
// inside this module, so pulling it in here costs nothing up front.
import { isWebGpuSupported } from "./lib/aiChatEngine";
import TypingCard from "./components/pages/TypingCard";
import LeetcodeCard from "./components/pages/leetcode/LeetcodeCard";
import ChangelogOverviewCard from "./components/pages/ChangelogOverviewCard";
import TourOverlay from "./components/TourOverlay";
import { TOUR_STEPS, getTourSteps } from "./lib/tourSteps";
import {
  MIN_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  DEFAULT_PANEL_WIDTH,
  ACTIVITY_BAR_WIDTH,
} from "./lib/sidebarConstants";

const PAGE_COMPONENTS = {
  bibliography: BibliographyCard,
  experience: ExperienceCard,
  opensource: OpenSourceCard,
  library: LibraryOverviewCard,
  typing: TypingCard,
  leetcode: LeetcodeCard,
  changelog: ChangelogOverviewCard,
};

const MIN_SPLIT_RATIO = 0.2;
const MAX_SPLIT_RATIO = 0.8;

function makePane(id, openTabs, page) {
  return { id, openTabs, page, backTabs: [], forwardTabs: [] };
}

function Portfolio() {
  const { cycleTheme } = useTheme();
  const [sidebarState, setSidebar] = useState(() => {
    return window.innerWidth >= 768;
  });
  // tyouAI is desktop-only: the panel takes over the whole screen on a
  // phone, and the model is a multi-hundred-megabyte download to run on the
  // device — not something to put in front of someone on mobile data.
  // Gated in JS rather than with `hidden md:block` so the panel genuinely
  // isn't mounted, which is what stops the engine from ever spinning up.
  // Tracked live so resizing (or rotating a tablet) across the breakpoint
  // doesn't leave it half-wired.
  const [aiEnabled, setAiEnabled] = useState(
    () => window.matchMedia("(min-width: 768px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const onChange = (e) => setAiEnabled(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Reopens in whichever state the visitor last left it in. First-ever
  // visit (nothing saved yet) instead opens with tyouAI already showing,
  // so it's discovered rather than hidden behind an unlabelled icon — same
  // "nothing saved yet" signal the initial tab set uses below. Held back
  // on browsers without WebGPU, where all it could greet you with is an
  // apology.
  const [aiChatOpen, setAiChatOpen] = useState(() => {
    const saved = localStorage.getItem("aiChatOpen");
    if (saved !== null) return saved === "true";
    return (
      !localStorage.getItem("openTabs") &&
      window.matchMedia("(min-width: 768px)").matches &&
      isWebGpuSupported()
    );
  });
  useEffect(() => {
    localStorage.setItem("aiChatOpen", String(aiChatOpen));
  }, [aiChatOpen]);

  // The terminal is desktop-only — there's no room for a shell panel on a
  // phone screen and no keyboard to type into it. Gated the same way as
  // tyouAI: tracked live via matchMedia so it unmounts/remounts correctly if
  // the viewport crosses the breakpoint (e.g. rotating a tablet).
  const [terminalEnabled, setTerminalEnabled] = useState(
    () => window.matchMedia("(min-width: 768px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const onChange = (e) => setTerminalEnabled(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Reopens in whichever state the visitor last left it in — including
  // whatever terminals (and split arrangement) were open, restored by
  // TerminalPanel itself from its own storage keys.
  const [terminalOpen, setTerminalOpen] = useState(
    () => terminalEnabled && localStorage.getItem("terminalOpen") === "true",
  );
  useEffect(() => {
    localStorage.setItem("terminalOpen", String(terminalOpen));
  }, [terminalOpen]);
  useEffect(() => {
    if (!terminalEnabled) setTerminalOpen(false);
  }, [terminalEnabled]);

  // Up to two panes (left/right, code-editor-style split view). "left"
  // always exists and always keeps "bibliography" pinned; "right" is created by
  // dragging a tab to the edge and disappears once its last tab leaves.
  const [panes, setPanes] = useState(() => {
    const savedOpenTabs = localStorage.getItem("openTabs");
    const savedActive = localStorage.getItem("activeTab");
    return [
      makePane(
        "left",
        // A first-ever visit (nothing saved yet) opens with the Experience
        // Overview already available as a tab — not focused, bibliography
        // stays the active one — rather than making visitors dig for it.
        savedOpenTabs ? JSON.parse(savedOpenTabs) : ["bibliography", "experience"],
        savedActive || "bibliography",
      ),
    ];
  });
  const [activePaneId, setActivePaneId] = useState("left");
  const [draggedTab, setDraggedTab] = useState(null); // { paneId, tab } | null
  const [splitRatio, setSplitRatio] = useState(0.5);

  const [projects, setProjects] = useState([]);
  const [pages, setPages] = useState([]);
  const [releases, setReleases] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [extracurriculars, setExtracurriculars] = useState([]);
  const [books, setBooks] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [leetcodeProblems, setLeetcodeProblems] = useState([]);
  const [cvUrl, setCvUrl] = useState(null);
  const [sidebarPanelWidth, setSidebarPanelWidth] = useState(() => {
    const saved = Number(localStorage.getItem("sidebarPanelWidth"));
    return saved >= MIN_PANEL_WIDTH && saved <= MAX_PANEL_WIDTH
      ? saved
      : DEFAULT_PANEL_WIDTH;
  });
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);
  // Measured rather than hardcoded: the sidebar and AI-panel resize handle
  // are `fixed` (so they can span the viewport independent of scroll) and
  // need to know exactly how tall the toolbar above them renders, which
  // varies with font metrics/zoom/DPR in ways a guessed px value can't
  // track reliably.
  const [toolbarHeight, setToolbarHeight] = useState(35);
  useEffect(() => {
    const el = document.querySelector("[data-toolbar]");
    if (!el) return;
    // getBoundingClientRect reports post-zoom viewport pixels, but the
    // fixed-positioned elements reading this var live inside the same
    // html { zoom } subtree — a CSS length there gets multiplied by zoom
    // again when rendered, so the measurement has to be un-scaled first
    // or the fixed offset ends up zoomed twice.
    const update = () => {
      const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      setToolbarHeight(el.getBoundingClientRect().height / zoom);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const [terminalReservedHeight, setTerminalReservedHeight] = useState(0);
  const [isTerminalResizing, setIsTerminalResizing] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [tourStep, setTourStep] = useState(null); // null = inactive, else 0-based step index
  const [tourSteps, setTourSteps] = useState(TOUR_STEPS); // filtered per-viewport at tour start

  const [isSplitResizing, setIsSplitResizing] = useState(false);

  const splitRatioStartRef = useRef(splitRatio);
  const panesRowRef = useRef(null);
  const sidebarRef = useRef(null);

  const activePane = panes.find((p) => p.id === activePaneId) || panes[0];

  // The right pane's width animates open/closed rather than snapping, so it
  // has to stay mounted for a beat after `panes` drops it (rendered from
  // this snapshot) while its flex-basis transitions down to 0.
  const rightPane = panes.find((p) => p.id === "right");
  const [rightPaneSnapshot, setRightPaneSnapshot] = useState(rightPane || null);
  const [isPaneSplit, setIsPaneSplit] = useState(!!rightPane);
  const paneCloseTimeoutRef = useRef(null);
  const rightPaneMountedRef = useRef(!!rightPane);

  useEffect(() => {
    if (rightPane) {
      clearTimeout(paneCloseTimeoutRef.current);
      setRightPaneSnapshot(rightPane);
      if (!rightPaneMountedRef.current) {
        // A freshly-mounted element has no prior style for the browser to
        // transition from, so it renders at its final width instantly.
        // Mount it at 0 first, then flip to the open width a couple of
        // frames later once that 0-width state has actually painted.
        rightPaneMountedRef.current = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsPaneSplit(true));
        });
      }
    } else if (rightPaneSnapshot) {
      rightPaneMountedRef.current = false;
      setIsPaneSplit(false);
      paneCloseTimeoutRef.current = setTimeout(
        () => setRightPaneSnapshot(null),
        180,
      );
    }
    return () => clearTimeout(paneCloseTimeoutRef.current);
    // rightPaneSnapshot is intentionally excluded: this effect only reacts
    // to the split opening/closing, not to the snapshot it manages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightPane]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "b") {
        event.preventDefault();
        sidebarRef.current?.toggle();
      }

      if (event.ctrlKey && event.key === "w") {
        event.preventDefault();
        if (activePane && activePane.page !== "bibliography") {
          deletePaneTab(activePane.id, activePane.page);
        }
      }

      if (event.ctrlKey && event.key === "c") {
        event.preventDefault();
        cycleTheme();
      }

      if (event.ctrlKey && event.key === "`" && terminalEnabled) {
        event.preventDefault();
        setTerminalOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePane, cycleTheme, terminalEnabled]);

  useEffect(() => {
    async function findPages() {
      try {
        const data = await sanityClient.fetch(
          `*[_type == "page"] | order(order asc){ id, label, icon, enabled, order }`,
        );
        setPages(data);
      } catch {
        setPages([]);
      }
    }
    findPages();
  }, []);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await sanityClient.fetch(`
          *[_type == "project" && active == true]{
            "name": name.current,
            title,
            subtitle,
            year,
            _createdAt,
            "techStack": coalesce(techStack, []),
            code,
            preview,
            "content": body,
            "media": coalesce(media[]{ "url": asset->url, "mimeType": asset->mimeType, "filename": asset->originalFilename }, [])
          }
        `);
        setProjects(
          data.map((meta) => ({
            project: meta.name,
            meta,
            content: meta.content,
          })),
        );
      } catch {
        setProjects([]);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    async function loadReleases() {
      try {
        const data = await sanityClient.fetch(`
          *[_type == "release"] | order(order asc){
            version, date, title,
            "completed": coalesce(completed, []),
            "planned": coalesce(planned, [])
          }
        `);
        setReleases(data);
      } catch {
        setReleases([]);
      }
    }
    loadReleases();
  }, []);

  useEffect(() => {
    async function loadExperiences() {
      try {
        const data = await sanityClient.fetch(`
          *[_type == "experience"] | order(start desc){
            role, company, location, description, start, end, link, techStack, tags,
            "photos": coalesce(photos[]{ "url": asset->url + "?w=1200&auto=format", alt }, [])
          }
        `);
        // No CMS slug field for experience entries — derive a stable one
        // from role+company+start so individual pages/tabs have a page id.
        setExperiences(
          data.map((exp) => ({
            ...exp,
            slug: `experience-${`${exp.role}-${exp.company}-${exp.start}`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")}`,
          })),
        );
      } catch {
        setExperiences([]);
      }
    }
    loadExperiences();
  }, []);

  useEffect(() => {
    async function loadExtracurriculars() {
      try {
        const data = await sanityClient.fetch(`
          *[_type == "extracurricular"] | order(order asc){
            organisation, role, position, description, link, tags,
            "photos": coalesce(photos[]{ "url": asset->url + "?w=1200&auto=format", alt }, [])
          }
        `);
        // No CMS slug field for extracurriculars — derive a stable one from
        // the organisation so individual pages/tabs have a page id.
        setExtracurriculars(
          data.map((item) => ({
            ...item,
            slug: `extracurricular-${item.organisation
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")}`,
          })),
        );
      } catch {
        setExtracurriculars([]);
      }
    }
    loadExtracurriculars();
  }, []);

  useEffect(() => {
    async function loadBooks() {
      try {
        const data = await sanityClient.fetch(`
          *[_type == "book"] | order(dateCompleted desc, dateStarted desc){
            title, author, isbn, dateStarted, dateCompleted,
            rating, themes, keyPoints, favoriteQuote,
            "coverImage": coverImage.asset->url + "?w=400&auto=format"
          }
        `);
        // No CMS slug field for books — derive a stable one from title+start
        // date so individual pages/tabs have a page id.
        setBooks(
          data.map((book) => ({
            ...book,
            slug: `library-book-${`${book.title}-${book.dateStarted || ""}`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")}`,
          })),
        );
      } catch {
        setBooks([]);
      }
    }
    loadBooks();
  }, []);

  useEffect(() => {
    async function loadBlogPosts() {
      try {
        const data = await sanityClient.fetch(`
          *[_type == "blogPost"] | order(date desc){
            title, date, excerpt, body
          }
        `);
        // No CMS slug field for blog posts — derive a stable one from
        // title+date so individual pages/tabs have a page id.
        setBlogPosts(
          data.map((post) => ({
            ...post,
            slug: `library-post-${`${post.title}-${post.date}`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")}`,
          })),
        );
      } catch {
        setBlogPosts([]);
      }
    }
    loadBlogPosts();
  }, []);

  useEffect(() => {
    async function loadFriends() {
      try {
        const data = await sanityClient.fetch(
          `*[_type == "friend"]{ name, link }`,
        );
        setFriends(data);
      } catch {
        setFriends([]);
      }
    }
    loadFriends();
  }, []);

  useEffect(() => {
    async function loadLeetcodeProblems() {
      try {
        const data = await sanityClient.fetch(`
          *[_type == "leetcodeProblem"] | order(year desc, month desc, number asc){
            path, year, month, number, title, date, difficulty
          }
        `);
        setLeetcodeProblems(data);
      } catch {
        setLeetcodeProblems([]);
      }
    }
    loadLeetcodeProblems();
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await sanityClient.fetch(
          `*[_type == "settings"][0]{ "cvUrl": cv.asset->url }`,
        );
        setCvUrl(data?.cvUrl || null);
      } catch {
        setCvUrl(null);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    const left = panes.find((p) => p.id === "left");
    if (left) {
      localStorage.setItem("openTabs", JSON.stringify(left.openTabs));
      localStorage.setItem("activeTab", left.page);
    }
  }, [panes]);

  // If the focused pane just closed (its last tab moved/closed elsewhere),
  // fall back to the pane that's guaranteed to still exist.
  useEffect(() => {
    if (!panes.some((p) => p.id === activePaneId)) {
      setActivePaneId("left");
    }
  }, [panes, activePaneId]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (sidebarState && isMobile) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [sidebarState]);

  const updateSidebar = (newState) => {
    setSidebar(newState);
  };

  const startTour = () => {
    sidebarRef.current?.open();
    const isMobile = window.innerWidth < 768;
    const steps = getTourSteps(isMobile);
    setTourSteps(steps);
    // The "Tabs" and "Split view" steps need a real, non-pinned tab to
    // point at — bibliography alone has no draggable tab (see Navigation's
    // data-tour on the tab bar), so without this those steps would just
    // auto-skip. Only relevant on desktop, since those steps are dropped
    // entirely on mobile. Only adds one if nothing else is already open,
    // and never switches focus to it — the tour should start on whatever
    // page the visitor was already looking at.
    // The "Ask tyouAI" and "Terminal" steps need their panel actually open
    // to point at — both collapse/translate away when closed, which the
    // tour reads as "not here" and skips. Desktop only: both steps are
    // dropped on mobile, where tyouAI and the terminal are disabled anyway.
    if (!isMobile) setAiChatOpen(true);
    if (!isMobile) setTerminalOpen(true);
    if (!isMobile) {
      setPanes((prev) =>
        prev.map((p) => {
          if (p.id !== "left") return p;
          const hasOtherTab = p.openTabs.some((tab) => tab !== "bibliography");
          if (hasOtherTab || p.openTabs.includes("experience")) return p;
          return { ...p, openTabs: [...p.openTabs, "experience"] };
        }),
      );
    }
    setTourStep(0);
  };
  const nextTourStep = () =>
    setTourStep((step) => Math.min(step + 1, tourSteps.length - 1));
  const prevTourStep = () => setTourStep((step) => Math.max(step - 1, 0));
  const closeTour = () => setTourStep(null);

  // Opens `tab` in a specific pane, focusing it. Used directly by the tab
  // bar (switching/opening within a known pane) and wrapped by `updatePage`
  // below for every other call site, which always targets "whichever pane
  // is currently focused" rather than naming one explicitly.
  //
  // A tab is only ever open in one pane at a time: if it's already open
  // somewhere else (e.g. a link opened it in a split pane, then a sidebar
  // click for that same tab targets whichever pane happens to be active),
  // this reuses that pane instead of adding a second copy of the tab.
  const openInPane = (paneId, tab) => {
    const targetPaneId = panes.some((p) => p.openTabs.includes(tab))
      ? panes.find((p) => p.openTabs.includes(tab)).id
      : paneId;
    setActivePaneId(targetPaneId);
    setPanes((prev) =>
      prev.map((p) => {
        if (p.id !== targetPaneId) return p;
        if (p.page === tab) return p;
        return {
          ...p,
          page: tab,
          openTabs: p.openTabs.includes(tab)
            ? p.openTabs
            : [...p.openTabs, tab],
          backTabs: [...p.backTabs, p.page],
          forwardTabs: [],
        };
      }),
    );
  };

  const updatePage = (newPage) => openInPane(activePaneId, newPage);

  const goBack = () => {
    setPanes((prev) =>
      prev.map((p) => {
        if (p.id !== activePaneId || p.backTabs.length === 0) return p;
        const previous = p.backTabs[p.backTabs.length - 1];
        return {
          ...p,
          page: previous,
          backTabs: p.backTabs.slice(0, -1),
          forwardTabs: [...p.forwardTabs, p.page],
        };
      }),
    );
  };

  const goForward = () => {
    setPanes((prev) =>
      prev.map((p) => {
        if (p.id !== activePaneId || p.forwardTabs.length === 0) return p;
        const next = p.forwardTabs[p.forwardTabs.length - 1];
        return {
          ...p,
          page: next,
          forwardTabs: p.forwardTabs.slice(0, -1),
          backTabs: [...p.backTabs, p.page],
        };
      }),
    );
  };

  // Closing a pane's last tab collapses that pane, except "left" which
  // always keeps "bibliography" (its close button is hidden, so this only
  // ever fires defensively).
  const deletePaneTab = (paneId, targetTab) => {
    setPanes((prev) =>
      prev
        .map((p) => {
          if (p.id !== paneId) return p;
          const newTabs = p.openTabs.filter((tab) => tab !== targetTab);
          let nextPage = p.page;
          if (p.page === targetTab) {
            if (newTabs.length > 0) {
              const deletedIndex = p.openTabs.indexOf(targetTab);
              const nextIndex = deletedIndex > 0 ? deletedIndex - 1 : 0;
              nextPage = newTabs[nextIndex];
            } else {
              nextPage = "bibliography";
            }
          }
          return {
            ...p,
            openTabs: newTabs,
            page: nextPage,
            backTabs: p.backTabs.filter((tab) => tab !== targetTab),
            forwardTabs: p.forwardTabs.filter((tab) => tab !== targetTab),
          };
        })
        .filter((p) => p.id === "left" || p.openTabs.length > 0),
    );
  };

  // Moves `tab` from one pane to another. `createNew` makes a brand-new
  // pane (the drag-to-split gesture); otherwise it's appended to an
  // existing pane. The source pane collapses if this was its last tab.
  const movePaneTab = (fromPaneId, toPaneId, tab, createNew) => {
    setPanes((prev) => {
      let next = prev.map((p) => {
        if (p.id !== fromPaneId) return p;
        const remaining = p.openTabs.filter((t) => t !== tab);
        const nextPage =
          p.page === tab
            ? remaining[remaining.length - 1] || "bibliography"
            : p.page;
        return { ...p, openTabs: remaining, page: nextPage };
      });
      next = next.filter((p) => p.id === "left" || p.openTabs.length > 0);

      if (createNew) {
        next = [...next, makePane(toPaneId, [tab], tab)];
      } else {
        next = next.map((p) => {
          if (p.id !== toPaneId) return p;
          return {
            ...p,
            openTabs: p.openTabs.includes(tab)
              ? p.openTabs
              : [...p.openTabs, tab],
            page: tab,
            backTabs: [...p.backTabs, p.page],
            forwardTabs: [],
          };
        });
      }
      return next;
    });
    setActivePaneId(toPaneId);
  };

  // Opens `tab` in whichever pane isn't `fromPaneId`, creating a split if
  // none exists yet — used by in-page links (e.g. an experience's "View
  // photos") that want a tab to appear alongside the page that opened it
  // rather than replacing it. If `tab` is already open somewhere, that
  // pane is simply focused instead of opening a duplicate.
  const openInSplitPane = (fromPaneId, tab) => {
    // Mobile has no split-pane UI, so the same "view photos" affordance
    // should just open the tab alongside the current one in the one pane
    // that exists, instead of trying to create a split.
    if (window.innerWidth < 768) {
      openInPane(fromPaneId, tab);
      return;
    }
    const existing = panes.find((p) => p.openTabs.includes(tab));
    if (existing) {
      openInPane(existing.id, tab);
      return;
    }
    const otherPane = panes.find((p) => p.id !== fromPaneId);
    if (otherPane) {
      openInPane(otherPane.id, tab);
      return;
    }
    setSplitRatio(0.5);
    const targetId = fromPaneId === "right" ? "left" : "right";
    setPanes((prev) => [...prev, makePane(targetId, [tab], tab)]);
    setActivePaneId(targetId);
  };

  const handleTabDragStart = (paneId, tab) => setDraggedTab({ paneId, tab });
  const handleTabDragEnd = () => setDraggedTab(null);

  const handleDropCreateSplit = () => {
    if (!draggedTab) return;
    // A new split should always start even — splitRatio otherwise carries
    // over whatever ratio was left from a previous split that's since been
    // closed (it's only ever changed by manually dragging the divider).
    setSplitRatio(0.5);
    movePaneTab(draggedTab.paneId, "right", draggedTab.tab, true);
    setDraggedTab(null);
  };

  const handleDropIntoPane = (targetPaneId) => {
    if (!draggedTab || draggedTab.paneId === targetPaneId) return;
    movePaneTab(draggedTab.paneId, targetPaneId, draggedTab.tab, false);
    setDraggedTab(null);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (window.innerWidth < 768) {
      if (isRightSwipe && !sidebarState) {
        sidebarRef.current?.open();
      } else if (isLeftSwipe && sidebarState) {
        setSidebar(false);
      }
    }
  };

  const quickLinks = [
    { id: "github", name: "GitHub", link: "https://github.com/tyooou" },
    {
      id: "linkedin",
      name: "LinkedIn",
      link: "https://nz.linkedin.com/in/tylerhyoung",
    },
    ...(cvUrl ? [{ id: "cv", name: "Résumé", link: cvUrl }] : []),
  ];

  // Whatever tab is focused right now, resolved into a label + content
  // summary so the AI panel can show it as file context and answer
  // questions about the page actually on screen.
  const tabContextData = {
    leetcodeProblems,
    experiences,
    extracurriculars,
    projects: projects.map((project) => project.meta),
    books,
    blogPosts,
    quickLinks,
    friends,
  };
  const activeTabContext = describeActiveTab(activePane?.page, tabContextData);

  // Same resolver, reused for the header's back/forward tooltips — the
  // tab a click would land on, named the way its own tab reads (e.g.
  // "LC345.md"), not the raw page id.
  const backTabLabel = activePane?.backTabs.length
    ? describeActiveTab(
        activePane.backTabs[activePane.backTabs.length - 1],
        tabContextData,
      )?.label
    : null;
  const forwardTabLabel = activePane?.forwardTabs.length
    ? describeActiveTab(
        activePane.forwardTabs[activePane.forwardTabs.length - 1],
        tabContextData,
      )?.label
    : null;

  const sidebarMargin = ACTIVITY_BAR_WIDTH + sidebarPanelWidth;

  const leftPane = panes.find((p) => p.id === "left");

  const sharedPaneProps = {
    isDragActive: draggedTab !== null,
    onSwitchTab: openInPane,
    onDeleteTab: deletePaneTab,
    onTabDragStart: handleTabDragStart,
    onTabDragEnd: handleTabDragEnd,
    onFocusPane: setActivePaneId,
    onDropIntoPane: handleDropIntoPane,
    onDropCreateSplit: handleDropCreateSplit,
    onOpenInSplitPane: openInSplitPane,
    updateSidebar,
    friends,
    quickLinks,
    leetcodeProblems,
    projects,
    releases,
    experiences,
    extracurriculars,
    books,
    blogPosts,
    sidebarPanelOpen: sidebarPanelWidth > 0,
    pageComponents: PAGE_COMPONENTS,
    startTour,
  };

  const paneElements = [
    <PaneView
      key="left"
      pane={leftPane}
      isPrimary={true}
      isActivePane={leftPane?.id === activePaneId}
      isSolePane={!rightPaneSnapshot}
      {...sharedPaneProps}
      style={{ flex: "1 1 0%" }}
    />,
  ];

  if (isPaneSplit) {
    paneElements.push(
      <ResizeHandle
        key="pane-split-handle"
        className="hidden sm:block absolute top-0 h-full w-2 z-20"
        style={{
          left: `${splitRatio * 100}%`,
          transform: "translateX(-50%)",
        }}
        onDragStart={() => {
          splitRatioStartRef.current = splitRatio;
          setIsSplitResizing(true);
        }}
        onDrag={(deltaX) => {
          const total = panesRowRef.current?.offsetWidth || 1;
          const deltaRatio = deltaX / total;
          setSplitRatio(
            Math.min(
              MAX_SPLIT_RATIO,
              Math.max(
                MIN_SPLIT_RATIO,
                splitRatioStartRef.current + deltaRatio,
              ),
            ),
          );
        }}
        onDragEnd={() => setIsSplitResizing(false)}
      />,
    );
  }

  if (rightPaneSnapshot) {
    paneElements.push(
      <PaneView
        key="right"
        pane={rightPaneSnapshot}
        isPrimary={false}
        isActivePane={rightPaneSnapshot.id === activePaneId}
        isSolePane={false}
        {...sharedPaneProps}
        style={{
          flex: `0 0 ${isPaneSplit ? (1 - splitRatio) * 100 : 0}%`,
          transition: isSplitResizing
            ? "none"
            : `flex-basis 180ms ${isPaneSplit ? "ease-out" : "ease-in"}`,
          overflow: "hidden",
        }}
      />,
    );
  }

  return (
    <>
      <div
        style={{ "--toolbar-height": `${toolbarHeight}px` }}
        className="flex flex-col min-h-full sm:h-full sm:fixed w-full bg-[var(--bg-secondary)]"
      >
        <SearchBar
          updateSidebar={updateSidebar}
          toggleSidebar={() => sidebarRef.current?.toggle()}
          toggleAiChat={
            aiEnabled ? () => setAiChatOpen((open) => !open) : null
          }
          sidebarOpen={sidebarState}
          aiChatOpen={aiChatOpen}
          toggleTerminal={
            terminalEnabled ? () => setTerminalOpen((open) => !open) : null
          }
          terminalOpen={terminalOpen}
          startTour={startTour}
          updatePage={updatePage}
          goBack={goBack}
          goForward={goForward}
          backTabLabel={backTabLabel}
          forwardTabLabel={forwardTabLabel}
          projects={projects.map((project) => project.meta)}
          pages={pages}
          releases={releases}
          friends={friends}
          leetcodeProblems={leetcodeProblems}
          experiences={experiences}
          quickLinks={quickLinks}
        />
        <div
          style={{ "--terminal-reserved": `${terminalReservedHeight}px` }}
          className={`flex-1 flex flex-row w-full sm:h-full sm:overflow-hidden pt-[52px] sm:pt-0 pb-[37px] sm:pb-[33px] sm:pb-[calc(33px+var(--terminal-reserved))] ${
            isTerminalResizing ? "" : "transition-[padding-bottom] duration-300 ease-in-out"
          } ${sidebarState ? "overflow-hidden" : "overflow-y-auto"}`}
        >
          <Sidebar
            ref={sidebarRef}
            updatePage={updatePage}
            updateSidebar={updateSidebar}
            state={sidebarState}
            projects={projects.map((project) => project.meta)}
            pages={pages}
            releases={releases}
            friends={friends}
            leetcodeProblems={leetcodeProblems}
            experiences={experiences}
            extracurriculars={extracurriculars}
            books={books}
            blogPosts={blogPosts}
            quickLinks={quickLinks}
            activePage={activePane?.page}
            onPanelWidthChange={setSidebarPanelWidth}
            onPanelResizingChange={setIsSidebarResizing}
          />
          <div
            style={{ "--panel-margin": `${sidebarMargin}px` }}
            className={`flex flex-col flex-1 min-h-0 min-w-0 sm:h-full sm:translate-x-0 sm:ml-[var(--panel-margin)] ${
              isSidebarResizing ? "" : "transition-all duration-300"
            } ${sidebarState ? "translate-x-full" : "ml-0"}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              ref={panesRowRef}
              className="relative flex flex-col sm:flex-row flex-1 min-h-0 sm:overflow-hidden"
            >
              {paneElements}
            </div>
          </div>
          {aiEnabled && (
          <AiChatPanel
            isOpen={aiChatOpen}
            onOpen={() => setAiChatOpen(true)}
            onClose={() => setAiChatOpen(false)}
            activeTab={activeTabContext}
            onOpenTab={updatePage}
            experiences={experiences}
            extracurriculars={extracurriculars}
            projects={projects.map((project) => project.meta)}
            books={books}
            blogPosts={blogPosts}
            leetcodeProblems={leetcodeProblems}
          />
          )}
        </div>
        {terminalEnabled && (
          <TerminalPanel
            isOpen={terminalOpen}
            onOpen={() => setTerminalOpen(true)}
            onClose={() => setTerminalOpen(false)}
            activeTabId={activePane?.page}
            data={tabContextData}
            releases={releases}
            onOpenTab={updatePage}
            leftInset={sidebarMargin}
            onReservedHeightChange={setTerminalReservedHeight}
            onResizingChange={setIsTerminalResizing}
          />
        )}
        <Footer />
      </div>
      {tourStep !== null && (
        <TourOverlay
          steps={tourSteps}
          stepIndex={tourStep}
          onNext={nextTourStep}
          onPrev={prevTourStep}
          onClose={closeTour}
        />
      )}
    </>
  );
}

export default Portfolio;
