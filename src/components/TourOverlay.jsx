import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const CALLOUT_WIDTH = 288;
const CALLOUT_GAP = 16;
// Matches the CSS animation-out duration in index.css — closing has to
// wait this long before actually calling the real onClose (which unmounts
// this component from Portfolio.jsx), or the overlay would just vanish
// mid-animation instead of fading out.
const CLOSE_ANIMATION_MS = 150;

// Polls every frame instead of a one-shot delayed re-measure — the sidebar
// and its panel animate open/resize with real CSS transitions, and two
// consecutive steps can target the exact same element (so a selector-keyed
// effect wouldn't even re-run between them), so nothing short of continuous
// tracking keeps the highlight from drifting off a stale pre-transition
// position. Only calls setState when the rect actually changed, so a static
// target doesn't cause a re-render every frame.
function measureTarget(selector) {
  if (!selector) return null;
  const el = document.querySelector(selector);
  const rect = el ? el.getBoundingClientRect() : null;
  // A selector can resolve to an element that exists in the DOM but isn't
  // actually rendered here (e.g. the desktop tab bar is `hidden md:flex` —
  // gone below that breakpoint, not just styled small) — that reports a
  // real zero-size rect, not null, so it has to be treated as "not found"
  // explicitly.
  return rect && rect.width > 0 && rect.height > 0 ? rect : null;
}

