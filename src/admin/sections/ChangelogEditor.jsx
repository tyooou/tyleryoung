import { useEffect, useState } from "react";
import { getContent, putContent, ApiError } from "../api.js";

// Mirrors the parsing in src/components/pages/ChangelogCard.jsx so the admin
// reads/writes the exact "## Completed" / "## Planned" bullet-list format.
function parseBody(body) {
  const sections = (body || "").split("## ").filter(Boolean);
  const extractList = (name) =>
    sections
      .find((s) => s.startsWith(name))
      ?.split("\n")
      .slice(1)
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.trim().substring(2)) || [];
  return { completed: extractList("Completed"), planned: extractList("Planned") };
}

function serializeBody({ completed, planned }) {
  const section = (name, items) =>
    `## ${name}\n\n${items
      .filter((i) => i.trim())
      .map((i) => `- ${i}`)
      .join("\n")}\n`;
  return `${section("Completed", completed)}\n${section("Planned", planned)}`;
}

function slugify(version) {
  return version.trim().replace(/\./g, "-");
}

function ChangelogEditor() {
  const [versions, setVersions] = useState([]);
  const [sha, setSha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    setConflict(false);
    try {
      const res = await getContent("releases");
      setVersions(res.data?.versions || []);
      setSha(res.sha);
    } catch {
      setError("Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const move = (index, direction) => {
    setVersions((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (slug) => setVersions((prev) => prev.filter((v) => v !== slug));

  const saveOrder = async () => {
    setSaving(true);
    setError("");
    setConflict(false);
    setSavedAt(null);
    try {
      const res = await putContent("releases", { data: { versions }, sha });
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

  if (selected) {
    return (
      <ReleaseDetailEditor
        version={selected}
        onBack={() => {
          setSelected(null);
          load();
        }}
      />
    );
  }

  if (creating) {
    return (
      <ReleaseDetailEditor
        isNew
        onBack={() => {
          setCreating(false);
          load();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div>
        <h2 className="text-lg font-bold">Changelog</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Release notes list. Reorder with the arrows; removing here only unlists an entry, it
          doesn't delete the underlying file.
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
        {versions.map((v, index) => (
          <div
            key={v}
            className="border border-[var(--border-secondary)] rounded p-3 flex items-center gap-3"
          >
            <button
              onClick={() => setSelected(v)}
              className="flex-1 text-left text-xs underline cursor-pointer"
            >
              {v}
            </button>
            <div className="flex items-center gap-1 text-xs shrink-0">
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="disabled:opacity-30 cursor-pointer px-1"
              >
                ↑
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === versions.length - 1}
                className="disabled:opacity-30 cursor-pointer px-1"
              >
                ↓
              </button>
              <button onClick={() => remove(v)} className="cursor-pointer px-1 text-red-500">
                ✕
              </button>
            </div>
          </div>
        ))}
        {versions.length === 0 && (
          <p className="text-xs text-[var(--text-secondary)]">No releases yet.</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setCreating(true)}
          className="text-xs border border-[var(--border-secondary)] rounded px-3 py-2 cursor-pointer hover:bg-[var(--bg-tertiary)]"
        >
          + New release
        </button>
        <button
          onClick={saveOrder}
          disabled={saving}
          className="text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] disabled:opacity-50 rounded px-3 py-2 cursor-pointer"
        >
          {saving ? "Saving…" : "Save list"}
        </button>
      </div>
    </div>
  );
}

function ReleaseDetailEditor({ version, isNew, onBack }) {
  const [versionLabel, setVersionLabel] = useState("");
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [completed, setCompleted] = useState("");
  const [planned, setPlanned] = useState("");
  const [sha, setSha] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [createdSlug, setCreatedSlug] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    setConflict(false);
    try {
      const res = await getContent(`releases/${version}`);
      setVersionLabel(res.frontmatter?.version || "");
      setDate(res.frontmatter?.date || "");
      setTitle(res.frontmatter?.title || "");
      const parsed = parseBody(res.body);
      setCompleted(parsed.completed.join("\n"));
      setPlanned(parsed.planned.join("\n"));
      setSha(res.sha);
    } catch {
      setError("Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNew) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const save = async () => {
    setSaving(true);
    setError("");
    setConflict(false);
    setSavedAt(null);

    const body = serializeBody({
      completed: completed.split("\n").map((s) => s.trim()).filter(Boolean),
      planned: planned.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    const frontmatter = { version: versionLabel, date, title };

    try {
      if (isNew) {
        const targetSlug = slugify(versionLabel);
        if (!targetSlug) {
          setError("Enter a version first (e.g. v1.6.0).");
          setSaving(false);
          return;
        }
        const fileRes = await putContent(`releases/${targetSlug}`, { frontmatter, body });
        const versionsRes = await getContent("releases");
        const nextVersions = [targetSlug, ...(versionsRes.data?.versions || [])];
        await putContent("releases", {
          data: { versions: nextVersions },
          sha: versionsRes.sha,
        });
        setSha(fileRes.sha);
        setCreatedSlug(targetSlug);
        setSavedAt(Date.now());
      } else {
        const res = await putContent(`releases/${version}`, { frontmatter, body, sha });
        setSha(res.sha);
        setSavedAt(Date.now());
      }
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

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <button onClick={onBack} className="text-xs underline self-start cursor-pointer">
        ← Back to changelog
      </button>
      <h2 className="text-lg font-bold">
        {isNew ? (createdSlug ? createdSlug : "New release") : version}
      </h2>

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
        Version (e.g. v1.6.0)
        <input
          value={versionLabel}
          onChange={(e) => setVersionLabel(e.target.value)}
          disabled={isNew && !!createdSlug}
          className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1 disabled:opacity-60"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Date (e.g. 08/08/2026)
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Completed (one per line)
        <textarea
          value={completed}
          onChange={(e) => setCompleted(e.target.value)}
          rows={5}
          className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Planned (one per line)
        <textarea
          value={planned}
          onChange={(e) => setPlanned(e.target.value)}
          rows={5}
          className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1"
        />
      </label>

      <button
        onClick={save}
        disabled={saving || (isNew && !!createdSlug)}
        className="self-start text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] disabled:opacity-50 rounded px-3 py-2 cursor-pointer"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export default ChangelogEditor;
