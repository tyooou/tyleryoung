// An invisible draggable divider — no layout space of its own, callers
// absolutely position it straddling the seam it resizes so it overlaps the
// panels on either side rather than pushing them apart. Reports the raw
// pixel offset from where the drag started on every mousemove — callers
// combine that with whatever value they captured in onDragStart (e.g.
// `startWidth + deltaX`) rather than accumulating against their live state,
// which would runaway. `direction="vertical"` reports vertical (clientY)
// offsets instead, for a divider that drags a height rather than a width.
function ResizeHandle({
  onDragStart,
  onDrag,
  onDragEnd,
  direction = "horizontal",
  className = "",
  style,
}) {
  const vertical = direction === "vertical";

  const handleMouseDown = (e) => {
    e.preventDefault();
    const start = vertical ? e.clientY : e.clientX;
    onDragStart?.();

    const handleMouseMove = (moveEvent) => {
      onDrag((vertical ? moveEvent.clientY : moveEvent.clientX) - start);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      onDragEnd?.();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = vertical ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`${vertical ? "cursor-row-resize" : "cursor-col-resize"} ${className}`}
      style={style}
    />
  );
}

export default ResizeHandle;
