export const TOUR_STEPS = [
  {
    target: '[data-tour="activity-bar"]',
    title: "Activity Bar",
    body: "Jump between sections of the site — About, Experience, LeetCode, and more.",
  },
  {
    target: '[data-tour="sidebar-panel"]',
    title: "Sidebar",
    body: "Browse pages within the current section, VS Code style. Click a section in the Activity Bar to see its pages here.",
  },
  {
    target: '[data-tour="sidebar-panel"]',
    title: "Resize & drag",
    body: "Drag the right edge of this panel to resize it, or drag it all the way closed and pull it back open anytime.",
    showDragAnimation: true,
  },
  {
    target: '[data-tour="tab-bar"]',
    title: "Tabs",
    body: "Pages open as tabs, just like a code editor — click one to switch, or close it with the × button.",
  },
  {
    target: '[data-tour="draggable-tab"]',
    title: "Split view",
    body: "Drag a tab to the right edge of the screen to open it in a second pane, side by side.",
    showSplitPreview: true,
  },
  {
    target: '[data-tour="theme-toggle"]',
    title: "Themes",
    body: "Cycle through VS Code-inspired themes here, or press Ctrl/Cmd+C anytime.",
  },
];