function useTargetRect(selector, stepIndex) {
  // Measured synchronously on mount rather than starting null and waiting
  // for the first animation frame. That one null render painted the
  // no-target fallback — a full-screen black wash — for a frame before the
  // spotlight appeared, which is the flash you saw on opening the tour.
  const [rect, setRect] = useState(() => measureTarget(selector));

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    let frameId;
    let last = null;

    const tick = () => {
      const next = measureTarget(selector);
      const changed =
        (!last) !== (!next) ||
        (last &&
          next &&
          (last.top !== next.top ||
            last.left !== next.left ||
            last.width !== next.width ||
            last.height !== next.height));
      if (changed) {
        last = next;
        setRect(next);
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [selector, stepIndex]);

  return rect;
}

// Picks whichever side actually has room for the callout, preferring the
// right (most targets here sit on the left edge of the screen) then
// falling back to below, then left — rather than a fixed position that
// could run off-screen for a wide target like the tab bar.
function calloutPosition(rect) {
  if (!rect) return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (rect.right + CALLOUT_GAP + CALLOUT_WIDTH < vw) {
    return { left: rect.right + CALLOUT_GAP, top: Math.min(rect.top, vh - 200) };
  }
  if (rect.bottom + CALLOUT_GAP + 160 < vh) {
    return {
      left: Math.min(Math.max(rect.left, 16), vw - CALLOUT_WIDTH - 16),
      top: rect.bottom + CALLOUT_GAP,
    };
  }
  return {
    left: Math.max(rect.left - CALLOUT_GAP - CALLOUT_WIDTH, 16),
    top: Math.min(rect.top, vh - 200),
  };
}

// The right half of the pane content area — where a dragged tab would land
// as a new split pane. Not a real drop zone, just an illustrative preview.
function splitPreviewRect(paneContentRect) {
  if (!paneContentRect) return null;
  return {
    top: paneContentRect.top,
    left: paneContentRect.left + paneContentRect.width / 2,
    width: paneContentRect.width / 2,
    height: paneContentRect.height,
  };
}

function TourOverlay({ steps, stepIndex, onNext, onPrev, onClose }) {
  const [closing, setClosing] = useState(false);
  const handleClose = useCallback(() => {
    setClosing((already) => {
      if (!already) setTimeout(onClose, CLOSE_ANIMATION_MS);
      return true;
    });
  }, [onClose]);

  const step = steps[stepIndex];
  const rect = useTargetRect(step.target, stepIndex);
  const paneContentRect = useTargetRect(
    step.showSplitPreview ? '[data-tour="pane-content"]' : null,
    stepIndex,
  );
  const previewRect = step.showSplitPreview ? splitPreviewRect(paneContentRect) : null;

  // A target can be legitimately absent at the current viewport (the tab
  // bar doesn't exist below the md breakpoint at all, not just styled
  // small) rather than just not-yet-mounted — give it a beat to show up
  // from a CSS transition, then treat a still-missing target as "doesn't
  // apply here" and move on, instead of stranding the tour on a dark
  // screen with no visible target and no callout.
  useEffect(() => {
    if (rect) return;
    const timeout = setTimeout(() => {
      if (stepIndex === steps.length - 1) handleClose();
      else onNext();
    }, 400);
    return () => clearTimeout(timeout);
  }, [rect, stepIndex, steps, onNext, handleClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        if (stepIndex === steps.length - 1) handleClose();
        else onNext();
      } else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stepIndex, steps, onNext, onPrev, handleClose]);

  // A dot traveling from the tab's right edge to just inside the preview
  // pane, illustrating the actual drag gesture rather than just showing
  // two disconnected boxes.
  const dragPath =
    rect && previewRect
      ? {
          startTop: rect.top + rect.height / 2 - 10,
          startLeft: rect.right,
          dx: previewRect.left + 40 - rect.right,
          dy: previewRect.top + 40 - (rect.top + rect.height / 2 - 10),
        }
      : null;

  const pos = calloutPosition(rect);
  // getBoundingClientRect() already returns real on-screen pixels (post the
  // site-wide zoom in index.css). This overlay is portalled to <body>, which
  // still inherits that ancestor zoom via the normal CSS cascade (portalling
  // only escapes React's tree, not the DOM's) — so feeding those values
  // straight into inline styles here would get shrunk a second time.
  // Cancelling the inherited zoom on this root makes plain screen-pixel
  // values usable directly, same fix as ZoomedIframe.
  const pageZoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] font-mono ${closing ? "animate-modal-backdrop-out pointer-events-none" : ""}`}
      style={{ zoom: 1 / pageZoom }}
    >
      {rect ? (
        <div
          className="absolute rounded pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: "0 0 0 4000px rgba(0,0,0,0.6), 0 0 0 2px var(--accent)",
          }}
        >
          {step.showDragAnimation && (
            <div
              className="absolute w-5 h-5 rounded-full bg-[var(--accent)] animate-tour-drag"
              style={{ right: -10, top: "50%" }}
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {previewRect && (
        <div
          className="absolute rounded border-2 border-dashed border-[var(--accent)] bg-[var(--accent)]/10 pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: previewRect.top,
            left: previewRect.left,
            width: previewRect.width,
            height: previewRect.height,
          }}
        />
      )}
      {dragPath && (
        <div
          className="absolute w-5 h-5 rounded-full bg-[var(--accent)] pointer-events-none animate-tour-drag-path"
          style={{
            top: dragPath.startTop,
            left: dragPath.startLeft,
            "--drag-dx": `${dragPath.dx}px`,
            "--drag-dy": `${dragPath.dy}px`,
          }}
        />
      )}

      {pos && (
        <div
          className="absolute w-72 rounded border border-[var(--border-secondary)] bg-[var(--bg-secondary)] shadow-lg p-4 transition-all duration-300 ease-out"
          style={{ left: pos.left, top: pos.top }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-[var(--text)]">{step.title}</p>
            <button
              onClick={handleClose}
              className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
              aria-label="Close tour"
            >
              <X size={16} />
            </button>
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{step.body}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              {stepIndex + 1} of {steps.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={onPrev}
                disabled={stepIndex === 0}
                className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--text-secondary)] cursor-pointer disabled:cursor-default"
                aria-label="Previous step"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={stepIndex === steps.length - 1 ? handleClose : onNext}
                className="px-3 py-1.5 text-sm rounded bg-[var(--text)] text-[var(--bg)] hover:opacity-90 cursor-pointer"
              >
                {stepIndex === steps.length - 1 ? "Done" : "Next"}
              </button>
              {stepIndex < steps.length - 1 && (
                <button
                  onClick={onNext}
                  className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
                  aria-label="Next step"
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

export default TourOverlay;
