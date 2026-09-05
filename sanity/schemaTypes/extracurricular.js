import { defineField, defineType } from "sanity";

export default defineType({
  name: "extracurricular",
  title: "Extracurricular",
  type: "document",
  fields: [
    defineField({
      name: "organisation",
      title: "Organisation",
      type: "string",
      description: "e.g. Developers Society",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      type: "string",
      description: "Broad role shown in the sidebar/tab, e.g. Club Executive",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "position",
      type: "string",
      description: "More specific position shown on the page, e.g. Marketing Lead",
    }),
    defineField({ name: "description", type: "text", rows: 6 }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      description: "Skills/areas, e.g. marketing, events, design",
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
    select: { role: "role", organisation: "organisation", photo: "photos.0" },
    prepare({ role, organisation, photo }) {
      return { title: role, subtitle: organisation, media: photo };
    },
  },
});
