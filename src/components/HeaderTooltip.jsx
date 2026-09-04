// Hover tooltip for the header's icon buttons. One definition shared by
// both ends of the header — the right-hand button group and the visitor
// counter's eye — so they can't drift apart in gap, colour or timing.
//
// Positioned against the nearest positioned ancestor, which for the button
// group is a tight wrapper around all of them (so every tooltip opens to
// the left of the whole group rather than jostling its neighbours), and for
// the eye is its own slot.
//
// `side` is where the tooltip goes relative to that anchor: "left" for
// buttons near the right edge, "right" for the eye at the far left.
// Desktop only — there's no hover to trigger it on touch.
//
// Styling matches ActivityBar's own icon tooltips exactly (bg-tertiary
// fill, text-md/sm:text-xs, plain opacity fade, no scale) — one look for
// every hover tooltip on the site rather than the header inventing its own.
function HeaderTooltip({ children, side = "left" }) {
  const placement = side === "left" ? "right-full mr-2" : "left-full ml-2";

  return (
    <span
      className={`hidden sm:block absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none text-md sm:text-xs font-mono py-1 px-2 rounded bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] whitespace-nowrap z-50 ${placement}`}
    >
      {children}
    </span>
  );
}

export default HeaderTooltip;
