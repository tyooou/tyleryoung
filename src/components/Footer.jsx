import { useTheme } from "./ThemeContext";

function Footer({ toggleSidebar }) {
  const { theme } = useTheme();

  // Convert theme class name to display name
  const getThemeDisplayName = (themeClass) => {
    return themeClass
      .replace("theme-", "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <>
      <footer className="fixed cursor-default select-none bottom-0 left-0 w-full text-xs font-mono py-2 px-4 border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center z-40">
        <span className="flex-1 text-left">
          © {new Date().getFullYear()} Tyler Young
        </span>
        <span className="flex-1 text-center">{getThemeDisplayName(theme)}</span>
        <span className="flex-1 text-right">v1.0.1</span>
      </footer>
    </>
  );
}

export default Footer;
