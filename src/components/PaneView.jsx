import { useState } from "react";
import Navigation from "./Navigation";
import VerticalNumbering from "./pages/VerticalNumbering";
import ProjectCard from "./pages/project/ProjectCard";
import ChangelogEntryCard from "./pages/ChangelogEntryCard";
import SimpleBrowserCard from "./pages/SimpleBrowserCard";
import PdfViewerCard from "./pages/PdfViewerCard";
import LeetcodeEntryCard from "./pages/leetcode/LeetcodeEntryCard";
import ExperienceEntryCard from "./pages/ExperienceEntryCard";
import ExtracurricularEntryCard from "./pages/ExtracurricularEntryCard";
import BookEntryCard from "./pages/BookEntryCard";
import BlogEntryCard from "./pages/BlogEntryCard";

function PaneView({
  pane,
  isPrimary,
  isSolePane,
  isDragActive,
  onSwitchTab,
  onDeleteTab,
  onTabDragStart,
  onTabDragEnd,
  onFocusPane,
  onDropIntoPane,
  onDropCreateSplit,
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
  style,
}) {
  const [edgeDragOver, setEdgeDragOver] = useState(false);
  const [paneDragOver, setPaneDragOver] = useState(false);

  const page = pane.page;
  const activeBrowserLink =
    friends.find((f) => f.name === page) ||
    quickLinks.find((q) => q.name === page);
  const activeProblem = leetcodeProblems.find((p) => p.path === page);
  const activeProject = projects.find((p) => p.meta.name === page);
  const activeRelease = releases.find((r) => r.version === page);
  const activeExperience = experiences.find((exp) => exp.slug === page);
  const activeExtracurricular = extracurriculars.find(
    (item) => item.slug === page,
  );
  const activeBook = books.find((book) => book.slug === page);
  const activeBlogPost = blogPosts.find((post) => post.slug === page);
  const ActivePageComponent = pageComponents[page];

  const acceptsCrossPaneDrop = isDragActive && !isSolePane;

  return (
    <div
      className="flex flex-col min-h-0 min-w-0 flex-1 border-l border-[var(--border-secondary)]"
      style={style}
      onMouseDown={() => onFocusPane(pane.id)}
    >
      <Navigation
        pane={pane}
        onSwitchTab={onSwitchTab}
        onDeleteTab={onDeleteTab}
        onTabDragStart={onTabDragStart}
        onTabDragEnd={onTabDragEnd}
        friends={friends}
        quickLinks={quickLinks}
        leetcodeProblems={leetcodeProblems}
        experiences={experiences}
        extracurriculars={extracurriculars}
        books={books}
        blogPosts={blogPosts}
      />
      <div
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
        {isPrimary && !activeBrowserLink && (
          <div className="hidden sm:block">
            <VerticalNumbering />
          </div>
        )}
        <div
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
            />
          )}
          {activeProject && <ProjectCard project={activeProject} />}
          {activeRelease && <ChangelogEntryCard release={activeRelease} />}
          {activeExperience && (
            <ExperienceEntryCard experience={activeExperience} />
          )}
          {activeExtracurricular && (
            <ExtracurricularEntryCard extracurricular={activeExtracurricular} />
          )}
          {activeBook && <BookEntryCard book={activeBook} />}
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
