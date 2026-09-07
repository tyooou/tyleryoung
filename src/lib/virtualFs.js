// A virtual filesystem laid over the same CMS-backed data the tab system
// already uses (see activeTabContext.js) — so the terminal's `ls`/`cd`/`code`
// walk the exact content the tabs do, rather than a second copy of it.

function sanitize(name) {
  return String(name).replace(/\//g, "-").trim().replace(/\s+/g, "-") || "untitled";
}

function fileNode(name, tabId) {
  return { type: "file", name: sanitize(name), tabId };
}

function dirNode(name, children = {}) {
  return { type: "dir", name: sanitize(name), children };
}

// Adds `node` under `parent`, and — for files — records its full path so
// a terminal can be opened straight to wherever the active tab lives.
function place(parent, parentPath, node, pathById) {
  parent.children[node.name] = node;
  if (node.type === "file") pathById[node.tabId] = [...parentPath, node.name];
  return node;
}

// Returns the existing subdirectory named `name` under `parent`, creating it
// (and recording it) if it doesn't exist yet.
function getOrCreateDir(parent, parentPath, name, pathById) {
  const key = sanitize(name);
  const existing = parent.children[key];
  if (existing) return existing;
  return place(parent, parentPath, dirNode(name), pathById);
}

export function buildFileTree(data = {}) {
  const {
    experiences = [],
    extracurriculars = [],
    projects = [],
    books = [],
    blogPosts = [],
    leetcodeProblems = [],
    releases = [],
    quickLinks = [],
    friends = [],
  } = data;

  const root = dirNode("/");
  const pathById = {};

  place(root, [], fileNode("bibliography.txt", "bibliography"), pathById);
  place(root, [], fileNode("typing.txt", "typing"), pathById);
  place(root, [], fileNode("opensource.txt", "opensource"), pathById);

  const experienceDir = dirNode("experience");
  place(root, [], experienceDir, pathById);
  place(experienceDir, ["experience"], fileNode("overview.txt", "experience"), pathById);
  experiences.forEach((exp) => {
    place(experienceDir, ["experience"], fileNode(`${exp.company}.txt`, exp.slug), pathById);
  });

  if (extracurriculars.length) {
    const extraDir = dirNode("extracurriculars");
    place(root, [], extraDir, pathById);
    extracurriculars.forEach((item) => {
      place(extraDir, ["extracurriculars"], fileNode(`${item.organisation}.txt`, item.slug), pathById);
    });
  }

  if (projects.length) {
    const projectsDir = dirNode("projects");
    place(root, [], projectsDir, pathById);
    projects.forEach((project) => {
      place(projectsDir, ["projects"], fileNode(`${project.title}.txt`, project.name), pathById);
    });
  }

  const libraryDir = dirNode("library");
  place(root, [], libraryDir, pathById);
  place(libraryDir, ["library"], fileNode("overview.txt", "library"), pathById);
  if (books.length) {
    const booksDir = dirNode("books");
    place(libraryDir, ["library"], booksDir, pathById);
    books.forEach((book) => {
      place(booksDir, ["library", "books"], fileNode(`${book.title}.txt`, book.slug), pathById);
    });
  }
  if (blogPosts.length) {
    const postsDir = dirNode("posts");
    place(libraryDir, ["library"], postsDir, pathById);
    blogPosts.forEach((post) => {
      place(postsDir, ["library", "posts"], fileNode(`${post.title}.txt`, post.slug), pathById);
    });
  }

  if (leetcodeProblems.length) {
    const leetcodeDir = dirNode("leetcode");
    place(root, [], leetcodeDir, pathById);
    place(leetcodeDir, ["leetcode"], fileNode("overview.txt", "leetcode"), pathById);
    leetcodeProblems.forEach((problem) => {
      const yearDir = getOrCreateDir(leetcodeDir, ["leetcode"], problem.year, pathById);
      const monthDir = getOrCreateDir(yearDir, ["leetcode", problem.year], problem.month, pathById);
      place(
        monthDir,
        ["leetcode", problem.year, problem.month],
        fileNode(`${problem.number}-${problem.title}.md`, problem.path),
        pathById,
      );
    });
  }

  if (releases.length) {
    const changelogDir = dirNode("changelog");
    place(root, [], changelogDir, pathById);
    place(changelogDir, ["changelog"], fileNode("overview.txt", "changelog"), pathById);
    releases.forEach((release) => {
      place(changelogDir, ["changelog"], fileNode(`${release.version}.txt`, release.version), pathById);
    });
  }

  const links = [...quickLinks, ...friends];
  if (links.length) {
    const linksDir = dirNode("links");
    place(root, [], linksDir, pathById);
    links.forEach((link) => {
      place(linksDir, ["links"], fileNode(link.name, link.name), pathById);
    });
  }

  return { root, pathById };
}

// Resolves `input` (relative or absolute, may contain "." / "..") against
// `cwd` (a segment array) into a new segment array. Never throws — an
// input that walks past root just clamps there, same as a real shell's cd.
export function resolvePath(cwd, input) {
  if (!input || input === ".") return cwd;
  const segments = input.startsWith("/") || input.startsWith("~") ? [] : [...cwd];
  input.split("/").forEach((seg) => {
    if (seg === "" || seg === "." || seg === "~") return;
    if (seg === "..") {
      segments.pop();
      return;
    }
    segments.push(seg);
  });
  return segments;
}

// Case-insensitive — visitors typing into a fake terminal shouldn't have to
// remember exactly how a project title was cased.
export function getNode(root, path) {
  let node = root;
  for (const seg of path) {
    if (node.type !== "dir") return null;
    const key = Object.keys(node.children).find(
      (k) => k.toLowerCase() === seg.toLowerCase(),
    );
    if (!key) return null;
    node = node.children[key];
  }
  return node;
}

export function formatPath(path) {
  return path.length ? `~/${path.join("/")}` : "~";
}

// Directories first, then alphabetical — matches the convention most real
// shells' `ls` colour/group output by.
export function listDir(node) {
  return Object.values(node.children).sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// Directory a freshly-opened terminal should land in: wherever the file for
// `tabId` lives, or root if the tab isn't backed by one (or there is none).
export function dirForTab(pathById, tabId) {
  const filePath = pathById[tabId];
  return filePath ? filePath.slice(0, -1) : [];
}
