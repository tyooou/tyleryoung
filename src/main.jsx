import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./themes.css"; // Your CSS variables and theme definitions
import Portfolio from "./Portfolio.jsx";
import { ThemeProvider } from "./components/ThemeContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <Portfolio />
    </ThemeProvider>
  </StrictMode>
);
