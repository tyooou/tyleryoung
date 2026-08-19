import { defineField, defineType } from "sanity";

// Singleton-by-convention: only one "settings" document should ever exist,
// queried via *[_type == "settings"][0]. Nothing in Studio enforces that,
// same level of trust as the rest of this schema.
export default defineType({
  name: "settings",
  title: "Settings",
  type: "document",
  fields: [
    defineField({ name: "cv", title: "CV / Résumé (PDF)", type: "file" }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});
