import { defineField, defineType } from "sanity";

export default defineType({
  name: "release",
  title: "Release",
  type: "document",
  fields: [
    defineField({
      name: "version",
      type: "string",
      description: "e.g. v1.6.0",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "date", type: "string", description: "e.g. 17/08/2026" }),
    defineField({ name: "title", type: "string" }),
    defineField({
      name: "completed",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "planned",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "order",
      type: "number",
      description: "Lower numbers show first (newest release = 0)",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "version", subtitle: "title" },
  },
});
