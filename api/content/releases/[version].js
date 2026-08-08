import { createMarkdownFileHandler } from "../../_lib/markdownRoute.js";

export default createMarkdownFileHandler({
  buildPath: (version) => `public/releaseNotes/${version}.md`,
  paramName: "version",
  label: "release note",
});
