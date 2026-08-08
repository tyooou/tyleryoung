import { useEffect, useState } from "react";
import { getContent, putContent, ApiError } from "../api.js";

function PagesEditor() {
  const [pages, setPages] = useState([]);
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
      const res = await getContent("pages");
      setPages((res.data || []).slice().sort((a, b) => a.order - b.order));
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

  const toggle = (id) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id && !p.locked ? { ...p, enabled: !p.enabled } : p)),
    );
  };

  const relabel = (id, label) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, label } : p)));
  };

  const move = (index, direction) => {
    setPages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setConflict(false);
    setSavedAt(null);
    try {
      const normalized = pages.map((p, i) => ({ ...p, order: i }));
      const res = await putContent("pages", { data: normalized, sha });
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

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div>
        <h2 className="text-lg font-bold">Pages</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Toggle sidebar pages on/off and reorder them. Bibliography is always on.
        </p>
      </div>

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

      <div className="flex flex-col gap-2">
        {pages.map((page, index) => (
          <div
            key={page.id}
            className="border border-[var(--border-secondary)] rounded p-3 flex items-center gap-3"
          >
            <input
              type="checkbox"
              checked={page.enabled}
              disabled={page.locked}
              onChange={() => toggle(page.id)}
              className="cursor-pointer disabled:cursor-not-allowed"
            />
            <input
              type="text"
              value={page.label}
              onChange={(e) => relabel(page.id, e.target.value)}
              className="flex-1 text-xs border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1"
            />
            <span className="text-xs text-[var(--text-secondary)] w-20 truncate">{page.id}</span>
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
                disabled={index === pages.length - 1}
                className="disabled:opacity-30 cursor-pointer px-1"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>

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

export default PagesEditor;
