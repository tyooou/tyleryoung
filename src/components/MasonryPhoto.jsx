import { useState } from "react";

// Deliberately no fixed aspect ratio (unlike ProjectImage) — a masonry
// layout's whole look depends on tiles keeping their natural, varied
// heights within a fixed-width column.
function MasonryPhoto({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`w-full mb-3 rounded border border-[var(--border-secondary)] break-inside-avoid transition-opacity duration-700 ease-in-out ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

export default MasonryPhoto;
