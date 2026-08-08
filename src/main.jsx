import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./themes.css"; // Your CSS variables and theme definitions
import Portfolio from "./Portfolio.jsx";
import { ThemeProvider } from "./components/ThemeContext.jsx";

const AdminApp = lazy(() => import("./admin/AdminApp.jsx"));
const isAdmin = window.location.pathname.startsWith("/admin");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      {isAdmin ? (
        <Suspense fallback={null}>
          <AdminApp />
        </Suspense>
      ) : (
        <Portfolio />
      )}
    </ThemeProvider>
  </StrictMode>
);
