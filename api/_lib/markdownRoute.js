import matter from "gray-matter";
import { getFile, putFile, GitHubConflictError } from "./github.js";
import { requireAuth } from "./auth.js";

const SLUG_RE = /^[a-zA-Z0-9_-]+$/;

// Builds a GET/PUT handler for a repo file that holds YAML-frontmatter +
// markdown body, e.g. public/projects/{slug}/README.md. `paramName` must
// match the dynamic route's bracket segment (e.g. [slug].js -> "slug").
export function createMarkdownFileHandler({ buildPath, paramName, label }) {
  return async function handler(req, res) {
    const identifier = req.query[paramName];
    if (typeof identifier !== "string" || !SLUG_RE.test(identifier)) {
      return res.status(400).json({ error: "invalid_identifier" });
    }
    const path = buildPath(identifier);

    if (req.method === "GET") {
      if (!(await requireAuth(req, res))) return;
      const file = await getFile(path);
      if (!file) return res.status(404).json({ error: "not_found" });
      const parsed = matter(file.content);
      return res.status(200).json({
        frontmatter: parsed.data,
        body: parsed.content,
        sha: file.sha,
      });
    }

    if (req.method === "PUT") {
      if (!(await requireAuth(req, res))) return;
      const { frontmatter, body, sha, message } = req.body || {};
      if (!frontmatter || typeof frontmatter !== "object" || typeof body !== "string") {
        return res.status(400).json({ error: "missing_data" });
      }
      const content = matter.stringify(body, frontmatter);
      try {
        const result = await putFile({
          path,
          content,
          sha,
          message: message || `chore(cms): update ${label} "${identifier}" via admin`,
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
