import { Palette, PanelLeft } from "lucide-react";
import { useTheme } from "./ThemeContext";

function Navigation({ updatePage, updateSidebar, deleteTab, openTabs, page }) {
  const { cycleTheme } = useTheme();

  return (
    <>
      <nav className="flex justify-between bg-[var(--bg-quaternary)] text-[var(--text)] select-none border-b border-[var(--border-secondary)]">
        {openTabs.map((tab, index) => (
          <div
            key={index}
            className={`flex items-center space-x-2 px-2 py-1.5 border-r border-[var(--border-secondary)]  ${
              tab === page
                ? "bg-[var(--bg)] -mb-px border-b-transparent"
                : "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
            }`}
          >
            <button
              className="font-mono text-xs truncate overflow-hidden whitespace-nowrap max-w-[150px]"
              onClick={() => updatePage(`${tab}`)}
            >
              {`${tab}.txt`}
            </button>
            {tab != "bibliography" && (
              <span
                className={`hover:bg-[var(--bg-secondary)] cursor-pointer text-mono text-xs px-1 rounded-sm ${
                  tab === page
                    ? "hover:bg-[var(--bg-secondary)]"
                    : "hover:bg-[var(--bg-tertiary)]"
                }`}
                onClick={() => deleteTab(`${tab}`)}
              >
                ×
              </span>
            )}
          </div>
        ))}
        <div className="ml-auto flex items-center space-x-1">
          <button
            className="hover:bg-[var(--bg-tertiary)] py-[0.5px] px-1 rounded"
            onClick={cycleTheme}
          >
            <Palette className="w-4" />
          </button>
          <button
            className="hover:bg-[var(--bg-tertiary)] py-[0.5px] px-1 mr-2 rounded"
            onClick={() => updateSidebar((prev) => !prev)}
          >
            <PanelLeft className="w-4" />
          </button>
        </div>
      </nav>
    </>
  );
}

export default Navigation;
