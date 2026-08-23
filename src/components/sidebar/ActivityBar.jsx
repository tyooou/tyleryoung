import { FileUser, Mail, Linkedin, Github } from "lucide-react";
import { getIcon } from "../iconMap";
import { useExternalLinkConfirm } from "../../lib/useExternalLinkConfirm";

function ExternalIcon({ href, label, children, onClick }) {
  return (
    <a
      className="group relative flex items-center justify-center w-full py-2.5 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)]"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
    >
      {children}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none text-md sm:text-xs font-mono py-1 px-2 rounded bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] whitespace-nowrap z-50">
        {label}
      </div>
    </a>
  );
}

// Same look as ExternalIcon, but opens the target as an in-app Simple
// Browser tab (via updatePage) instead of navigating away in a new tab.
function BrowserIcon({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center justify-center w-full py-2.5 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)]"
    >
      {children}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none text-md sm:text-xs font-mono py-1 px-2 rounded bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] whitespace-nowrap z-50">
        {label}
      </div>
    </button>
  );
}

function ActivityIcon({ icon, label, isActive, onClick }) {
  const Icon = icon;
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center justify-center w-full py-3 cursor-pointer border-l-2 ${
        isActive
          ? "border-[var(--text)] text-[var(--text)] bg-[var(--bg-tertiary)]"
          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)]"
      }`}
    >
      <Icon className="w-6 sm:w-5" />
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none text-md sm:text-xs font-mono py-1 px-2 rounded bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] whitespace-nowrap z-50">
        {label}
      </div>
    </button>
  );
}

function ActivityBar({
  pages,
  activeActivity,
  onSelectActivity,
  updatePage,
  updateSidebar,
  quickLinks = [],
}) {
  const github = quickLinks.find((q) => q.id === "github");
  const linkedin = quickLinks.find((q) => q.id === "linkedin");
  const cv = quickLinks.find((q) => q.id === "cv");
  const changelogPage = pages.find((page) => page.id === "changelog");
  const { handleClick, modal } = useExternalLinkConfirm();

  return (
    <div
      data-tour="activity-bar"
      className="flex flex-col items-center w-12 h-full bg-[var(--bg-secondary)] shrink-0 select-none"
    >
      {modal}
      <div className="flex flex-col items-center w-full py-2 border-b border-[var(--border-secondary)]">
        {github && (
          <ExternalIcon
            href={github.link}
            label="github"
            onClick={handleClick(github.link)}
          >
            <Github className="w-6 sm:w-5" />
          </ExternalIcon>
        )}
        {linkedin && (
          <ExternalIcon
            href={linkedin.link}
            label="linkedin"
            onClick={handleClick(linkedin.link)}
          >
            <Linkedin className="w-6 sm:w-5" />
          </ExternalIcon>
        )}
        <ExternalIcon
          href="mailto:young.h.tyler@gmail.com"
          label="email"
          onClick={handleClick("mailto:young.h.tyler@gmail.com")}
        >
          <Mail className="w-6 sm:w-5" />
        </ExternalIcon>
        {cv && (
          <BrowserIcon
            onClick={() => {
              updatePage(cv.name);
              if (window.innerWidth < 768) updateSidebar(false);
            }}
            label="resume"
          >
            <FileUser className="w-6 sm:w-5" />
          </BrowserIcon>
        )}
      </div>

      <div className="flex flex-col items-center w-full pt-2">
        {pages
          .filter((page) => page.id !== "typing" && page.id !== "changelog")
          .map((page) => (
            <ActivityIcon
              key={page.id}
              icon={getIcon(page.icon)}
              label={page.label}
              isActive={activeActivity === page.id}
              onClick={() => onSelectActivity(page.id)}
            />
          ))}
      </div>

      {changelogPage && (
        <div className="flex flex-col items-center w-full mt-auto pt-2 border-t border-[var(--border-secondary)]">
          <ActivityIcon
            icon={getIcon(changelogPage.icon)}
            label={changelogPage.label}
            isActive={activeActivity === "changelog"}
            onClick={() => onSelectActivity("changelog")}
          />
        </div>
      )}
    </div>
  );
}

export default ActivityBar;
