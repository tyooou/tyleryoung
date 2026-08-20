import { useEffect, useState } from "react";

// Hints the browser to fetch these at high priority as soon as they're
// known, rather than waiting for the parser to reach each <img> tag —
// all 9 tiles are visible immediately, so none of them should be treated
// as a low-priority, below-the-fold fetch.
function usePreloadImages(urls) {
  // `urls` is a fresh array every render — key on its contents instead of
  // its identity so this only re-runs when the actual photos change.
  const key = urls.join("|");
  useEffect(() => {
    const links = urls.map((url) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = url;
      document.head.appendChild(link);
      return link;
    });
    return () => {
      links.forEach((link) => link.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

// Matches ProjectImage's fade-in: a themed placeholder box shows until the
// image finishes loading, then it fades in in place instead of popping in.
function GridPhoto({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full bg-[var(--bg-tertiary)] rounded border border-[var(--border-secondary)] overflow-hidden">
      <img
        src={src}
        alt={alt}
        decoding="async"
        fetchPriority="high"
        onLoad={() => setLoaded(true)}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
          loaded ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />
    </div>
  );
}

// A fixed 3x3 grid — grid-rows-3 divides the parent's height into three
// equal rows regardless of how many photos are actually supplied, so the
// grid's overall footprint stays identical across every experience page.
function ExperiencePhotoGrid({ photos, alt }) {
  const shown = photos.slice(0, 9);
  usePreloadImages(shown.map((photo) => photo.url));

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-3 h-full">
      {shown.map((photo, i) => (
        <GridPhoto key={photo.url || i} src={photo.url} alt={photo.alt || alt} />
      ))}
    </div>
  );
}

export default ExperiencePhotoGrid;
