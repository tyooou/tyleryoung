import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./themes.css"; // Your CSS variables and theme definitions
import Portfolio from "./Portfolio.jsx";
import { ThemeProvider } from "./components/ThemeContext.jsx";

const StudioRoute = lazy(() => import("./admin/StudioRoute.jsx"));
const isAdmin = window.location.pathname.startsWith("/admin");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isAdmin ? (
      // Sanity Studio manages its own theming/viewport, so it's rendered
      // standalone rather than nested inside the portfolio's ThemeProvider.
      <Suspense fallback={null}>
        <StudioRoute />
      </Suspense>
    ) : (
      <ThemeProvider>
        <Portfolio />
      </ThemeProvider>
    )}
  </StrictMode>
);
