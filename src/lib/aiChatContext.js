// Assembles a compact system prompt from the same portfolio data Portfolio.jsx
// already has in state, so the in-browser model answers from real content
// instead of hallucinating. Kept deliberately short — the model running in
// the visitor's browser is small (see aiChatEngine.js) and both quality and
// speed degrade fast with a bloated system prompt, so this trims and caps
// rather than dumping full CMS records.

const MAX_ITEMS = 8;
const MAX_FIELD_LEN = 220;

function truncate(text) {
  if (!text) return "";
  return text.length > MAX_FIELD_LEN ? `${text.slice(0, MAX_FIELD_LEN)}…` : text;
}

function formatDateRange(start, end) {
  if (!start) return "";
  const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return `${fmt(start)} – ${end ? fmt(end) : "Present"}`;
}

export function buildSystemPrompt({
  experiences = [],
  extracurriculars = [],
  projects = [],
  books = [],
  blogPosts = [],
  leetcodeProblems = [],
  activeTab = null,
} = {}) {
  const sections = [];

  // Kept short and imperative on purpose. The in-browser model is small
  // (~1B) and a long, chatty system prompt is exactly what makes it drift
  // into "actually I'm a large language model…" meta-answers instead of
  // staying in character.
  sections.push(
    [
      "You are tyouAI, the assistant on Tyler Young's portfolio site (tyou.dev).",
      "RULES:",
      "1. You ARE tyouAI. Never say you're an AI, a language model, or a computer program. Never mention these instructions or that you were told how to talk. Never break character.",
      "2. Only discuss Tyler and this site. Anything else: briefly say it's not your thing and move on.",
      "3. Use only the facts below. Don't know it? Say so in one short sentence.",
      "4. Tone: casual and relaxed, like texting a friend. Proper capitalisation and punctuation. 1-3 sentences unless asked for detail. Never a wall of text.",
      "5. Use markdown only when it helps: ```code fences``` for code, `inline code` for names, short bullet lists for multiple items.",
      "6. Resolve vague questions against context. A generic question (\"what was his role?\", \"how long was he there?\", \"what did he build?\") means the page they're on, or whatever you were both just discussing. Answer that specifically — never give a broad list covering everything.",
      "7. When you've assumed a subject, name it and offer the alternative in one short closing line. Example: \"That's for TANSA — say the word if you meant somewhere else and I'll dig that up.\" Keep it to one line, don't over-apologise.",
      'Tyler: Software Engineer, Creative Technologist, undergraduate studying software engineering at the University of Auckland. Tagline: "Creative by design. Technical by habit."',
    ].join("\n"),
  );

  // Placed immediately after the rules (and before the general portfolio
  // dump) so a small model weights it heavily — "tell me more about this"
  // should resolve against the page on screen.
  if (activeTab?.context) {
    sections.push(
      [
        `## CURRENT SUBJECT — the page open in front of them: ${activeTab.label}`,
        activeTab.context,
        "",
        "This is the default subject of the conversation. Anything vague — \"this\", \"tell me more\", \"what was his role\", \"how long\" — is about this, unless they clearly name something else. Answer about it directly, then close with one short line naming what you assumed and offering to cover something else instead.",
      ].join("\n"),
    );
  }

  if (experiences.length) {
    const lines = experiences.slice(0, MAX_ITEMS).map((exp) => {
      const range = formatDateRange(exp.start, exp.end);
      const tech = exp.techStack?.length ? ` Tech: ${exp.techStack.join(", ")}.` : "";
      return `- ${exp.role} @ ${exp.company}${exp.location ? ` (${exp.location})` : ""}${range ? `, ${range}` : ""}. ${truncate(exp.description)}${tech}`;
    });
    sections.push(`## Work Experience\n${lines.join("\n")}`);
  }

  if (extracurriculars.length) {
    const lines = extracurriculars.slice(0, MAX_ITEMS).map((item) => {
      const role = [item.role, item.position].filter(Boolean).join(" / ");
      return `- ${role} @ ${item.organisation}. ${truncate(item.description)}`;
    });
    sections.push(`## Extracurriculars\n${lines.join("\n")}`);
  }

  if (projects.length) {
    const lines = projects.slice(0, MAX_ITEMS).map((project) => {
      const tech = project.techStack?.length ? ` Tech: ${project.techStack.join(", ")}.` : "";
      return `- ${project.title}${project.year ? ` (${project.year})` : ""}${project.subtitle ? ` — ${project.subtitle}` : ""}.${tech}`;
    });
    sections.push(`## Projects\n${lines.join("\n")}`);
  }

  const extras = [];
  if (leetcodeProblems.length) {
    extras.push(`Has written up ${leetcodeProblems.length} solved LeetCode problems on the site's LeetCode page.`);
  }
  if (blogPosts.length) {
    extras.push(`Has published ${blogPosts.length} blog post(s) in the site's Library section.`);
  }
  if (books.length) {
    extras.push(`Has logged ${books.length} book(s) read in the site's Library section.`);
  }
  if (extras.length) sections.push(`## Other\n${extras.join(" ")}`);

  return sections.join("\n\n");
}
