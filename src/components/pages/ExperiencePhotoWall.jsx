import { useMemo } from "react";

const COLUMN_COUNT = 2;
const SECONDS_PER_TILE = 4; // how long one photo takes to fully scroll past

function distributeColumns(photos, count) {
  const columns = Array.from({ length: count }, () => []);
  photos.forEach((photo, i) => columns[i % count].push(photo));
  return columns;
}

function PhotoColumn({ photos, direction, alt }) {
  if (photos.length === 0) return null;

  // Doubling the list and animating a translateY of exactly -50% shifts the
  // view by one full copy's height — so the loop point lines up perfectly
  // with where it started, with no visible seam.
  const looped = [...photos, ...photos];
  const duration = photos.length * SECONDS_PER_TILE;

  return (
    <div className="h-full overflow-hidden">
      <div
        className={`flex flex-col gap-3 ${
          direction === "down" ? "animate-photowall-down" : "animate-photowall-up"
        }`}
        style={{ animationDuration: `${duration}s` }}
      >
        {looped.map((photo, i) => (
          <img
            key={i}
            src={photo.url}
            alt={photo.alt || alt}
            decoding="async"
            className="w-full shrink-0 rounded border border-[var(--border-secondary)]"
          />
        ))}
      </div>
    </div>
  );
}

function ExperiencePhotoWall({ photos, alt }) {
  const columns = useMemo(() => distributeColumns(photos, COLUMN_COUNT), [photos]);

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {columns.map((col, i) => (
        <PhotoColumn key={i} photos={col} direction={i % 2 === 0 ? "down" : "up"} alt={alt} />
      ))}
    </div>
  );
}

export default ExperiencePhotoWall;
