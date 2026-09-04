import CodeBlock from "../components/CodeBlock";

// A leaner sibling of LeetcodeEntryCard's markdown component map — same
// visual language (code/pre/list styling) for consistency across the site,
// but without the Obsidian wikilink/callout handling those pages need,
// since tyouAI's replies never contain either.
const chatMarkdownComponents = {
  p: (props) => <p className="text-[13px] leading-relaxed mb-2 last:mb-0" {...props} />,
  ul: (props) => <ul className="list-disc ml-4 mb-2 text-[13px] space-y-0.5" {...props} />,
  ol: (props) => <ol className="list-decimal ml-4 mb-2 text-[13px] space-y-0.5" {...props} />,
  a: (props) => (
    <a
      className="underline text-[var(--text-secondary)] hover:text-[var(--text)]"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="border-l-2 border-[var(--border-secondary)] bg-[var(--bg-tertiary)] rounded-r px-3 py-1.5 mb-2 text-[13px]"
      {...props}
    />
  ),
  // Fenced blocks get a language-* className from remark-gfm; inline `code`
  // spans don't — that's what distinguishes them (react-markdown v9+ no
  // longer passes an `inline` prop).
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
  pre: CodeBlock,
};

export default chatMarkdownComponents;
