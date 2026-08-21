import { useEffect, useRef, useState } from "react";

// CSS `zoom` on an ancestor (see index.css) shrinks an <iframe>'s own box
// correctly, but in WebKit that scale doesn't propagate cleanly into the
// document rendered *inside* the iframe, so content ends up clipped instead
// of filling the box.
//
// The fix: cancel the inherited zoom on a wrapper around the iframe, so the
// wrapper's *net* effective zoom is 1 (ancestor's zoom × this wrapper's
// inverse zoom cancel out) — at net zoom 1 there's no scale distortion, so
// sizing the wrapper to the outer container's real on-screen pixels via
// plain inline width/height gives the iframe a genuinely correct,
// undistorted box to lay out against.
function ZoomedIframe({ className, style, ...props }) {
  const outerRef = useRef(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    // getBoundingClientRect (not ResizeObserver's own contentRect, which
    // reports the element's local pre-zoom box) — this needs the actual
    // on-screen visual size the ancestor's zoom already shrank it to.
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    return () => observer.disconnect();
  }, []);

  const pageZoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;

  return (
    <div ref={outerRef} className={className} style={style}>
      {size && (
        <div style={{ width: size.width, height: size.height, zoom: 1 / pageZoom }}>
          <iframe {...props} style={{ width: "100%", height: "100%", border: 0 }} />
        </div>
      )}
    </div>
  );
}

export default ZoomedIframe;
