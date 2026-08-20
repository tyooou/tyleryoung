import { defineField, defineType } from "sanity";

export default defineType({
  name: "experience",
  title: "Experience",
  type: "document",
  fields: [
    defineField({ name: "role", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "company", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "location", type: "string" }),
    defineField({ name: "description", type: "text", rows: 4 }),
    defineField({ name: "start", type: "date", validation: (Rule) => Rule.required() }),
    defineField({
      name: "end",
      type: "date",
      description: "Leave blank to show as 'Present'",
    }),
    defineField({ name: "link", title: "Link (URL)", type: "url" }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      description: "Skills/areas, e.g. ui/ux, backend, robotics",
    }),
    defineField({
      name: "techStack",
      title: "Tech stack",
      type: "array",
      of: [{ type: "string" }],
      description: "Icon slugs, e.g. python, react, typescript",
    }),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
  ],
  preview: {
    select: { title: "role", subtitle: "company" },
  },
});
