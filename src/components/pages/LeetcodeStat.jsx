function LeetcodeStat({ label, stat }) {
  return (
    <li>
      <span className="font-bold">{label}:</span> {stat}
    </li>
  );
}

export default LeetcodeStat;
