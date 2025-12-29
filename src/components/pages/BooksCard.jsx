import { useEffect, useState } from "react";

function calculateDateDifference(startDate, endDate) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;
  if (weeks > 0) {
    return `${weeks} week${weeks !== 1 ? 's' : ''}${days > 0 ? ` ${days} day${days !== 1 ? 's' : ''}` : ''}`;
  } else {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
}

function formatDateDMY(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function Books({ title, author, dateStarted, dateCompleted, notes }) {
  return (
    <>
      <div className="grid grid-cols-[6fr_6fr_3fr_3fr_4fr_3fr] gap-2 mb-1 text-sm">
        <p className="italic truncate">{title}</p>
        <p className="truncate">{author}</p>
        <p className="truncate">{formatDateDMY(dateStarted)}</p>
        <p className="truncate">{formatDateDMY(dateCompleted)}</p>
        <p className="truncate">{calculateDateDifference(dateStarted, dateCompleted)}</p>
        <a className="truncate hover:text-[var(--text-secondary)] hover:underline" href={notes}>notes [↗]</a>
      </div>
    </>
  );
}

function BooksCard() {
  const [bookList, setBookList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);

  useEffect(() => {
    async function loadAllBooks() {
      try {
        const response = await fetch(
          import.meta.env.BASE_URL + "/books.json"
        );
        if (!response.ok) {
          console.error("Failed to load books.json.");
          return;
        }
        const books = await response.json();
        const yearSet = new Set();
        books.forEach((book) => {
          if (book.dateStarted) {
            const year = new Date(book.dateStarted).getFullYear();
            yearSet.add(year);
            book.year = year;
          }
        });
        books.sort((a, b) => {
          const dateA = new Date(a.dateStarted);
          const dateB = new Date(b.dateStarted);
          return dateB - dateA;
        });
        const yearsArr = Array.from(yearSet).sort((a, b) => b - a);
        setYears(yearsArr);
        setBookList(books);
        if (yearsArr.length > 0) {
          setCurrentYear(yearsArr[0]);
        }
      } catch (error) {
        console.error("Failed to load books:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAllBooks();
  }, []);
  
  return (
    <>
      <div className="w-full h-full p-3 sm:p-5 font-mono select-none flex flex-col cursor-default">
        <h2 className="font-bold text-8xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
          Books.
        </h2>
        <div className="mt-3 ml-2">
          <p className="text-2xl sm:text-lg md:text-xl mb-2">
            Some of the books I've read and enjoyed recently.
          </p>

          {loading && (
            <div className="border-l-4 border-[var(--border-secondary)] pl-6 mt-4">
              <p className="text-sm sm:text-base">
                Loading books...
              </p>
            </div>
          )}

          {!loading && bookList.length === 0 && (
            <p className="text-sm sm:text-base mt-4">
              No books found. Check back later!
            </p>
          )}

          {!loading && bookList.length > 0 && (
            <>
              {/* Year tabs */}
              <div className="mt-4 mb-4 space-x-2">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setCurrentYear(year)}
                    className={`rounded px-2 py-1 border border-[var(--border)] ${
                      currentYear === year
                        ? "font-bold bg-[var(--bg-quaternary)]"
                        : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto pb-10 sm:pb-4">
                {(() => {
                  const booksByMonth = {};
                  bookList
                    .filter((book) => book.year === currentYear)
                    .forEach((book) => {
                      const date = new Date(book.dateCompleted);
                      const month = date.toLocaleString('default', { month: 'long' });
                      if (!booksByMonth[month]) booksByMonth[month] = [];
                      booksByMonth[month].push(book);
                    });
                  const months = Object.keys(booksByMonth);
                  const monthOrder = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ];
                  months.sort((a, b) => monthOrder.indexOf(b) - monthOrder.indexOf(a));
                  return months.map((month) => (
                    <div key={month} className="mb-4 border-l-4 border-[var(--border-secondary)] pl-6">
                      <h4 className="font-bold text-lg mb-2">{month}</h4>
                      {booksByMonth[month].map((book, idx) => (
                        <Books key={book.title + book.author + idx} {...book} />
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default BooksCard;