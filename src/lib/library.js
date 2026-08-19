// Merges books-read and posts-written into one filled monthly timeline
// (gaps included as zero counts) so a bar chart can show both side by side
// on a shared x-axis — same fill-gaps approach as
// githubStats.js#aggregateStatsByMonth.
export function aggregateLibraryByMonth(books, posts) {
  const countByMonth = (items, dateField) => {
    const map = new Map();
    for (const item of items) {
      const raw = item[dateField];
      if (!raw) continue;
      const date = new Date(raw);
      if (isNaN(date)) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  };

  const bookMap = countByMonth(books, "dateCompleted");
  const postMap = countByMonth(posts, "date");

  const allKeys = [...new Set([...bookMap.keys(), ...postMap.keys()])]
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month };
    })
    .sort((a, b) => a.year - b.year || a.month - b.month);

  if (allKeys.length === 0) return [];

  const filled = [];
  const cursor = new Date(allKeys[0].year, allKeys[0].month, 1);
  const end = new Date(allKeys[allKeys.length - 1].year, allKeys[allKeys.length - 1].month, 1);
  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const key = `${year}-${month}`;
    filled.push({ year, month, books: bookMap.get(key) || 0, posts: postMap.get(key) || 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return filled;
}
