import { useEffect, useState } from "react";
import { getSession, logout as apiLogout } from "./api.js";
import AdminLogin from "./AdminLogin.jsx";
import AdminLayout from "./AdminLayout.jsx";
import PagesEditor from "./sections/PagesEditor.jsx";
import ExperienceEditor from "./sections/ExperienceEditor.jsx";
import BooksEditor from "./sections/BooksEditor.jsx";
import FriendsEditor from "./sections/FriendsEditor.jsx";
import ProjectsEditor from "./sections/ProjectsEditor.jsx";
import ChangelogEditor from "./sections/ChangelogEditor.jsx";

const SECTIONS = [
  { id: "pages", label: "Pages", Component: PagesEditor },
  { id: "experience", label: "Experience", Component: ExperienceEditor },
  { id: "books", label: "Books", Component: BooksEditor },
  { id: "friends", label: "Friends", Component: FriendsEditor },
  { id: "projects", label: "Projects", Component: ProjectsEditor },
  { id: "changelog", label: "Changelog", Component: ChangelogEditor },
];

function AdminApp() {
  const [status, setStatus] = useState("loading"); // loading | anonymous | authenticated
  const [section, setSection] = useState(SECTIONS[0].id);

  useEffect(() => {
    getSession()
      .then((res) => setStatus(res.authenticated ? "authenticated" : "anonymous"))
      .catch(() => setStatus("anonymous"));
  }, []);

  const handleLogout = async () => {
    await apiLogout().catch(() => {});
    setStatus("anonymous");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm bg-[var(--bg)] text-[var(--text)]">
        Loading…
      </div>
    );
  }

  if (status === "anonymous") {
    return <AdminLogin onSuccess={() => setStatus("authenticated")} />;
  }

  const Active = SECTIONS.find((s) => s.id === section)?.Component;

  return (
    <AdminLayout
      sections={SECTIONS}
      activeSection={section}
      onSelectSection={setSection}
      onLogout={handleLogout}
    >
      {Active && <Active />}
    </AdminLayout>
  );
}

export default AdminApp;
