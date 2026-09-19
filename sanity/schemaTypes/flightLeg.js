import { defineField, defineType } from "sanity";

// Explicit point-to-point legs rather than an implicit "Auckland to every
// visitedCity" star — the actual trips weren't all direct from home (e.g.
// Hanoi -> Hong Kong -> Singapore was its own loop). `from`/`to` are plain
// city names, matched against "Auckland" (hardcoded airport coords in
// MapCard.jsx) or a visitedCity's `city` field at render time.
export default defineType({
  name: "flightLeg",
  title: "Flight Leg",
  type: "document",
  fields: [
    defineField({ name: "from", title: "From city", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "to", title: "To city", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "order",
      type: "number",
      description: "Lower shows first. Purely cosmetic — legs render as independent lines.",
    }),
  ],
  preview: {
    select: { from: "from", to: "to" },
    prepare({ from, to }) {
      return { title: `${from} → ${to}` };
    },
  },
});
