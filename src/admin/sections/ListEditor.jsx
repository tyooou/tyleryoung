import { useEffect, useState } from "react";
import { getContent, putContent, ApiError } from "../api.js";

// Generic add/edit/delete/reorder editor for a repo file that holds a JSON
// array of similarly-shaped objects (experience, books, friends).
function ListEditor({ type, title, description, fields, emptyItem, getSummary }) {
  const [items, setItems] = useState([]);
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
      const res = await getContent(type);
      setItems(res.data || []);
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
  }, [type]);

  const updateField = (index, key, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const moveItem = (index, direction) => {
    setItems((prev) => {
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
      const res = await putContent(type, { data: items, sha });
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
    <div className="flex flex-col gap-4 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {description && (
          <p className="text-xs text-[var(--text-secondary)] mt-1">{description}</p>
        )}
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

      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="border border-[var(--border-secondary)] rounded p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold truncate">
                {getSummary ? getSummary(item) : `Item ${index + 1}`}
              </span>
              <div className="flex items-center gap-1 text-xs shrink-0">
                <button
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  className="disabled:opacity-30 cursor-pointer px-1"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveItem(index, 1)}
                  disabled={index === items.length - 1}
                  className="disabled:opacity-30 cursor-pointer px-1"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeItem(index)}
                  className="cursor-pointer px-1 text-red-500"
                >
                  ✕
                </button>
              </div>
            </div>
            {fields.map((field) => (
              <label key={field.key} className="flex flex-col gap-1 text-xs">
                {field.label}
                {field.type === "textarea" ? (
                  <textarea
                    value={item[field.key] ?? ""}
                    onChange={(e) => updateField(index, field.key, e.target.value)}
                    rows={3}
                    className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1 text-xs"
                  />
                ) : field.type === "list" ? (
                  <input
                    type="text"
                    value={(item[field.key] || []).join(", ")}
                    onChange={(e) =>
                      updateField(
                        index,
                        field.key,
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder={field.placeholder}
                    className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1 text-xs"
                  />
                ) : (
                  <input
                    type="text"
                    value={item[field.key] ?? ""}
                    onChange={(e) => updateField(index, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="border border-[var(--border-secondary)] bg-[var(--bg)] rounded px-2 py-1 text-xs"
                  />
                )}
              </label>
            ))}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-[var(--text-secondary)]">No entries yet.</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={addItem}
          className="text-xs border border-[var(--border-secondary)] rounded px-3 py-2 cursor-pointer hover:bg-[var(--bg-tertiary)]"
        >
          + Add
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] disabled:opacity-50 rounded px-3 py-2 cursor-pointer"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default ListEditor;
