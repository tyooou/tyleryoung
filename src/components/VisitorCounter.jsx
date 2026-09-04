import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import HeaderTooltip from "./HeaderTooltip";

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
    // left edge, and w-12 matches the activity bar's width below it — which
    // is what puts the eye on the same vertical line as the rail's icons
    // rather than sitting inboard of them.
    <span className="hidden sm:flex items-center justify-center -ml-1 w-12 text-[var(--text-secondary)] font-mono text-xs select-none shrink-0 group">
      {/* The hover chip is this inner box, not the w-12 slot — same p-1
          rounded square the other header buttons get, so it highlights like
          them instead of washing the whole rail-width column. It also owns
          the `relative`: anchoring the tooltip to the w-12 slot instead put
          the slot's own 12px of centring padding into the gap, making it
          noticeably wider than the tooltips at the other end of the
          header. */}
      <span className="relative flex items-center justify-center p-1 rounded transition-colors duration-200 group-hover:text-[var(--text)] group-hover:bg-[var(--bg-tertiary)]">
        <Eye className="w-4 h-4 shrink-0" />
        {/* The same tooltip the header's right-hand buttons use, just
            opening rightwards — absolutely positioned, so its width growing
            on hover floats over the header instead of pushing the arrows
            and search across. */}
        <HeaderTooltip side="right">
          You are visitor no. {count.toLocaleString()}!
        </HeaderTooltip>
      </span>
    </span>
  );
}

export default VisitorCounter;
