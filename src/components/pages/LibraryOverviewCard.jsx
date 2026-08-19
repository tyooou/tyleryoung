import { useMemo } from "react";
import StatTile from "../StatTile";
import { aggregateLibraryByMonth } from "../../lib/library";

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function LibraryOverviewCard({ books = [], blogPosts = [], updatePage = () => {} }) {
  const completedBooks = books.filter((b) => b.dateCompleted);
  const monthly = useMemo(() => aggregateLibraryByMonth(books, blogPosts), [books, blogPosts]);
  const maxCount = monthly.length
    ? Math.max(...monthly.map((m) => Math.max(m.books, m.posts)))
    : 0;

  const recentBooks = [...completedBooks]
    .sort((a, b) => new Date(b.dateCompleted) - new Date(a.dateCompleted))
    .slice(0, 5);
  const recentPosts = [...blogPosts]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default overflow-y-auto">
      <h2 className="font-bold text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
        Library.
      </h2>
      <p className="text-base md:text-xl mt-3 ml-2">
        What I've been reading and writing, and how often.
      </p>

      <div className="ml-2 mt-6">
        <ul className="flex flex-wrap gap-8 mb-10">
          <StatTile label="Books Read" value={completedBooks.length} />
          <StatTile label="Posts Written" value={blogPosts.length} />
        </ul>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
            <p className="font-bold text-lg mb-3">Activity by Month</p>
            {monthly.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No activity yet.</p>
            ) : (
              <>
                <div className="flex items-end gap-3 h-56 overflow-x-auto pb-1 mb-4">
                  {monthly.map((m) => (
                    <div
                      key={`${m.year}-${m.month}`}
                      className="group relative flex flex-col items-center gap-1 shrink-0 h-full"
                    >
                      <div className="flex items-end gap-1 flex-1">
                        <div className="w-3 flex flex-col justify-end h-full bg-[var(--bg-tertiary)] rounded-t overflow-hidden">
                          <div
                            className="w-full bg-[var(--accent)]"
                            style={{ height: `${maxCount ? (m.books / maxCount) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="w-3 flex flex-col justify-end h-full bg-[var(--bg-tertiary)] rounded-t overflow-hidden">
                          <div
                            className="w-full bg-[var(--accent-secondary)]"
                            style={{ height: `${maxCount ? (m.posts / maxCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] whitespace-nowrap shrink-0">
                        {monthLabel(m.year, m.month)}
                      </span>
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded px-1.5 py-0.5 pointer-events-none whitespace-nowrap z-10">
                        {m.books} book{m.books !== 1 ? "s" : ""}, {m.posts} post
                        {m.posts !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent)]" /> Books
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-secondary)]" /> Posts
                  </span>
                </div>
              </>
            )}
          </div>

          <div>
            <p className="font-bold text-lg mb-3">Recently Read</p>
            <div className="flex flex-col gap-2">
              {recentBooks.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No books finished yet.</p>
              ) : (
                recentBooks.map((book) => (
                  <button
                    key={book.slug}
                    onClick={() => updatePage(book.slug)}
                    className="group flex flex-col gap-1 border border-[var(--border-secondary)] rounded p-3 hover:bg-[var(--bg-secondary)] text-left cursor-pointer"
                  >
                    <p className="text-sm break-words underline decoration-transparent group-hover:decoration-current transition-colors italic">
                      {book.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {book.author} — {formatDate(book.dateCompleted)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="font-bold text-lg mb-3">Recently Written</p>
            <div className="flex flex-col gap-2">
              {recentPosts.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No posts published yet.</p>
              ) : (
                recentPosts.map((post) => (
                  <button
                    key={post.slug}
                    onClick={() => updatePage(post.slug)}
                    className="group flex flex-col gap-1 border border-[var(--border-secondary)] rounded p-3 hover:bg-[var(--bg-secondary)] text-left cursor-pointer"
                  >
                    <p className="text-sm break-words underline decoration-transparent group-hover:decoration-current transition-colors">
                      {post.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">{formatDate(post.date)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LibraryOverviewCard;
