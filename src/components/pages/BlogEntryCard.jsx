import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CustomScrollbar from "../CustomScrollbar";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const markdownComponents = {
  h1: (props) => <h3 className="text-xl font-bold mt-6 mb-2" {...props} />,
  h2: (props) => <h3 className="text-xl font-bold mt-6 mb-2" {...props} />,
  h3: (props) => <h4 className="text-lg font-bold mt-5 mb-2" {...props} />,
  p: (props) => <p className="text-sm mb-3 leading-relaxed" {...props} />,
  ul: (props) => <ul className="list-disc ml-5 mb-3 text-sm space-y-1" {...props} />,
  ol: (props) => <ol className="list-decimal ml-5 mb-3 text-sm space-y-1" {...props} />,
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
      className="border-l-2 border-[var(--border-secondary)] bg-[var(--bg-secondary)] rounded-r px-4 py-2 mb-3 text-sm"
      {...props}
    />
  ),
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
  hr: () => <hr className="border-[var(--border-secondary)] my-6" />,
};

function BlogEntryCard({ post }) {
  if (!post) return null;
  const { title, date, excerpt, body } = post;

  return (
    <CustomScrollbar className="p-3 sm:p-5 font-mono flex flex-col select-none cursor-default">
      <h2 className="font-bold text-4xl sm:text-3xl md:text-4xl lg:text-5xl flex-shrink-0">
        {title}
      </h2>
      <p className="text-base mt-2 ml-2 text-[var(--text-secondary)]">{formatDate(date)}</p>
      <div className="mt-4 ml-2 mr-2 max-w-3xl select-text cursor-text">
        {excerpt && (
          <p className="text-base italic text-[var(--text-secondary)] mb-4">{excerpt}</p>
        )}
        {body ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {body}
          </ReactMarkdown>
        ) : (
          <p className="text-base text-[var(--text-secondary)]">(fill in)</p>
        )}
      </div>
    </CustomScrollbar>
  );
}

export default BlogEntryCard;
