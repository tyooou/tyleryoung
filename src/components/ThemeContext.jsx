import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const THEMES = [
  "theme-light",
  "theme-dark",
  "theme-forest",
  "theme-solace",
  "theme-rose",
  "theme-lavender",
  "theme-clementine",
  "theme-ice",
];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.theme || "theme-light");

  useEffect(() => {
    document.documentElement.classList.remove(...THEMES);
    document.documentElement.classList.add(theme);
    localStorage.theme = theme;
  }, [theme]);

  const cycleTheme = () => {
    const currentIndex = THEMES.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
