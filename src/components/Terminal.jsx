import { useEffect, useRef, useState } from "react";
import { resolvePath, getNode, formatPath, listDir } from "../lib/virtualFs";
import CustomScrollbar from "./CustomScrollbar";

const HELP_TEXT = [
  "Commands:",
  "  ls [path]     list a directory's contents",
  "  cd [path]     change directory (.. / / / ~ all work)",
  "  code <file>   open a file as a tab",
  "  pwd           print the working directory",
  "  clear         clear the screen",
  "  version       show the site's version",
  "  whoami        guess",
  "  help          show this again",
];

let lineId = 0;
function nextLineId() {
  lineId += 1;
  return lineId;
}

// One terminal instance: its own scrollback, cwd and command history.
// Mounted once per session and kept alive (just hidden) while a session
// isn't the one showing, so switching back to it doesn't lose anything.
function Terminal({ root, initialCwd, version, onOpenTab, visible, active, onFocus }) {
  const [cwd, setCwd] = useState(initialCwd);
  const [lines, setLines] = useState(() => [
    { id: nextLineId(), type: "banner", text: `tyler@tyou.dev — ${version}` },
    { id: nextLineId(), type: "output", text: "Type 'help' to see available commands." },
  ]);
  const [input, setInput] = useState("");
  // Tracks real DOM focus on the input, separately from `active` (which
  // only says "this is the selected pane among however many are split") —
  // clicking away to somewhere else on the page (the main content, the
  // sidebar, anywhere) blurs the input without changing which pane is
  // selected, and the cursor should hollow out for that too.
  const [hasFocus, setHasFocus] = useState(false);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    if (visible && active) inputRef.current?.focus();
  }, [visible, active]);

  function print(text, type = "output") {
    setLines((prev) => [...prev, { id: nextLineId(), type, text }]);
  }

  function run(raw) {
    const trimmed = raw.trim();
    setLines((prev) => [
      ...prev,
      { id: nextLineId(), type: "cmd", text: trimmed, prompt: formatPath(cwd) },
    ]);
    if (trimmed) {
      historyRef.current = [...historyRef.current, trimmed];
    }
    historyIndexRef.current = historyRef.current.length;

    if (!trimmed) return;
    const spaceIdx = trimmed.indexOf(" ");
    const cmd = (spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)).toLowerCase();
    const arg = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();

    switch (cmd) {
      case "help":
        HELP_TEXT.forEach((line) => print(line));
        break;

      case "pwd":
        print(formatPath(cwd));
        break;

      case "clear":
        setLines([]);
        break;

      case "whoami":
        print("tyler");
        break;

      case "version":
        print(version);
        break;

      case "ls": {
        const target = arg ? resolvePath(cwd, arg) : cwd;
        const node = getNode(root, target);
        if (!node) {
          print(`ls: ${arg}: no such file or directory`, "error");
        } else if (node.type === "file") {
          print(node.name);
        } else {
          const entries = listDir(node);
          if (entries.length === 0) print("(empty)");
          else
            print(
              entries
                .map((e) => (e.type === "dir" ? `${e.name}/` : e.name))
                .join("  "),
            );
        }
        break;
      }

      case "cd": {
        const target = arg ? resolvePath(cwd, arg) : [];
        const node = getNode(root, target);
        if (!node) {
          print(`cd: ${arg}: no such file or directory`, "error");
        } else if (node.type !== "dir") {
          print(`cd: ${arg}: not a directory`, "error");
        } else {
          setCwd(target);
        }
        break;
      }

      case "code": {
        if (!arg) {
          print("usage: code <file>", "error");
          break;
        }
        const target = resolvePath(cwd, arg);
        const node = getNode(root, target);
        if (!node) {
          print(`code: ${arg}: no such file or directory`, "error");
        } else if (node.type !== "file") {
          print(`code: ${arg}: is a directory`, "error");
        } else {
          print(`Opening ${node.name}…`);
          onOpenTab?.(node.tabId);
        }
        break;
      }

      default:
        print(`command not found: ${cmd}`, "error");
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      run(input);
      setInput("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const hist = historyRef.current;
      if (!hist.length) return;
      const idx = Math.max(0, historyIndexRef.current - 1);
      historyIndexRef.current = idx;
      setInput(hist[idx] || "");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const hist = historyRef.current;
      const idx = Math.min(hist.length, historyIndexRef.current + 1);
      historyIndexRef.current = idx;
      setInput(hist[idx] || "");
    }
  }

  return (
    <div
      onMouseDown={onFocus}
      className={`flex flex-col h-full min-w-0 min-h-0 ${visible ? "" : "hidden"} ${
        active ? "" : "opacity-70"
      }`}
    >
      <CustomScrollbar
        ref={scrollRef}
        wrapperClassName="flex-1 min-h-0 w-full"
        className="px-3 py-2 text-[12px] leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line) => {
          if (line.type === "cmd") {
            return (
              <div key={line.id} className="flex gap-1.5 flex-wrap">
                <span className="text-[var(--accent)] shrink-0">
                  {line.prompt}
                  {" $"}
                </span>
                <span className="whitespace-pre-wrap break-all">{line.text}</span>
              </div>
            );
          }
          return (
            <div
              key={line.id}
              className={`whitespace-pre-wrap break-all ${
                line.type === "error"
                  ? "text-[var(--difficulty-hard)]"
                  : line.type === "banner"
                    ? "text-[var(--text)] font-bold"
                    : "text-[var(--text-secondary)]"
              }`}
            >
              {line.text}
            </div>
          );
        })}
        <div className="flex gap-1.5">
          <span className="text-[var(--accent)] shrink-0">
            {formatPath(cwd)}
            {" $"}
          </span>
          {/* The real input is invisible and just here to capture typing —
              what's actually shown is the plain text plus a block cursor
              rendered right after it, terminal-style, instead of the
              browser's native thin text caret. There's no mid-line cursor
              movement (ArrowLeft/Right aren't handled, only history via
              Up/Down), so the cursor is always exactly at the end of the
              text — no position tracking needed. */}
          <div className="relative flex-1 min-w-0 flex items-center">
            <span className="whitespace-pre-wrap break-all">{input}</span>
            <span
              className={`inline-block w-[0.55em] h-[1.15em] -mb-px ${
                active && hasFocus ? "bg-[var(--text)]" : "border border-[var(--text)] box-border"
              }`}
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setHasFocus(true)}
              onBlur={() => setHasFocus(false)}
              spellCheck={false}
              autoComplete="off"
              className="absolute inset-0 w-full h-full bg-transparent outline-none border-0 text-transparent caret-transparent"
            />
          </div>
        </div>
      </CustomScrollbar>
    </div>
  );
}

export default Terminal;
