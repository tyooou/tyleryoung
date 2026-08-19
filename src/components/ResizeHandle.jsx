// An invisible draggable divider — no layout space of its own, callers
// absolutely position it straddling the seam it resizes so it overlaps the
// panels on either side rather than pushing them apart. Reports the raw
// horizontal pixel offset from where the drag started on every mousemove —
// callers combine that with whatever value they captured in onDragStart
// (e.g. `startWidth + deltaX`) rather than accumulating against their live
// state, which would runaway.
function ResizeHandle({ onDragStart, onDrag, onDragEnd, className = "", style }) {
  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    onDragStart?.();

    const handleMouseMove = (moveEvent) => {
      onDrag(moveEvent.clientX - startX);
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
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`cursor-col-resize ${className}`}
      style={style}
    />
  );
}

export default ResizeHandle;
