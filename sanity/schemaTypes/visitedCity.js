import { defineField, defineType } from "sanity";

export default defineType({
  name: "visitedCity",
  title: "Visited City",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Slug",
      type: "slug",
      options: { source: "city" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "city", title: "City", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "country", title: "Country", type: "string" }),
    defineField({
      name: "continent",
      title: "Continent",
      type: "string",
      options: {
        list: [
          "Africa",
          "Antarctica",
          "Asia",
          "Europe",
          "North America",
          "Oceania",
          "South America",
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
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
      name: "order",
      type: "number",
      description: "Lower shows first. Leave blank to sort by city name.",
    }),
  ],
  preview: {
    select: { title: "city", subtitle: "country" },
  },
});
