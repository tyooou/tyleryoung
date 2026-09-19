import { defineField, defineType } from "sanity";

export default defineType({
  name: "foodSpot",
  title: "Food Spot",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "title", title: "Name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "city", title: "City", type: "string" }),
    defineField({
      name: "lat",
      title: "Latitude",
      type: "number",
      validation: (Rule) => Rule.required().min(-90).max(90),
    }),
    defineField({
      name: "lng",
      title: "Longitude",
      type: "number",
      validation: (Rule) => Rule.required().min(-180).max(180),
    }),
    defineField({
      name: "rating",
      title: "Rating (1-5)",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(1).max(5),
    }),
    defineField({ name: "review", title: "Review", type: "text", rows: 4 }),
    defineField({
      name: "order",
      type: "number",
      description: "Lower shows first. Leave blank to sort by rating.",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "city", rating: "rating" },
    prepare({ title, subtitle, rating }) {
      return {
        title,
        subtitle: `${subtitle || ""}${rating ? ` — ${"★".repeat(rating)}` : ""}`,
      };
    },
  },
});
