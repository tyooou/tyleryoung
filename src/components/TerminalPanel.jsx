import { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, SquareSplitHorizontal, TerminalSquare, Trash2 } from "lucide-react";
import Terminal from "./Terminal";
import ResizeHandle from "./ResizeHandle";
import HeaderTooltip from "./HeaderTooltip";
import { buildFileTree, dirForTab } from "../lib/virtualFs";

const MIN_HEIGHT = 140;
const MAX_HEIGHT = 640;
const DEFAULT_HEIGHT = 260;
// Dragging the resize handle shorter than this snaps the panel fully closed
// on release, instead of resting at a barely-there sliver height — same
// idea (and value) as the sidebar's own SNAP_CLOSE_THRESHOLD.
const SNAP_CLOSE_THRESHOLD = 80;
const HEIGHT_KEY = "tyouTerminalHeight";
const SESSIONS_KEY = "tyouTerminalSessions";
const GROUPS_KEY = "tyouTerminalGroups";
const PANE_IDS_KEY = "tyouTerminalPaneIds";
const FOCUSED_INDEX_KEY = "tyouTerminalFocusedIndex";

let sessionSeq = 0;
function makeSession(cwd) {
  sessionSeq += 1;
  return { id: sessionSeq, name: `${sessionSeq}`, cwd };
}

