import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  X,
  ArrowUp,
  Brain,
  Plus,
  History,
  Copy,
  Check,
  FileText,
  Trash2,
  Square,
  ChevronDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import Scribble from "./Scribble";
import ResizeHandle from "./ResizeHandle";
import CustomScrollbar from "./CustomScrollbar";
import {
  getEngine,
  isEngineReady,
  isWebGpuSupported,
} from "../lib/aiChatEngine";
import {
  MODELS,
  findModel,
  getStoredModelId,
  setStoredModelId,
  subscribeModelId,
} from "../lib/aiModels";
import { buildSystemPrompt } from "../lib/aiChatContext";
import chatMarkdownComponents from "../lib/chatMarkdownComponents";
import { fetchProblemMarkdown } from "../lib/leetcode";

const STORAGE_KEY = "tyouAiChats";
// The model running in the browser is small — a whole write-up would crowd
// out the portfolio context, so the page body gets a hard cap.
const MAX_TAB_BODY = 2000;
const REPLY_TIMEOUT_MS = 60000;
// Matches .animate-menu-up-out's duration in index.css. Shared by the model
// picker and the loading modal, which use the same exit animation.
const MODAL_CLOSE_MS = 120;
const MIN_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 720;
const DEFAULT_PANEL_WIDTH = 380;
const WIDTH_KEY = "tyouAiPanelWidth";
// Dragging the resize handle narrower than this snaps the panel fully
// closed on release, instead of resting at a barely-there sliver width —
// same idea (and value) as the sidebar's own SNAP_CLOSE_THRESHOLD.
const SNAP_CLOSE_THRESHOLD = 80;

// Cycled while a reply is generating, so the wait reads as the model doing
// something rather than a static spinner.
const THINKING_WORDS = [
  "Thinking",
  "Marinating",
  "Pondering",
  "Noodling",
  "Percolating",
  "Ruminating",
  "Mulling",
  "Simmering",
];

function newChat() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "New chat",
    messages: [],
    updatedAt: Date.now(),
  };
}

function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    // Corrupt/unreadable storage just starts fresh rather than breaking the panel.
  }
  return [newChat()];
}

// WebLLM's raw progress text is along the lines of "Fetching param
// cache[12/38]: 245MB fetched. 32% completed, 4 secs elapsed." — the shard
// counter, the fetch-vs-cache distinction, the elapsed time and the "it can
// take a while" explainer are all noise next to a progress bar. Only the MB
// figure is worth pulling out; the percentage comes from `progress` itself
// so the number can never disagree with the bar drawn beside it.
function describeProgress(text, progress) {
  const mb = text?.match(/([\d.]+)\s*MB/i);
  const percent = Math.round(progress * 100);
  if (mb) return `${mb[1]}MB fetched · ${percent}%`;
  return percent > 0 ? `${percent}%` : "Starting…";
}

// First user message doubles as the chat's title in the history list.
function titleFrom(text) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > 32 ? `${flat.slice(0, 32)}…` : flat;
}

