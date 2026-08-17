import { defineField, defineType } from "sanity";

export default defineType({
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    defineField({
      name: "id",
      type: "string",
      description: "Matches a page component id — don't change after creation.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "label", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "icon",
      type: "string",
      description: "Icon key from src/components/iconMap.js (e.g. user, briefcase, book)",
    }),
    defineField({
      name: "enabled",
      type: "boolean",
      initialValue: true,
      readOnly: ({ document }) => document?.id === "bibliography",
      description: "Bibliography is always on — it's the site's default page.",
    }),
    defineField({ name: "order", type: "number", validation: (Rule) => Rule.required() }),
  ],
  preview: {
    select: { title: "label", subtitle: "id", enabled: "enabled" },
    prepare({ title, subtitle, enabled }) {
      return { title, subtitle: `${subtitle} — ${enabled ? "on" : "off"}` };
    },
  },
});
