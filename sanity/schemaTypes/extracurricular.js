import { defineField, defineType } from "sanity";

export default defineType({
  name: "extracurricular",
  title: "Extracurricular",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "description", type: "text", rows: 6 }),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({ name: "link", title: "Link (URL)", type: "url" }),
    defineField({ name: "order", type: "number", description: "Lower numbers show first" }),
  ],
  preview: {
    select: { title: "title", media: "photos.0" },
  },
});
