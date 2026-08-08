import { useEffect, useState } from "react";
import { getContent, putContent, ApiError } from "../api.js";

function ProjectsEditor() {
  const [allSlugs, setAllSlugs] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [indexSha, setIndexSha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    setConflict(false);
    try {
      const res = await getContent("projects");
      setAllSlugs((res.slugs || []).slice().sort());
      setActiveProjects(res.data?.activeProjects || []);
      setIndexSha(res.sha);
    } catch {
      setError("Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = (slug) => {
    setActiveProjects((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const saveIndex = async () => {
    setSaving(true);
    setError("");
    setConflict(false);
    setSavedAt(null);
    try {
      const res = await putContent("projects", {
        data: { activeProjects },
        sha: indexSha,
      });
      setIndexSha(res.sha);
      setSavedAt(Date.now());
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setConflict(true);
      } else {
        setError("Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm">Loading…</p>;

  if (selected) {
    return <ProjectDetailEditor slug={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div>
        <h2 className="text-lg font-bold">Projects</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Toggle which projects appear in the sidebar, and edit each project's details. A
          brand-new project must be added via git (folder + media) before it shows up here to
          be toggled on and edited.
        </p>
      </div>

      {conflict && (
        <div className="text-xs border border-red-400 text-red-500 rounded p-3 flex items-center justify-between gap-2">
          <span>This changed on GitHub since it was loaded.</span>
          <button onClick={load} className="underline cursor-pointer shrink-0">
            Reload
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {savedAt && !conflict && (
        <p className="text-xs text-green-600">Saved — redeploying, live in ~30-60s.</p>
      )}

      <div className="flex flex-col gap-2">
        {allSlugs.map((slug) => (
          <div
            key={slug}
            className="border border-[var(--border-secondary)] rounded p-3 flex items-center gap-3"
          >
            <input
              type="checkbox"
              checked={activeProjects.includes(slug)}
              onChange={() => toggleActive(slug)}
              className="cursor-pointer"
            />
            <span className="flex-1 text-xs">{slug}</span>
            <button onClick={() => setSelected(slug)} className="text-xs underline cursor-pointer">
              Edit details
            </button>
          </div>
        ))}
        {allSlugs.length === 0 && (
          <p className="text-xs text-[var(--text-secondary)]">No project folders found.</p>
        )}
      </div>

      <button
        onClick={saveIndex}
        disabled={saving}
        className="self-start text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] disabled:opacity-50 rounded px-3 py-2 cursor-pointer"
      >
        {saving ? "Saving…" : "Save visibility"}
      </button>
    </div>
  );
}

function ProjectDetailEditor({ slug, onBack }) {
  const [frontmatter, setFrontmatter] = useState(null);
  const [body, setBody] = useState("");
  const [sha, setSha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    setConflict(false);
    try {
      const res = await getContent(`projects/${slug}`);
      setFrontmatter(res.frontmatter || {});
      setBody(res.body || "");
      setSha(res.sha);
    } catch {
      setError("Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const updateFm = (key, value) => setFrontmatter((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError("");
    setConflict(false);
    setSavedAt(null);
    try {
      const res = await putContent(`projects/${slug}`, { frontmatter, body, sha });
      setSha(res.sha);
      setSavedAt(Date.now());
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setConflict(true);
      } else {
        setError("Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm">Loading…</p>;
  if (!frontmatter) return <p className="text-sm">Not found.</p>;

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <button onClick={onBack} className="text-xs underline self-start cursor-pointer">
        ← Back to projects
      </button>
      <h2 className="text-lg font-bold">{slug}</h2>

      {conflict && (
        <div className="text-xs border border-red-400 text-red-500 rounded p-3 flex items-center justify-between gap-2">
          <span>This file changed on GitHub since it was loaded.</span>
          <button onClick={load} className="underline cursor-pointer shrink-0">
            Reload
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {savedAt && !conflict && (
        <p className="text-xs text-green-600">Saved — redeploying, live in ~30-60s.</p>
      )}

      <label className="flex flex-col gap-1 text-xs">
        Title
        <input
          value={frontmatter.title || ""}
          onChange={(e) => updateFm("title", e.target.value)}
          className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Subtitle
        <input
          value={frontmatter.subtitle || ""}
          onChange={(e) => updateFm("subtitle", e.target.value)}
          className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Tech stack (comma-separated icon slugs)
        <input
          value={(frontmatter.techStack || []).join(", ")}
          onChange={(e) =>
            updateFm(
              "techStack",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Code URL
        <input
          value={frontmatter.code || ""}
          onChange={(e) => updateFm("code", e.target.value)}
          className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Preview URL
        <input
          value={frontmatter.preview || ""}
          onChange={(e) => updateFm("preview", e.target.value)}
          className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1"
        />
      </label>
      <div className="flex flex-col gap-1 text-xs">
        <span>Media files (managed via git, shown read-only here)</span>
        <p className="text-[var(--text-secondary)]">
          {(frontmatter.media || []).join(", ") || "none"}
        </p>
      </div>
      <label className="flex flex-col gap-1 text-xs">
        Description
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1"
        />
      </label>

      <button
        onClick={save}
        disabled={saving}
        className="self-start text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] disabled:opacity-50 rounded px-3 py-2 cursor-pointer"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export default ProjectsEditor;
