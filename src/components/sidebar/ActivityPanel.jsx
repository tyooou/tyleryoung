import { useState, useEffect } from "react";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Globe,
  ListTodo,
  BarChart3,
  Briefcase,
  Library,
  Images,
  FileText,
} from "lucide-react";
import { getIcon } from "../iconMap";
import SidebarLink from "./SidebarLink";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ActivityPanel({
  activeActivity,
  pages,
  projects,
  releases,
  experiences,
  extracurriculars,
  friends,
  leetcodeProblems,
  books,
  blogPosts,
  updatePage,
  updateSidebar,
  width,
  animateWidth,
  activePage,
}) {
  // Keep rendering the last-open activity's content while the panel
  // animates its width down to 0 on close, instead of unmounting instantly
  // — mirrors how the header's sidebar toggle animates via transform
  // rather than popping the whole thing in/out.
  const [lastActivity, setLastActivity] = useState(activeActivity);
  useEffect(() => {
    if (activeActivity) setLastActivity(activeActivity);
  }, [activeActivity]);
  const displayActivity = activeActivity ?? lastActivity;

  if (!displayActivity) return null;

  if (displayActivity === "bibliography") {
    const bioPage = pages.find((p) => p.id === "bibliography");
    const typingPage = pages.find((p) => p.id === "typing");
    const BioIcon = getIcon(bioPage?.icon);
    const TypingIcon = getIcon(typingPage?.icon);
    return (
      <Panel
        title={bioPage?.label || "About"}
        width={width}
        animateWidth={animateWidth}
      >
        <SidebarLink
          text="About Me"
          updatePage={updatePage}
          updateSidebar={updateSidebar}
          projectName="bibliography"
          icon={<BioIcon size={15} />}
          isActive={activePage === "bibliography"}
        />
        {typingPage && (
          <SidebarLink
            text="Typing"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
            projectName="typing"
            icon={<TypingIcon size={15} />}
            isActive={activePage === "typing"}
          />
        )}
        <ExtracurricularsTree
          extracurriculars={extracurriculars}
          updatePage={updatePage}
          updateSidebar={updateSidebar}
          activePage={activePage}
        />
      </Panel>
    );
  }

  if (displayActivity === "experience") {
    return (
      <Panel title="Experience" width={width} animateWidth={animateWidth}>
        <ExperienceTree
          projects={projects}
          experiences={experiences}
          updatePage={updatePage}
          updateSidebar={updateSidebar}
          activePage={activePage}
        />
      </Panel>
    );
  }

  if (displayActivity === "changelog") {
    return (
      <Panel title="Changelog" width={width} animateWidth={animateWidth}>
        <SidebarLink
          text="Overview"
          updatePage={updatePage}
          updateSidebar={updateSidebar}
          projectName="changelog"
          icon={<BarChart3 size={15} />}
          isActive={activePage === "changelog"}
        />
        <ChangelogTree
          releases={releases}
          updatePage={updatePage}
          updateSidebar={updateSidebar}
          activePage={activePage}
        />
      </Panel>
    );
  }

  if (displayActivity === "friends") {
    return (
      <Panel title="Friends" width={width} animateWidth={animateWidth}>
        {friends.map((friend) => (
          <FriendLink
            key={friend.name}
            friend={friend}
            updatePage={updatePage}
            updateSidebar={updateSidebar}
            isActive={activePage === friend.name}
          />
        ))}
      </Panel>
    );
  }

  if (displayActivity === "leetcode") {
    return (
      <Panel title="Leetcode" width={width} animateWidth={animateWidth}>
        <SidebarLink
          text="Overview"
          updatePage={updatePage}
          updateSidebar={updateSidebar}
          projectName="leetcode"
          icon={<ListTodo size={15} />}
          isActive={activePage === "leetcode"}
        />
        <LeetcodeTree
          problems={leetcodeProblems}
          updatePage={updatePage}
          updateSidebar={updateSidebar}
          activePage={activePage}
        />
      </Panel>
    );
  }

  if (displayActivity === "library") {
    return (
      <Panel title="Library" width={width} animateWidth={animateWidth}>
        <SidebarLink
          text="Overview"
          updatePage={updatePage}
          updateSidebar={updateSidebar}
          projectName="library"
          icon={<Library size={15} />}
          isActive={activePage === "library"}
        />
        <LibraryTree
          books={books}
          blogPosts={blogPosts}
          updatePage={updatePage}
          updateSidebar={updateSidebar}
          activePage={activePage}
        />
      </Panel>
    );
  }

  const page = pages.find((p) => p.id === displayActivity);
  if (!page) return null;
  const Icon = getIcon(page.icon);

  return (
    <Panel title={page.label} width={width} animateWidth={animateWidth}>
      <SidebarLink
        text={`Open ${page.label}`}
        updatePage={updatePage}
        updateSidebar={updateSidebar}
        projectName={page.id}
        icon={<Icon size={15} />}
        isActive={activePage === page.id}
      />
    </Panel>
  );
}

