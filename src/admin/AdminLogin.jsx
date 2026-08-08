import { useState } from "react";
import { login, ApiError } from "./api.js";

function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(password);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Incorrect password.");
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)] font-mono px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs flex flex-col gap-3 border border-[var(--border-secondary)] rounded p-6 bg-[var(--bg-secondary)]"
      >
        <h1 className="text-lg font-bold mb-2">Admin login</h1>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="text-sm outline-none border border-[var(--border-secondary)] bg-[var(--bg)] px-3 py-2 rounded"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !password}
          className="text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] disabled:opacity-50 px-3 py-2 rounded cursor-pointer"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
