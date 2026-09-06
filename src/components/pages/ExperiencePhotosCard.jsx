import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CustomScrollbar from "../CustomScrollbar";

// A single-photo viewer for an experience's gallery, opened as its own tab
// (see ExperienceEntryCard's "View photos" link) rather than rendered as a
// grid inline on the experience page — keeps that page compact and lets the
// gallery stay open in a split pane while browsing other content.
function ExperiencePhotosCard({ experience, isActive }) {
  const [index, setIndex] = useState(0);
  const photos = experience?.photos || [];
  const stripRef = useRef(null);

  // A different experience's photo tab reusing this component (unlikely,
  // since each experience gets its own tab id, but cheap to guard) should
  // still start from the first photo.
  useEffect(() => {
    setIndex(0);
  }, [experience?.slug]);

  // Only the pane that's actually focused should react to arrow keys —
  // without `isActive`, a photos tab sitting unfocused in a background
  // pane would still hijack arrow-key presses meant for whatever the
  // visitor is really looking at.
  useEffect(() => {
    if (!isActive || photos.length < 2) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        setIndex((i) => (i - 1 + photos.length) % photos.length);
      } else if (e.key === "ArrowRight") {
        setIndex((i) => (i + 1) % photos.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, photos.length]);

  // Keeps the active thumbnail centered in the strip as it cycles, rather
  // than just scrolled into view at whichever edge it entered from.
  useEffect(() => {
    const container = stripRef.current;
    const activeEl = container?.querySelector("[data-active-thumb]");
    if (!container || !activeEl) return;
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const offset =
      activeRect.left +
      activeRect.width / 2 -
      (containerRect.left + containerRect.width / 2);
    container.scrollBy({ left: offset, behavior: "smooth" });
  }, [index]);

  if (!experience || photos.length === 0) return null;

  const current = photos[index];
  const goPrev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const goNext = () => setIndex((i) => (i + 1) % photos.length);

  return (
    <div className="flex flex-col w-full h-full font-mono select-none cursor-default p-4 sm:p-6">
      <div className="flex items-center mb-3 shrink-0">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-secondary)] truncate">
          {experience.company} — Photos
        </h2>
      </div>
      <div className="relative flex-1 min-h-0 flex items-center justify-center bg-[var(--bg-tertiary)] rounded border border-[var(--border-secondary)] overflow-hidden">
        <img
          key={current.url}
          src={current.url}
          alt={current.alt || experience.role}
          className="max-w-full max-h-full object-contain"
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous photo"
              className="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[var(--bg)]/70 hover:bg-[var(--bg)] text-[var(--text)] transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next photo"
              className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[var(--bg)]/70 hover:bg-[var(--bg)] text-[var(--text)] transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <CustomScrollbar
          ref={stripRef}
          direction="horizontal"
          wrapperClassName="mt-3 shrink-0"
          className="flex gap-2 pb-1"
        >
          {photos.map((photo, i) => (
            <button
              type="button"
              key={photo.url || i}
              data-active-thumb={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={`shrink-0 w-16 h-16 rounded overflow-hidden border cursor-pointer transition-opacity ${
                i === index
                  ? "border-[var(--accent)]"
                  : "border-[var(--border-secondary)] opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={photo.url}
                alt={photo.alt || experience.role}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </CustomScrollbar>
      )}
    </div>
  );
}

export default ExperiencePhotosCard;
