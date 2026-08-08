import { createMarkdownFileHandler } from "../../_lib/markdownRoute.js";

export default createMarkdownFileHandler({
  buildPath: (slug) => `public/projects/${slug}/README.md`,
  paramName: "slug",
  label: "project",
});
