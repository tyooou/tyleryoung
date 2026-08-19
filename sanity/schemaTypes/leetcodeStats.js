import { defineField, defineType } from "sanity";

// Singleton-by-convention (see settings.js), queried via
// *[_type == "leetcodeStats"][0]. Populated by scripts/sync-leetcode-stats.mjs
// from LeetCode's own GraphQL API (leetcode.com/graphql), which has no CORS
// headers and can't be called directly from the browser — this doc is the
// static site's stand-in for that live call.
export default defineType({
  name: "leetcodeStats",
  title: "LeetCode Stats",
  type: "document",
  fields: [
    defineField({ name: "totalSolved", type: "number", validation: (Rule) => Rule.required() }),
    defineField({ name: "easySolved", type: "number", validation: (Rule) => Rule.required() }),
    defineField({ name: "mediumSolved", type: "number", validation: (Rule) => Rule.required() }),
    defineField({ name: "hardSolved", type: "number", validation: (Rule) => Rule.required() }),
    defineField({
      name: "submissionCalendar",
      title: "Submission Calendar (JSON)",
      description: "Raw JSON string as returned by LeetCode: { [unixTimestamp]: submissionCount }",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { totalSolved: "totalSolved" },
    prepare({ totalSolved }) {
      return { title: "LeetCode Stats", subtitle: `${totalSolved} solved` };
    },
  },
});
