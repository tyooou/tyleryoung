import { defineField, defineType } from "sanity";

export default defineType({
  name: "book",
  title: "Book",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "author", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "isbn", title: "ISBN", type: "string" }),
    defineField({ name: "dateStarted", type: "date" }),
    defineField({
      name: "dateCompleted",
      type: "date",
      description: "Leave blank if still in progress",
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "rating",
      title: "Rating (out of 5)",
      type: "number",
      validation: (Rule) => Rule.min(0).max(5),
    }),
    defineField({
      name: "themes",
      title: "Themes",
      type: "array",
      of: [{ type: "string" }],
      description: "Genres/topics, e.g. productivity, habits, psychology",
    }),
    defineField({
      name: "keyPoints",
      title: "Key Points / Understanding",
      type: "text",
      rows: 6,
      description: "Personal notes on what the book covers and what stuck with you.",
    }),
    defineField({
      name: "favoriteQuote",
      title: "Favorite Quote",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "author", media: "coverImage" },
  },
});
