import { useState } from "react";
import { ArrowLeft, ArrowRight, Palette, PanelLeft } from "lucide-react";
import { useTheme } from "./ThemeContext";


function SearchBarOption({text, onClick, caret}) {
  return (
    <>
      <button type="button" onClick={onClick} className="mb-2 text-sm text-[var(--text-secondary)]">
        {text}
      </button>
    </>
  );
}


function SearchBar({ updateSidebar}) {
  const { cycleTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [isCmd, setIsCmd] = useState(false);
  const [isMore, setIsMore] = useState(false);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setIsCmd(value.trim().charAt(0) === ">");
    setIsMore(value.trim().charAt(0) === "?");
  };

  return (
    <>
      <div className="cursor-default select-none top-0 w-full z-40 flex items-center justify-center bg-[var(--bg-secondary)] border-b border-[var(--border-secondary)] py-2 px-1 sm:py-1 font-mono">
        {expanded && (
          <div className="absolute z-100 border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] flex flex-col items-center max-w-lg w-full p-2 top-1 rounded transition-all duration-300 gap-2 h-100">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              className="text-xs w-full outline-none border border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--text)] px-2 py-1 rounded focus:border-[var(--text-secondary)] transition-colors"
              placeholder="Search sections by name ..."
              autoFocus
              onBlur={() => setExpanded(false)}
            />
            <div className="flex flex-col text-left w-full">
              {isCmd &&
                <div className="mb-2 text-[var(--text-secondary)]">
                  Detected command input
                </div>
              }
              {isMore &&
                <div className="mb-2 text-[var(--text-secondary)]">
                  Detected more input
                </div>
              }
              <button className="mb-2 text-sm text-[var(--text-secondary)]">Go to Section</button>
              <button className="mb-2 text-sm text-[var(--text-secondary)]">Search for Text</button>
              <button className="mb-2 text-sm text-[var(--text-secondary)]">Cycle Theme</button>
              <button className="mb-2 text-sm text-[var(--text-secondary)]">More</button>
            </div>
          </div>
        )}
        <div className="flex items-center w-full transition-all duration-300 gap-2">
          <div className="flex flex-1 items-center text-[var(--text)] justify-end">
            <button className="hover:bg-[var(--bg-tertiary)] py-2 px-2 sm:py-[0.5px] sm:px-1 rounded cursor-pointer">
              <ArrowLeft className="w-6 sm:w-4" />
            </button>
            <button className="hover:bg-[var(--bg-tertiary)] py-2 px-2 sm:py-[0.5px] sm:px-1 rounded cursor-pointer">
              <ArrowRight className="w-6 sm:w-4" />
            </button>
          </div>
          <div className="flex flex-1 justify-center">
            <button
              type="button"
              className="text-xs outline-none border border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--text)] px-2 py-1 rounded focus:border-[var(--text-secondary)] transition-colors text-center w-full"
              onClick={() => setExpanded(true)}
            >
              Tyler Young
            </button>
          </div>
          <div className="flex flex-1 items-center justify-end text-[var(--text)] gap-1">
            <button
              className="hover:bg-[var(--bg-tertiary)] py-2 px-2 sm:py-[0.5px] sm:px-1 rounded cursor-pointer"
              onClick={cycleTheme}
            >
              <Palette className="w-6 sm:w-4" />
            </button>
            <button
              className="hover:bg-[var(--bg-tertiary)] py-2 px-2 sm:py-[0.5px] sm:px-1 rounded cursor-pointer"
              onClick={() => updateSidebar((prev) => !prev)}
            >
              <PanelLeft className="w-6 sm:w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default SearchBar;
