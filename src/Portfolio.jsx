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
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [tourStep, setTourStep] = useState(null); // null = inactive, else 0-based step index
  const [tourSteps, setTourSteps] = useState(TOUR_STEPS); // filtered per-viewport at tour start

  const splitRatioStartRef = useRef(splitRatio);
  const panesRowRef = useRef(null);
  const sidebarRef = useRef(null);

  const activePane = panes.find((p) => p.id === activePaneId) || panes[0];

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
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePane, cycleTheme]);

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
            "graphics": coalesce(graphics[]{ "url": asset->url + "?w=1200&auto=format", alt }, []),
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
  const openInPane = (paneId, tab) => {
    setActivePaneId(paneId);
    setPanes((prev) =>
      prev.map((p) => {
        if (p.id !== paneId) return p;
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

  const sidebarMargin = ACTIVITY_BAR_WIDTH + sidebarPanelWidth;

  const paneElements = panes.flatMap((pane, index) => {
    const paneEl = (
      <PaneView
        key={pane.id}
        pane={pane}
        isPrimary={index === 0}
        isSolePane={panes.length === 1}
        isDragActive={draggedTab !== null}
        onSwitchTab={openInPane}
        onDeleteTab={deletePaneTab}
        onTabDragStart={handleTabDragStart}
        onTabDragEnd={handleTabDragEnd}
        onFocusPane={setActivePaneId}
        onDropIntoPane={handleDropIntoPane}
        onDropCreateSplit={handleDropCreateSplit}
        updateSidebar={updateSidebar}
        friends={friends}
        quickLinks={quickLinks}
        leetcodeProblems={leetcodeProblems}
        projects={projects}
        releases={releases}
        experiences={experiences}
        extracurriculars={extracurriculars}
        books={books}
        blogPosts={blogPosts}
        sidebarPanelOpen={sidebarPanelWidth > 0}
        pageComponents={PAGE_COMPONENTS}
        startTour={startTour}
        style={
          panes.length === 2 && index === 0
            ? { flex: `0 0 ${splitRatio * 100}%` }
            : { flex: "1 1 0%" }
        }
      />
    );
    if (index === 0 && panes.length === 2) {
      return [
        paneEl,
        <ResizeHandle
          key="pane-split-handle"
          className="hidden sm:block absolute top-0 h-full w-2 z-20"
          style={{
            left: `${splitRatio * 100}%`,
            transform: "translateX(-50%)",
          }}
          onDragStart={() => {
            splitRatioStartRef.current = splitRatio;
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
        />,
      ];
    }
    return [paneEl];
  });

  return (
    <>
      <div className="flex flex-col min-h-full sm:h-full sm:fixed w-full bg-[var(--bg-secondary)]">
        <SearchBar
          updateSidebar={updateSidebar}
          toggleSidebar={() => sidebarRef.current?.toggle()}
          updatePage={updatePage}
          goBack={goBack}
          goForward={goForward}
          projects={projects.map((project) => project.meta)}
          pages={pages}
          releases={releases}
          friends={friends}
          leetcodeProblems={leetcodeProblems}
          experiences={experiences}
          quickLinks={quickLinks}
        />
        <div
          className={`flex-1 flex flex-row w-full sm:h-full sm:overflow-hidden pt-[52px] sm:pt-0 pb-[37px] sm:pb-[33px] ${sidebarState ? "overflow-hidden" : "overflow-y-auto"}`}
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
        </div>
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
