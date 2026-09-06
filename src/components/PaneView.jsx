import { useEffect, useRef, useState } from "react";
import Navigation from "./Navigation";
import VerticalNumbering from "./pages/VerticalNumbering";
import ProjectCard from "./pages/project/ProjectCard";
import ChangelogEntryCard from "./pages/ChangelogEntryCard";
import SimpleBrowserCard from "./pages/SimpleBrowserCard";
import PdfViewerCard from "./pages/PdfViewerCard";
import LeetcodeEntryCard from "./pages/leetcode/LeetcodeEntryCard";
import ExperienceEntryCard from "./pages/ExperienceEntryCard";
import ExperiencePhotosCard from "./pages/ExperiencePhotosCard";
import ExtracurricularEntryCard from "./pages/ExtracurricularEntryCard";
import ExtracurricularPhotosCard from "./pages/ExtracurricularPhotosCard";
import BookEntryCard from "./pages/BookEntryCard";
import BlogEntryCard from "./pages/BlogEntryCard";

function PaneView({
  pane,
  isPrimary,
  isActivePane,
  isSolePane,
  isDragActive,
  onSwitchTab,
  onDeleteTab,
  onTabDragStart,
  onTabDragEnd,
  onFocusPane,
  onDropIntoPane,
  onDropCreateSplit,
  onOpenInSplitPane,
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
  sidebarPanelOpen,
  pageComponents,
  startTour,
  style,
}) {
  const [edgeDragOver, setEdgeDragOver] = useState(false);
  const [paneDragOver, setPaneDragOver] = useState(false);
  const [gutterLineCount, setGutterLineCount] = useState(100);
  const contentScrollRef = useRef(null);
  const gutterRef = useRef(null);

  const page = pane.page;
  const activeBrowserLink =
    friends.find((f) => f.name === page) ||
    quickLinks.find((q) => q.name === page);
  const activeProblem = leetcodeProblems.find((p) => p.path === page);
  const activeProject = projects.find((p) => p.meta.name === page);
  const activeRelease = releases.find((r) => r.version === page);
  const activeExperience = experiences.find((exp) => exp.slug === page);
  const activeExperiencePhotos = experiences.find(
    (exp) => `${exp.slug}-photos` === page,
  );
  const activeExtracurricular = extracurriculars.find(
    (item) => item.slug === page,
  );
  const activeExtracurricularPhotos = extracurriculars.find(
    (item) => `${item.slug}-photos` === page,
  );
  const activeBook = books.find((book) => book.slug === page);
  const activeBookPdf = books.find((book) => `${book.slug}-pdf` === page);
  const activeBlogPost = blogPosts.find((post) => post.slug === page);
  const ActivePageComponent = pageComponents[page];

  const acceptsCrossPaneDrop = isDragActive && !isSolePane;

  useEffect(() => {
    const containerEl = contentScrollRef.current;
    if (!containerEl) return;

    // Each page card owns its own overflow-y-auto element somewhere inside
    // it (sometimes its root, sometimes nested a level or two down for
    // two-column layouts), rather than the wrapper itself, which is
    // overflow-hidden on desktop. Find whichever descendant actually scrolls.
    const findScrollElement = (root) => {
      const stack = [...root.children];
      while (stack.length) {
        const el = stack.pop();
        const overflowY = getComputedStyle(el).overflowY;
        if (overflowY === "auto" || overflowY === "scroll") return el;
        stack.push(...el.children);
      }
      return null;
    };

    const scrollEl = findScrollElement(containerEl);
    if (!scrollEl) return;

    const rowHeight = 20; // text-xs line-height (16px) + space-y-1 gap (4px)
    const updateLineCount = () => {
      const needed = Math.ceil(scrollEl.scrollHeight / rowHeight) + 10;
      setGutterLineCount((prev) => Math.max(needed, 100, prev));
    };

    const handleScroll = (e) => {
      if (gutterRef.current) {
        gutterRef.current.scrollTop = e.target.scrollTop;
      }
    };

    updateLineCount();
    const resizeObserver = new ResizeObserver(updateLineCount);
    resizeObserver.observe(scrollEl);
    // Scroll events don't bubble, so listen on the capture phase from the
    // wrapper to catch scrolling on the nested per-card scroll container.
    containerEl.addEventListener("scroll", handleScroll, true);
    return () => {
      resizeObserver.disconnect();
      containerEl.removeEventListener("scroll", handleScroll, true);
    };
  }, [page]);

  return (
    <div
      className="flex flex-col min-h-0 min-w-0 flex-1 border-l border-[var(--border-secondary)]"
      style={style}
      onMouseDown={() => onFocusPane(pane.id)}
    >
      <Navigation
        pane={pane}
        isActivePane={isActivePane}
        onSwitchTab={onSwitchTab}
        onDeleteTab={onDeleteTab}
        onTabDragStart={onTabDragStart}
        onTabDragEnd={onTabDragEnd}
        friends={friends}
        quickLinks={quickLinks}
        leetcodeProblems={leetcodeProblems}
        releases={releases}
        experiences={experiences}
        extracurriculars={extracurriculars}
        books={books}
        blogPosts={blogPosts}
      />
      <div
        data-tour="pane-content"
        className="relative flex flex-col sm:flex-row flex-1 min-h-0 sm:overflow-hidden"
        onDragOver={(e) => {
          if (!acceptsCrossPaneDrop) return;
          e.preventDefault();
          setPaneDragOver(true);
        }}
        onDragLeave={() => setPaneDragOver(false)}
        onDrop={(e) => {
          if (!acceptsCrossPaneDrop) return;
          e.preventDefault();
          setPaneDragOver(false);
          onDropIntoPane(pane.id);
        }}
      >
        {isPrimary &&
          !activeBrowserLink &&
          !activeExperiencePhotos &&
          !activeExtracurricularPhotos &&
          !activeBookPdf && (
          <div className="hidden sm:block">
            <VerticalNumbering gutterRef={gutterRef} count={gutterLineCount} />
          </div>
        )}
        <div
          ref={contentScrollRef}
          className={`flex-1 min-h-0 bg-[var(--bg)] text-[var(--text)] overflow-y-auto sm:overflow-hidden pb-14 sm:pb-0 transition-colors ${
            acceptsCrossPaneDrop && paneDragOver
              ? "bg-[var(--bg-tertiary)]"
              : ""
          }`}
        >
          {ActivePageComponent && (
            <ActivePageComponent
              toggleSidebar={updateSidebar}
              updatePage={(tab) => onSwitchTab(pane.id, tab)}
              quickLinks={quickLinks}
              projects={projects}
              experiences={experiences}
              releases={releases}
              leetcodeProblems={leetcodeProblems}
              books={books}
              blogPosts={blogPosts}
              sidebarPanelOpen={sidebarPanelOpen}
              startTour={startTour}
            />
          )}
          {activeProject && <ProjectCard project={activeProject} />}
          {activeRelease && <ChangelogEntryCard release={activeRelease} />}
          {activeExperience && (
            <ExperienceEntryCard
              experience={activeExperience}
              onOpenPhotos={(tab) => onOpenInSplitPane(pane.id, tab)}
            />
          )}
          {activeExperiencePhotos && (
            <ExperiencePhotosCard
              experience={activeExperiencePhotos}
              isActive={isActivePane}
            />
          )}
          {activeExtracurricular && (
            <ExtracurricularEntryCard
              extracurricular={activeExtracurricular}
              onOpenPhotos={(tab) => onOpenInSplitPane(pane.id, tab)}
            />
          )}
          {activeExtracurricularPhotos && (
            <ExtracurricularPhotosCard
              extracurricular={activeExtracurricularPhotos}
              isActive={isActivePane}
            />
          )}
          {activeBook && (
            <BookEntryCard
              book={activeBook}
              onOpenPdf={(tab) => onOpenInSplitPane(pane.id, tab)}
            />
          )}
          {activeBookPdf && (
            <PdfViewerCard url={activeBookPdf.pdfUrl} title={`${activeBookPdf.title}.pdf`} />
          )}
          {activeBlogPost && <BlogEntryCard post={activeBlogPost} />}
          {activeBrowserLink && activeBrowserLink.id === "cv" && (
            <PdfViewerCard url={activeBrowserLink.link} title={page} />
          )}
          {activeBrowserLink && activeBrowserLink.id !== "cv" && (
            <SimpleBrowserCard url={activeBrowserLink.link} title={page} />
          )}
          {activeProblem && (
            <LeetcodeEntryCard
              path={activeProblem.path}
              title={`${activeProblem.number}. ${activeProblem.title}`}
              leetcodeProblems={leetcodeProblems}
              updatePage={(tab) => onSwitchTab(pane.id, tab)}
            />
          )}
        </div>

        {isSolePane && isDragActive && (
          <div
            className="hidden sm:block absolute top-0 right-0 h-full w-[30%] z-20"
            onDragOver={(e) => {
              e.preventDefault();
              setEdgeDragOver(true);
            }}
            onDragLeave={() => setEdgeDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setEdgeDragOver(false);
              onDropCreateSplit();
            }}
          >
            <div
              className={`h-full w-full border-l-2 transition-colors ${
                edgeDragOver
                  ? "bg-[var(--text)]/10 border-[var(--text)]"
                  : "border-transparent"
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default PaneView;
