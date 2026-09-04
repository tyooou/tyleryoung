// The site's "ty." mark as inline SVG rather than <img src="/favicon.svg">,
// so it renders with currentColor and follows the active theme — an <img>
// can't reach into an external SVG file's hardcoded fill. Shared by the
// Welcome tab label and tyouAI's empty-chat greeting.
function TyGlyph({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      viewBox="0 0 4.1210098 2.9389598"
      className={`${className} shrink-0`}
      aria-hidden="true"
    >
      <g
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.243"
        style={{ fontFamily: "'Andale Mono', monospace", fontSize: "3.175px" }}
      >
        <text x="75.560226" y="96.293221" transform="translate(-75.810791,-94.114487)">
          ty
        </text>
        <text x="78.673943" y="96.408546" transform="translate(-75.810791,-94.114487)">
          .
        </text>
      </g>
    </svg>
  );
}

export default TyGlyph;
