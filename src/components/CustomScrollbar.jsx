import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// Native scrollbars can't be styled reliably across browsers (Safari's
// scrollbar-color support is buggy, and WebKit has never supported
// ::-webkit-scrollbar-thumb colors at all) — so every real scrollbar on the
// site is hidden globally (see index.css) and this renders a thin floating
// mock thumb that tracks scroll position instead, the same trick the tab
// bar (Navigation.jsx) already used for its own horizontal scroll.
// Forwards its ref to the underlying scrollable element, so callers that
// need to read/set scroll position (e.g. auto-scrolling a transcript to
// the bottom) work exactly as if they held the native element directly.
// `wrapperClassName` carries the classes that determine how this component
// is sized/positioned by ITS parent (flex-1, min-h-0, w-full, h-full) —
// defaults to filling the parent. `className` behaves like the old plain
// overflow-auto div did: padding/typography/etc. applied to the actual
// scrolling element. `direction` picks which axis scrolls and which edge
// the mock thumb rides. `overflowClassName` overrides the default
// overflow-{x,y}-auto entirely, for callers that only want scrolling past
// a breakpoint (e.g. "overflow-visible sm:overflow-y-auto").
const CustomScrollbar = forwardRef(function CustomScrollbar(
  {
    className = "",
    wrapperClassName = "h-full w-full",
    wrapperStyle,
    direction = "vertical",
    overflowClassName,
    onScroll,
    children,
    ...rest
  },
  forwardedRef,
) {
  const scrollRef = useRef(null);
  useImperativeHandle(forwardedRef, () => scrollRef.current, []);
  const [thumb, setThumb] = useState({
    visible: false,
    startPercent: 0,
    sizePercent: 1,
  });
  const horizontal = direction === "horizontal";

  const update = () => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollPos = horizontal ? el.scrollLeft : el.scrollTop;
    const scrollSize = horizontal ? el.scrollWidth : el.scrollHeight;
    const clientSize = horizontal ? el.clientWidth : el.clientHeight;
    const scrollable = scrollSize > clientSize + 1;
    const sizePercent = scrollable ? clientSize / scrollSize : 1;
    const startPercent = scrollable
      ? (scrollPos / (scrollSize - clientSize)) * (1 - sizePercent)
      : 0;
    setThumb({ visible: scrollable, startPercent, sizePercent });
  };

  // A ResizeObserver, not a window resize listener: most of what changes a
  // card's scroll size (theme font-size, panel open/close, split view
  // ratio) never resizes the window at all.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, horizontal]);

  return (
    <div className={`relative min-h-0 group/scrollbar ${wrapperClassName}`} style={wrapperStyle}>
      <div
        ref={scrollRef}
        onScroll={(e) => {
          update();
          onScroll?.(e);
        }}
        className={`h-full w-full ${overflowClassName ?? (horizontal ? "overflow-x-auto" : "overflow-y-auto")} ${className}`}
        {...rest}
      >
        {children}
      </div>
      <div
        className={`absolute z-20 pointer-events-none opacity-0 group-hover/scrollbar:opacity-100 transition-opacity duration-200 ${
          horizontal ? "left-0 right-0 bottom-0 h-[5px]" : "top-0 bottom-0 right-0 w-[5px]"
        }`}
      >
        {thumb.visible && (
          <div
            className={`absolute rounded-full bg-[var(--border-secondary)] ${
              horizontal ? "bottom-0 h-[3px]" : "right-0 w-[3px]"
            }`}
            style={
              horizontal
                ? { left: `${thumb.startPercent * 100}%`, width: `${thumb.sizePercent * 100}%` }
                : { top: `${thumb.startPercent * 100}%`, height: `${thumb.sizePercent * 100}%` }
            }
          />
        )}
      </div>
    </div>
  );
});

export default CustomScrollbar;
