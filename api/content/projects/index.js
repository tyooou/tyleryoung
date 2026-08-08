import { getFile, putFile, listDir, GitHubConflictError } from "../../_lib/github.js";
import { requireAuth } from "../../_lib/auth.js";

const PATH = "public/projects/projects.json";

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (!(await requireAuth(req, res))) return;
    const [file, entries] = await Promise.all([getFile(PATH), listDir("public/projects")]);
    if (!file) return res.status(404).json({ error: "not_found" });
    const slugs = entries.filter((e) => e.type === "dir").map((e) => e.name);
    return res.status(200).json({ data: JSON.parse(file.content), sha: file.sha, slugs });
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
        path: PATH,
        content,
        sha,
        message: message || "chore(cms): update projects via admin",
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
}
