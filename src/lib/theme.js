import { createContext, useContext } from "react";

export const THEMES = [
  "theme-light",
  "theme-dark",
  "theme-monokai",
  "theme-nord",
  "theme-gruvbox-light",
  "theme-gruvbox-dark",
  "theme-tokyo-night",
  "theme-catppuccin-mocha",
  "theme-cobalt2",
  "theme-rose-pine",
];

export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);
