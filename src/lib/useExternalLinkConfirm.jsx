import { useState } from "react";
import ExternalLinkWarningModal from "../components/ExternalLinkWarningModal";

const SKIP_WARNING_KEY = "skipExternalLinkWarning";

// Confirms before opening any external website rather than silently
// leaving the page on a single misclick. Shared by the Activity Bar's
// GitHub/LinkedIn/email icons and the Help links on the Start page, so
// both go through the same "don't ask me again" preference.
export function useExternalLinkConfirm() {
  const [pending, setPending] = useState(null);

  const handleClick = (href) => (e) => {
    if (localStorage.getItem(SKIP_WARNING_KEY) === "true") return;
    e.preventDefault();
    setPending(href);
  };

  const modal = pending && (
    <ExternalLinkWarningModal
      url={pending}
      onCancel={() => setPending(null)}
      onConfirm={(dontAskAgain) => {
        if (dontAskAgain) localStorage.setItem(SKIP_WARNING_KEY, "true");
        window.open(pending, "_blank", "noopener,noreferrer");
        setPending(null);
      }}
    />
  );

  return { handleClick, modal };
}
