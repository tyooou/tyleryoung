import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

// Free, no-auth hit counter (CORS-enabled). /hit increments and returns the
// new total; /get just reads the current total with no side effect.
const NAMESPACE = "tyou-dev-portfolio/visits";
const HIT_URL = `https://abacus.jasoncameron.dev/hit/${NAMESPACE}`;
const GET_URL = `https://abacus.jasoncameron.dev/get/${NAMESPACE}`;

// Reloading the page (or React StrictMode's dev-only double-invoke of
// effects) shouldn't count as a second visit. The flag is set synchronously
// before the fetch — not in its .then() — specifically so StrictMode's
// second, immediate effect invocation already sees it and falls through to
// the read-only endpoint, rather than racing the first call's async result.
const SESSION_KEY = "visitorCounted";

function VisitorCounter() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const alreadyCounted = sessionStorage.getItem(SESSION_KEY) === "true";
    if (!alreadyCounted) sessionStorage.setItem(SESSION_KEY, "true");

    fetch(alreadyCounted ? GET_URL : HIT_URL)
      .then((res) => res.json())
      .then((data) => setCount(data.value))
      .catch(() => setCount(null));
  }, []);

  if (count === null) return null;

  return (
    // -ml-1 cancels the header's own px-1 so this box starts at the very
    // left edge, and w-12 on the icon slot matches the activity bar's width
    // below it — which is what puts the eye on the same vertical line as
    // the rail's icons rather than sitting inboard of them.
    <span className="hidden sm:flex items-center -ml-1 text-[var(--text-secondary)] font-mono text-xs select-none shrink-0">
      <span className="flex items-center justify-center w-12">
        <Eye className="w-4 h-4 shrink-0" />
      </span>
      <span className="-ml-1">{count.toLocaleString()}</span>
    </span>
  );
}

export default VisitorCounter;
