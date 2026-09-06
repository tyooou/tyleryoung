import { useState } from "react";
import { Copy, Check } from "lucide-react";

// react-markdown hands `pre` a React tree, not a string, so the raw source
// for the copy button has to be walked back out of it.
function nodeText(node) {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  return nodeText(node.props?.children);
}

// A fenced code block in a chat reply, with a hover copy button.
function CodeBlock({ children, ...props }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(nodeText(children));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (permissions, insecure context) — the
      // button just doesn't confirm rather than throwing at the user.
    }
  }

  return (
    <div className="relative group/code mb-2">
      <pre
        className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded p-2 pr-8 text-xs overflow-x-auto"
        {...props}
      >
        {children}
      </pre>
      <button
        onClick={copy}
        className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover/code:opacity-100 focus:opacity-100 transition-opacity bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
        aria-label={copied ? "Copied" : "Copy code"}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}

export default CodeBlock;
