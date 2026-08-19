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
