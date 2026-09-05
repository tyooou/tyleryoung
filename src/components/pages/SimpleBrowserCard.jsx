import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ExternalLink as ExternalLinkIcon,
} from "lucide-react";
import ZoomedIframe from "../ZoomedIframe";
import { useExternalLinkConfirm } from "../../lib/useExternalLinkConfirm";

function normalizeUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function SimpleBrowserCard({ url, title }) {
  const { handleClick: handleExternalClick, modal: externalLinkModal } =
    useExternalLinkConfirm();
  const [history, setHistory] = useState([url]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [inputValue, setInputValue] = useState(url);
  const [reloadCount, setReloadCount] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const blockedTimerRef = useRef(null);

  const currentUrl = history[historyIndex];

  // A different friend was opened (new `url` prop) -> start a fresh history.
  useEffect(() => {
    setHistory([url]);
    setHistoryIndex(0);
    setInputValue(url);
  }, [url]);

  // Some sites (GitHub, LinkedIn, ...) send X-Frame-Options/CSP headers that
  // silently refuse to render in an iframe — no load or error event fires
  // cross-origin, so the only signal is "still blank after a while." The
  // timer must be cancelled on a real load, or it fires anyway later and
  // covers perfectly-working content with the blocked overlay.
  useEffect(() => {
    setBlocked(false);
    blockedTimerRef.current = setTimeout(() => setBlocked(true), 4000);
    return () => clearTimeout(blockedTimerRef.current);
  }, [currentUrl, reloadCount]);

  if (!url) return null;

  const navigateTo = (target) => {
    const next = normalizeUrl(target);
    if (!next) return;
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), next]);
    setHistoryIndex((prev) => prev + 1);
    setInputValue(next);
  };

  const goBack = () => {
    if (historyIndex === 0) return;
    setHistoryIndex((prev) => prev - 1);
    setInputValue(history[historyIndex - 1]);
  };

  const goForward = () => {
    if (historyIndex >= history.length - 1) return;
    setHistoryIndex((prev) => prev + 1);
    setInputValue(history[historyIndex + 1]);
  };

  const reload = () => setReloadCount((prev) => prev + 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigateTo(inputValue);
  };

  return (
    <div className="w-full h-full flex flex-col select-none">
      {externalLinkModal}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1 px-1 py-1 border-b border-[var(--border-secondary)] bg-[var(--bg)] shrink-0"
      >
        <button
          type="button"
          onClick={goBack}
          disabled={historyIndex === 0}
          className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
          title="Back"
        >
          <ArrowLeft size={13} />
        </button>
        <button
          type="button"
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
          title="Forward"
        >
          <ArrowRight size={13} />
        </button>
        <button
          type="button"
          onClick={reload}
          className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
          title="Reload"
        >
          <RotateCw size={13} />
        </button>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 text-xs font-mono px-2 py-1 rounded bg-[var(--bg)] border border-[var(--border-secondary)] text-[var(--text)] outline-none focus:border-[var(--text-secondary)]"
        />
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleExternalClick(currentUrl)}
          className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer shrink-0"
          title="Open in new tab"
        >
          <ExternalLinkIcon size={13} />
        </a>
      </form>
      <div className="relative flex-1 min-h-0">
        <ZoomedIframe
          key={`${currentUrl}-${reloadCount}`}
          src={currentUrl}
          title={title || currentUrl}
          className="w-full h-full bg-white overflow-hidden"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          onLoad={() => {
            clearTimeout(blockedTimerRef.current);
            setBlocked(false);
          }}
        />
        {blocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--bg)] text-center px-6">
            <p className="text-sm text-[var(--text-secondary)] font-mono">
              This site can't be displayed in an embedded browser.
            </p>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleExternalClick(currentUrl)}
              className="text-sm font-mono underline text-[var(--text)] hover:text-[var(--text-secondary)]"
            >
              Open in a new tab ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimpleBrowserCard;
