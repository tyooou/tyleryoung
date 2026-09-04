export const TOUR_STEPS = [
  {
    target: '[data-tour="activity-bar"]',
    title: "Activity Bar",
    body: "Jump between sections of the site — About, Experience, LeetCode, and more.",
  },
  {
    target: '[data-tour="sidebar-panel"]',
    title: "Sidebar",
    body: "Browse pages within the current section. Tap a section in the Activity Bar to see its pages here.",
  },
  {
    target: '[data-tour="sidebar-panel"]',
    title: "Resize & drag",
    body: "Drag the right edge of this panel to resize it, or drag it all the way closed and pull it back open anytime.",
    mobileBody: "Swipe left over the panel to close it, and pull it back open anytime.",
    showDragAnimation: true,
  },
  {
    target: '[data-tour="tab-bar"]',
    title: "Tabs",
    body: "Pages open as tabs, just like a code editor — click one to switch, or close it with the × button.",
    desktopOnly: true,
  },
  {
    target: '[data-tour="draggable-tab"]',
    title: "Split view",
    body: "Drag a tab to the right edge of the screen to open it in a second pane, side by side.",
    showSplitPreview: true,
    desktopOnly: true,
  },
  {
    target: '[data-tour="terminal-panel"]',
    title: "Terminal",
    body: "A real integrated terminal — browse the same content as the sidebar with commands like ls and cd.",
    // Desktop-only: the terminal itself is disabled on mobile, so there's
    // nothing here for the step to point at.
    desktopOnly: true,
  },
  {
    target: '[data-tour="ai-panel"]',
    title: "Ask tyouAI",
    body: "tyouAI runs entirely in your browser and knows this portfolio. Ask it about a role, a project, or whatever page you have open.",
    // The panel is full-screen on mobile, so highlighting it there would
    // just black out the whole viewport with nowhere left for the callout.
    desktopOnly: true,
  },
  {
    target: '[data-tour="theme-toggle"]',
    title: "Themes",
    body: "Cycle through the available themes here, or press Ctrl/Cmd+C anytime.",
  },
];

// Tabs and split view don't exist below the tab bar's own breakpoint (it's
// hidden, not just small), so there's nothing there for those steps to
// point at — dropped up front instead of letting the tour discover that
// live and auto-skip past a blank dark screen first.
export function getTourSteps(isMobile) {
  const steps = isMobile
    ? TOUR_STEPS.filter((step) => !step.desktopOnly)
    : TOUR_STEPS;
  return isMobile
    ? steps.map((step) => (step.mobileBody ? { ...step, body: step.mobileBody } : step))
    : steps;
}
