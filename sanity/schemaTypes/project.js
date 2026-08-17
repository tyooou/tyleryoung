import { defineField, defineType } from "sanity";

export default defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "subtitle", type: "string" }),
    defineField({ name: "body", title: "Description", type: "text", rows: 6 }),
    defineField({
      name: "techStack",
      title: "Tech stack",
      type: "array",
      of: [{ type: "string" }],
      description: "Icon slugs, e.g. js, astro, tailwindcss",
    }),
    defineField({ name: "code", title: "Code URL", type: "url" }),
    defineField({ name: "preview", title: "Preview URL", type: "url" }),
    defineField({
      name: "active",
      title: "Show in sidebar",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "media",
      title: "Media (images/video, in display order)",
      type: "array",
      of: [{ type: "file" }],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "subtitle", active: "active" },
    prepare({ title, subtitle, active }) {
      return { title, subtitle: `${active ? "active" : "hidden"} — ${subtitle || ""}` };
    },
  },
});
