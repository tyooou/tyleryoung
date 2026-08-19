import { createContext, useContext } from "react";

export const THEMES = [
  "theme-light",
  "theme-dark",
  "theme-one-dark-pro",
  "theme-dracula",
  "theme-monokai",
  "theme-nord",
  "theme-solarized-light",
  "theme-gruvbox-dark",
];

export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);
