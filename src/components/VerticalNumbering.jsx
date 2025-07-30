function VerticalNumbering({ start = 1, end = 100 }) {
  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="overflow-hidden text-xs p-2 bg-[var(--bg)] text-[var(--text)] select-none">
      <ul className="flex flex-col space-y-1 text-right">
        {numbers.map((n) => (
          <li key={n} className="font-mono">
            {n}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VerticalNumbering;
