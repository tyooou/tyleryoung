import { useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";

function ExternalLinkWarningModal({ url, onConfirm, onCancel }) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  // Portalled to <body> — several ancestors (e.g. the sidebar) sit on a
  // translate-x transform, which makes them the containing block for any
  // position:fixed descendant instead of the viewport, so a plain fixed
  // overlay here would render pinned to that ancestor's box, not the page.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 font-mono"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md mx-4 rounded border border-[var(--border-secondary)] bg-[var(--bg-secondary)] shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex gap-3">
          <ExternalLinkIcon
            className="shrink-0 mt-0.5 text-[var(--text-secondary)]"
            size={20}
          />
          <div className="min-w-0">
            <p className="font-bold text-[var(--text)]">
              Do you want to open this external website?
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)] break-all">
              {url}
            </p>
          </div>
        </div>
        <div className="px-5 pb-4">
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="cursor-pointer"
            />
            Don't ask me again
          </label>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 bg-[var(--bg-tertiary)] border-t border-[var(--border-secondary)]">
          <button
            onClick={onCancel}
            className="text-sm px-3 py-1.5 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(dontAskAgain)}
            className="text-sm px-3 py-1.5 rounded bg-[var(--accent)] text-white hover:opacity-90 cursor-pointer"
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
