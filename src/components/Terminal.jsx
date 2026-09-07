import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolvePath, getNode, formatPath, listDir } from "../lib/virtualFs";
import { THEMES, useTheme } from "../lib/theme";
import Scribble from "./Scribble";
import { getEngine, isEngineReady, isWebGpuSupported } from "../lib/aiChatEngine";
import {
  MODELS,
  findModel,
  getStoredModelId,
  setStoredModelId,
  subscribeModelId,
} from "../lib/aiModels";
import { buildSystemPrompt } from "../lib/aiChatContext";
import CustomScrollbar from "./CustomScrollbar";

// Deliberately bare-bones next to chatMarkdownComponents.jsx (the panel's
// map) — the terminal keeps its tight, no-margin aesthetic, so this only
// covers what a reply actually needs: bold/italic emphasis, and just enough
// list/link/code handling that they don't render unstyled if they show up.
const terminalMarkdownComponents = {
  p: (props) => (
    <p
      className="m-0 mb-1.5 last:mb-0 whitespace-pre-wrap break-all"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-bold" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  ul: (props) => <ul className="list-disc ml-4 my-0.5" {...props} />,
  ol: (props) => <ol className="list-decimal ml-4 my-0.5" {...props} />,
  li: (props) => <li className="whitespace-pre-wrap break-all" {...props} />,
  a: (props) => (
    <a
      className="underline text-[var(--accent-secondary)]"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  code: (props) => (
    <code className="text-[var(--accent-secondary)]" {...props} />
  ),
};

// A little pixel-art brain for the chat intro banner — two hemispheres
// (accent / accent-secondary) with a fissure down the middle, flecked with
// the difficulty colors for texture, plus a short brainstem.
const BRAIN_ART = [
  ".LLLLLLLLL.",
  "LLLLLLLLLLL",
  "LLLLLLLLLLL",
  "..LLLLLLLL",
  ".......LL",
];
const BRAIN_ART_COLORS = {
  L: "var(--accent)",
};

function BrainLump() {
  return (
    <pre
      className="shrink-0 leading-[0.85] select-none font-mono text-[9px] tracking-[-1px]"
      aria-hidden="true"
    >
      {BRAIN_ART.map((row, i) => (
        <div key={i}>
          {row.split("").map((ch, j) =>
            ch === "." ? (
              " "
            ) : (
              <span key={j} style={{ color: BRAIN_ART_COLORS[ch] }}>
                █
              </span>
            ),
          )}
        </div>
      ))}
    </pre>
  );
}

// Flavor text for the "in progress" status line, picked at random per
// message — same idea as Claude Code's own rotating verbs.
const CHAT_VERBS = [
  "Thinking",
  "Pondering",
  "Composing",
  "Herding tokens",
  "Percolating",
];
// Shown under the status line while a reply is generating, one picked at
// random per message — same spirit as Claude Code's own rotating tips.
const CHAT_TIPS = [
  "type /exit to leave chat",
  "type /model to switch models",
  "ask about a specific project or page for a sharper answer",
  "type `theme next` to cycle the color scheme without leaving chat",
  "type `sidebar` to toggle the file tree",
];
// Slash commands available while inside tyouAI chat — the single source for
// the /help listing, the "/" autocomplete dropdown, and dispatch below.
const CHAT_COMMANDS = [
  { cmd: "/model", usage: "/model [name|#]", desc: "open the model picker, or switch directly" },
  { cmd: "/clear", usage: "/clear", desc: "clear the chat transcript" },
  { cmd: "/exit", usage: "/exit", desc: "leave tyouAI chat" },
  { cmd: "/help", usage: "/help", desc: "show this again" },
];
// A long enough run of the box-drawing dash that `overflow-hidden` on a
// full-width container clips it to exactly the container's width — a
// cheap way to draw a rule with actual characters instead of a CSS border.
const RULE = "─".repeat(400);
// Same trick, heavier weight — frames the /model picker panel so it reads
// as a distinct overlay rather than more of the ordinary chat prompt.
const PANEL_RULE = "▔".repeat(400);

const HELP_TEXT = [
  "Commands:",
  "  ls [path]     list a directory's contents",
  "  cd [path]     change directory (.. / / / ~ all work)",
  "  code <file>   open a file as a tab",
  "  pwd           print the working directory",
  "  clear         clear the screen",
  "  version       show the site's version",
  "  whoami        guess",
  "  theme [name]  show/cycle/set the color theme",
  "  sidebar       toggle the sidebar",
  "  tyouAI        chat with tyouAI right here (type /exit to leave)",
  "  chat          toggle the tyouAI chat panel",
  "  help          show this again",
];

const CHAT_TIMEOUT_MS = 60000;

function themeShortName(theme) {
  return theme.replace(/^theme-/, "");
}

// Resolves the argument to `/model` against MODELS — a 1-based list index
// (matching what `/model` with no args prints), an exact id, an exact
// label, or a loose label substring, in that order.
function findModelByQuery(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  if (/^\d+$/.test(q)) {
    const byIndex = MODELS[Number(q) - 1];
    if (byIndex) return byIndex;
  }
  return (
    MODELS.find((m) => m.id.toLowerCase() === q) ||
    MODELS.find((m) => m.label.toLowerCase() === q) ||
    MODELS.find((m) => m.label.toLowerCase().includes(q)) ||
    null
  );
}

// Mirrors AiChatPanel's describeProgress: WebLLM's raw progress text is
// verbose, so trim it to a one-line "X MB fetched · Y%" the terminal can
// print/refresh during a first-time model download.
function describeProgress(text, progress) {
  const mb = text?.match(/([\d.]+)\s*MB/i);
  const percent = Math.round((progress || 0) * 100);
  if (mb) return `${mb[1]}MB fetched · ${percent}%`;
  return percent > 0 ? `${percent}%` : "Starting…";
}

let lineId = 0;
function nextLineId() {
  lineId += 1;
  return lineId;
}
// lineId resets to 0 on every page load, but a restored session's lines
// keep whatever ids they had when they were persisted (possibly much
// higher). Without this, a freshly generated line after restore could mint
// an id that collides with one of those — and since updateModelProgress /
// finishModelProgress locate the line to edit by id, that collision makes a
// brand-new "Loading…"/"Now using X" update silently overwrite an unrelated
// historic line sharing the same id instead of appending its own.
function bumpLineIdPast(maxId) {
  if (maxId > lineId) lineId = maxId;
}

// One terminal instance: its own scrollback, cwd and command history.
// Mounted once per session and kept alive (just hidden) while a session
// isn't the one showing, so switching back to it doesn't lose anything.
// Restored chat lines can carry an in-flight state (streaming reply,
// animating model-download progress) that no longer applies once the page
// has actually reloaded — the engine and its worker are gone, so anything
// still "in progress" needs to be flattened to a settled, static line.
function sanitizeRestoredLines(restored) {
  return restored.map((l) => {
    if (l.type === "chat-ai" && l.state === "streaming") {
      return { ...l, state: "done", status: "", text: l.text || "(interrupted)" };
    }
    if (l.type === "ai-progress" && l.animate) {
      return { ...l, animate: false };
    }
    return l;
  });
}

function Terminal({
  root,
  initialCwd,
  version,
  onOpenTab,
  onToggleSidebar,
  onToggleAiChat,
  chatContext,
  activeTab,
  visible,
  active,
  onFocus,
  initialChatMode = false,
  initialChatHistory = [],
  initialPreChatLines = [],
  initialChatLines = null,
  onChatStateChange,
}) {
  const { theme, setTheme, cycleTheme } = useTheme();
  const [cwd, setCwd] = useState(initialCwd);
  const [lines, setLines] = useState(() => {
    const maxRestoredId = [...initialPreChatLines, ...(initialChatLines || [])].reduce(
      (max, l) => Math.max(max, l?.id || 0),
      0,
    );
    bumpLineIdPast(maxRestoredId);
    if (initialChatMode && initialChatLines?.length) {
      return sanitizeRestoredLines(initialChatLines);
    }
    return [
      { id: nextLineId(), type: "banner", text: `tyler@tyou.dev — ${version}` },
      {
        id: nextLineId(),
        type: "output",
        text: "Type 'help' to see available commands.",
      },
    ];
  });
  const [input, setInput] = useState("");
  // Tracks real DOM focus on the input, separately from `active` (which
  // only says "this is the selected pane among however many are split") —
  // clicking away to somewhere else on the page (the main content, the
  // sidebar, anywhere) blurs the input without changing which pane is
  // selected, and the cursor should hollow out for that too.
  const [hasFocus, setHasFocus] = useState(false);
  // Shell command history and tyouAI chat-input history are kept separate —
  // otherwise leaving chat and pressing ArrowUp in the plain shell would
  // recall old chat messages (and vice versa on re-entering chat).
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const chatInputHistoryRef = useRef([]);
  const chatInputHistoryIndexRef = useRef(-1);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  // Whether the scrollback is pinned to the bottom — read via the ref inside
  // the auto-scroll effect (so it doesn't need `lines` growth to also
  // depend on scroll position) and mirrored to state to drive the "Jump to
  // bottom" affordance's visibility.
  const atBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  // How many AI replies have landed while scrolled away from them — shown
  // on the "Jump to bottom" affordance, cleared once the visitor actually
  // scrolls (or jumps) back down to see them.
  const [unseenCount, setUnseenCount] = useState(0);

  // In-terminal tyouAI chat: swaps the shell prompt for a "tyouAI" one and
  // routes input straight to the model instead of the usual command switch,
  // like dropping into a REPL. `getEngine` is a module-level singleton (see
  // aiChatEngine.js), so this shares the exact same worker/model — already
  // loaded or not — as AiChatPanel; only the conversation history below is
  // private to this terminal session.
  const [chatMode, setChatMode] = useState(initialChatMode);
  const [chatStatus, setChatStatus] = useState("idle"); // idle | loading | ready | streaming | error
  // Shared with AiChatPanel via aiModels.js's external store, so this
  // terminal both starts on and stays live-synced to whatever model the
  // visitor picks anywhere — in the panel, or in another split terminal.
  const modelId = useSyncExternalStore(subscribeModelId, getStoredModelId);
  const setModelId = setStoredModelId;
  // Bare `/model` opens an inline picker in place of the prompt (arrow keys
  // to move the cursor row, Enter to switch, Esc to cancel) instead of just
  // printing the list — modelPickerIndex is which row the cursor sits on.
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelPickerIndex, setModelPickerIndex] = useState(0);
  // Bare `/help` swaps the same footer slot for a static reference panel —
  // no cursor to move, just Esc (or Enter) to dismiss it.
  const [helpPanelOpen, setHelpPanelOpen] = useState(false);
  // Which row of the "/" command autocomplete dropdown is selected —
  // arrow-key controllable, reset to 0 (closest match leads the sorted
  // list) whenever what's typed changes.
  const [chatCmdIndex, setChatCmdIndex] = useState(0);
  const engineRef = useRef(null);
  const chatHistoryRef = useRef(initialChatHistory);
  const lastProgressRef = useRef("");
  // Scrollback as it stood right before dropping into chat mode, so /exit
  // can restore the terminal exactly there instead of leaving the intro
  // banner and the whole conversation sitting in the scrollback.
  const preChatLinesRef = useRef(initialPreChatLines);
  // Whether this session has ever been in chat mode — gates the persistence
  // effect below so plain terminal usage (which deliberately doesn't
  // persist scrollback, see TerminalPanel) never gets written to storage,
  // while a tyouAI conversation (and the fact that it was since exited)
  // does.
  const wasChatModeRef = useRef(initialChatMode);
  // Guards the restore-boot effect below against StrictMode's dev-only
  // double-invoke of effects — chatStatus is still "idle" in both
  // invocations' closures (the first call's setChatStatus("loading") hasn't
  // committed yet), so startEngine()'s own status check can't tell the
  // second call apart from a genuine fresh mount. A ref survives that
  // double-invoke (only the effect is torn down and rerun, not the
  // component instance), so it can.
  const bootedChatRef = useRef(false);

  // The model/worker aren't persisted across a reload, so a session
  // restored mid-chat needs to reload it itself, the same way running
  // `tyouai` fresh does.
  useEffect(() => {
    if (!initialChatMode || bootedChatRef.current) return;
    bootedChatRef.current = true;
    startEngine({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirrors chat mode/history/transcript up to TerminalPanel so it survives
  // a page reload — skipped entirely for plain terminal use (see
  // wasChatModeRef above) and while a reply is mid-stream, since restoring
  // into the middle of a generation that no longer exists would just show a
  // stuck "thinking" line.
  useEffect(() => {
    if (chatStatus === "streaming") return;
    if (!chatMode && !wasChatModeRef.current) return;
    wasChatModeRef.current = chatMode;
    onChatStateChange?.({
      chatMode,
      history: chatHistoryRef.current,
      preChatLines: preChatLinesRef.current,
      lines,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMode, chatStatus, lines]);

  useEffect(() => {
    // Only follow new output while already pinned to the bottom — otherwise
    // this would yank someone back down mid-scroll every time a streaming
    // reply appends another chunk.
    if (atBottomRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [lines]);

  useEffect(() => {
    if (visible && active) inputRef.current?.focus();
  }, [visible, active]);

  useEffect(() => {
    if (chatStatus === "ready") inputRef.current?.focus();
  }, [chatStatus]);

  useEffect(() => {
    setChatCmdIndex(0);
  }, [input]);

  // Both panels swap in a differently-shaped (hidden) input to keep
  // capturing keys, so refocus it across that swap in either direction.
  // chatMode does the same thing (the input moves from inline scrollback to
  // the pinned chat footer, unmounting/remounting the DOM node), so /exit
  // and entering tyouAI both need to refocus here too.
  useEffect(() => {
    inputRef.current?.focus();
  }, [modelPickerOpen, helpPanelOpen, chatMode]);

  // Outside chat mode the input line lives inline in the scrollback (like a
  // real terminal prompt), so typing can grow the content past the visible
  // area — follow it down the same way new output does, but only while
  // already pinned to the bottom.
  useEffect(() => {
    if (!chatMode && atBottomRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [input, chatMode]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const bottom = distanceFromBottom < 32;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    if (bottom) setUnseenCount(0);
  }

  function jumpToBottom() {
    atBottomRef.current = true;
    setAtBottom(true);
    setUnseenCount(0);
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }

  function print(text, type = "output") {
    setLines((prev) => [...prev, { id: nextLineId(), type, text }]);
  }

  // tyouAI's own lines get a bullet, like Claude Code prefixing its output —
  // visually separates "the assistant said this" from plain shell output.
  function printAi(text, type = "ai") {
    print(`⏺ ${text}`, type);
  }

  // Model-load progress (download %, "Starting…", etc.) used to print a new
  // line per update — these three keep it to a single animated line that's
  // edited in place instead, the same way a chat reply streams into one
  // line rather than appending as it grows.
  const modelProgressLineIdRef = useRef(null);

  function startModelProgress(text) {
    const id = nextLineId();
    modelProgressLineIdRef.current = id;
    setLines((prev) => [...prev, { id, type: "ai-progress", text, animate: true }]);
  }

  function updateModelProgress(text) {
    const id = modelProgressLineIdRef.current;
    if (id == null) {
      startModelProgress(text);
      return;
    }
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, text } : l)));
  }

  // Finalizes the progress line as plain (non-shimmering) text — used for
  // both the success ("Now using X.") and failure message, since either one
  // ends the animation the same way.
  function finishModelProgress(text, type = "ai-progress") {
    const id = modelProgressLineIdRef.current;
    modelProgressLineIdRef.current = null;
    if (id == null) {
      printAi(text, type === "ai-progress" ? "ai" : type);
      return;
    }
    setLines((prev) =>
      prev.map((l) =>
        l.id === id ? { id, type, text: `⏺ ${text}`, animate: false } : l,
      ),
    );
  }

  function buildChatIntroLine() {
    return {
      id: nextLineId(),
      type: "chat-intro",
      bannerName: "tyouAI",
      bannerVersion: version,
      modelLine: `${findModel(modelId).label} · runs locally via WebGPU`,
      location: formatPath(cwd),
    };
  }

  // Snapshots the current scrollback (so /exit can restore it later), then
  // wipes it and drops in a fresh banner — the way launching Claude Code
  // clears the terminal to its own intro screen.
  function enterChat() {
    setLines((prev) => {
      preChatLinesRef.current = prev;
      return [buildChatIntroLine()];
    });
  }

  // Loads (or reuses, if already cached in aiChatEngine's map) the engine
  // for a given model id. Used both for the initial load and for /model
  // switching — unlike startEngine() below, it always (re)loads rather than
  // no-op'ing when a different model is already ready. `silent` skips the
  // scrollback lines entirely (chatStatus/the footer's own "Model still
  // loading…" placeholder still reflect progress) — used when reconnecting
  // to the engine after a page reload, where nothing about the model
  // actually changed and printing "Loading…"/"Now using X" again would just
  // be a redundant line that then gets baked permanently into the persisted
  // transcript on every future reload.
  function loadModel(id, { silent = false } = {}) {
    setChatStatus("loading");
    lastProgressRef.current = "";
    const label = findModel(id).label;
    if (!silent) startModelProgress(`Loading ${label}…`);
    getEngine(id, (report) => {
      if (silent) return;
      const text = describeProgress(report.text, report.progress);
      if (text === lastProgressRef.current) return;
      lastProgressRef.current = text;
      updateModelProgress(text);
    })
      .then((engine) => {
        engineRef.current = engine;
        setChatStatus("ready");
        if (!silent) finishModelProgress(`Now using ${label}.`);
      })
      .catch((err) => {
        setChatStatus("error");
        const message = `Failed to load tyouAI: ${err?.message || "unknown error"}`;
        if (silent) printAi(message, "error");
        else finishModelProgress(message, "error");
      });
  }

  function startEngine(opts) {
    if (chatStatus === "loading" || chatStatus === "ready") return;
    loadModel(modelId, opts);
  }

  function switchModel(target) {
    if (chatStatus === "streaming") {
      printAi("Finish the current reply before switching models.", "error");
      return;
    }
    if (target.id === modelId) {
      printAi(`Already using ${target.label}.`);
      return;
    }
    setModelId(target.id);
    if (isEngineReady(target.id)) {
      startModelProgress(`Switching to ${target.label}…`);
      getEngine(target.id).then((engine) => {
        engineRef.current = engine;
        setChatStatus("ready");
        finishModelProgress(`Now using ${target.label}.`);
      });
    } else {
      loadModel(target.id);
    }
  }

  // Restores the scrollback to exactly how it was before `tyouai` was run —
  // the intro banner and every message from the chat go away with it.
  function exitChat() {
    if (chatStatus === "streaming") engineRef.current?.interruptGenerate?.();
    setChatMode(false);
    setInput("");
    setLines(preChatLinesRef.current);
    inputRef.current?.focus();
  }

  // Enter/Esc handlers for the /model picker — pulled out of
  // handleKeyDown so they read the same whether triggered by keyboard.
  function confirmModelPicker() {
    const target = MODELS[modelPickerIndex];
    setModelPickerOpen(false);
    if (target) switchModel(target);
  }

  function cancelModelPicker() {
    setModelPickerOpen(false);
  }

  function handleChatCommand(raw) {
    setLines((prev) => [
      ...prev,
      { id: nextLineId(), type: "chat-user", text: raw },
    ]);

    const spaceIdx = raw.indexOf(" ");
    const cmd = (spaceIdx === -1 ? raw : raw.slice(0, spaceIdx)).toLowerCase();
    const arg = spaceIdx === -1 ? "" : raw.slice(spaceIdx + 1).trim();

    switch (cmd) {
      case "/exit":
      case "/quit":
        exitChat();
        break;

      case "/model": {
        if (!arg) {
          const currentIndex = MODELS.findIndex((m) => m.id === modelId);
          setModelPickerIndex(currentIndex === -1 ? 0 : currentIndex);
          setModelPickerOpen(true);
          break;
        }
        const target = findModelByQuery(arg);
        if (!target) {
          printAi(
            `No model matching "${arg}". Try /model to list options.`,
            "error",
          );
          break;
        }
        switchModel(target);
        break;
      }

      case "/clear":
        // Unlike /exit, this stays in chat — it resets the transcript back
        // to a fresh intro, with the /clear invocation itself kept as the
        // first message so it doesn't look like chat never happened.
        setLines([
          buildChatIntroLine(),
          { id: nextLineId(), type: "chat-user", text: raw },
        ]);
        break;

      case "/help":
        setHelpPanelOpen(true);
        break;

      default:
        printAi(`Unknown command: ${cmd}. Try /help.`, "error");
    }
  }

  async function sendChatMessage(text) {
    if (chatStatus === "streaming") {
      printAi("Still working on the last reply — hang tight.", "error");
      return;
    }
    if (chatStatus !== "ready" || !engineRef.current) {
      printAi(
        chatStatus === "loading"
          ? "Still loading the model — hang tight."
          : "tyouAI isn't ready yet.",
        "error",
      );
      if (chatStatus === "idle" || chatStatus === "error") startEngine();
      return;
    }

    const history = [
      ...chatHistoryRef.current,
      { role: "user", content: text },
    ];
    chatHistoryRef.current = history;
    setChatStatus("streaming");

    const answerId = nextLineId();
    const verb = CHAT_VERBS[Math.floor(Math.random() * CHAT_VERBS.length)];
    const tip = CHAT_TIPS[Math.floor(Math.random() * CHAT_TIPS.length)];
    const startedAt = Date.now();
    const secondsSoFar = () => Math.round((Date.now() - startedAt) / 1000);
    let tokenCount = 0;
    const thinkingText = (secs) =>
      `${verb}… (${secs}s · ↓ ${tokenCount} tokens)`;

    setLines((prev) => [
      ...prev,
      {
        id: answerId,
        type: "chat-ai",
        text: "",
        status: thinkingText(0),
        tip,
        state: "streaming",
      },
    ]);
    if (!atBottomRef.current) setUnseenCount((c) => c + 1);

    const tick = setInterval(() => {
      const secs = secondsSoFar();
      tokenCount += Math.floor(Math.random() * 3) + 1;
      setLines((prev) =>
        prev.map((l) =>
          l.id === answerId ? { ...l, status: thinkingText(secs) } : l,
        ),
      );
    }, 150);

    let cancelled = false;
    const timeout = setTimeout(() => {
      cancelled = true;
      engineRef.current?.interruptGenerate?.();
    }, CHAT_TIMEOUT_MS);

    try {
      // A deliberate pause before the model is even asked — otherwise a
      // short prompt can answer fast enough that the thinking indicator
      // barely flashes before disappearing.
      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (cancelled) {
        setLines((prev) =>
          prev.map((l) =>
            l.id === answerId
              ? { ...l, text: "(stopped)", status: "", state: "done" }
              : l,
          ),
        );
        return;
      }

      const stream = await engineRef.current.chat.completions.create({
        messages: [
          {
            role: "system",
            content: buildSystemPrompt({ ...chatContext, activeTab }),
          },
          ...history,
        ],
        stream: true,
        temperature: 0.3,
      });

      let reply = "";
      for await (const chunk of stream) {
        if (cancelled) break;
        const delta = chunk.choices[0]?.delta?.content || "";
        if (!delta) continue;
        reply += delta;
        setLines((prev) =>
          prev.map((l) =>
            l.id === answerId
              ? { ...l, text: reply, status: thinkingText(secondsSoFar()) }
              : l,
          ),
        );
      }
      if (!reply) reply = "(no response)";
      const secs = secondsSoFar();
      setLines((prev) =>
        prev.map((l) =>
          l.id === answerId
            ? {
                ...l,
                text: reply,
                status: `${verb} for ${secs}s`,
                state: "done",
              }
            : l,
        ),
      );
      chatHistoryRef.current = [
        ...history,
        { role: "assistant", content: reply },
      ];
    } catch (err) {
      setLines((prev) =>
        prev.map((l) =>
          l.id === answerId
            ? {
                ...l,
                text: err?.message || "Something went wrong.",
                status: "",
                state: "error",
              }
            : l,
        ),
      );
    } finally {
      clearInterval(tick);
      clearTimeout(timeout);
      setChatStatus("ready");
    }
  }

  function run(raw) {
    const trimmed = raw.trim();
    const histRef = chatMode ? chatInputHistoryRef : historyRef;
    const histIndexRef = chatMode ? chatInputHistoryIndexRef : historyIndexRef;
    if (trimmed) {
      histRef.current = [...histRef.current, trimmed];
    }
    histIndexRef.current = histRef.current.length;
    if (!trimmed) return;

    if (chatMode) {
      if (trimmed.startsWith("/")) {
        handleChatCommand(trimmed);
        return;
      }
      setLines((prev) => [
        ...prev,
        { id: nextLineId(), type: "chat-user", text: trimmed },
      ]);
      sendChatMessage(trimmed);
      return;
    }

    setLines((prev) => [
      ...prev,
      { id: nextLineId(), type: "cmd", text: trimmed, prompt: formatPath(cwd) },
    ]);

    const spaceIdx = trimmed.indexOf(" ");
    const cmd = (
      spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)
    ).toLowerCase();
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

      case "theme": {
        if (!arg) {
          print(`current theme: ${themeShortName(theme)}`);
          print(`available: ${THEMES.map(themeShortName).join(", ")}`);
          break;
        }
        if (arg === "next" || arg === "cycle") {
          cycleTheme();
          break;
        }
        const target = THEMES.find(
          (t) => t === arg || themeShortName(t) === arg,
        );
        if (!target) {
          print(`theme: ${arg}: no such theme`, "error");
        } else {
          setTheme(target);
          print(`theme set to ${themeShortName(target)}`);
        }
        break;
      }

      case "sidebar":
        onToggleSidebar?.();
        break;

      case "chat":
        onToggleAiChat?.();
        break;

      case "tyouai": {
        if (!isWebGpuSupported()) {
          print(
            "tyouAI needs a WebGPU-capable browser (Chrome or Edge on desktop).",
            "error",
          );
          break;
        }
        setChatMode(true);
        enterChat();
        if (chatStatus === "idle") startEngine();
        else if (chatStatus === "loading") printAi("Model is loading…");
        break;
      }

      default:
        print(`command not found: ${cmd}`, "error");
    }
  }

  // The real input is invisible and just here to capture typing — what's
  // actually shown is the plain text plus a block cursor rendered right
  // after it, terminal-style, instead of the browser's native thin text
  // caret. There's no mid-line cursor movement (ArrowLeft/Right aren't
  // handled, only history via Up/Down), so the cursor is always exactly at
  // the end of the text — no position tracking needed. Rendered either
  // inline in the scrollback (plain terminal) or pinned to the bottom of
  // the pane (chat mode) — see the two call sites below.
  function renderInputLine() {
    return (
      <div className="flex gap-1.5">
        <span className="text-[var(--accent)] shrink-0">
          {chatMode ? "❯" : `${formatPath(cwd)} $`}
        </span>
        <div className="relative flex-1 min-w-0 flex items-center">
          <span className="whitespace-pre-wrap break-all">
            {input ||
              (chatMode && chatStatus === "loading" && (
                <span className="animate-shimmer-text">
                  Model still loading…
                </span>
              ))}
          </span>
          <span
            className={`inline-block w-[0.55em] h-[1.15em] -mb-px ${
              active && hasFocus
                ? "bg-[var(--text)]"
                : "border border-[var(--text)] box-border"
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
            disabled={chatMode && chatStatus === "loading"}
            spellCheck={false}
            autoComplete="off"
            className="absolute inset-0 w-full h-full bg-transparent outline-none border-0 text-transparent caret-transparent disabled:cursor-default"
          />
        </div>
      </div>
    );
  }

  // Fills the same footer slot renderInputLine() normally occupies — the
  // prompt itself is hidden while this is up, and a separate offscreen
  // input (rendered by the caller) keeps capturing arrow/Enter/Esc.
  function renderModelPicker() {
    return (
      <div className="flex flex-col gap-1">
        <div className="text-[var(--text)] font-bold">Select model</div>
        <div className="text-[var(--text-secondary)]">
          Switch tyouAI's model — larger models answer better but take
          longer to download.
        </div>
        <div className="flex flex-col mt-0.5">
          {MODELS.map((m, i) => {
            const isCursor = i === modelPickerIndex;
            const isActive = m.id === modelId;
            const label = `${i + 1}. ${m.label}`.padEnd(18);
            const marker = isActive ? "✔ " : "  ";
            return (
              <div
                key={m.id}
                className={
                  isCursor ? "text-[var(--text)]" : "text-[var(--text-secondary)]"
                }
              >
                <span
                  className={`whitespace-pre ${
                    isCursor ? "text-[var(--accent)]" : "text-transparent"
                  }`}
                >
                  {isCursor ? "❯ " : "  "}
                </span>
                <span
                  className={`whitespace-pre ${
                    isCursor ? "text-[var(--accent)]" : "text-[var(--accent-secondary)]"
                  }`}
                >
                  {label}
                </span>
                <span
                  className={`whitespace-pre ${
                    isActive ? "text-[var(--accent)]" : ""
                  }`}
                >
                  {marker}
                </span>
                <span className="text-[var(--text-secondary)]">
                  {m.sizeGb}GB · {m.pro}
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-[var(--text-secondary)] mt-0.5">
          ↑/↓ to move · Enter to switch · Esc to cancel
        </div>
      </div>
    );
  }

  // Same footer slot again — a static reference instead of an interactive
  // picker, so it's just a list with nothing to move a cursor over.
  function renderHelpPanel() {
    return (
      <div className="flex flex-col gap-1">
        <div className="text-[var(--text)] font-bold">Help</div>
        <div className="text-[var(--text-secondary)]">
          tyouAI runs entirely in your browser via WebGPU — ask about a
          specific project, page, or piece of code for a sharper answer.
        </div>
        <div className="flex flex-col mt-0.5">
          {CHAT_COMMANDS.map((c) => (
            <div key={c.cmd}>
              <span className="whitespace-pre text-[var(--accent-secondary)]">
                {c.usage.padEnd(18)}
              </span>
              <span className="text-[var(--text-secondary)]">{c.desc}</span>
            </div>
          ))}
        </div>
        <div className="text-[var(--text-secondary)] mt-0.5">
          Esc to close
        </div>
      </div>
    );
  }

  // Commands to suggest above the prompt while typing one in chat mode —
  // shown the moment "/" is typed, narrowed as more of it is, and ranked so
  // the command closest to what's already typed (fewest letters left to
  // finish it) leads the list.
  const chatTyped = input.trim().toLowerCase();
  const chatCommandMatches =
    chatMode && input.startsWith("/")
      ? CHAT_COMMANDS.filter((c) => c.cmd.startsWith(chatTyped)).sort(
          (a, b) => a.cmd.length - b.cmd.length,
        )
      : [];

  function handleKeyDown(e) {
    // While the /model picker is up it owns the keyboard outright — no
    // typing, no history, just moving the cursor row and confirming/backing
    // out — so this branch returns unconditionally either way.
    if (modelPickerOpen) {
      e.preventDefault();
      if (e.key === "ArrowUp") {
        setModelPickerIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowDown") {
        setModelPickerIndex((i) => Math.min(MODELS.length - 1, i + 1));
      } else if (e.key === "Enter") {
        confirmModelPicker();
      } else if (e.key === "Escape") {
        cancelModelPicker();
      }
      return;
    }
    // The /help panel is purely informational — Esc or Enter just closes it.
    if (helpPanelOpen) {
      e.preventDefault();
      if (e.key === "Escape" || e.key === "Enter") setHelpPanelOpen(false);
      return;
    }
    const isCtrlC = e.ctrlKey && e.key.toLowerCase() === "c";
    // Inside chat, Ctrl+C only stops an in-flight reply — leaving the chat
    // itself is a /exit command now, not a key combo.
    if (chatMode && isCtrlC && chatStatus === "streaming") {
      e.preventDefault();
      engineRef.current?.interruptGenerate?.();
      print("^C");
      return;
    }
    // While the "/" command dropdown is up, arrow keys move its selection
    // instead of walking history, and Enter runs whichever row is selected
    // (defaulting to the closest match) rather than the raw typed text —
    // so "/mod" + Enter runs "/model" even without typing it out.
    if (chatCommandMatches.length > 0) {
      const clampedIndex = Math.min(chatCmdIndex, chatCommandMatches.length - 1);
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setChatCmdIndex(Math.max(0, clampedIndex - 1));
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setChatCmdIndex(Math.min(chatCommandMatches.length - 1, clampedIndex + 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        run(chatCommandMatches[clampedIndex].cmd);
        setInput("");
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      run(input);
      setInput("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const histRef = chatMode ? chatInputHistoryRef : historyRef;
      const histIndexRef = chatMode ? chatInputHistoryIndexRef : historyIndexRef;
      const hist = histRef.current;
      if (!hist.length) return;
      const idx = Math.max(0, histIndexRef.current - 1);
      histIndexRef.current = idx;
      setInput(hist[idx] || "");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const histRef = chatMode ? chatInputHistoryRef : historyRef;
      const histIndexRef = chatMode ? chatInputHistoryIndexRef : historyIndexRef;
      const hist = histRef.current;
      const idx = Math.min(hist.length, histIndexRef.current + 1);
      histIndexRef.current = idx;
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
      <div className="relative flex-1 min-h-0 w-full">
        <CustomScrollbar
          ref={scrollRef}
          wrapperClassName="h-full w-full"
          className="px-3 py-2 text-[12px] leading-relaxed"
          onClick={() => inputRef.current?.focus()}
          onScroll={handleScroll}
        >
          {lines.map((line) => {
            if (line.type === "cmd") {
              return (
                <div key={line.id} className="flex gap-1.5 flex-wrap">
                  <span className="text-[var(--accent)] shrink-0">
                    {line.prompt}
                    {" $"}
                  </span>
                  <span className="whitespace-pre-wrap break-all">
                    {line.text}
                  </span>
                </div>
              );
            }
            // A conversational turn — rendered as a card (background behind
            // it) rather than a plain text row, so the exchange reads apart
            // from the surrounding shell scrollback.
            if (line.type === "chat-user") {
              return (
                <div
                  key={line.id}
                  className="mt-1.5 rounded px-2 leading-snug bg-[var(--bg-secondary)]"
                >
                  <span className="text-[var(--accent)]">{"❯ "}</span>
                  <span className="whitespace-pre-wrap break-all">
                    {line.text}
                  </span>
                </div>
              );
            }
            if (line.type === "chat-ai") {
              return (
                <div
                  key={line.id}
                  className={`my-1.5 px-2 py-1 flex flex-col gap-0.5 leading-snug ${
                    line.state === "error"
                      ? "rounded border border-[var(--difficulty-hard)]"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    <span
                      className={`text-[var(--accent-secondary)] shrink-0 ${
                        line.state === "streaming" ? "animate-pulse" : ""
                      }`}
                    >
                      ⏺
                    </span>
                    <div className="min-w-0 flex-1">
                      {line.state === "error" ? (
                        <span className="whitespace-pre-wrap break-all text-[var(--difficulty-hard)]">
                          {line.text}
                        </span>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={terminalMarkdownComponents}
                        >
                          {line.text}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                  {/* Only shown before the first token arrives — once the
                    reply itself is rendering, the "thinking" status line is
                    redundant next to the actual generated text. */}
                  {line.state === "streaming" && !line.text && line.status && (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <Scribble />
                        <span className="animate-shimmer-text">
                          {line.status}
                        </span>
                      </div>
                      {line.tip && (
                        <span className="pl-[19px] text-[var(--text-secondary)]">
                          {"⎿ Tip: "}
                          {line.tip}
                        </span>
                      )}
                    </div>
                  )}
                  {line.state === "done" && line.status && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[var(--text-secondary)] shrink-0">
                        ✻
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        {line.status}
                      </span>
                    </div>
                  )}
                </div>
              );
            }
            // One line, edited in place as the model downloads/loads —
            // shimmering while in progress, settling to plain text once
            // finishModelProgress() lands the final "Now using X." message.
            if (line.type === "ai-progress") {
              return (
                <div
                  key={line.id}
                  className="flex items-start gap-1.5 whitespace-pre-wrap break-all text-[var(--accent-secondary)]"
                >
                  {line.animate ? (
                    <>
                      <Scribble />
                      <span className="animate-shimmer-text">{line.text}</span>
                    </>
                  ) : (
                    line.text
                  )}
                </div>
              );
            }
            if (line.type === "chat-intro") {
              return (
                <div
                  key={line.id}
                  className="flex items-center gap-3 mt-0 mb-4"
                >
                  <BrainLump />
                  <div className="min-w-0 leading-tight">
                    <div className="text-[var(--text)]">
                      <span className="font-bold">{line.bannerName}</span>{" "}
                      {line.bannerVersion}
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      {line.modelLine}
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      {line.location}
                    </div>
                  </div>
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
                      : line.type === "ai"
                        ? "text-[var(--accent-secondary)]"
                        : line.type === "meta"
                          ? "text-[var(--text-secondary)] italic"
                          : "text-[var(--text-secondary)]"
                }`}
              >
                {line.text}
              </div>
            );
          })}
          {/* In plain terminal mode the prompt is just the next line of the
              scrollback, like a real terminal — chat mode instead pins it to
              the bottom of the pane below (see the footer past the
              scrollbar). */}
          {!chatMode && renderInputLine()}
        </CustomScrollbar>

        {/* Floats over the transcript instead of taking its own row — a
          translucent, blurred pill rather than a solid block, so it stays
          legible without fully hiding the messages underneath it. */}
        {!atBottom && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
            <button
              type="button"
              onClick={jumpToBottom}
              className="pointer-events-auto flex items-center gap-1 leading-none bg-[var(--bg-secondary)]/80 backdrop-blur-sm px-2 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)]/90 cursor-pointer"
            >
              {unseenCount > 0
                ? `${unseenCount} new message${unseenCount === 1 ? "" : "s"} (click)`
                : "Jump to bottom (click) "}
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Only chat mode pins the input to the very bottom of the pane —
          outside the scrollable region above — so a reply streaming in
          above it doesn't shove the prompt around. The plain terminal
          renders its prompt inline in the scrollback instead (above). */}
      {chatMode && (
        <div
          className="relative shrink-0 px-3 pt-0 pb-2 text-[12px]"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Same floating, blurred-pill treatment as "Jump to bottom"
              above, but spanning the full width over the prompt instead of
              a centered pill — it's an inline autocomplete, not a page-wide
              affordance. Arrow keys move the selection (defaulting to the
              closest match); the part already typed is bolded in each row.
              Hidden while /model or /help owns the footer below. */}
          {!modelPickerOpen && !helpPanelOpen && chatCommandMatches.length > 0 && (
            <div className="absolute bottom-full left-3 right-3 mb-1 flex flex-col gap-0.5 bg-[var(--bg-secondary)]/80 backdrop-blur-sm px-2 py-1 text-[11px] pointer-events-none">
              {chatCommandMatches.map((c, i) => {
                const highlighted =
                  i === Math.min(chatCmdIndex, chatCommandMatches.length - 1);
                return (
                  <div
                    key={c.cmd}
                    className={`flex gap-2 ${
                      highlighted
                        ? "text-[var(--text)]"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    <span
                      className={`shrink-0 ${
                        highlighted
                          ? "text-[var(--accent)]"
                          : "text-[var(--accent-secondary)]"
                      }`}
                    >
                      <span className="font-bold">
                        {c.usage.slice(0, chatTyped.length)}
                      </span>
                      {c.usage.slice(chatTyped.length)}
                    </span>
                    <span>{c.desc}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div
            className="overflow-hidden whitespace-nowrap select-none text-[var(--border-secondary)]"
            aria-hidden="true"
          >
            {modelPickerOpen || helpPanelOpen ? PANEL_RULE : RULE}
          </div>
          {modelPickerOpen || helpPanelOpen ? (
            <>
              {modelPickerOpen ? renderModelPicker() : renderHelpPanel()}
              {/* Real input stays mounted (off-screen) so the panel keeps
                  capturing keyboard input via the same handleKeyDown. */}
              <input
                ref={inputRef}
                value=""
                onChange={() => {}}
                onKeyDown={handleKeyDown}
                className="absolute w-0 h-0 opacity-0 pointer-events-none"
                aria-hidden="true"
              />
            </>
          ) : (
            renderInputLine()
          )}
          <div
            className="overflow-hidden whitespace-nowrap select-none text-[var(--border-secondary)]"
            aria-hidden="true"
          >
            {modelPickerOpen || helpPanelOpen ? PANEL_RULE : RULE}
          </div>
        </div>
      )}
    </div>
  );
}

export default Terminal;
