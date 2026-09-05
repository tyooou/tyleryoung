function VerticalNumbering({ start = 1, count = 100, gutterRef }) {
  const numbers = Array.from({ length: count }, (_, i) => start + i);

  return (
    <div
      ref={gutterRef}
      className="h-full overflow-hidden text-xs p-2 pt-8 bg-[var(--bg)] text-[var(--border-secondary)] select-none"
    >
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
