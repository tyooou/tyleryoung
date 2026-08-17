import { defineField, defineType } from "sanity";

export default defineType({
  name: "friend",
  title: "Friend",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "link", title: "Link (URL)", type: "url", validation: (Rule) => Rule.required() }),
  ],
  preview: {
    select: { title: "name", subtitle: "link" },
  },
});
