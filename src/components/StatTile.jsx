function StatTile({ label, value }) {
  return (
    <li className="flex flex-col">
      <span className="text-4xl sm:text-5xl font-bold">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      <span className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">{label}</span>
    </li>
  );
}

export default StatTile;
