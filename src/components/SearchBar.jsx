import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, Palette, PanelLeft } from "lucide-react";
import { useTheme, THEMES } from "./ThemeContext";

function SearchBar({ updateSidebar, updatePage, goBack, goForward, projects }) {
  const { cycleTheme, setTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [isCmd, setIsCmd] = useState(false);
  const [menuContext, setMenuContext] = useState("main");
  const [selectedOption, setSelectedOption] = useState(0);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const themes = THEMES.map((t) => ({
    name: t.replace("theme-", "").replace(/\b\w/g, (c) => c.toUpperCase()),
    value: t,
  }));

  const contentLinks = [
    "bibliography",
    "experience",
    "books",
    // "leetcode",
    "friends",
    "contact",
    "changelog",
  ];

  const mainOptions = [
    {
      label: "Go to Contents",
      action: () => {
        setMenuContext("page");
        setSelectedOption(0);
      },
    },
    {
      label: "Go to Projects",
      action: () => {
        setMenuContext("projects");
        setSelectedOption(0);
      },
    },
    {
      label: "Show and Run Commands >",
      action: () => {
        setMenuContext("commands");
        setSelectedOption(0);
        setInput(">");
      },
    },
    {
      label: "Toggle Sidebar",
      action: () => {
        updateSidebar((prev) => !prev);
      },
    },
    {
      label: "Cycle Theme",
      action: () => {
        cycleTheme();
      },
    },
    {
      label: "Set Theme",
      action: () => {
        setMenuContext("theme");
        setSelectedOption(0);
      },
    },
  ];

  const pageLinks = [...contentLinks.map((c) => ({ label: c, value: c }))];

  const projectLinks = [
    ...projects.map((p) => ({ label: p.title, value: p.name })),
  ];

  const themeOptions = themes.map((t) => ({
    label: t.name,
    action: () => {
      setTheme(t.value);
      setExpanded(false);
      if (window.innerWidth < 768) updateSidebar(false);
    },
  }));

  const pageOptions = pageLinks.map((s) => ({
    label: s.label,
    action: () => {
      updatePage(s.value);
      setExpanded(false);
      if (window.innerWidth < 768) updateSidebar(false);
    },
  }));

  const projectOptions = projectLinks.map((p) => ({
    label: p.label,
    action: () => {
      updatePage(p.value);
      setExpanded(false);
      if (window.innerWidth < 768) updateSidebar(false);
    },
  }));

  const commandOptions = [
    {
      label: "Document: Open CV",
      action: () => {
        window.open(
          "https://drive.google.com/file/d/14Aru2JXekxazMWw34HCe7SZbIk4kuTkP/view?usp=sharing",
          "_blank",
        );
        setExpanded(false);
      },
    },
    {
      label: "Document: Download CV",
      action: () => {
        const link = document.createElement("a");
        link.href =
          "https://drive.google.com/uc?export=download&id=14Aru2JXekxazMWw34HCe7SZbIk4kuTkP";
        link.download = "TYLER-YOUNG-CV.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExpanded(false);
      },
    },
    {
      label: "Contact: Send an E-mail",
      action: () => {
        window.open("mailto:young.h.tyler@gmail.com", "_blank");
        setExpanded(false);
      },
    },
    {
      label: "Contact: Copy E-mail to Clipboard",
      action: () => {
        navigator.clipboard.writeText("young.h.tyler@gmail.com");
        setExpanded(false);
      },
    },
    {
      label: "Contact: Open LinkedIn",
      action: () => {
        window.open("https://nz.linkedin.com/in/tylerhyoung", "_blank");
        setExpanded(false);
      },
    },
    {
      label: "Contact: Open GitHub",
      action: () => {
        window.open("https://github.com/tyooou", "_blank");
        setExpanded(false);
      },
    },
  ];

  const getCurrentOptions = () => {
    switch (menuContext) {
      case "page":
        return pageOptions;
      case "projects":
        return projectOptions;
      case "theme":
        return themeOptions;
      case "commands":
        return commandOptions;
      case "main":
      default:
        return mainOptions;
    }
  };

  const getFilteredOptions = () => {
    if (menuContext === "commands" && input.trim().startsWith(">")) {
      const lower = input.trim().slice(1).toLowerCase();
      return commandOptions.filter((opt) =>
        opt.label.toLowerCase().includes(lower),
      );
    }
    if (menuContext === "main" && input.trim() !== "") {
      const lower = input.trim().toLowerCase();
      const allOptions = [...pageOptions, ...projectOptions];
      return allOptions.filter((opt) =>
        opt.label.toLowerCase().includes(lower),
      );
    }
    if (menuContext === "page" && input.trim() !== "") {
      const lower = input.trim().toLowerCase();
      return pageOptions.filter((opt) =>
        opt.label.toLowerCase().includes(lower),
      );
    }
    if (menuContext === "projects" && input.trim() !== "") {
      const lower = input.trim().toLowerCase();
      return projectOptions.filter((opt) =>
        opt.label.toLowerCase().includes(lower),
      );
    }
    if (menuContext === "theme" && input.trim() !== "") {
      const lower = input.trim().toLowerCase();
      return themeOptions.filter((opt) =>
        opt.label.toLowerCase().includes(lower),
      );
    }
    return getCurrentOptions();
  };
  const filteredOptions = getFilteredOptions();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setIsCmd(value.trim().charAt(0) === ">");
    if (value.trim().charAt(0) === ">") {
      setMenuContext("commands");
    } else if (menuContext === "commands" && value.trim() === "") {
      setMenuContext("main");
    }
    setSelectedOption(0);
  };

  useEffect(() => {
    if (!expanded) {
      setInput("");
      setMenuContext("main");
      setSelectedOption(0);
      setIsCmd(false);
      return;
    }
    if (isCmd) {
      setMenuContext("commands");
    }
    // Reset selectedOption if filteredOptions shrink
    if (selectedOption >= filteredOptions.length) setSelectedOption(0);
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        setSelectedOption((prev) => (prev + 1) % filteredOptions.length);
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setSelectedOption(
          (prev) =>
            (prev - 1 + filteredOptions.length) % filteredOptions.length,
        );
        e.preventDefault();
      } else if (e.key === "Enter") {
        filteredOptions[selectedOption]?.action();
        e.preventDefault();
      } else if (e.key === "Escape") {
        if (menuContext !== "main") {
          setMenuContext("main");
          setSelectedOption(0);
        } else {
          setExpanded(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expanded, filteredOptions, selectedOption, menuContext, isCmd]);

  useEffect(() => {
    if (!expanded) return;
    function handleClickOutside(e) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded]);

  return (
    <>
      <div className="cursor-default select-none fixed sm:sticky top-0 w-full z-50 flex items-center justify-center bg-[var(--bg-secondary)] border-b border-[var(--border-secondary)] py-2 px-1 sm:py-1 font-mono text-xs">
        {expanded && (
          <div
            className="absolute z-100 border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] flex flex-col items-center max-w-lg w-full p-1 top-1 rounded gap-2"
            ref={panelRef}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              className="text-xs w-full outline-none border border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--text)] px-2 py-1 rounded"
              placeholder="Search pages by name (append '>' for commands)..."
              autoFocus
            />
            <div className="flex flex-col text-left w-full">
              {filteredOptions.map((opt, idx) => (
                <button
                  key={opt.label}
                  className={`mb-1 text-left w-full px-2 py-1 rounded ${selectedOption === idx ? "bg-[var(--bg)]" : "hover:bg-[var(--bg)]"} text-[var(--text-secondary)]`}
                  onClick={opt.action}
                  tabIndex={0}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center w-full transition-all duration-300 gap-2">
          <div
            className={`flex sm:flex-1 items-center text-[var(--text)] justify-end ${expanded ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"}`}
          >
            <button
              className="hover:bg-[var(--bg-tertiary)] py-2 px-2 sm:py-[0.5px] sm:px-1 rounded cursor-pointer"
              onClick={goBack}
            >
              <ArrowLeft className="w-6 sm:w-4" />
            </button>
            <button
              className="hover:bg-[var(--bg-tertiary)] py-2 px-2 sm:py-[0.5px] sm:px-1 rounded cursor-pointer"
              onClick={goForward}
            >
              <ArrowRight className="w-6 sm:w-4" />
            </button>
          </div>

          <div
            className={`hidden sm:flex flex-1 justify-center ${expanded ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"}`}
          >
            <button
              type="button"
              className="text-xs outline-none border border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--border-secondary)] px-2 py-1 rounded focus:border-[var(--text-secondary)] text-center w-full"
              onClick={() => setExpanded(true)}
            >
              tyou.dev
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
