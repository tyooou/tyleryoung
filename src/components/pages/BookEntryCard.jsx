import { Star, FileText } from "lucide-react";
import CustomScrollbar from "../CustomScrollbar";

function formatMonthYear(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);
  return `${month} '${year}`;
}

function readingDuration(startDate, endDate) {
  if (!startDate) return "";
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;
  if (weeks > 0) {
    return `${weeks} week${weeks !== 1 ? "s" : ""}${days > 0 ? ` ${days} day${days !== 1 ? "s" : ""}` : ""}`;
  }
  return `${days} day${days !== 1 ? "s" : ""}`;
}

function StarRating({ rating }) {
  if (rating == null) return null;
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          className={i <= rounded ? "fill-current text-[var(--accent)]" : "text-[var(--border-secondary)]"}
        />
      ))}
      <span className="text-sm text-[var(--text-secondary)] ml-1">{rating}/5</span>
    </div>
  );
}

function BookEntryCard({ book, onOpenPdf }) {
  if (!book) return null;
  const {
    title,
    author,
    isbn,
    dateStarted,
    dateCompleted,
    rating,
    themes,
    keyPoints,
    favoriteQuote,
    pdfUrl,
    slug,
  } = book;

  return (
    <div className="flex flex-col sm:flex-row w-full h-full font-mono select-none cursor-default sm:overflow-hidden">
      <CustomScrollbar
        wrapperClassName="flex-1 h-full w-full min-w-0"
        overflowClassName="overflow-visible sm:overflow-y-auto"
        className="p-3 sm:p-5 select-text cursor-text"
      >
        <h2 className="font-bold text-4xl sm:text-3xl md:text-4xl lg:text-5xl italic">{title}</h2>
        <p className="text-xl sm:text-2xl mt-2 ml-2 font-bold text-[var(--text-secondary)]">
          {author}
        </p>
        {rating != null && (
          <div className="ml-2 mt-3">
            <StarRating rating={rating} />
          </div>
        )}
        <div className="ml-2 mt-4 max-w-2xl">
          <p className="text-base text-[var(--text-secondary)]">
            {dateStarted ? formatMonthYear(dateStarted) : "?"} to{" "}
            {dateCompleted ? formatMonthYear(dateCompleted) : "in progress"}
            {dateStarted && ` — ${readingDuration(dateStarted, dateCompleted)}`}
          </p>
          {isbn && <p className="text-sm text-[var(--text-secondary)] mt-1">ISBN {isbn}</p>}

          {themes?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {themes.map((theme) => (
                <span
                  key={theme}
                  className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                >
                  {theme}
                </span>
              ))}
            </div>
          )}

          {keyPoints ? (
            <p className="text-base whitespace-pre-line leading-relaxed mt-4">{keyPoints}</p>
          ) : (
            <p className="text-base text-[var(--text-secondary)] mt-4">(fill in)</p>
          )}

          {favoriteQuote && (
            <blockquote className="border-l-2 border-[var(--border-secondary)] bg-[var(--bg-secondary)] rounded-r px-4 py-3 mt-6 text-sm italic whitespace-pre-line">
              “{favoriteQuote}”
            </blockquote>
          )}

          {pdfUrl && (
            <p className="mt-6">
              <button
                type="button"
                onClick={() => onOpenPdf(`${slug}-pdf`)}
                className="cursor-pointer text-left group inline-flex items-center gap-2 hover:bg-[var(--bg-secondary)] p-2"
              >
                <FileText size={16} className="text-[var(--text-secondary)]" />
                <span className="font-bold">View book</span>
              </button>
            </p>
          )}
        </div>
      </CustomScrollbar>
    </div>
  );
}

export default BookEntryCard;
