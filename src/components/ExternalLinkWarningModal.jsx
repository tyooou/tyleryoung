import { useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink as ExternalLinkIcon, Check } from "lucide-react";

// Matches the CSS animation-out duration in index.css — closing has to wait
// this long before actually unmounting/firing the real callback, or the
// modal would just vanish mid-animation instead of playing it.
const CLOSE_ANIMATION_MS = 150;

function ExternalLinkWarningModal({ url, onConfirm, onCancel }) {
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [closing, setClosing] = useState(false);
  const isEmail = url.startsWith("mailto:");

  const closeThen = (after) => {
    if (closing) return;
    setClosing(true);
    setTimeout(after, CLOSE_ANIMATION_MS);
  };
  const handleCancel = () => closeThen(onCancel);
  const handleConfirm = () => closeThen(() => onConfirm(dontAskAgain));

  // Portalled to <body> — several ancestors (e.g. the sidebar) sit on a
  // translate-x transform, which makes them the containing block for any
  // position:fixed descendant instead of the viewport, so a plain fixed
  // overlay here would render pinned to that ancestor's box, not the page.
  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/50 font-mono ${closing ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in"}`}
      onClick={handleCancel}
    >
      <div
        className={`w-full max-w-md mx-4 rounded border border-[var(--border-secondary)] bg-[var(--bg-secondary)] shadow-lg overflow-hidden ${closing ? "animate-modal-out" : "animate-modal-in"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex gap-3">
          <ExternalLinkIcon
            className="shrink-0 mt-0.5 text-[var(--text-secondary)]"
            size={20}
          />
          <div className="min-w-0">
            <p className="font-bold text-[var(--text)]">
              {isEmail
                ? "Do you want to open your email client?"
                : "Do you want to open this external website?"}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)] break-all">
              {isEmail ? url.replace("mailto:", "") : url}
            </p>
          </div>
        </div>
        <div className="px-5 pb-4">
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="sr-only"
            />
            <span
              className={`w-4 h-4 shrink-0 rounded-sm border flex items-center justify-center ${
                dontAskAgain
                  ? "bg-[var(--text)] border-[var(--text)]"
                  : "bg-[var(--bg)] border-[var(--border-secondary)]"
              }`}
            >
              {dontAskAgain && (
                <Check size={12} strokeWidth={3} className="text-[var(--bg)]" />
              )}
            </span>
            Don't ask me again
          </label>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 bg-[var(--bg-tertiary)] border-t border-[var(--border-secondary)]">
          <button
            onClick={handleCancel}
            className="text-sm px-3 py-1.5 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="text-sm px-3 py-1.5 rounded bg-[var(--text)] text-[var(--bg)] hover:opacity-90 cursor-pointer"
            autoFocus
          >
            Open
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ExternalLinkWarningModal;
