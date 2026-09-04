# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Tyler Young's personal portfolio site (tyou.dev) — a VS Code-styled "IDE" shell (activity bar, file-tree sidebar, tabbed editor panes, split view, an integrated terminal, and an in-browser AI chat) where every "file" a visitor opens is actually a content page (experience, projects, blog posts, LeetCode write-ups, etc.) rendered as a card component.

## Commands

```
npm run dev                    # start Vite dev server
npm run build                  # production build (also copies dist/index.html -> dist/404.html for GH Pages SPA routing)
npm run lint                   # eslint .
npm run deploy                 # gh-pages -d dist
npm run seed:sanity            # one-time data migration into Sanity (needs SANITY_WRITE_TOKEN in .env.local)
npm run sync:leetcode          # pull problem list from the tyooou/leetcode GitHub repo into Sanity
npm run sync:leetcode-stats    # sync LeetCode solved-count stats into Sanity
```

There is no test suite configured. Sanity Studio config lives at `sanity.config.js` / `sanity/schemaTypes/` (run via `npx sanity dev` from the Sanity CLI if needed, not through an npm script here).

Env vars: `VITE_SANITY_PROJECT_ID` / `VITE_SANITY_DATASET` live in the tracked `.env` (not secret). `SANITY_WRITE_TOKEN` is a write-scoped Sanity token, only needed for the `seed:sanity`/`sync:*` scripts, kept in `.env.local` (gitignored) — see `.env.local.example`.

## Content model

All visitor-facing content (projects, experience, extracurriculars, books, blog posts, LeetCode problems, releases/changelog, friends, quick links, site settings) is authored in Sanity and fetched via `src/lib/sanityClient.js`. `Portfolio.jsx` fetches everything up front on mount and threads it down as props — there is no per-page fetching. `sanity/schemaTypes/` is the source of truth for each content type's shape.

## The editor-tab architecture

This is the part that isn't obvious from any single file:

- **Panes** (`Portfolio.jsx`, `PaneView.jsx`): up to two panes, "left" and "right", VS Code split-editor style. "left" always exists and always keeps the `bibliography` (About Me) tab pinned. "right" is created by dragging a tab to the pane edge and disappears once its last tab closes. Each pane tracks its own open tabs, active tab, and back/forward history.
- **Tabs are content pages, not routes.** A tab is just an id (e.g. `experience`, a project slug, a LeetCode problem slug). `PAGE_COMPONENTS` in `Portfolio.jsx` maps a handful of static tab kinds (bibliography, experience, opensource, library, typing, leetcode, changelog) to their card component; anything else (projects, blog posts, individual LeetCode entries, extracurriculars, books) is resolved dynamically — see `describeActiveTab` in `src/lib/activeTabContext.js`, which is the single place that turns a tab id + the fetched CMS data into a label/icon/component. Open tabs and the active tab are persisted to `localStorage` (`openTabs`, `activeTab`).
- **Sidebar** (`Sidebar.jsx`, `src/components/sidebar/`): the activity-bar + file-tree panel on the left. Its layout constants (`ACTIVITY_BAR_WIDTH`, panel width bounds) live in `src/lib/sidebarConstants.js` and are reused by anything that needs to avoid overlapping it (e.g. the terminal panel's left inset, computed in `Portfolio.jsx` as `sidebarMargin = ACTIVITY_BAR_WIDTH + sidebarPanelWidth`).
- **Virtual filesystem** (`src/lib/virtualFs.js`): lays a fake `ls`/`cd`-able directory tree over the exact same CMS data the tabs use, so the integrated terminal (`Terminal.jsx`, `TerminalPanel.jsx`) reads the same content as the sidebar/tabs rather than a second copy of it. `TerminalPanel.jsx` supports multiple sessions and a left/right split; sessions stay mounted (just hidden) when not shown so scrollback survives toggling.
- **AiChatPanel** (`AiChatPanel.jsx` + `src/lib/aiChatEngine.js`/`aiChatWorker.js`/`aiModels.js`): runs an LLM entirely client-side via WebGPU (`@mlc-ai/web-llm`), in a Web Worker so generation never blocks the main thread. Desktop-only and gated behind a `window.matchMedia("(min-width: 768px)")` check plus `isWebGpuSupported()` — it's not just hidden with CSS, it's not mounted at all on mobile/unsupported browsers, since the model is a large one-time download. `@mlc-ai/web-llm` is dynamically imported so its JS chunk is only fetched once chat is actually opened.
- Both `AiChatPanel` and `TerminalPanel` stay mounted at all times once shown once (open/closed is just a slide transition), for the same "don't lose in-progress state" reason.

## LeetCode sync

`scripts/sync-leetcode.mjs` pulls problem write-ups from the separate `tyooou/leetcode` GitHub repo and syncs them into Sanity as `leetcodeProblem` docs (matched by a deterministic id derived from file path; stale docs for renamed/deleted problems are removed). The live site always reads from Sanity, never GitHub directly — nothing shows up until this has run. `.github/workflows/sync-leetcode.yml` runs it on a 30-min cron, but `scripts/check-leetcode-sync-age.mjs` gates the actual sync to no more than once per 24h.

## Styling

Tailwind v4 (via `@tailwindcss/vite`) plus CSS custom properties for theming — see `src/themes.css` and `src/lib/theme.js`/`ThemeContext.jsx`. Colors in components are almost always `var(--...)` tokens (e.g. `bg-[var(--bg-tertiary)]`, `text-[var(--text-secondary)]`) rather than literal Tailwind color classes, so a component looks right across all themes.
