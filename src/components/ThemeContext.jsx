import { useEffect, useState } from "react";
import { ThemeContext, THEMES } from "../lib/theme";

export const ThemeProvider = ({ children }) => {
  // A returning visitor may have an old theme slug in localStorage from
  // before the theme lineup changed (e.g. "theme-forest") — falling back
  // to light rather than applying a class with no matching CSS avoids
  // rendering unstyled.
  const [theme, setTheme] = useState(() =>
    THEMES.includes(localStorage.theme) ? localStorage.theme : "theme-light",
  );

  useEffect(() => {
    const root = document.documentElement;
    // Suppress transitions for the swap itself (see the .theme-switching
    // rule in index.css), then release them a frame later — otherwise
    // every element's own color transition would still animate, just
    // starting from whatever the *previous* theme's colors were.
    root.classList.add("theme-switching");
    root.classList.remove(...THEMES);
    root.classList.add(theme);
    localStorage.theme = theme;
    void root.offsetHeight; // force layout so the "no transition" state commits
    requestAnimationFrame(() => root.classList.remove("theme-switching"));
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
