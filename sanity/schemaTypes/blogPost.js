import { defineField, defineType } from "sanity";

export default defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "date", type: "date", validation: (Rule) => Rule.required() }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      description: "Short summary shown in lists — not the full post.",
    }),
    defineField({
      name: "body",
      title: "Body (Markdown)",
      type: "text",
      rows: 12,
    }),
  ],
  orderings: [
    {
      title: "Date, newest first",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "date" },
  },
});
