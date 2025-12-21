import { useTheme } from "./ThemeContext";
import { useEffect, useState } from "react";

function Footer() {
  const { theme } = useTheme();
  const [version, setVersion] = useState("");
  const [svgColor, setSvgColor] = useState('#53278d');

  // Convert theme class name to display name
  const getThemeDisplayName = (themeClass) => {
    return themeClass
      .replace("theme-", "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  useEffect(() => {
    fetch("releaseNotes/versions.json")
      .then((res) => res.json())
      .then((data) => {
        if (data.versions && data.versions.length > 0) {
          const last = data.versions[data.versions.length - 1];
          setVersion(last.replace(/-/g, "."));
        }
      });
  }, []);

  useEffect(() => {
    setTimeout(() => {
      const color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#53278d';
      setSvgColor(color.trim() || '#53278d');
    }, 0);
  }, [theme]);

  const svgElement = (
   <svg width="20" height="17" viewBox="0 0 4.1210098 2.9389598" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-75.810791,-94.114487)">
      <text xmlSpace="preserve" style={{fontSize:'3.175px',fontFamily:'Press Start 2P',fill:svgColor,stroke:svgColor,strokeWidth:0.243}} x="75.560226" y="96.293221"> <tspan style={{fontFamily:'Andale Mono',fill:svgColor,stroke:svgColor,strokeWidth:0.243}} x="75.560226" y="96.293221">ty</tspan></text>
      <text xmlSpace="preserve" style={{fontSize:'3.175px',fontFamily:'Press Start 2P',fill:svgColor,stroke:svgColor,strokeWidth:0.243}} x="78.673943" y="96.408546"> <tspan style={{fontFamily:'Andale Mono',fill:svgColor,stroke:svgColor,strokeWidth:0.243}} x="78.673943" y="96.408546">.</tspan></text>
    </g>
  </svg>
  );

  return (
    <>
      <footer className="fixed cursor-default select-none bottom-0 left-0 w-full border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center z-40">
        <div className="py-2 px-3 flex items-center bg-[var(--bg-tertiary)]">
          {svgElement}
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
