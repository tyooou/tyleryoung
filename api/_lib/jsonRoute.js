import { getFile, putFile, GitHubConflictError } from "./github.js";
import { requireAuth } from "./auth.js";

// Builds a GET/PUT handler for a repo file that holds a single JSON value
// (an object or array), e.g. public/books.json.
export function createJsonFileHandler({ path, label }) {
  return async function handler(req, res) {
    if (req.method === "GET") {
      if (!(await requireAuth(req, res))) return;
      const file = await getFile(path);
      if (!file) return res.status(404).json({ error: "not_found" });
      return res.status(200).json({ data: JSON.parse(file.content), sha: file.sha });
    }

    if (req.method === "PUT") {
      if (!(await requireAuth(req, res))) return;
      const { data, sha, message } = req.body || {};
      if (data === undefined) {
        return res.status(400).json({ error: "missing_data" });
      }
      const content = JSON.stringify(data, null, 2) + "\n";
      try {
        const result = await putFile({
          path,
          content,
          sha,
          message: message || `chore(cms): update ${label} via admin`,
        });
        return res.status(200).json({ sha: result.sha });
      } catch (err) {
        if (err instanceof GitHubConflictError) {
          return res.status(409).json({ error: "conflict", message: err.message });
        }
        console.error(err);
        return res.status(500).json({ error: "github_write_failed" });
      }
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "method_not_allowed" });
  };
}
