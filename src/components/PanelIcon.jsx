// The header's panel toggles, VS Code style: one panel glyph whose side
// strip is filled in while that panel is open, rather than the icon
// changing shape. lucide only ships the plain outline and chevron variants
// (PanelLeftOpen/Close, PanelBottomOpen/Close), so the geometry is drawn
// here — lucide's own 24x24 panel rect and divider, plus a strip path that
// follows the rect's rounded corners. Same viewBox, stroke width and 24x24
// attributes as a lucide icon so it sizes identically next to the others in
// the header.
function PanelIcon({ side = "left", filled = false, className = "" }) {
  const divider = side === "left" ? "M9 3v18" : side === "right" ? "M15 3v18" : "M3 15h18";
  const strip =
    side === "left"
      ? "M5 3h4v18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      : side === "right"
        ? "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4V3z"
        : "M3 15h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d={divider} />
      {filled && <path d={strip} fill="currentColor" stroke="none" />}
    </svg>
  );
}

export default PanelIcon;
