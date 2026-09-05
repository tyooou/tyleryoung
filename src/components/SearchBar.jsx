import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, Palette, Brain } from "lucide-react";
import { useTheme, THEMES } from "../lib/theme";
import VisitorCounter from "./VisitorCounter";
import PanelIcon from "./PanelIcon";
import HeaderTooltip from "./HeaderTooltip";

// Matches the CSS animation-out duration in index.css — the panel has to
// stay mounted this long after `expanded` goes false so the exit animation
// can actually play, instead of the dropdown just vanishing instantly.
const CLOSE_ANIMATION_MS = 150;

function SearchBar({
  updateSidebar,
  toggleSidebar,
  toggleAiChat,
  toggleTerminal,
  sidebarOpen,
  aiChatOpen,
  terminalOpen,
  startTour,
  updatePage,
  goBack,
  goForward,
  backTabLabel,
  forwardTabLabel,
  projects,
  pages,
  releases,
  friends,
  leetcodeProblems,
  experiences = [],
  quickLinks = [],
}) {
  const { theme, cycleTheme, setTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [panelRendered, setPanelRendered] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);
  const [input, setInput] = useState("");
  const [isCmd, setIsCmd] = useState(false);
  const [menuContext, setMenuContext] = useState("main");
  const [selectedOption, setSelectedOption] = useState(0);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const themes = THEMES.map((t) => ({
    name: t
      .replace("theme-", "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    value: t,
  }));

  // `themes` keeps THEMES' order, so this is the one cycleTheme will land
  // on — named in the tooltip so the button says where it's going rather
  // than just that it cycles. An unknown stored slug indexes to -1, which
  // lands on the first theme, matching ThemeProvider's own fallback.
  const nextThemeName =
    themes[(THEMES.indexOf(theme) + 1) % THEMES.length].name;

  const contentLinks = pages
    .filter(
      (p) =>
        p.enabled &&
        p.id !== "changelog" &&
        p.id !== "friends" &&
        p.id !== "experience",
    )
    .sort((a, b) => a.order - b.order)
    .map((p) => p.id);

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
      label: "Go to Changelog",
      action: () => {
        setMenuContext("changelog");
        setSelectedOption(0);
      },
    },
    {
      label: "Go to Friends",
      action: () => {
        setMenuContext("friends");
        setSelectedOption(0);
      },
    },
    {
      label: "Go to Leetcode",
      action: () => {
        setMenuContext("leetcode");
        setSelectedOption(0);
      },
    },
    {
      label: "Go to Work",
      action: () => {
        setMenuContext("work");
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
        toggleSidebar();
      },
    },
    // Unlike Toggle Sidebar / Cycle Theme above, these close the palette —
    // both take over the screen, and leaving a command list floating on top
    // of the tour (or over the panel you just asked for) makes no sense.
    {
      label: "Take a Tour",
      action: () => {
        setExpanded(false);
        startTour?.();
      },
    },
    // Absent entirely when tyouAI is off (mobile) rather than listed and
    // inert — Portfolio passes a null toggle in that case.
    ...(toggleAiChat
      ? [
          {
            label: "Toggle AI Chat",
            action: () => {
              setExpanded(false);
              toggleAiChat();
            },
          },
        ]
      : []),
    {
      label: "Toggle Terminal",
      action: () => {
        setExpanded(false);
        toggleTerminal?.();
      },
    },
    {
      label: "Go Back",
      action: () => {
        setExpanded(false);
        goBack();
      },
    },
    {
      label: "Go Forward",
      action: () => {
        setExpanded(false);
        goForward();
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

  const releaseLinks = [
    ...releases.map((r) => ({ label: r.version, value: r.version })),
  ];

  const friendLinks = [
    ...friends.map((f) => ({ label: f.name, value: f.name })),
  ];

  const leetcodeLinks = [
    ...leetcodeProblems.map((p) => ({
      label: `${p.number}. ${p.title}`,
      value: p.path,
    })),
  ];

  const workLinks = [
    ...experiences.map((exp) => ({
      label: `${exp.role} @ ${exp.company}`,
      value: exp.slug,
    })),
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

  const releaseOptions = releaseLinks.map((r) => ({
    label: r.label,
    action: () => {
      updatePage(r.value);
      setExpanded(false);
      if (window.innerWidth < 768) updateSidebar(false);
    },
  }));

  const friendOptions = friendLinks.map((f) => ({
    label: f.label,
    action: () => {
      updatePage(f.value);
      setExpanded(false);
      if (window.innerWidth < 768) updateSidebar(false);
    },
  }));

  const leetcodeOptions = leetcodeLinks.map((l) => ({
    label: l.label,
    action: () => {
      updatePage(l.value);
      setExpanded(false);
      if (window.innerWidth < 768) updateSidebar(false);
    },
  }));

  const workOptions = workLinks.map((w) => ({
    label: w.label,
    action: () => {
      updatePage(w.value);
      setExpanded(false);
      if (window.innerWidth < 768) updateSidebar(false);
    },
  }));

  const quickLinkById = (id) => quickLinks.find((q) => q.id === id);

  const commandOptions = [
    ...(quickLinkById("cv")
      ? [
          {
            label: "Document: Open Résumé",
            action: () => {
              updatePage(quickLinkById("cv").name);
              setExpanded(false);
            },
          },
          {
            label: "Document: Download Résumé",
            action: () => {
              const link = document.createElement("a");
              link.href = `${quickLinkById("cv").link}?dl=TYLER-YOUNG-RESUME.pdf`;
              link.download = "TYLER-YOUNG-RESUME.pdf";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setExpanded(false);
            },
          },
        ]
      : []),
    {
      label: "Contact: Send an Email",
      action: () => {
        window.open("mailto:young.h.tyler@gmail.com", "_blank");
        setExpanded(false);
      },
    },
    {
      label: "Contact: Copy Email to Clipboard",
      action: () => {
        navigator.clipboard.writeText("young.h.tyler@gmail.com");
        setExpanded(false);
      },
    },
    ...(quickLinkById("linkedin")
      ? [
          {
            label: "Contact: Open LinkedIn",
            action: () => {
              updatePage(quickLinkById("linkedin").name);
              setExpanded(false);
            },
          },
        ]
      : []),
    ...(quickLinkById("github")
      ? [
          {
            label: "Contact: Open GitHub",
            action: () => {
              updatePage(quickLinkById("github").name);
              setExpanded(false);
            },
          },
        ]
      : []),
  ];

  const getCurrentOptions = () => {
    switch (menuContext) {
      case "page":
        return pageOptions;
      case "projects":
        return projectOptions;
      case "changelog":
        return releaseOptions;
      case "friends":
        return friendOptions;
      case "leetcode":
        return leetcodeOptions;
      case "work":
        return workOptions;
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
      const allOptions = [
        ...pageOptions,
        ...projectOptions,
        ...releaseOptions,
        ...friendOptions,
        ...leetcodeOptions,
        ...workOptions,
      ];
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
    if (menuContext === "changelog" && input.trim() !== "") {
      const lower = input.trim().toLowerCase();
      return releaseOptions.filter((opt) =>
        opt.label.toLowerCase().includes(lower),
      );
    }
    if (menuContext === "friends" && input.trim() !== "") {
      const lower = input.trim().toLowerCase();
      return friendOptions.filter((opt) =>
        opt.label.toLowerCase().includes(lower),
      );
    }
    if (menuContext === "leetcode" && input.trim() !== "") {
      const lower = input.trim().toLowerCase();
      return leetcodeOptions.filter((opt) =>
        opt.label.toLowerCase().includes(lower),
      );
    }
    if (menuContext === "work" && input.trim() !== "") {
      const lower = input.trim().toLowerCase();
      return workOptions.filter((opt) =>
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

  // Keeps the dropdown mounted for one extra beat after `expanded` goes
  // false so animate-modal-out actually gets to play, instead of the panel
  // just disappearing the instant any of the many close call sites
  // (Escape, click-outside, every option's action) flips `expanded`.
  useEffect(() => {
    if (expanded) {
      setPanelRendered(true);
      setPanelClosing(false);
      return;
    }
    if (!panelRendered) return;
    setPanelClosing(true);
    const timeout = setTimeout(() => {
      setPanelRendered(false);
      setPanelClosing(false);
    }, CLOSE_ANIMATION_MS);
    return () => clearTimeout(timeout);
  }, [expanded, panelRendered]);

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
      <div
        data-toolbar
        className="cursor-default select-none fixed sm:sticky top-0 w-full z-50 flex items-center justify-center bg-[var(--bg-secondary)] border-b border-[var(--border-secondary)] py-2 px-1 sm:py-1 font-mono text-xs"
      >
        {panelRendered && (
          <div
            className={`absolute z-100 border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] flex flex-col items-center max-w-lg w-full p-1 top-1 rounded gap-2 ${panelClosing ? "animate-modal-out" : "animate-modal-in"}`}
            ref={panelRef}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              // placeholder:text-* — without it the browser falls back to
              // its own fixed grey, which ignores the theme entirely.
              className="text-xs w-full outline-none border border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--text-secondary)] px-2 py-1 rounded"
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
          <VisitorCounter />
          <div
            className={`flex sm:flex-1 items-center text-[var(--text-secondary)] justify-end transition-opacity duration-300 ${expanded ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"}`}
          >
            {/* relative lives on this tight inner wrapper, not the flex-1
                box above — that box spans the whole gap back to the eye
                icon and only right-aligns its content, so anchoring there
                put the tooltip off the *box's* left edge, way out past the
                actual buttons (and off-screen for "Go forward to…"). This
                wrapper shrinks to the two buttons themselves, the same
                pattern the theme/sidebar/AI group uses on the other end of
                the header — so both tooltips open flush against the back
                button, not off in empty space. */}
            <div className="relative flex items-center gap-1">
              <button
                className="group hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40 disabled:hover:bg-transparent py-2 px-2 sm:p-1 rounded cursor-pointer disabled:cursor-default"
                onClick={goBack}
                disabled={!backTabLabel}
                aria-label={
                  backTabLabel ? `Go back to ${backTabLabel}` : "Go back"
                }
              >
                <ArrowLeft className="w-6 h-6 sm:w-4 sm:h-4" />
                {backTabLabel && (
                  <HeaderTooltip>Go back to {backTabLabel}</HeaderTooltip>
                )}
              </button>
              <button
                className="group hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40 disabled:hover:bg-transparent py-2 px-2 sm:p-1 rounded cursor-pointer disabled:cursor-default"
                onClick={goForward}
                disabled={!forwardTabLabel}
                aria-label={
                  forwardTabLabel
                    ? `Go forward to ${forwardTabLabel}`
                    : "Go forward"
                }
              >
                <ArrowRight className="w-6 h-6 sm:w-4 sm:h-4" />
                {forwardTabLabel && (
                  <HeaderTooltip>Go forward to {forwardTabLabel}</HeaderTooltip>
                )}
              </button>
            </div>
          </div>

          <div className="hidden sm:flex flex-1 items-center justify-center gap-2">
            {/* The collapsing button gets its own flex-1 wrapper, whose
                width stays constant whatever the button inside is doing.
                Without it the brain is a flex sibling of a box animating
                from w-full to w-0, so justify-center drags the brain across
                the header as the search bar grows back. */}
            <div className="flex-1 flex justify-center min-w-0">
              {/* width (not opacity) — collapses to a point rather than
                  fading in place, so it reads as the search bar itself
                  shrinking away instead of a cross-fade against the panel
                  opening on top of it. w-full/w-0 are both concrete values
                  that interpolate cleanly, unlike an intrinsic "auto" width. */}
              <button
                type="button"
                className={`text-xs outline-none border border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--border-secondary)] py-1 rounded focus:border-[var(--text-secondary)] text-center cursor-pointer overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  expanded
                    ? "w-0 px-0 border-0 opacity-0 pointer-events-none"
                    : "w-full px-2 opacity-100 pointer-events-auto"
                }`}
                onClick={() => setExpanded(true)}
              >
                tyou.dev
              </button>
            </div>
            {toggleAiChat && (
              <button
                // Fades in place, the same way the back/forward arrows do,
                // rather than travelling with the search bar.
                className={`group relative hover:bg-[var(--bg-tertiary)] text-[var(--accent)] p-1 rounded cursor-pointer shrink-0 transition-opacity duration-300 ${
                  expanded
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100 pointer-events-auto"
                }`}
                onClick={toggleAiChat}
                aria-label={aiChatOpen ? "Close tyouAI" : "Open tyouAI"}
              >
                <Brain className="w-4 h-4" />
                <HeaderTooltip side="right">
                  {aiChatOpen ? "Close tyouAI" : "Open tyouAI"}
                </HeaderTooltip>
              </button>
            )}
          </div>

          <div className="flex flex-1 items-center justify-end text-[var(--text-secondary)]">
            {/* The tooltips anchor to this tight wrapper rather than the
                flex-1 box around it — right-full on the outer one would
                measure from the far side of the header and land the tooltip
                somewhere near the search bar. */}
            <div className="relative flex items-center gap-1">
              <button
                data-tour="theme-toggle"
                className="group hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] py-2 px-2 sm:p-1 rounded cursor-pointer"
                onClick={cycleTheme}
                aria-label={`Cycle to ${nextThemeName}`}
              >
                <Palette className="w-6 h-6 sm:w-4 sm:h-4" />
                <HeaderTooltip>Cycle to {nextThemeName}</HeaderTooltip>
              </button>
              {/* Both toggles swap glyph with their panel's state, the way
                  VS Code's do — the icon shows what the click will do rather
                  than staying static. */}
              <button
                className="group hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] py-2 px-2 sm:p-1 rounded cursor-pointer"
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <PanelIcon
                  side="left"
                  filled={sidebarOpen}
                  className="w-6 h-6 sm:w-4 sm:h-4"
                />
                <HeaderTooltip>
                  {sidebarOpen ? "Close sidebar" : "Open sidebar"}
                </HeaderTooltip>
              </button>
              {toggleTerminal && (
                <button
                  className="group hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] py-2 px-2 sm:p-1 rounded cursor-pointer"
                  onClick={toggleTerminal}
                  aria-label={terminalOpen ? "Close terminal" : "Open terminal"}
                >
                  <PanelIcon
                    side="bottom"
                    filled={terminalOpen}
                    className="w-6 h-6 sm:w-4 sm:h-4"
                  />
                  <HeaderTooltip>
                    {terminalOpen ? "Close terminal" : "Open terminal"}
                  </HeaderTooltip>
                </button>
              )}
              {/* Absent entirely when tyouAI is off (mobile), matching the
                  brain button next to the search field. */}
              {toggleAiChat && (
                <button
                  className="group hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] py-2 px-2 sm:p-1 rounded cursor-pointer"
                  onClick={toggleAiChat}
                  aria-label={aiChatOpen ? "Close AI chat" : "Open AI chat"}
                >
                  <PanelIcon
                    side="right"
                    filled={aiChatOpen}
                    className="w-6 h-6 sm:w-4 sm:h-4"
                  />
                  <HeaderTooltip>
                    {aiChatOpen ? "Close tyouAI" : "Open tyouAI"}
                  </HeaderTooltip>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SearchBar;
