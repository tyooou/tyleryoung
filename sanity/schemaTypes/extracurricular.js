import { defineField, defineType } from "sanity";

export default defineType({
  name: "extracurricular",
  title: "Extracurricular",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "description", type: "text", rows: 6 }),
    defineField({
      name: "graphics",
      title: "Graphics",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      description: "Design work / graphics you made for this organisation.",
    }),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      description: "Photos of your time there.",
    }),
    defineField({ name: "link", title: "Link (URL)", type: "url" }),
    defineField({ name: "order", type: "number", description: "Lower numbers show first" }),
  ],
  preview: {
    select: { title: "title", photo: "photos.0", graphic: "graphics.0" },
    prepare({ title, photo, graphic }) {
      return { title, media: photo || graphic };
    },
  },
});
