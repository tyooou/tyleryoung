import { useState, useEffect } from "react";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Globe,
  ListTodo,
  BarChart3,
  Briefcase,
  Library,
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
        />
        {typingPage && (
          <SidebarLink
            text="Typing"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
            projectName="typing"
            icon={<TypingIcon size={15} />}
          />
        )}
        <ExtracurricularsTree
          extracurriculars={extracurriculars}
          updatePage={updatePage}
          updateSidebar={updateSidebar}
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
        />
        <ChangelogTree
          releases={releases}
          updatePage={updatePage}
          updateSidebar={updateSidebar}
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
        />
        <LeetcodeTree
          problems={leetcodeProblems}
          updatePage={updatePage}
          updateSidebar={updateSidebar}
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
        />
        <LibraryTree
          books={books}
          blogPosts={blogPosts}
          updatePage={updatePage}
          updateSidebar={updateSidebar}
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

function LeetcodeTree({ problems, updatePage, updateSidebar }) {
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
            {yearOpen &&
              yearNode.months.map((monthNode) => {
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
                    {monthOpen &&
                      monthNode.problems.map((problem) => (
                        <SidebarLink
                          key={problem.path}
                          text={`${problem.number}. ${problem.title}`}
                          updatePage={updatePage}
                          updateSidebar={updateSidebar}
                          projectName={problem.path}
                          indent={2}
                        />
                      ))}
                  </div>
                );
              })}
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
function ExperienceTree({ projects, experiences, updatePage, updateSidebar }) {
  const [expanded, setExpanded] = useState(
    () => new Set(["professional", "projects"]),
  );

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
      <SidebarLink
        text="Overview"
        updatePage={updatePage}
        updateSidebar={updateSidebar}
        projectName="experience"
        icon={<Briefcase size={15} />}
      />

      <FolderRow
        label="Work"
        open={expanded.has("professional")}
        onClick={() => toggle("professional")}
      />
      {expanded.has("professional") &&
        experiences.map((exp) => (
          <SidebarLink
            key={exp.slug}
            text={exp.role}
            subtitle={exp.company}
            updatePage={updatePage}
            updateSidebar={updateSidebar}
            projectName={exp.slug}
            indent={1}
          />
        ))}

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
      {expanded.has("projects") &&
        (projects.length === 0 ? (
          <p className="px-5 py-2 text-sm sm:text-xs text-[var(--text-secondary)]">
            No projects found.
          </p>
        ) : (
          projects.map((project) => (
            <SidebarLink
              key={project.name}
              text={project.title}
              updatePage={updatePage}
              updateSidebar={updateSidebar}
              projectName={project.name}
              indent={1}
            />
          ))
        ))}
    </div>
  );
}

// A single collapsible folder listing every extracurricular as a flat list
// (no year/month or category grouping needed, unlike the trees above).
function ExtracurricularsTree({
  extracurriculars = [],
  updatePage,
  updateSidebar,
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <FolderRow
        label="Extracurriculars"
        open={open}
        onClick={() => setOpen((prev) => !prev)}
      />
      {open &&
        (extracurriculars.length === 0 ? (
          <p className="px-5 py-2 text-sm sm:text-xs text-[var(--text-secondary)]">
            No extracurriculars found.
          </p>
        ) : (
          extracurriculars.map((item) => (
            <SidebarLink
              key={item.slug}
              text={item.title}
              updatePage={updatePage}
              updateSidebar={updateSidebar}
              projectName={item.slug}
              indent={1}
            />
          ))
        ))}
    </div>
  );
}

// Two independently-collapsible folders — Books and Blogs — same shape as
// ExperienceTree's Work/Projects split.
function LibraryTree({ books = [], blogPosts = [], updatePage, updateSidebar }) {
  const [expanded, setExpanded] = useState(() => new Set(["books", "blogs"]));

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
      {expanded.has("books") &&
        (books.length === 0 ? (
          <p className="px-5 py-2 text-sm sm:text-xs text-[var(--text-secondary)]">
            No books found.
          </p>
        ) : (
          books.map((book) => (
            <SidebarLink
              key={book.slug}
              text={book.title}
              updatePage={updatePage}
              updateSidebar={updateSidebar}
              projectName={book.slug}
              indent={1}
            />
          ))
        ))}

      <FolderRow label="Blogs" open={expanded.has("blogs")} onClick={() => toggle("blogs")} />
      {expanded.has("blogs") &&
        (blogPosts.length === 0 ? (
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
            />
          ))
        ))}
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

function ChangelogTree({ releases, updatePage, updateSidebar }) {
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
            {open &&
              minorNode.releases.map((release) => (
                <SidebarLink
                  key={release.version}
                  text={release.version}
                  updatePage={updatePage}
                  updateSidebar={updateSidebar}
                  projectName={release.version}
                  indent={1}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}

function FolderRow({ label, open, onClick, indent = 0 }) {
  const Chevron = open ? ChevronDown : ChevronRight;
  const FolderIcon = open ? FolderOpen : Folder;

  return (
    <button
      onClick={onClick}
      className="font-mono text-lg sm:text-xs hover:bg-[var(--bg)] py-2 flex items-center gap-1 w-full min-w-0 cursor-pointer text-left"
      style={{ paddingLeft: `${0.5 + indent * 1}rem` }}
    >
      <Chevron size={14} className="shrink-0 text-[var(--text-secondary)]" />
      <FolderIcon size={15} className="shrink-0" />
      <span className="ml-1 min-w-0 truncate">{label}</span>
    </button>
  );
}

function FriendLink({ friend, updatePage, updateSidebar }) {
  const handleClick = () => {
    updatePage(friend.name);
    if (window.innerWidth < 768) updateSidebar(false);
  };

  return (
    <a
      className="font-mono hover:bg-[var(--bg)] px-5 py-2 flex items-start gap-2 group cursor-pointer"
      onClick={handleClick}
    >
      <Globe size={15} className="mt-1 shrink-0 text-[var(--text-secondary)]" />
      <span className="flex flex-col min-w-0">
        <span className="text-lg sm:text-xs truncate transition-transform duration-200 group-hover:translate-x-2">
          {friend.name}
        </span>
        <span className="text-sm sm:text-[10px] text-[var(--text-secondary)] truncate transition-transform duration-200 group-hover:translate-x-2">
          {friend.link}
        </span>
      </span>
    </a>
  );
}

function Panel({ title, children, width, animateWidth }) {
  return (
    <div
      className={`flex flex-col h-full bg-[var(--bg-secondary)] overflow-y-auto pb-10 shrink-0 overflow-x-hidden border-l border-[var(--border-secondary)] ${animateWidth ? "transition-[width] duration-300 ease-out" : ""}`}
      style={{ width: `${width}px` }}
    >
      <h2 className="sticky top-0 z-10 font-bold text-xl sm:text-xs text-[var(--text-secondary)] uppercase px-6 sm:px-3 py-3 sm:py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-secondary)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default ActivityPanel;
