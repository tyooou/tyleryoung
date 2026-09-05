import { Children, useEffect, useMemo, useState } from "react";
import fm from "front-matter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Pencil,
  Info,
  ClipboardList,
  Flame,
  CheckCircle2,
  Check,
  HelpCircle,
  AlertTriangle,
  X,
  Zap,
  Bug,
  List,
  Quote,
  Code2,
} from "lucide-react";
import ExternalLink from "../../ExternalLink";
import Scribble from "../../Scribble";
import { fetchProblemMarkdown, DIFFICULTY_COLOR } from "../../../lib/leetcode";
import remarkObsidian from "../../../lib/remarkObsidian";
import { useExternalLinkConfirm } from "../../../lib/useExternalLinkConfirm";

// YAML parses unquoted dates like `date: 2026-08-03` into real Date objects,
// not strings, so this can't just be rendered directly in JSX.
function formatDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

// Icon + accent color per Obsidian callout type, mirroring Obsidian's own
// type groupings (help.obsidian.md/Editing+and+formatting/Callouts).
// example/success/warning are the only types the tyooou/leetcode vault
// actually uses. Colors are theme-scoped CSS vars — the note/example/quote
// groups map onto this theme's own accent/text tokens (so they're never a
// color foreign to the active palette), and the rest reuse the same
// difficulty colors as the badges above for visual consistency.
const CALLOUT_META = {
  note: { icon: Pencil, color: "var(--accent)" },
  info: { icon: Info, color: "var(--accent)" },
  abstract: { icon: ClipboardList, color: "var(--accent)" },
  summary: { icon: ClipboardList, color: "var(--accent)" },
  tldr: { icon: ClipboardList, color: "var(--accent)" },
  tip: { icon: Flame, color: DIFFICULTY_COLOR.Easy },
  hint: { icon: Flame, color: DIFFICULTY_COLOR.Easy },
  important: { icon: Flame, color: DIFFICULTY_COLOR.Easy },
  todo: { icon: CheckCircle2, color: "var(--accent)" },
  success: { icon: Check, color: DIFFICULTY_COLOR.Easy },
  check: { icon: Check, color: DIFFICULTY_COLOR.Easy },
  done: { icon: Check, color: DIFFICULTY_COLOR.Easy },
  question: { icon: HelpCircle, color: DIFFICULTY_COLOR.Medium },
  help: { icon: HelpCircle, color: DIFFICULTY_COLOR.Medium },
  faq: { icon: HelpCircle, color: DIFFICULTY_COLOR.Medium },
  warning: { icon: AlertTriangle, color: DIFFICULTY_COLOR.Medium },
  attention: { icon: AlertTriangle, color: DIFFICULTY_COLOR.Medium },
  caution: { icon: AlertTriangle, color: DIFFICULTY_COLOR.Medium },
  failure: { icon: X, color: DIFFICULTY_COLOR.Hard },
  missing: { icon: X, color: DIFFICULTY_COLOR.Hard },
  fail: { icon: X, color: DIFFICULTY_COLOR.Hard },
  danger: { icon: Zap, color: DIFFICULTY_COLOR.Hard },
  error: { icon: Zap, color: DIFFICULTY_COLOR.Hard },
  bug: { icon: Bug, color: DIFFICULTY_COLOR.Hard },
  example: { icon: List, color: "var(--accent-secondary)" },
  quote: { icon: Quote, color: "var(--text-secondary)" },
  cite: { icon: Quote, color: "var(--text-secondary)" },
};

