// Resolves whichever tab the visitor currently has focused into (a) a short
// filename-ish label for the chat's file-context chip and (b) a plain-text
// summary of that page's content, so tyouAI can answer "what am I looking
// at?" style questions about the page in front of them rather than only
// about the portfolio in general.

const MAX_FIELD_LEN = 400;

function truncate(text) {
  if (!text) return "";
  const flat = String(text).replace(/\s+/g, " ").trim();
  return flat.length > MAX_FIELD_LEN ? `${flat.slice(0, MAX_FIELD_LEN)}…` : flat;
}

// Static pages that aren't backed by a CMS record.
const STATIC_PAGES = {
  bibliography: {
    label: "Welcome",
    context: "The site's welcome/home page — an overview of Tyler with quick links into the rest of the portfolio.",
  },
  experience: {
    label: "Experience",
    context: "The Experience overview page, listing Tyler's roles as a timeline.",
  },
  leetcode: {
    label: "LeetCode",
    context: "The LeetCode page — solved-problem stats, a submission heatmap, and links to individual write-ups.",
  },
  library: {
    label: "Library",
    context: "The Library page — books Tyler has read and blog posts he's written.",
  },
  changelog: {
    label: "Changelog",
    context: "The Changelog page, listing released versions of this site.",
  },
  typing: { label: "Typing", context: "The Typing page — Tyler's typing-speed stats." },
  opensource: { label: "Open Source", context: "The Open Source contributions page." },
};

export function describeActiveTab(tab, data = {}) {
  if (!tab) return null;
  const described = resolveTab(tab, data);
  // `id` is what the chat's context chip reopens when clicked.
  return described && { ...described, id: tab };
}

function resolveTab(tab, data) {
  const {
    leetcodeProblems = [],
    experiences = [],
    extracurriculars = [],
    projects = [],
    books = [],
    blogPosts = [],
    quickLinks = [],
    friends = [],
  } = data;

  const staticPage = STATIC_PAGES[tab];
  if (staticPage) return staticPage;

  const problem = leetcodeProblems.find((p) => p.path === tab);
  if (problem) {
    // The write-up body isn't in the CMS record — it's markdown fetched
    // from the leetcode repo at view time. Hand the path back so the chat
    // panel can pull it in and actually answer about the solution, not
    // just the problem's name.
    return {
      label: `LC${problem.number}.md`,
      context: `A LeetCode write-up: problem ${problem.number}, "${problem.title}".`,
      leetcodePath: problem.path,
    };
  }

  const experience = experiences.find((e) => e.slug === tab);
  if (experience) {
    const tech = experience.techStack?.length ? ` Tech used: ${experience.techStack.join(", ")}.` : "";
    return {
      label: `${experience.company}.txt`,
      context: `Tyler's role as ${experience.role} at ${experience.company}. ${truncate(experience.description)}${tech}`,
    };
  }

  const experiencePhotos = experiences.find(
    (e) => `${e.slug}-photos` === tab,
  );
  if (experiencePhotos) {
    return {
      label: `${experiencePhotos.company}-photos.txt`,
      context: `A photo gallery from Tyler's role as ${experiencePhotos.role} at ${experiencePhotos.company}.`,
    };
  }

  const extracurricular = extracurriculars.find((e) => e.slug === tab);
  if (extracurricular) {
    return {
      label: `${extracurricular.organisation}.txt`,
      context: `Tyler's extracurricular role as ${[extracurricular.role, extracurricular.position].filter(Boolean).join(" / ")} at ${extracurricular.organisation}. ${truncate(extracurricular.description)}`,
    };
  }

  const project = projects.find((p) => p.name === tab);
  if (project) {
    const tech = project.techStack?.length ? ` Tech: ${project.techStack.join(", ")}.` : "";
    return {
      label: `${project.title}.txt`,
      context: `Tyler's project "${project.title}"${project.year ? ` (${project.year})` : ""}${project.subtitle ? ` — ${project.subtitle}` : ""}.${tech} ${truncate(project.content)}`,
    };
  }

  const book = books.find((b) => b.slug === tab);
  if (book) {
    return {
      label: `${book.title}.txt`,
      context: `A book in Tyler's library: "${book.title}"${book.author ? ` by ${book.author}` : ""}${book.rating ? `, rated ${book.rating}` : ""}. ${truncate(book.keyPoints)}`,
    };
  }

  const post = blogPosts.find((p) => p.slug === tab);
  if (post) {
    return {
      label: `${post.title}.txt`,
      context: `A blog post by Tyler: "${post.title}". ${truncate(post.excerpt || post.body)}`,
    };
  }

  const link = [...quickLinks, ...friends].find((l) => l.name === tab);
  if (link) {
    return { label: link.name, context: `An external link Tyler has on his site: ${link.name}.` };
  }

  return { label: tab, context: `A page on Tyler's site called "${tab}".` };
}