// Groups the flat, already-sorted (newest first) problem list into a
// Year -> Month -> problems[] tree, matching the repo's own folder layout.
function buildLeetcodeTree(problems) {
  const years = [];
  for (const problem of problems) {
    let yearNode = years[years.length - 1];
    if (!yearNode || yearNode.year !== problem.year) {
      yearNode = { year: problem.year, months: [] };
      years.push(yearNode);
    }
    let monthNode = yearNode.months[yearNode.months.length - 1];
    if (!monthNode || monthNode.month !== problem.month) {
      monthNode = { month: problem.month, problems: [] };
      yearNode.months.push(monthNode);
    }
    monthNode.problems.push(problem);
  }
  return years;
}

function LeetcodeTree({ problems, updatePage, updateSidebar, activePage }) {
  const tree = buildLeetcodeTree(problems);

  const [expandedYears, setExpandedYears] = useState(
    () => new Set(tree[0] ? [tree[0].year] : []),
  );
  const [expandedMonths, setExpandedMonths] = useState(() => {
    const firstYear = tree[0];
    const firstMonth = firstYear?.months[0];
    return new Set(firstMonth ? [`${firstYear.year}-${firstMonth.month}`] : []);
  });

  const toggleYear = (year) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const toggleMonth = (key) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (problems.length === 0) {
    return (
      <p className="px-5 py-2 text-sm sm:text-xs text-[var(--text-secondary)]">
        No problems found.
      </p>
    );
  }

  return (
    <div>
      {tree.map((yearNode) => {
        const yearOpen = expandedYears.has(yearNode.year);
        return (
          <div key={yearNode.year}>
            <FolderRow
              label={yearNode.year}
              open={yearOpen}
              onClick={() => toggleYear(yearNode.year)}
            />
            <Collapsible open={yearOpen}>
              {yearNode.months.map((monthNode) => {
                const monthKey = `${yearNode.year}-${monthNode.month}`;
                const monthOpen = expandedMonths.has(monthKey);
                return (
                  <div key={monthKey}>
                    <FolderRow
                      label={MONTH_NAMES[Number(monthNode.month) - 1]}
                      open={monthOpen}
                      onClick={() => toggleMonth(monthKey)}
                      indent={1}
                    />
                    <Collapsible open={monthOpen}>
                      {monthNode.problems.map((problem) => (
                        <SidebarLink
                          key={problem.path}
                          text={`${problem.number}. ${problem.title}`}
                          updatePage={updatePage}
                          updateSidebar={updateSidebar}
                          projectName={problem.path}
                          indent={2}
                          isActive={activePage === problem.path}
                        />
                      ))}
                    </Collapsible>
                  </div>
                );
              })}
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
}

// Overview sits at the top, outside any folder — it covers the whole
// Experience section (work + projects), not just the Work folder beneath
// it. Work lists each role; Projects lists every project underneath its own
// folder. Contributions (open source) is disabled for now — see the
// commented-out block below to bring it back.
function ExperienceTree({
  projects,
  experiences,
  updatePage,
  updateSidebar,
  activePage,
}) {
  const [expanded, setExpanded] = useState(
    () => new Set(["professional", "projects"]),
  );
  // Which individual experience rows have their "Photos" sub-item revealed
  // — separate from `expanded` (that Set tracks the Work/Projects section
  // folders, not per-entry state) and starts empty so every entry loads
  // collapsed, except whichever one's photos tab is already active (e.g.
  // opened via the inline "View photos" link rather than this dropdown).
  const [photosExpanded, setPhotosExpanded] = useState(() => new Set());

  // Only ever adds — once a row is auto-revealed because its photos tab
  // became active, it stays open (per design) even if the visitor switches
  // to some other tab afterward; closing it again is a deliberate action.
  useEffect(() => {
    const active = experiences.find((exp) => `${exp.slug}-photos` === activePage);
    if (!active) return;
    setPhotosExpanded((prev) =>
      prev.has(active.slug) ? prev : new Set(prev).add(active.slug),
    );
  }, [activePage, experiences]);

  const toggle = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const togglePhotos = (slug) => {
    setPhotosExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div>
      <SidebarLink
        text="Overview"
        updatePage={updatePage}
        updateSidebar={updateSidebar}
        projectName="experience"
        icon={<Briefcase size={15} />}
        isActive={activePage === "experience"}
      />

      <FolderRow
        label="Work"
        open={expanded.has("professional")}
        onClick={() => toggle("professional")}
      />
      <Collapsible open={expanded.has("professional")}>
        {experiences.map((exp) => {
          const hasPhotos = exp.photos?.length > 0;
          if (!hasPhotos) {
            return (
              <SidebarLink
                key={exp.slug}
                text={exp.role}
                subtitle={`@ ${exp.company}`}
                updatePage={updatePage}
                updateSidebar={updateSidebar}
                projectName={exp.slug}
                indent={1}
                isActive={activePage === exp.slug}
              />
            );
          }
          const photosTab = `${exp.slug}-photos`;
          const showPhotos = photosExpanded.has(exp.slug);
          return (
            <div key={exp.slug}>
              <div className="relative">
                <SidebarLink
                  text={exp.role}
                  subtitle={`@ ${exp.company}`}
                  updatePage={updatePage}
                  updateSidebar={updateSidebar}
                  projectName={exp.slug}
                  indent={1}
                  isActive={activePage === exp.slug}
                />
                <button
                  type="button"
                  onClick={() => togglePhotos(exp.slug)}
                  aria-label={showPhotos ? "Hide photos" : "Show photos"}
                  className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--text-secondary)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                >
                  <ChevronRight
                    size={12}
                    className={`transition-transform duration-200 ease-in-out ${
                      showPhotos ? "rotate-90" : ""
                    }`}
                  />
                </button>
              </div>
              <Collapsible open={showPhotos}>
                <SidebarLink
                  text="Photos"
                  updatePage={updatePage}
                  updateSidebar={updateSidebar}
                  projectName={photosTab}
                  icon={<Images size={13} />}
                  indent={2}
                  isActive={activePage === photosTab}
                />
              </Collapsible>
            </div>
          );
        })}
      </Collapsible>

      {/* Disabled for now — re-enable by restoring this block:
      <FolderRow
        label="Contributions"
        open={expanded.has("opensource")}
        onClick={() => toggle("opensource")}
      />
      {expanded.has("opensource") && (
        <SidebarLink
          text="Overview"
          updatePage={updatePage}
          updateSidebar={updateSidebar}
          projectName="opensource"
          indent={1}
        />
      )}
      */}

      <FolderRow
        label="Projects"
        open={expanded.has("projects")}
        onClick={() => toggle("projects")}
      />
      <Collapsible open={expanded.has("projects")}>
        {projects.length === 0 ? (
          <p className="px-5 py-2 text-sm sm:text-xs text-[var(--text-secondary)]">
            No projects found.
          </p>
        ) : (
          projects.map((project) => (
            <SidebarLink
              key={project.name}
              text={project.title}
              subtitle={project.year ? String(project.year) : undefined}
              updatePage={updatePage}
              updateSidebar={updateSidebar}
              projectName={project.name}
              indent={1}
              isActive={activePage === project.name}
            />
          ))
        )}
      </Collapsible>
    </div>
  );
}

// A single collapsible folder listing every extracurricular as a flat list
// (no year/month or category grouping needed, unlike the trees above).
function ExtracurricularsTree({
  extracurriculars = [],
  updatePage,
  updateSidebar,
  activePage,
}) {
  const [open, setOpen] = useState(true);
  // Which individual extracurricular rows have their "Photos" sub-item
  // revealed — mirrors ExperienceTree's photosExpanded/togglePhotos.
  const [photosExpanded, setPhotosExpanded] = useState(() => new Set());

  useEffect(() => {
    const active = extracurriculars.find(
      (item) => `${item.slug}-photos` === activePage,
    );
    if (!active) return;
    setPhotosExpanded((prev) =>
      prev.has(active.slug) ? prev : new Set(prev).add(active.slug),
    );
  }, [activePage, extracurriculars]);

  const togglePhotos = (slug) => {
    setPhotosExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div>
      <FolderRow
        label="Extracurriculars"
        open={open}
        onClick={() => setOpen((prev) => !prev)}
      />
      <Collapsible open={open}>
        {extracurriculars.length === 0 ? (
          <p className="px-5 py-2 text-sm sm:text-xs text-[var(--text-secondary)]">
            No extracurriculars found.
          </p>
        ) : (
          extracurriculars.map((item) => {
            const hasPhotos = item.photos?.length > 0;
            if (!hasPhotos) {
              return (
                <SidebarLink
                  key={item.slug}
                  text={item.role}
                  subtitle={`@ ${item.organisation}`}
                  updatePage={updatePage}
                  updateSidebar={updateSidebar}
                  projectName={item.slug}
                  indent={1}
                  isActive={activePage === item.slug}
                />
              );
            }
            const photosTab = `${item.slug}-photos`;
            const showPhotos = photosExpanded.has(item.slug);
            return (
              <div key={item.slug}>
                <div className="relative">
                  <SidebarLink
                    text={item.role}
                    subtitle={`@ ${item.organisation}`}
                    updatePage={updatePage}
                    updateSidebar={updateSidebar}
                    projectName={item.slug}
                    indent={1}
                    isActive={activePage === item.slug}
                  />
                  <button
                    type="button"
                    onClick={() => togglePhotos(item.slug)}
                    aria-label={showPhotos ? "Hide photos" : "Show photos"}
                    className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--text-secondary)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                  >
                    <ChevronRight
                      size={12}
                      className={`transition-transform duration-200 ease-in-out ${
                        showPhotos ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </div>
                <Collapsible open={showPhotos}>
                  <SidebarLink
                    text="Photos"
                    updatePage={updatePage}
                    updateSidebar={updateSidebar}
                    projectName={photosTab}
                    icon={<Images size={13} />}
                    indent={2}
                    isActive={activePage === photosTab}
                  />
                </Collapsible>
              </div>
            );
          })
        )}
      </Collapsible>
    </div>
  );
}

// Two independently-collapsible folders — Books and Blogs — same shape as
// ExperienceTree's Work/Projects split.
function LibraryTree({ books = [], blogPosts = [], updatePage, updateSidebar, activePage }) {
  const [expanded, setExpanded] = useState(() => new Set(["books", "blogs"]));
  // Which individual book rows have their "View book" sub-item revealed —
  // mirrors ExperienceTree/ExtracurricularsTree's photosExpanded/togglePhotos.
  const [pdfExpanded, setPdfExpanded] = useState(() => new Set());

  useEffect(() => {
    const active = books.find((book) => `${book.slug}-pdf` === activePage);
    if (!active) return;
    setPdfExpanded((prev) =>
      prev.has(active.slug) ? prev : new Set(prev).add(active.slug),
    );
  }, [activePage, books]);

  const togglePdf = (slug) => {
    setPdfExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggle = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div>
      <FolderRow label="Books" open={expanded.has("books")} onClick={() => toggle("books")} />
      <Collapsible open={expanded.has("books")}>
        {books.length === 0 ? (
          <p className="px-5 py-2 text-sm sm:text-xs text-[var(--text-secondary)]">
            No books found.
          </p>
        ) : (
          books.map((book) => {
            if (!book.pdfUrl) {
              return (
                <SidebarLink
                  key={book.slug}
                  text={book.title}
                  updatePage={updatePage}
                  updateSidebar={updateSidebar}
                  projectName={book.slug}
                  indent={1}
                  isActive={activePage === book.slug}
                />
              );
            }
            const pdfTab = `${book.slug}-pdf`;
            const showPdf = pdfExpanded.has(book.slug);
            return (
              <div key={book.slug}>
                <div className="relative">
                  <SidebarLink
                    text={book.title}
                    updatePage={updatePage}
                    updateSidebar={updateSidebar}
                    projectName={book.slug}
                    indent={1}
                    isActive={activePage === book.slug}
                  />
                  <button
                    type="button"
                    onClick={() => togglePdf(book.slug)}
                    aria-label={showPdf ? "Hide book" : "Show book"}
                    className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--text-secondary)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                  >
                    <ChevronRight
                      size={12}
                      className={`transition-transform duration-200 ease-in-out ${
                        showPdf ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </div>
                <Collapsible open={showPdf}>
                  <SidebarLink
                    text="View book"
                    updatePage={updatePage}
                    updateSidebar={updateSidebar}
                    projectName={pdfTab}
                    icon={<FileText size={13} />}
                    indent={2}
                    isActive={activePage === pdfTab}
                  />
                </Collapsible>
              </div>
            );
          })
        )}
      </Collapsible>

      <FolderRow label="Blogs" open={expanded.has("blogs")} onClick={() => toggle("blogs")} />
      <Collapsible open={expanded.has("blogs")}>
        {blogPosts.length === 0 ? (
          <p className="px-5 py-2 text-sm sm:text-xs text-[var(--text-secondary)]">
            No blog posts found.
          </p>
        ) : (
          blogPosts.map((post) => (
            <SidebarLink
              key={post.slug}
              text={post.title}
              updatePage={updatePage}
              updateSidebar={updateSidebar}
              projectName={post.slug}
              indent={1}
              isActive={activePage === post.slug}
            />
          ))
        )}
      </Collapsible>
    </div>
  );
}

// Groups the flat, already-sorted (newest first) release list into a
// minor-version -> releases[] tree, e.g. v1.3.0 and v1.3.1 both under "1.3".
function buildChangelogTree(releases) {
  const minors = [];
  for (const release of releases) {
    const [major, minor] = release.version.replace(/^v/i, "").split(".");
    const key = `${major}.${minor}`;
    let minorNode = minors[minors.length - 1];
    if (!minorNode || minorNode.key !== key) {
      minorNode = { key, releases: [] };
      minors.push(minorNode);
    }
    minorNode.releases.push(release);
  }
  return minors;
}

function ChangelogTree({ releases, updatePage, updateSidebar, activePage }) {
  const tree = buildChangelogTree(releases);

  const [expandedMinors, setExpandedMinors] = useState(
    () => new Set(tree[0] ? [tree[0].key] : []),
  );

  const toggleMinor = (key) => {
    setExpandedMinors((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (releases.length === 0) {
    return (
      <p className="px-5 py-2 text-sm sm:text-xs text-[var(--text-secondary)]">
        No releases found.
      </p>
    );
  }

  return (
    <div>
      {tree.map((minorNode) => {
        const open = expandedMinors.has(minorNode.key);
        return (
          <div key={minorNode.key}>
            <FolderRow
              label={minorNode.key}
              open={open}
              onClick={() => toggleMinor(minorNode.key)}
            />
            <Collapsible open={open}>
              {minorNode.releases.map((release) => (
                <SidebarLink
                  key={release.version}
                  text={release.version}
                  subtitle={release.date}
                  updatePage={updatePage}
                  updateSidebar={updateSidebar}
                  projectName={release.version}
                  indent={1}
                  isActive={activePage === release.version}
                />
              ))}
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
}

function FolderRow({ label, open, onClick, indent = 0 }) {
  const FolderIcon = open ? FolderOpen : Folder;

  return (
    <button
      onClick={onClick}
      className="font-mono text-lg sm:text-xs hover:bg-[var(--bg)] py-2 flex items-center gap-1 w-full min-w-0 cursor-pointer text-left"
      style={{ paddingLeft: `${0.5 + indent * 1}rem` }}
    >
      <ChevronRight
        size={14}
        className={`shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ease-in-out ${
          open ? "rotate-90" : ""
        }`}
      />
      <FolderIcon size={15} className="shrink-0" />
      <span className="ml-1 min-w-0 truncate">{label}</span>
    </button>
  );
}

// Shared open/close animation for every sidebar dropdown — folder sections
// and per-entry sub-items alike. The grid-rows 0fr/1fr trick animates
// to/from the child's intrinsic height without measuring it in JS, and
// children stay mounted while collapsed (clipped via overflow-hidden)
// rather than unmounting, so nested expand state survives a collapse.
function Collapsible({ open, children }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-200 ease-in-out"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden min-h-0">{children}</div>
    </div>
  );
}

function FriendLink({ friend, updatePage, updateSidebar, isActive = false }) {
  const handleClick = () => {
    updatePage(friend.name);
    if (window.innerWidth < 768) updateSidebar(false);
  };

  return (
    <a
      className={`font-mono px-5 py-2 flex items-start gap-2 group cursor-pointer border-l-2 ${
        isActive
          ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-tertiary)]"
          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)]"
      }`}
      onClick={handleClick}
    >
      <Globe size={15} className="mt-1 shrink-0" />
      <span className="flex flex-col min-w-0">
        <span className="text-lg sm:text-xs truncate">{friend.name}</span>
        <span className="text-sm sm:text-[10px] truncate">{friend.link}</span>
      </span>
    </a>
  );
}

function Panel({ title, children, width, animateWidth }) {
  return (
    <div
      data-tour="sidebar-panel"
      className={`flex flex-col h-full bg-[var(--bg-secondary)] overflow-y-auto pb-10 shrink-0 overflow-x-hidden border-l border-[var(--border-secondary)] ${animateWidth ? "transition-[width] duration-300 ease-out" : ""}`}
      style={{ width: `${width}px` }}
    >
      <h2 className="sticky top-0 z-10 flex items-center px-6 sm:px-3 py-3 sm:pt-2 sm:pb-[9px] bg-[var(--bg-secondary)] border-b border-[var(--border-secondary)]">
        <span className="font-bold text-xl sm:text-xs text-[var(--text-secondary)] uppercase">
          {title}
        </span>
      </h2>
      {children}
    </div>
  );
}

export default ActivityPanel;
