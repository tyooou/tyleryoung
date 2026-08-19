import { defineField, defineType } from "sanity";

// Mirrors the file layout of the tyooou/leetcode GitHub repo
// (YYYY/MM/<number>. <title>.md). Populated by scripts/sync-leetcode.mjs,
// not edited by hand — the sidebar tree/list reads from here instead of
// hitting the GitHub API on every page load.
export default defineType({
  name: "leetcodeProblem",
  title: "LeetCode Problem",
  type: "document",
  fields: [
    defineField({
      name: "path",
      type: "string",
      description: "Path in the GitHub repo, e.g. 2026/08/877. Stone Game.md",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "year", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "month", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "number", type: "number", validation: (Rule) => Rule.required() }),
    defineField({ name: "title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "date",
      type: "date",
      description: "Pulled from the write-up's frontmatter — the actual solve date.",
    }),
    defineField({
      name: "difficulty",
      type: "string",
      options: { list: ["Easy", "Medium", "Hard"] },
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "path" },
  },
});
