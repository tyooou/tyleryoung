import { useEffect, useState } from "react";

// The site's loading mark: a cycling scribble, the same one tyouAI shows
// while it's working. Shared so every wait on the site — page loads, the
// changelog, a problem write-up — reads as the same thing happening,
// rather than each spot inventing its own spinner.
const FRAMES = ["·", "✢", "✳", "∗", "✻", "✽"];

function Scribble({ className = "" }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 120);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={`text-[var(--accent)] shrink-0 ${className}`}
      aria-hidden="true"
    >
      {FRAMES[frame]}
    </span>
  );
}

export default Scribble;
