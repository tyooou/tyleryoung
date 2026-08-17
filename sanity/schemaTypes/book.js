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
  ],
  preview: {
    select: { title: "title", subtitle: "author" },
  },
});
