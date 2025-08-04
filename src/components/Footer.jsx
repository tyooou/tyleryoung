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
      <footer className="fixed cursor-default select-none bottom-0 left-0 w-full text-sm sm:text-xs font-mono py-3 px-4 sm:py-2 border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center z-40">
        <span className="flex-1 text-left">
          <span className="hidden sm:inline">
            © {new Date().getFullYear()} Tyler Young
          </span>
          <span className="sm:hidden">© {new Date().getFullYear()}</span>
        </span>
        <span className="flex-1 text-center">{getThemeDisplayName(theme)}</span>
        <span className="flex-1 text-right">v1.1.0</span>
      </footer>
    </>
  );
}

export default Footer;
