const GITHUB_API = "https://api.github.com";

export class GitHubConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "GitHubConflictError";
  }
}

function getConfig() {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } =
    process.env;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error("Missing GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO env vars");
  }
  return {
    token: GITHUB_TOKEN,
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH || "main",
  };
}

function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function githubFetch(path, options = {}) {
  const { token } = getConfig();
  return fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
}

// Reads a file's current content + sha from the repo. Returns null if it doesn't exist.
export async function getFile(path) {
  const { owner, repo, branch } = getConfig();
  const res = await githubFetch(
    `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${branch}`,
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub getFile(${path}) failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

// Lists entries (files/dirs) directly inside a directory. Returns [] if it doesn't exist.
export async function listDir(path) {
  const { owner, repo, branch } = getConfig();
  const res = await githubFetch(
    `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${branch}`,
  );
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`GitHub listDir(${path}) failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((entry) => ({ name: entry.name, type: entry.type }));
}

// Creates or updates a file. Omit `sha` to create a new file; pass the file's
// current sha to update it (GitHub rejects the write with a conflict if it's stale).
export async function putFile({ path, content, sha, message }) {
  const { owner, repo, branch } = getConfig();
  const body = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await githubFetch(`/repos/${owner}/${repo}/contents/${encodePath(path)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (res.status === 409) {
    throw new GitHubConflictError(
      "This file changed on GitHub since it was loaded — reload and try again.",
    );
  }
  if (res.status === 422) {
    const text = await res.text();
    if (/sha/i.test(text)) {
      throw new GitHubConflictError(
        "This file changed on GitHub since it was loaded — reload and try again.",
      );
    }
    throw new Error(`GitHub putFile(${path}) validation failed: ${text}`);
  }
  if (!res.ok) {
    throw new Error(`GitHub putFile(${path}) failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return { sha: data.content.sha };
}
