import { visit } from "unist-util-visit";

// Matches the leading marker of an Obsidian callout's first line, e.g.
// "[!example]+ Submission" -> type "example", fold "+", rest is the title.
const CALLOUT_MARKER = /^\[!(\w+)\]([+-]?)\s*/;

// Matches Obsidian wikilinks: [[Target]] or [[Target|Display text]].
const WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

// Handles the two bits of Obsidian-flavored markdown the tyooou/leetcode
// vault actually uses: "> [!type] Title" callouts and "[[Page]]" wikilinks.
// Both are done at the mdast level (via hName/hProperties, not a raw-HTML
// string swap) so nested content — fenced code blocks, tables, lists inside
// a callout — still flows through the normal remark/rehype pipeline instead
// of being frozen as unparsed text.
export default function remarkObsidian() {
  return (tree) => {
    // A callout is just a blockquote whose first paragraph starts with the
    // "[!type]" marker. mdast already splits a table/code-fence/list that
    // immediately follows the marker line into sibling nodes (they interrupt
    // the paragraph). But plain/bold text does NOT interrupt a paragraph —
    // e.g. "[!example]- Example 1\n**Input:**" (no blank line between them,
    // a pattern used throughout this vault) parses as ONE paragraph with two
    // children: text("Example 1\n") and strong("Input:"). Without splitting
    // at that line break, the whole thing would end up jammed into the title.
    visit(tree, "blockquote", (node) => {
      const first = node.children[0];
      if (!first || first.type !== "paragraph") return;
      const firstText = first.children[0];
      if (!firstText || firstText.type !== "text") return;

      const match = firstText.value.match(CALLOUT_MARKER);
      if (!match) return;

      const [, rawType, fold] = match;
      const type = rawType.toLowerCase();
      const afterMarker = firstText.value.slice(match[0].length);
      const newlineIndex = afterMarker.indexOf("\n");
      // Obsidian falls back to the capitalized type name when no title is given.
      const fallbackTitle = type[0].toUpperCase() + type.slice(1);

      let replacementNodes;
      if (newlineIndex === -1) {
        // No line break on the marker line itself — everything in this
        // paragraph (including any trailing inline siblings, e.g. a title
        // with inline formatting) is the title.
        firstText.value = afterMarker.trim() || fallbackTitle;
        first.data = { ...first.data, hName: "span" };
        replacementNodes = [first];
      } else {
        const titleText = afterMarker.slice(0, newlineIndex).trim();
        const trailingText = afterMarker.slice(newlineIndex + 1);
        const titleNode = {
          type: "paragraph",
          data: { hName: "span" },
          children: [{ type: "text", value: titleText || fallbackTitle }],
        };
        const restChildren = [
          ...(trailingText.trim() ? [{ type: "text", value: trailingText }] : []),
          ...first.children.slice(1),
        ];
        replacementNodes =
          restChildren.length > 0
            ? [titleNode, { type: "paragraph", children: restChildren }]
            : [titleNode];
      }
      node.children.splice(0, 1, ...replacementNodes);

      node.data = {
        ...node.data,
        hProperties: {
          ...node.data?.hProperties,
          "data-callout": type,
          ...(fold && { "data-callout-fold": fold }),
        },
      };
    });

    // Wikilinks only ever appear in prose text nodes, never inside code
    // (fenced code blocks and inline code are separate mdast node types) —
    // so visiting "text" nodes can't accidentally mangle code like
    // `edges = [[1,2]]`.
    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === null || typeof node.value !== "string") return;
      if (!node.value.includes("[[")) return;

      WIKILINK.lastIndex = 0;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = WIKILINK.exec(node.value))) {
        if (match.index > lastIndex) {
          parts.push({ type: "text", value: node.value.slice(lastIndex, match.index) });
        }
        const target = match[1].trim();
        const display = (match[2] || match[1]).trim();
        parts.push({
          type: "link",
          url: "#",
          data: { hProperties: { className: "wikilink", "data-wikilink": target } },
          children: [{ type: "text", value: display }],
        });
        lastIndex = match.index + match[0].length;
      }
      if (parts.length === 0) return;
      if (lastIndex < node.value.length) {
        parts.push({ type: "text", value: node.value.slice(lastIndex) });
      }
      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}
