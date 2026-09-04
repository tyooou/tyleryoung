import { useTheme } from "../lib/theme";
import { useEffect, useState } from "react";
import { sanityClient } from "../lib/sanityClient";
import TyGlyph from "./TyGlyph";

function Footer() {
  const { theme } = useTheme();
  const [version, setVersion] = useState("");

  // Convert theme class name to display name
  const getThemeDisplayName = (themeClass) => {
    return themeClass
      .replace("theme-", "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  useEffect(() => {
    sanityClient
      .fetch(`*[_type == "release"] | order(order asc)[0]{ version }`)
      .then((latest) => {
        if (latest?.version) setVersion(latest.version);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <footer className="fixed cursor-default select-none bottom-0 left-0 w-full border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center z-40">
        <div className="px-3 flex items-center border-r border-[var(--border-secondary)] bg-[var(--accent)] text-[var(--bg)] self-stretch">
          <TyGlyph className="w-6 h-4" />
        </div>
        <div className="text-sm sm:text-xs font-mono py-2 px-4 flex items-center w-full">
          <div className="flex-1 text-left">
            <p className="hidden sm:inline">
              © {new Date().getFullYear()} Tyler Young
            </p>
            <p className="sm:hidden">© {new Date().getFullYear()}</p>
          </div>
          <p className="flex-1 text-center">{getThemeDisplayName(theme)}</p>
          <p className="flex-1 text-right">{version}</p>
          </div>
      </footer>
    </>
  );
}

export default Footer;
