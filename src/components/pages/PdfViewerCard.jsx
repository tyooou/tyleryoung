import { Download, ExternalLink as ExternalLinkIcon } from "lucide-react";

// A static document, not a navigable site — no back/forward/URL bar like
// SimpleBrowserCard. The iframe itself renders the file through the
// browser's native PDF viewer (its own zoom/page/print controls included);
// this header just adds a title bar and a reliable download action on top.
function PdfViewerCard({ url, title = "Document" }) {
  if (!url) return null;

  // Sanity file assets serve `inline` by default (good for the embedded
  // viewer) but honor a `dl` query param to force `Content-Disposition:
  // attachment` — that's what actually makes the download button work
  // reliably, since the plain `download` attribute on an <a> is ignored by
  // browsers for cross-origin URLs like this one.
  const downloadUrl = `${url}${url.includes("?") ? "&" : "?"}dl=`;

  return (
    <div className="w-full h-full flex flex-col select-none">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)] shrink-0">
        <span className="text-xs font-mono text-[var(--text-secondary)] truncate">{title}</span>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
            title="Open in new tab"
          >
            <ExternalLinkIcon size={13} />
          </a>
          <a
            href={downloadUrl}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] text-[var(--text)] cursor-pointer"
            title="Download"
          >
            <Download size={13} />
            Download
          </a>
        </div>
      </div>
      <iframe src={url} title={title} className="w-full h-full border-0 bg-white flex-1 min-h-0" />
    </div>
  );
}

export default PdfViewerCard;