// Built per-render (via useMemo below) since the wikilink handler needs to
// resolve against this pane's problem list and navigate through its tab.
function createMarkdownComponents({ leetcodeProblems, updatePage }) {
  return {
    h1: (props) => <h3 className="text-xl font-bold mt-6 mb-2" {...props} />,
    h2: (props) => <h3 className="text-xl font-bold mt-6 mb-2" {...props} />,
    h3: (props) => <h4 className="text-lg font-bold mt-5 mb-2" {...props} />,
    p: (props) => <p className="text-sm mb-3 leading-relaxed" {...props} />,
    ul: (props) => <ul className="list-disc ml-5 mb-3 text-sm space-y-1" {...props} />,
    ol: (props) => <ol className="list-decimal ml-5 mb-3 text-sm space-y-1" {...props} />,
    a: ({ href, children, ...props }) => {
      const wikiTarget = props["data-wikilink"];
      if (wikiTarget !== undefined) {
        const resolved = leetcodeProblems.find(
          (p) => `${p.number}. ${p.title}` === wikiTarget,
        );
        if (resolved && updatePage) {
          return (
            <a
              className="underline decoration-dotted text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
              onClick={() => updatePage(resolved.path)}
            >
              {children}
            </a>
          );
        }
        // Unresolved reference (e.g. the note it points to hasn't synced) —
        // still readable, just not clickable.
        return <span className="italic text-[var(--text-secondary)]">{children}</span>;
      }
      return (
        <a
          className="underline text-[var(--text-secondary)] hover:text-[var(--text)]"
          target="_blank"
          rel="noopener noreferrer"
          href={href}
          {...props}
        />
      );
    },
    blockquote: ({ children, ...props }) => {
      const calloutType = props["data-callout"];
      if (!calloutType) {
        return (
          <blockquote
            className="border-l-2 border-[var(--border-secondary)] bg-[var(--bg-secondary)] rounded-r px-4 py-2 mb-3 text-sm"
            {...props}
          >
            {children}
          </blockquote>
        );
      }
      const meta = CALLOUT_META[calloutType] || CALLOUT_META.note;
      const Icon = meta.icon;
      // mdast-util-to-hast inserts whitespace-only "\n" text nodes between
      // the callout's block-level children (title, table, code, ...) —
      // filter those out before splitting off the title, or it ends up
      // grabbing a stray newline instead of the actual title span.
      const parts = Children.toArray(children).filter(
        (child) => typeof child !== "string" || child.trim() !== "",
      );
      const [calloutTitle, ...calloutBody] = parts;
      return (
        <div
          className="rounded border-l-4 mb-3 px-3 py-2 text-sm"
          style={{
            borderColor: meta.color,
            backgroundColor: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
          }}
        >
          <div className="flex items-center gap-2 font-bold mb-1" style={{ color: meta.color }}>
            <Icon size={15} className="shrink-0" />
            {calloutTitle}
          </div>
          {calloutBody.length > 0 && <div>{calloutBody}</div>}
        </div>
      );
    },
    // react-markdown v9+ no longer passes an `inline` prop to the code
    // component (a breaking change from earlier versions) — fenced code blocks
    // are the only ones that get a `language-*` className, so that's what
    // distinguishes them from inline `code` spans now.
    code: ({ className, children, ...props }) => {
      const isBlock = /language-/.test(className || "");
      return isBlock ? (
        <code className={className} {...props}>
          {children}
        </code>
      ) : (
        <code className="bg-[var(--bg-tertiary)] rounded px-1 py-0.5 text-xs" {...props}>
          {children}
        </code>
      );
    },
    pre: (props) => (
      <pre
        className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded p-3 mb-3 text-xs overflow-x-auto"
        {...props}
      />
    ),
    table: (props) => (
      <div className="overflow-x-auto mb-3">
        <table className="text-xs border-collapse w-full" {...props} />
      </div>
    ),
    th: (props) => (
      <th
        className="border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-2 py-1 text-left"
        {...props}
      />
    ),
    td: (props) => (
      <td className="border border-[var(--border-secondary)] px-2 py-1" {...props} />
    ),
    hr: () => <hr className="border-[var(--border-secondary)] my-6" />,
  };
}

function LeetcodeEntryCard({ path, title, leetcodeProblems = [], updatePage }) {
  const { handleClick: handleExternalClick, modal: externalLinkModal } =
    useExternalLinkConfirm();
  const [frontmatter, setFrontmatter] = useState(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const markdownComponents = useMemo(
    () => createMarkdownComponents({ leetcodeProblems, updatePage }),
    [leetcodeProblems, updatePage],
  );

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchProblemMarkdown(path)
      .then((raw) => {
        const { attributes, body: content } = fm(raw);
        setFrontmatter(attributes);
        setBody(content);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [path]);

  return (
    <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default overflow-y-auto">
      {externalLinkModal}
      <h2 className="font-bold text-4xl sm:text-3xl md:text-4xl">{title}</h2>

      {loading && (
        <div className="mt-6">
          <Scribble />
        </div>
      )}

      {!loading && error && <p className="text-sm mt-4">Failed to load this problem :(</p>}

      {!loading && !error && (
        <div className="animate-content-in mt-4 ml-2 mr-2 max-w-4xl select-text cursor-text">
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
            {frontmatter.difficulty &&
              (() => {
                const color = DIFFICULTY_COLOR[frontmatter.difficulty];
                return (
                  <span
                    className="px-2 py-0.5 rounded border font-bold"
                    style={
                      color
                        ? {
                            color,
                            borderColor: color,
                            backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                          }
                        : undefined
                    }
                  >
                    {frontmatter.difficulty}
                  </span>
                );
              })()}
            {frontmatter.date && (
              <span className="text-[var(--text-secondary)]">{formatDate(frontmatter.date)}</span>
            )}
            {frontmatter.link && (
              <ExternalLink
                text="View on LeetCode"
                link={frontmatter.link}
                icon={<Code2 size={14} />}
                onClick={handleExternalClick(frontmatter.link)}
              />
            )}
          </div>

          {frontmatter.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {frontmatter.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Same highlighter tyouAI's replies use. It only emits
              highlight.js class names — the colours themselves come from
              the hljs-* rules in index.css, which are mapped onto the
              theme's tokens, so code follows the active theme rather than
              carrying its own palette.
              No `detect`: these write-ups use unlabelled fences for prose
              asides as well as code, and auto-detection reads those as
              markdown and starts colouring the bullets and bold markers.
              Labelled fences only; an unlabelled one stays plain text.
              ignoreMissing keeps an unknown language from throwing. */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkObsidian]}
            rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
            components={markdownComponents}
          >
            {body}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default LeetcodeEntryCard;