let groupSeq = 0;
function nextGroupId() {
  groupSeq += 1;
  return groupSeq;
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Only the session's identity/location is remembered across a reload, not
// its scrollback — cheap to restore, and re-running a lost command is a lot
// less surprising than a terminal silently forgetting which ones existed
// or what was split with what. Bumps the id/group counters past whatever
// was restored so a freshly created session or group can never collide
// with one that came back from storage.
function readStoredSessions() {
  const parsed = readJSON(SESSIONS_KEY, []);
  if (!Array.isArray(parsed)) return [];
  const maxId = parsed.reduce((max, s) => Math.max(max, Number(s?.id) || 0), 0);
  if (maxId > sessionSeq) sessionSeq = maxId;
  return parsed.filter((s) => s && typeof s.id === "number");
}

function readStoredGroups() {
  const parsed = readJSON(GROUPS_KEY, {});
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  const maxId = Object.keys(parsed).reduce((max, k) => Math.max(max, Number(k) || 0), 0);
  if (maxId > groupSeq) groupSeq = maxId;
  return parsed;
}

// A VS Code-style integrated terminal docked to the bottom of the page.
//
// A "group" is a set of 2+ terminals that have been split together — it's
// a standing relationship, not just "whatever happens to be on screen right
// now": pressing split repeatedly keeps adding panes to the same group (not
// toggling split on/off), and a group's branch connector stays visible in
// the rail even while some other, unrelated terminal is what's actually
// being shown. Clicking a rail icon that belongs to a group reopens every
// pane in that group; clicking a standalone one just shows that terminal
// alone.
//
// Always mounted (like AiChatPanel) so scrollback survives toggling it
// closed and back open — `isOpen` just drives the slide animation.
function TerminalPanel({
  isOpen,
  onOpen,
  onClose,
  activeTabId,
  data,
  releases = [],
  onOpenTab,
  leftInset = 0,
  onReservedHeightChange,
  onResizingChange,
}) {
  const { root, pathById } = useMemo(
    () => buildFileTree({ ...data, releases }),
    [data, releases],
  );
  const version = releases[0]?.version || "dev";

  // Every piece of terminal state below is restored from localStorage on
  // mount (and re-saved whenever it changes) so reopening the site brings
  // back whichever terminals — and split arrangement — were open before,
  // the same way Portfolio remembers whether the panel itself was open.
  const [sessions, setSessions] = useState(readStoredSessions);
  // groupId -> ordered array of session ids (left-to-right pane order for
  // that group). Persists independently of what's currently on screen.
  const [groups, setGroups] = useState(readStoredGroups);
  // The session ids currently shown as side-by-side panes, left to right.
  // Length 1 = no split; 2+ = that many panes — always either a whole
  // group's members, or a single standalone terminal.
  const [paneIds, setPaneIds] = useState(() => readJSON(PANE_IDS_KEY, []));
  const [focusedIndex, setFocusedIndex] = useState(() => readJSON(FOCUSED_INDEX_KEY, 0)); // index into paneIds

  useEffect(() => {
    localStorage.setItem(
      SESSIONS_KEY,
      JSON.stringify(sessions.map(({ id, name, cwd }) => ({ id, name, cwd }))),
    );
  }, [sessions]);
  useEffect(() => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  }, [groups]);
  useEffect(() => {
    localStorage.setItem(PANE_IDS_KEY, JSON.stringify(paneIds));
  }, [paneIds]);
  useEffect(() => {
    localStorage.setItem(FOCUSED_INDEX_KEY, JSON.stringify(focusedIndex));
  }, [focusedIndex]);

  const [height, setHeight] = useState(() => {
    const saved = Number(localStorage.getItem(HEIGHT_KEY));
    return saved >= MIN_HEIGHT && saved <= MAX_HEIGHT ? saved : DEFAULT_HEIGHT;
  });
  const [isResizing, setIsResizing] = useState(false);
  const heightAtDragStart = useRef(height);
  const liveHeightRef = useRef(height);

  useEffect(() => {
    localStorage.setItem(HEIGHT_KEY, String(height));
  }, [height]);

  // Panel takes no vertical space of its own in the flex layout (see the
  // render comment below) — this is how the rest of the page knows how much
  // room to reserve at the bottom so the panel never has to overlap it.
  useEffect(() => {
    onReservedHeightChange?.(isOpen ? height : 0);
  }, [isOpen, height, onReservedHeightChange]);

  // First open ever (nothing restored from a previous visit and nothing
  // created yet this session) seeds one session at wherever the visitor
  // currently is, rather than always starting back at root. Guarded by a
  // ref rather than just `sessions.length` — StrictMode's dev-only
  // double-invoke of effects fires this twice back-to-back, before the
  // first call's setSessions has actually committed a re-render, so a
  // length check alone (reading the same stale `sessions` from either
  // invocation) let both through and silently seeded 2-3 sessions instead
  // of 1. That's what made the terminal look impossible to close: closing
  // the one visible session just revealed another identical-looking one
  // underneath it.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!isOpen || seededRef.current) return;
    seededRef.current = true;
    if (sessions.length > 0) {
      // Restored from a previous visit. paneIds/focusedIndex were restored
      // right alongside it — just guard against the pane list somehow
      // being empty (e.g. storage from an older version of this panel).
      if (paneIds.length === 0) setPaneIds([sessions[0].id]);
      return;
    }
    const session = makeSession(dirForTab(pathById, activeTabId));
    setSessions([session]);
    setPaneIds([session.id]);
    setFocusedIndex(0);
    // pathById is stable per data/releases identity — activeTabId is only
    // read for this one-time seed, not tracked afterward. sessions/paneIds
    // are read once, at the moment this fires, not tracked afterward
    // either — this only ever runs a single time (seededRef).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function groupIdOf(id) {
    for (const gid in groups) {
      if (groups[gid].includes(id)) return gid;
    }
    return null;
  }

  // Just creates and appends a session at the end of the rail — no opinion
  // on where (or whether) it gets shown. openNewSession below decides that
  // for itself.
  function createSession() {
    const session = makeSession(dirForTab(pathById, activeTabId));
    setSessions((prev) => [...prev, session]);
    return session.id;
  }

  // Same, but inserted right after `afterId` in the rail rather than at the
  // end — what addSplitPane uses, so a split's new terminal lands next to
  // the one it was split from instead of wherever the rail happens to end.
  function createSessionAfter(afterId) {
    const session = makeSession(dirForTab(pathById, activeTabId));
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === afterId);
      if (idx === -1) return [...prev, session];
      return [...prev.slice(0, idx + 1), session, ...prev.slice(idx + 1)];
    });
    return session.id;
  }

  // The "+" button: always a brand new terminal, shown alone — doesn't
  // touch any existing group, just changes what's currently on screen.
  function openNewSession() {
    const id = createSession();
    setPaneIds([id]);
    setFocusedIndex(0);
  }

  // The split button: not a toggle. Every press adds one more terminal to
  // the focused pane's group (creating one first if it doesn't have one
  // yet) — three presses gets a three-way split, not "split, then unsplit,
  // then split again." The new terminal lands right after the one it was
  // split from in the rail, so repeated presses grow one contiguous block
  // instead of scattering across whatever else is open.
  function addSplitPane() {
    const activeId = paneIds[focusedIndex];
    if (activeId == null) return;
    const newId = createSessionAfter(activeId);
    const gid = groupIdOf(activeId) ?? nextGroupId();
    const members = [...(groups[gid] || [activeId]), newId];
    setGroups((prev) => ({ ...prev, [gid]: members }));
    setPaneIds(members);
    setFocusedIndex(members.length - 1);
  }

  // Clicking a rail icon reopens whatever it belongs to: its whole group
  // (every pane, in the group's stored order) if it has one, or just
  // itself alone if it's standalone.
  function selectSession(id) {
    const gid = groupIdOf(id);
    if (gid != null) {
      const members = groups[gid];
      setPaneIds(members);
      setFocusedIndex(members.indexOf(id));
      return;
    }
    setPaneIds([id]);
    setFocusedIndex(0);
  }

  // The trash button is the only way to close a terminal — it always acts
  // on whichever pane is currently focused. Removing a terminal that's the
  // end of its group's branch just leaves the next one along as the new
  // end (nothing special to do — the L/T each row draws is recomputed from
  // the group's remaining members every render); a group that drops to one
  // member is dissolved back to a plain standalone terminal. The panel
  // itself only closes once every terminal is gone — closing whichever one
  // happens to be on screen never should, since others might still exist
  // in the background.
  function deleteActivePane() {
    const id = paneIds[focusedIndex];
    if (id == null) return;

    const closedIndex = sessions.findIndex((s) => s.id === id);
    const nextSessions = sessions.filter((s) => s.id !== id);

    if (nextSessions.length === 0) {
      onClose?.();
      return;
    }

    const gid = groupIdOf(id);
    let nextPaneIds;

    if (gid != null) {
      const members = groups[gid].filter((m) => m !== id);
      if (members.length >= 2) {
        setGroups((prev) => ({ ...prev, [gid]: members }));
        nextPaneIds = members;
      } else {
        setGroups((prev) => {
          const next = { ...prev };
          delete next[gid];
          return next;
        });
        nextPaneIds = members; // the one remaining group member, now standalone
      }
    } else {
      nextPaneIds = [];
    }

    if (nextPaneIds.length === 0) {
      // Standalone terminal closed (or a group dissolved with no member
      // left, which can't actually happen) — show whichever terminal now
      // sits where the closed one used to, so the rail's stable order
      // decides the fallback rather than picking arbitrarily.
      const fallback = nextSessions[closedIndex] || nextSessions[closedIndex - 1] || nextSessions[0];
      nextPaneIds = [fallback.id];
    }

    setSessions(nextSessions);
    setPaneIds(nextPaneIds);
    setFocusedIndex((fi) => Math.min(fi, nextPaneIds.length - 1));
  }

  const activeSessionId = paneIds[focusedIndex] ?? null;
  const paneIdSet = new Set(paneIds);

  // Content area only: panes have to be in `paneIds` order (left to right)
  // for the dividers between them (border-r, below) to land correctly.
  // This is purely about draw order for the *visible* panes — it doesn't
  // reorder `sessions` itself, so it has no bearing on the rail's stable
  // order below.
  const contentOrder = [
    ...paneIds.map((id) => sessions.find((s) => s.id === id)).filter(Boolean),
    ...sessions.filter((s) => !paneIdSet.has(s.id)),
  ];

  // Rail connectors, one computed per group (not just whichever group is
  // currently on screen) — this is what keeps a group's branch visible in
  // the rail even after switching away to look at something else. Each
  // entry is the group's member positions in `sessions` (the rail's one
  // true order), sorted, so the branch line can run through — but not tick
  // into — any unrelated terminal that happens to sit between two of a
  // group's panes.
  const groupPositions = Object.values(groups)
    .map((members) =>
      members.map((id) => sessions.findIndex((s) => s.id === id)).filter((idx) => idx !== -1),
    )
    .filter((positions) => positions.length >= 2)
    .map((positions) => positions.sort((a, b) => a - b));

  function connectorForRow(i) {
    for (const positions of groupPositions) {
      const min = positions[0];
      const max = positions[positions.length - 1];
      if (i < min || i > max) continue;
      if (i === min) return "top";
      if (i === max) return "bottom";
      if (positions.includes(i)) return "middle";
      return "through";
    }
    return null;
  }

  // Still a fixed overlay, not a flex participant — Sidebar (and the pane
  // content beneath it) are themselves viewport-fixed with a hardcoded
  // bottom inset rather than sized by flex, so growing this panel's height
  // could never actually shrink them to make room by itself. Instead,
  // Portfolio reserves the matching amount of space (via
  // onReservedHeightChange, above) as padding-bottom on the main
  // content/AI-chat column only — that's what actually pushes that content
  // up rather than letting this panel sit on top of it. The left inset
  // (activity bar + file-tree panel width) does the equivalent job
  // horizontally: the panel only ever occupies the main content/AI-chat
  // area, never the activity bar or sidebar.
  return (
    <>
      {/* Drag to resize/reopen — deliberately a fixed sibling of the panel
          below rather than a child of it: that panel slides fully off
          screen (translate-y-full) while closed, which would carry an
          always-rendered handle off screen right along with it. Anchored
          from the viewport's bottom edge (`bottom`, not `top`) so its
          position tracks the panel's top edge — which sits `height` above
          the footer when open, and flush against the footer itself when
          closed — without needing the panel's own (translated) box.
          Always rendered on desktop (even while closed) so the collapsed
          edge can still be grabbed and dragged back open. It's an invisible
          hit-target either way, so there's nothing extra to show while
          closed; only the drag behavior changes. */}
      <ResizeHandle
        direction="vertical"
        className="hidden sm:block fixed left-[var(--terminal-left)] right-0 h-1 z-50"
        style={{
          "--terminal-left": `${leftInset}px`,
          bottom: `${isOpen ? 33 + height : 33}px`,
        }}
        onDragStart={() => {
          if (!isOpen) {
            // Starting from fully closed: open it and start the height at 0
            // rather than the stale last-open height, so it visibly grows
            // from nothing as it's pulled out instead of popping open
            // instantly.
            onOpen?.();
            setHeight(0);
            heightAtDragStart.current = 0;
            // A plain click (mousedown+mouseup, no real movement) never
            // calls onDrag, so without this, onDragEnd's snap-close check
            // below would see whatever liveHeightRef was left over from the
            // last real drag — not the 0 this gesture actually started at —
            // and fail to detect "that wasn't a drag," leaving the panel
            // stuck open-but-0-height instead of cleanly closed.
            liveHeightRef.current = 0;
          } else {
            heightAtDragStart.current = height;
          }
          setIsResizing(true);
          onResizingChange?.(true);
        }}
        onDrag={(deltaY) => {
          const next = Math.min(
            MAX_HEIGHT,
            Math.max(0, heightAtDragStart.current - deltaY),
          );
          liveHeightRef.current = next;
          setHeight(next);
        }}
        onDragEnd={() => {
          setIsResizing(false);
          onResizingChange?.(false);
          if (liveHeightRef.current < SNAP_CLOSE_THRESHOLD) {
            onClose?.();
            setHeight(DEFAULT_HEIGHT);
          }
        }}
      />
      <div
        data-tour="terminal-panel"
        style={{
          "--terminal-height": `${height}px`,
          "--terminal-left": `${leftInset}px`,
          // A fixed pixel offset, not Tailwind's translate-y-full (100%,
          // relative to the element's own height) — that percentage would
          // recompute (and, since transform is transitioned, visibly
          // re-animate) any time `height` changes while closed, e.g. the
          // reset back to DEFAULT_HEIGHT right after a close-drag, making
          // the panel appear to pop back open before sliding shut again.
          // MAX_HEIGHT is always >= the actual height, so this fully hides
          // the panel regardless of what height happens to be underneath.
          transform: isOpen ? "translateY(0)" : `translateY(${MAX_HEIGHT}px)`,
        }}
        className={`fixed inset-x-0 sm:left-[var(--terminal-left)] bottom-[37px] sm:bottom-[33px] z-40 overflow-hidden ${
          isResizing ? "" : "transition-transform duration-300 ease-in-out"
        } ${isOpen ? "" : "pointer-events-none"} h-[var(--terminal-height)]`}
      >
      <div className="flex flex-col h-full sm:h-[var(--terminal-height)] w-full bg-[var(--bg)] text-[var(--text)] border-t-2 sm:border-l border-[var(--border-secondary)] font-mono text-sm">
        {/* Top bar — just panel-level controls. Session tabs live in the
            right-hand rail below, VS Code-style, rather than a top strip. */}
        <div className="flex items-center justify-between gap-2 pl-2 pr-2 py-1 border-b border-[var(--border-secondary)] bg-[var(--bg-quaternary)] shrink-0">
          <span className="text-[10px] tracking-wider uppercase font-bold text-[var(--text)]">
            Terminal
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={openNewSession}
              className="hover:bg-[var(--bg-tertiary)] p-1 rounded cursor-pointer"
              aria-label="New terminal"
              title="New terminal"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={deleteActivePane}
              disabled={activeSessionId == null}
              className="hover:bg-[var(--bg-tertiary)] p-1 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              aria-label="Delete terminal"
              title="Delete terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={addSplitPane}
              className={`p-1 rounded cursor-pointer ${
                paneIds.length > 1 ? "bg-[var(--bg-tertiary)]" : "hover:bg-[var(--bg-tertiary)]"
              }`}
              aria-label="Split terminal"
              title="Split terminal (adds another pane)"
            >
              <SquareSplitHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="hover:bg-[var(--bg-tertiary)] p-1 rounded cursor-pointer"
              aria-label="Close terminal panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body — terminal content on the left, a VS Code-style vertical
            list of session tabs docked to the right. Every session stays
            mounted (just hidden) so its scrollback survives being swapped
            out of view. */}
        <div className="relative flex-1 min-h-0 flex flex-row">
          <div className="relative flex-1 min-w-0 min-h-0 flex flex-row">
            {contentOrder.map((s) => {
              const paneIndex = paneIds.indexOf(s.id);
              const shown = paneIndex !== -1;
              const isLastPane = shown && paneIndex === paneIds.length - 1;
              return (
                <div
                  key={s.id}
                  onMouseDown={() => shown && setFocusedIndex(paneIndex)}
                  className={`min-w-0 min-h-0 ${
                    shown
                      ? `flex-1 ${!isLastPane ? "border-r border-[var(--border-secondary)]" : ""}`
                      : "w-0 flex-none overflow-hidden"
                  }`}
                >
                  <Terminal
                    root={root}
                    initialCwd={s.cwd}
                    version={version}
                    onOpenTab={onOpenTab}
                    visible={shown}
                    active={shown && paneIndex === focusedIndex}
                    onFocus={() => shown && setFocusedIndex(paneIndex)}
                  />
                </div>
              );
            })}
          </div>

          <div className="tabs-scroll w-9 shrink-0 overflow-y-auto overflow-x-hidden border-l border-[var(--border-secondary)] bg-[var(--bg-quaternary)]">
            {/* Icon-only, VS Code-style, always in creation order — this
                order never changes as terminals are split/selected, and
                closing one just shifts the rest up, so a terminal never
                jumps around the rail. Deleting happens from the trash
                button above, not here — clicking an icon only selects it
                (its whole group, if it has one). */}
            {sessions.map((s, i) => {
              const shown = paneIdSet.has(s.id);
              const connector = connectorForRow(i);
              return (
                <div key={s.id} className="group relative">
                  <button
                    onClick={() => selectSession(s.id)}
                    className={`relative flex items-center justify-center w-full h-9 border-b border-[var(--border-secondary)] cursor-pointer ${
                      shown
                        ? "bg-[var(--bg)] text-[var(--text)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                    }`}
                    aria-label={`zsh — ${s.name}`}
                  >
                    {connector && (
                      <span className="absolute left-1.5 top-0 bottom-0 w-2 pointer-events-none" aria-hidden="true">
                        {/* Branch connector: top row = an "L" rotated 90°
                            clockwise (horizontal top, vertical down);
                            bottom row = the same corner mirrored (vertical
                            up, horizontal out); a genuine middle pane = a
                            "T" rotated 90° counter-clockwise (vertical
                            passes through, tick out); a row the line
                            merely passes on its way between panes gets
                            just the vertical stroke, no tick. */}
                        <span
                          className={`absolute left-0 w-px bg-[var(--accent)] ${
                            connector === "top"
                              ? "top-1/2 bottom-0"
                              : connector === "bottom"
                                ? "top-0 bottom-1/2"
                                : "top-0 bottom-0"
                          }`}
                        />
                        {connector !== "through" && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-px bg-[var(--accent)]" />
                        )}
                      </span>
                    )}
                    <TerminalSquare className="w-3.5 h-3.5 shrink-0" />
                  </button>
                  <HeaderTooltip side="left">zsh — {s.name}</HeaderTooltip>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

export default TerminalPanel;