// Coarse relative time for the chat history list — doesn't need to be more
// precise than "how long ago was this roughly".
function relativeTime(timestamp) {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.round(days / 365)}y`;
}

function ThinkingLine({ startedAt }) {
  const [wordIndex, setWordIndex] = useState(() =>
    Math.floor(Math.random() * THINKING_WORDS.length),
  );
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const word = setInterval(
      () => setWordIndex((i) => (i + 1) % THINKING_WORDS.length),
      2200,
    );
    const tick = setInterval(
      () => setElapsed(Math.round((Date.now() - startedAt) / 1000)),
      250,
    );
    return () => {
      clearInterval(word);
      clearInterval(tick);
    };
  }, [startedAt]);

  return (
    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
      <Scribble />
      <span>
        {THINKING_WORDS[wordIndex]}
        <span className="animate-thinking-ellipsis">...</span>
      </span>
      {elapsed > 0 && (
        <span className="text-[10px] opacity-70">({elapsed}s)</span>
      )}
    </div>
  );
}

// The file that was in context — clickable so it opens that tab in the
// pane behind the panel, the way Claude Code's context files are.
function ContextChip({ label, onOpen, className = "" }) {
  const content = (
    <>
      <FileText className="w-3 h-3 shrink-0" />
      <span className="truncate">{label}</span>
    </>
  );
  if (!onOpen) {
    return (
      <span
        className={`flex items-center gap-1 min-w-0 text-[10px] text-[var(--text-secondary)] ${className}`}
      >
        {content}
      </span>
    );
  }
  return (
    <button
      onClick={onOpen}
      title={`Open ${label}`}
      className={`flex items-center gap-1 min-w-0 text-[10px] text-[var(--accent)] hover:underline cursor-pointer ${className}`}
    >
      {content}
    </button>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (permissions, insecure context) — the
      // button just doesn't confirm rather than throwing at the user.
    }
  }

  return (
    <button
      onClick={copy}
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer shrink-0"
      aria-label={copied ? "Copied" : "Copy response"}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function AiChatPanel({
  isOpen,
  onOpen,
  onClose,
  activeTab,
  onOpenTab,
  experiences,
  extracurriculars,
  projects,
  books,
  blogPosts,
  leetcodeProblems,
}) {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [tabBody, setTabBody] = useState("");
  const [streamStartedAt, setStreamStartedAt] = useState(null);

  const [chats, setChats] = useState(loadChats);
  // Derived from the already-loaded list, not a second loadChats() call —
  // that would mint a different random id when storage is empty and leave
  // activeChatId pointing at a chat that isn't in `chats`.
  const [activeChatId, setActiveChatId] = useState(() => chats[0].id);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Shared with Terminal via aiModels.js's external store, not local state —
  // so switching models in the CLI's /model picker moves this panel's
  // selection too, live, instead of only agreeing at first mount.
  const modelId = useSyncExternalStore(subscribeModelId, getStoredModelId);
  const setModelId = setStoredModelId;
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [modelMenuRendered, setModelMenuRendered] = useState(false);
  const [modelMenuClosing, setModelMenuClosing] = useState(false);
  const [historyRendered, setHistoryRendered] = useState(false);
  const [historyClosing, setHistoryClosing] = useState(false);
  const [loadingRendered, setLoadingRendered] = useState(false);
  const [loadingClosing, setLoadingClosing] = useState(false);
  const [queued, setQueued] = useState([]);
  const model = findModel(modelId);

  // Keeps the picker mounted for one extra beat after modelMenuOpen goes
  // false, so its close animation actually plays instead of the menu just
  // vanishing the moment a model is picked (or the button re-clicked).
  useEffect(() => {
    if (modelMenuOpen) {
      setModelMenuRendered(true);
      setModelMenuClosing(false);
      return;
    }
    if (!modelMenuRendered) return;
    setModelMenuClosing(true);
    const timeout = setTimeout(() => {
      setModelMenuRendered(false);
      setModelMenuClosing(false);
    }, MODAL_CLOSE_MS);
    return () => clearTimeout(timeout);
  }, [modelMenuOpen, modelMenuRendered]);

  // Same mount-through-close pattern as the model picker, for the chat
  // history dropdown.
  useEffect(() => {
    if (historyOpen) {
      setHistoryRendered(true);
      setHistoryClosing(false);
      return;
    }
    if (!historyRendered) return;
    setHistoryClosing(true);
    const timeout = setTimeout(() => {
      setHistoryRendered(false);
      setHistoryClosing(false);
    }, MODAL_CLOSE_MS);
    return () => clearTimeout(timeout);
  }, [historyOpen, historyRendered]);

  // Same mount-through-close the picker uses: without it the loading modal
  // would animate in and then vanish outright the instant the model is
  // ready, since `status` leaving "loading" unmounts it immediately.
  useEffect(() => {
    if (status === "loading") {
      setLoadingRendered(true);
      setLoadingClosing(false);
      return;
    }
    if (!loadingRendered) return;
    setLoadingClosing(true);
    const timeout = setTimeout(() => {
      setLoadingRendered(false);
      setLoadingClosing(false);
    }, MODAL_CLOSE_MS);
    return () => clearTimeout(timeout);
  }, [status, loadingRendered]);

  // Clicking anywhere else — the transcript, the input, the header — closes
  // the picker, rather than it staying up until you find the button again.
  // Two exclusions: the toggle button, whose own handler would otherwise
  // reopen what this just closed, and the menu itself — closing on
  // pointerdown there would leave it pointer-events-none for its exit
  // animation before the option's click could land, so picking a model
  // would silently do nothing.
  useEffect(() => {
    if (!modelMenuOpen) return;
    const onPointerDown = (e) => {
      if (modelMenuRef.current?.contains(e.target)) return;
      if (modelButtonRef.current?.contains(e.target)) return;
      setModelMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [modelMenuOpen]);

  // Grow the input with its content up to a cap, then let it scroll —
  // reset to auto first so it can shrink back when text is deleted.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    return saved >= MIN_PANEL_WIDTH && saved <= MAX_PANEL_WIDTH
      ? saved
      : DEFAULT_PANEL_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const widthAtDragStart = useRef(panelWidth);
  const liveWidthRef = useRef(panelWidth);

  useEffect(() => {
    localStorage.setItem(WIDTH_KEY, String(panelWidth));
  }, [panelWidth]);

  const engineRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const modelMenuRef = useRef(null);
  const modelButtonRef = useRef(null);
  const cancelledRef = useRef(false);
  const timedOutRef = useRef(false);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  // Memoised so the `|| []` fallback doesn't hand the scroll effect below a
  // fresh array identity on every render and re-fire it endlessly.
  const messages = useMemo(() => activeChat?.messages || [], [activeChat]);

  const portfolioData = useMemo(
    () => ({
      experiences,
      extracurriculars,
      projects,
      books,
      blogPosts,
      leetcodeProblems,
    }),
    [
      experiences,
      extracurriculars,
      projects,
      books,
      blogPosts,
      leetcodeProblems,
    ],
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch {
      // Storage full/blocked — chats just won't survive a reload.
    }
  }, [chats]);

  // LeetCode write-ups live as markdown in a separate repo, not in the CMS
  // record, so without this the model only ever knew the problem's title.
  const leetcodePath = activeTab?.leetcodePath;
  useEffect(() => {
    if (!leetcodePath) {
      setTabBody("");
      return;
    }
    let cancelled = false;
    fetchProblemMarkdown(leetcodePath)
      .then((raw) => {
        if (!cancelled) setTabBody(raw);
      })
      .catch(() => {
        if (!cancelled) setTabBody("");
      });
    return () => {
      cancelled = true;
    };
  }, [leetcodePath]);

  // Runs on open and on every model switch. Always drops back to the
  // loading screen first — even a cached model has to be re-read and
  // recompiled for WebGPU, which isn't instant, and showing the panel as
  // ready while that happens just looks broken.
  useEffect(() => {
    if (!isOpen) return;

    if (!isWebGpuSupported()) {
      setStatus("unsupported");
      return;
    }

    let stale = false;
    setError("");
    setProgress(0);
    setProgressText("");
    setStatus("loading");
    engineRef.current = null;

    getEngine(modelId, (report) => {
      if (stale) return;
      setProgress(report.progress || 0);
      setProgressText(report.text || "");
    })
      .then((engine) => {
        if (stale) return;
        engineRef.current = engine;
        setStatus("ready");
      })
      .catch((err) => {
        if (stale) return;
        setError(err?.message || "Failed to load the AI model.");
        setStatus("error");
      });

    return () => {
      // A newer model selection supersedes this one — ignore its results.
      stale = true;
    };
  }, [isOpen, modelId]);

  // Drain one queued message as soon as the model is free again.
  useEffect(() => {
    if (status !== "ready" || queued.length === 0 || !engineRef.current) return;
    const [next, ...rest] = queued;
    setQueued(rest);
    sendMessage(next);
    // sendMessage is stable enough for this — re-running on every render
    // would re-fire the send.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, queued]);

  // Transcript runs newest-at-the-bottom and follows the stream; the
  // question stays visible in the sticky bar above it instead.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  // Each question is paired with the answer under it. The question itself
  // is rendered only in the sticky bar (never inline with a "> "), so it
  // doesn't appear twice.
  const turns = useMemo(() => {
    const out = [];
    messages.forEach((m, i) => {
      if (m.role === "user") {
        out.push({ question: m, answer: null, answerIndex: -1 });
      } else if (out.length && !out[out.length - 1].answer) {
        out[out.length - 1].answer = m;
        out[out.length - 1].answerIndex = i;
      } else {
        out.push({ question: null, answer: m, answerIndex: i });
      }
    });
    return out;
  }, [messages]);

  // Which turn the bar describes: the last one scrolled to or past the top
  // edge, so scrolling back through answers walks the bar back through the
  // questions that produced them.
  const [activeTurn, setActiveTurn] = useState(0);
  const turnRefs = useRef({});

  useEffect(() => {
    setActiveTurn(Math.max(0, turns.length - 1));
  }, [turns.length]);

  // Threshold is the viewport's midpoint, not its top: with the top edge,
  // the newest turn never qualifies (there's no room left to scroll it up
  // there), so the bar would sit stuck on an older question.
  function syncActiveTurn() {
    const list = listRef.current;
    if (!list) return;
    const listTop = list.getBoundingClientRect().top;
    const threshold = list.clientHeight / 2;
    let current = 0;
    turns.forEach((_, i) => {
      const el = turnRefs.current[i];
      if (el && el.getBoundingClientRect().top - listTop <= threshold)
        current = i;
    });
    setActiveTurn(current);
  }

  const respondingTo = turns[activeTurn]?.question || null;

  function updateActiveChat(updater) {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...updater(chat), updatedAt: Date.now() }
          : chat,
      ),
    );
  }

  function startNewChat() {
    const chat = newChat();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setHistoryOpen(false);
  }

  function deleteChat(id) {
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      const next = remaining.length ? remaining : [newChat()];
      if (id === activeChatId) setActiveChatId(next[0].id);
      return next;
    });
  }

  // Typing while a reply streams queues the message instead of dropping
  // it; the effect below sends it once the model frees up.
  function submit() {
    const text = input.trim();
    if (!text) return;
    if (status === "streaming") {
      setQueued((q) => [...q, text]);
      setInput("");
      return;
    }
    sendMessage(text);
  }

  async function sendMessage(rawText) {
    const text = (rawText ?? input).trim();
    if (!text || status !== "ready" || !engineRef.current) return;

    // Snapshot the file that was in context for this turn, so the pinned
    // message keeps showing what it was actually asked against.
    const history = [
      ...messages,
      {
        role: "user",
        content: text,
        contextLabel: activeTab?.label,
        contextId: activeTab?.id,
      },
    ];
    updateActiveChat((chat) => ({
      ...chat,
      title: chat.messages.length === 0 ? titleFrom(text) : chat.title,
      messages: [...history, { role: "assistant", content: "" }],
    }));
    setInput("");
    setStatus("streaming");
    cancelledRef.current = false;
    timedOutRef.current = false;
    const startedAt = Date.now();
    setStreamStartedAt(startedAt);

    // A small local model on a slow device can grind for a long time —
    // cut it off rather than leaving the panel stuck mid-reply.
    const timeout = setTimeout(() => {
      timedOutRef.current = true;
      cancelledRef.current = true;
      engineRef.current?.interruptGenerate?.();
    }, REPLY_TIMEOUT_MS);

    try {
      const tabContext = activeTab
        ? {
            ...activeTab,
            context: tabBody
              ? `${activeTab.context}\n\nThe page's full write-up:\n${tabBody.slice(0, MAX_TAB_BODY)}`
              : activeTab.context,
          }
        : null;

      const stream = await engineRef.current.chat.completions.create({
        messages: [
          {
            role: "system",
            content: buildSystemPrompt({
              ...portfolioData,
              activeTab: tabContext,
            }),
          },
          ...history,
        ],
        stream: true,
        // Low, deliberately: a small model at higher temperature is much
        // more likely to wander off-script and start narrating itself.
        temperature: 0.3,
      });

      let reply = "";
      for await (const chunk of stream) {
        if (cancelledRef.current) break;
        const delta = chunk.choices[0]?.delta?.content || "";
        if (!delta) continue;
        reply += delta;
        updateActiveChat((chat) => ({
          ...chat,
          messages: [...history, { role: "assistant", content: reply }],
        }));
      }

      const note = timedOutRef.current
        ? "_Took too long, so I stopped there._"
        : cancelledRef.current
          ? "_Stopped._"
          : "";
      const finalReply = note ? `${reply}${reply ? "\n\n" : ""}${note}` : reply;
      const thoughtMs = Date.now() - startedAt;
      updateActiveChat((chat) => ({
        ...chat,
        messages: [
          ...history,
          { role: "assistant", content: finalReply, thoughtMs },
        ],
      }));
    } catch (err) {
      setError(err?.message || "Something went wrong generating a reply.");
    } finally {
      clearTimeout(timeout);
      setStatus("ready");
      setStreamStartedAt(null);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") cancelGeneration();
  }

  // Esc interrupts an in-flight reply. interruptGenerate() ends the stream
  // early, so the loop below it exits on its own and whatever text arrived
  // so far is kept rather than discarded.
  function cancelGeneration() {
    if (status !== "streaming") return;
    cancelledRef.current = true;
    engineRef.current?.interruptGenerate?.();
  }

  // The textarea is disabled mid-reply, so its own keydown never fires —
  // this is what actually makes Esc work while streaming.
  useEffect(() => {
    if (!isOpen || status !== "streaming") return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      cancelledRef.current = true;
      engineRef.current?.interruptGenerate?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, status]);

  // Loading gets its own modal over the transcript (see below); only the
  // states that need explaining sit in the transcript itself.
  const statusBlock =
    status === "unsupported" ? (
      <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
        tyouAI runs straight in your browser (no server, no API key, no rate
        limit) — but it needs WebGPU, and this browser doesn't have it. Try a
        recent Chrome or Edge on desktop.
      </p>
    ) : status === "error" ? (
      <p className="text-[var(--difficulty-hard)] text-xs leading-relaxed">
        {error}
      </p>
    ) : null;

  // A modal over the transcript rather than a strip above the composer:
  // there's nothing to read behind it until the model is up, so covering
  // the chat makes the wait the one thing on screen. Scoped to the
  // transcript (absolute, not fixed) so the header and composer stay
  // visible — you can still close the panel or switch chats mid-download.
  // items-end keeps the card itself sitting directly above the prompt box,
  // where the pinned progress strip used to be, while its backdrop covers
  // the chat text above it. px-2 mirrors the composer wrapper's p-2 so the
  // card lines up edge-for-edge with the prompt box below it; pb-px adds to
  // that wrapper's own pt-2 for the same 9px the model picker leaves above
  // the box (its mb-2.5 is measured from the padding box, so the box's 1px
  // border eats into it — hence px here rather than a matching 2.5).
  const loadingModal = loadingRendered ? (
    <div
      className={`absolute inset-0 z-20 flex items-end justify-center px-2 pb-px pt-3 bg-[var(--bg)]/95 ${
        loadingClosing
          ? "animate-modal-backdrop-out pointer-events-none"
          : "animate-modal-backdrop-in"
      }`}
    >
      {/* menu-up, not modal-in/out — this one is anchored to the bottom,
            so it should rise into place and sink back out, rather than drop
            in from above. */}
      <div
        className={`w-full flex flex-col gap-2.5 rounded border border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-3 ${
          loadingClosing ? "animate-menu-up-out" : "animate-menu-up-in"
        }`}
      >
        <div className="flex items-start gap-2 text-[var(--text-secondary)] text-xs leading-relaxed">
          <Scribble />
          <span>
            One sec, pulling {model.label} down to run locally in your browser.
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-[width] duration-200"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="text-[var(--text-secondary)] text-[10px] truncate">
          {describeProgress(progressText, progress)}
        </p>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Drag to resize/reopen — deliberately a fixed sibling of the
          collapsing/clipped wrapper below rather than a child of it: that
          wrapper's width collapses to 0 (with overflow-hidden) while
          closed, which would clip an always-rendered handle down to
          nothing. Anchored from the viewport's right edge (`right`, not
          `left`) so its position tracks the panel/content boundary — which
          sits at `panelWidth` from the edge when open, and flush at the
          edge itself when closed — without needing to know the viewport
          width. Always rendered on desktop (even while closed) so the
          collapsed edge can still be grabbed and dragged back open. It's an
          invisible hit-target either way, so there's nothing extra to show
          while closed; only the drag behavior changes. */}
      <ResizeHandle
        className="hidden sm:block fixed top-[57px] sm:top-[var(--toolbar-height)] bottom-[37px] sm:bottom-[33px] w-2 z-50"
        style={{ right: `${isOpen ? panelWidth - 4 : 0}px` }}
        onDragStart={() => {
          if (!isOpen) {
            // Starting from fully closed: open it and start the width at 0
            // rather than the stale last-open width, so it visibly grows
            // from nothing as it's pulled out instead of popping open
            // instantly.
            onOpen?.();
            setPanelWidth(0);
            widthAtDragStart.current = 0;
            // A plain click (mousedown+mouseup, no real movement) never
            // calls onDrag, so without this, onDragEnd's snap-close check
            // below would see whatever liveWidthRef was left over from the
            // last real drag — not the 0 this gesture actually started at —
            // and fail to detect "that wasn't a drag," leaving the panel
            // stuck open-but-0-width instead of cleanly closed.
            liveWidthRef.current = 0;
          } else {
            widthAtDragStart.current = panelWidth;
          }
          setIsResizing(true);
        }}
        onDrag={(deltaX) => {
          const next = Math.min(
            MAX_PANEL_WIDTH,
            Math.max(0, widthAtDragStart.current - deltaX),
          );
          liveWidthRef.current = next;
          setPanelWidth(next);
        }}
        onDragEnd={() => {
          setIsResizing(false);
          if (liveWidthRef.current < SNAP_CLOSE_THRESHOLD) {
            onClose?.();
            setPanelWidth(DEFAULT_PANEL_WIDTH);
          }
        }}
      />
      <div
        // On the outer wrapper, not the inner panel: this one collapses to
        // zero width when closed, which is exactly the signal the tour uses to
        // skip a step whose target isn't really on screen.
        data-tour="ai-panel"
        style={{ "--ai-panel-width": `${panelWidth}px` }}
        className={`fixed sm:static inset-0 z-40 sm:z-auto overflow-hidden sm:shrink-0 ${
          // Skipped mid-drag: transitioning width would make the handle lag
          // behind the cursor.
          isResizing ? "" : "transition-all duration-300 ease-in-out"
        } ${
          isOpen
            ? "translate-x-0 sm:w-[var(--ai-panel-width)]"
            : "translate-x-full sm:translate-x-0 sm:w-0"
        }`}
      >
        <div className="flex flex-col h-full w-full sm:w-[var(--ai-panel-width)] bg-[var(--bg)] text-[var(--text)] sm:border-l border-[var(--border-secondary)] font-mono text-sm">
          {/* Header — current chat title, new chat, history, close. */}
          <div className="relative flex items-center justify-between gap-2 px-3 pt-2 pb-[9px] border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text)] shrink-0">
            <span className="flex items-center gap-2 text-xs font-bold min-w-0 text-[var(--accent)]">
              <Brain className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">tyouAI</span>
            </span>
            {/* -my-1 (not -m-1) on the buttons: the vertical cancel keeps the
              header the same height as the main one it lines up with, while
              leaving the horizontal padding in place so gap-1 puts real space
              between the hover rectangles instead of overlapping them. */}
            <span className="flex items-center gap-1 shrink-0">
              <button
                onClick={startNewChat}
                className="text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] p-1 -my-1 rounded cursor-pointer"
                aria-label="New chat"
                title="New chat"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setHistoryOpen((open) => !open)}
                className="text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] p-1 -my-1 rounded cursor-pointer"
                aria-label="Chat history"
                title="Chat history"
              >
                <History className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] p-1 -my-1 rounded cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>

            {historyRendered && (
              <CustomScrollbar
                wrapperClassName={`absolute top-full left-0 right-0 z-20 ${
                  historyClosing ? "animate-modal-out" : "animate-modal-in"
                }`}
                className="max-h-64 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]"
              >
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-[var(--bg-tertiary)] ${
                      chat.id === activeChatId ? "bg-[var(--bg-tertiary)]" : ""
                    }`}
                    onClick={() => {
                      setActiveChatId(chat.id);
                      setHistoryOpen(false);
                    }}
                  >
                    <span className="truncate flex-1">{chat.title}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
                      {relativeTime(chat.updatedAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] p-1 rounded cursor-pointer shrink-0"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </CustomScrollbar>
            )}
          </div>

          {/* The question for whatever answer you're currently looking at —
            always present, and the only place a question is rendered.
            Scrolling back through answers walks it back too. */}
          {respondingTo && (
            <div className="p-2 shrink-0">
              <div className="flex flex-col gap-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-secondary)] p-2">
                <span className="truncate text-[11px]">
                  {respondingTo.content}
                </span>
                {respondingTo.contextLabel && (
                  <ContextChip
                    label={respondingTo.contextLabel}
                    onOpen={
                      respondingTo.contextId
                        ? () => onOpenTab?.(respondingTo.contextId)
                        : null
                    }
                  />
                )}
              </div>
            </div>
          )}

          {/* Transcript. Wrapped in a relative box purely so the loading
            modal has something panel-shaped to cover. */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            <CustomScrollbar
              ref={listRef}
              onScroll={syncActiveTurn}
              wrapperClassName="flex-1 min-h-0 w-full"
              className="p-3 flex flex-col gap-3"
            >
              {/* A fresh chat leads with the "ty." mark + greeting, with any
              model status tucked underneath rather than replacing it. */}
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-2">
                  <Brain className="w-8 h-8 text-[var(--accent)]" />
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                    Hey, I'm tyouAI. Ask me about Tyler's work, projects, or
                    whatever's on the page you're looking at.
                  </p>
                  {statusBlock}
                </div>
              )}

              {messages.length > 0 && statusBlock}

              {turns.map((turn, ti) => {
                const answer = turn.answer;
                return (
                  <div
                    key={ti}
                    ref={(el) => {
                      turnRefs.current[ti] = el;
                    }}
                    className="group flex flex-col gap-3"
                  >
                    {turn.question && (
                      <div className="flex flex-col gap-1 animate-content-in">
                        <div className="flex flex-col gap-0.5 rounded border border-[var(--border-secondary)] p-2">
                          <span className="min-w-0 flex-1 whitespace-pre-wrap leading-relaxed text-[13px]">
                            {turn.question.content}
                          </span>
                          {turn.question.contextLabel && (
                            <ContextChip
                              label={turn.question.contextLabel}
                              onOpen={
                                turn.question.contextId
                                  ? () => onOpenTab?.(turn.question.contextId)
                                  : null
                              }
                            />
                          )}
                        </div>
                      </div>
                    )}
                    {answer && (
                      <div className="flex flex-col gap-1">
                        {answer.content && answer.thoughtMs != null && (
                          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                            <span aria-hidden="true">✻</span>
                            Thought for {(answer.thoughtMs / 1000).toFixed(1)}s
                          </div>
                        )}
                        <div
                          key={answer.thoughtMs != null ? "final" : "pending"}
                          className="flex items-start gap-2 animate-content-in"
                        >
                          {/* The bullet marks an actual answer — while it's
                          still thinking the scribble is the only marker. */}
                          {answer.content && (
                            <span
                              className="w-1.5 h-1.5 mt-[7px] rounded-full bg-[var(--accent)] shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <div className="min-w-0 flex-1 text-[13px]">
                            {answer.content ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[
                                  [
                                    rehypeHighlight,
                                    { detect: true, ignoreMissing: true },
                                  ],
                                ]}
                                components={chatMarkdownComponents}
                              >
                                {answer.content}
                              </ReactMarkdown>
                            ) : (
                              <ThinkingLine
                                startedAt={streamStartedAt || Date.now()}
                              />
                            )}
                          </div>
                          {answer.content && (
                            <CopyButton text={answer.content} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CustomScrollbar>
            {loadingModal}
          </div>

          {/* Composer — input and the model/context row are one bordered box
            with an internal divider, rather than a bordered input sitting
            above separate controls. */}
          <div className="p-2 shrink-0">
            {queued.length > 0 && (
              <div className="flex flex-col gap-1 mb-1.5">
                {queued.map((q, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] min-w-0"
                  >
                    <span className="shrink-0 opacity-70">queued</span>
                    <span className="truncate">{q}</span>
                    <button
                      onClick={() =>
                        setQueued((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="ml-auto shrink-0 hover:text-[var(--text)] cursor-pointer"
                      aria-label="Remove queued message"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative rounded border border-[var(--border-secondary)] bg-[var(--bg-secondary)] focus-within:border-[var(--accent)] transition-colors">
              <div className="p-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={status !== "ready" && status !== "streaming"}
                  rows={1}
                  placeholder={
                    status === "ready"
                      ? "Ask away…"
                      : status === "unsupported"
                        ? "Unavailable in this browser"
                        : status === "streaming"
                          ? "Queue another message… (esc to stop)"
                          : "Model still loading…"
                  }
                  // placeholder:text-* — the browser's default placeholder
                  // colour is a fixed grey that ignores the theme entirely,
                  // so "Unavailable in this browser" (and the other states)
                  // sat off-palette, worst on the dark themes.
                  className={`w-full resize-none outline-none border-0 bg-transparent text-[var(--text)] placeholder:text-[var(--text-secondary)] text-[13px] leading-relaxed disabled:opacity-50 ${
                    status === "loading" ? "placeholder-breathing" : ""
                  }`}
                />
              </div>

              <div className="flex items-center gap-3 px-2 py-1.5 border-t border-[var(--border-secondary)] text-[10px] text-[var(--text-secondary)] min-w-0">
                <button
                  ref={modelButtonRef}
                  onClick={() => setModelMenuOpen((open) => !open)}
                  disabled={status === "loading"}
                  className="flex items-center gap-1 shrink-0 hover:text-[var(--text)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[var(--text-secondary)]"
                  title={
                    status === "loading" ? "Model is loading…" : "Change model"
                  }
                >
                  <Brain className="w-3 h-3" />
                  <span className="truncate">{model.label}</span>
                  {/* Tailwind v4's rotate-* sets the standalone `rotate`
                    property, not `transform` — transitioning `transform`
                    here animates nothing. */}
                  <ChevronDown
                    className={`w-3 h-3 transition-[rotate] duration-200 ${
                      modelMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {activeTab?.label && (
                  <ContextChip
                    label={activeTab.label}
                    onOpen={
                      activeTab.id ? () => onOpenTab?.(activeTab.id) : null
                    }
                  />
                )}
                {/* Mid-reply the button stops generation — unless there's
                  something typed, in which case it queues that instead. */}
                {status === "streaming" && !input.trim() ? (
                  <button
                    onClick={cancelGeneration}
                    className="ml-auto p-1 rounded bg-[var(--accent)] text-[var(--bg)] cursor-pointer shrink-0"
                    aria-label="Stop generating"
                    title="Stop (esc)"
                  >
                    <Square className="w-3.5 h-3.5" fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={
                      (status !== "ready" && status !== "streaming") ||
                      !input.trim()
                    }
                    className="ml-auto p-1 rounded bg-[var(--accent)] text-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    aria-label={
                      status === "streaming" ? "Queue message" : "Send"
                    }
                    title={status === "streaming" ? "Queue message" : "Send"}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {modelMenuRendered && (
                <div
                  ref={modelMenuRef}
                  className={`absolute bottom-full left-0 right-0 mb-2.5 z-30 rounded border border-[var(--border-secondary)] bg-[var(--bg-secondary)] overflow-hidden ${
                    modelMenuClosing
                      ? // pointer-events-none so the extra beat it stays
                        // mounted for can't swallow a click meant for what's
                        // underneath it.
                        "animate-menu-up-out pointer-events-none"
                      : "animate-menu-up-in"
                  }`}
                >
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setModelId(m.id);
                        setModelMenuOpen(false);
                      }}
                      className={`flex w-full flex-col gap-0.5 px-2 py-1.5 text-left cursor-pointer hover:bg-[var(--bg-tertiary)] ${
                        m.id === modelId ? "bg-[var(--bg-tertiary)]" : ""
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--text)]">
                        {m.id === modelId && (
                          <Check className="w-3 h-3 shrink-0" />
                        )}
                        <span className="truncate">{m.label}</span>
                        <span className="ml-auto shrink-0 text-[10px] text-[var(--text-secondary)]">
                          {m.sizeGb} GB
                          {isEngineReady(m.id) ? " · loaded" : ""}
                        </span>
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] leading-snug">
                        {m.pro}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AiChatPanel;
