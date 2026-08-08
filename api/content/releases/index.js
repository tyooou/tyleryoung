import { createJsonFileHandler } from "../../_lib/jsonRoute.js";

export default createJsonFileHandler({
  path: "public/releaseNotes/versions.json",
  label: "release versions",
});
