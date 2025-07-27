import { useState, useEffect } from "react";
import fm from "front-matter";
import ProjectCard from "./components/ProjectCard";
import Sidebar from "./components/sidebar/Sidebar";
import BibliographyCard from "./components/BibliographyCard";
import Navigation from "./components/Navigation";
import VerticalNumbering from "./components/VerticalNumbering";
import Footer from "./components/Footer";
import FriendsCard from "./components/FriendsCard";
import ContactCard from "./components/ContactCard";
import ChangelogCard from "./components/ChangelogCard";

function Portfolio() {
  const [sidebarState, setSidebar] = useState(false);
  const [page, setPage] = useState("bibliography");
  const [openTabs, setOpenTabs] = useState(["bibliography"]);
  const [projects, setProjects] = useState([]);
  const [projectList, setProjectList] = useState([]);

  useEffect(() => {
    async function findProjects() {
      const res = await fetch("projects/projects.json");
      if (!res.ok) return;
      const data = await res.json();
      setProjectList(data.activeProjects);
    }
    findProjects();
  }, []);

  useEffect(() => {
    if (!projectList.length) return;
    async function loadProjects() {
      const loadedProjects = await Promise.all(
        projectList.map(async (project) => {
          const res = await fetch(`projects/${project}/README.md`);
          if (!res.ok) return null;
          const raw = await res.text();
          const isFallbackHTML =
            raw.trim().toLowerCase().startsWith("<!doctype html>") ||
            raw.trim().toLowerCase().startsWith("<html>");

          if (isFallbackHTML) {
            return null;
          }

          const { attributes: data, body: content } = fm(raw);
          return { project, meta: data, content };
        })
      );
      const filtered = loadedProjects.filter(Boolean);
      setProjects(filtered);
    }
    loadProjects();
  }, [projectList]);

  const updateSidebar = (newState) => {
    setSidebar(newState);
  };

  const updatePage = (newPage) => {
    setPage(newPage);
    setOpenTabs((prevTabs) =>
      prevTabs.includes(newPage) ? prevTabs : [...prevTabs, newPage]
    );
  };

  const deleteTab = (targetTab) => {
    const newTabs = openTabs.filter((tab) => tab !== targetTab);
    setOpenTabs(newTabs);
    if (page === targetTab) {
      setPage(newTabs.length > 0 ? newTabs[0] : "bibliography");
    }
  };

  return (
    <>
      <Sidebar
        updatePage={updatePage}
        state={sidebarState}
        projects={projects.map((project) => project.meta.name)}
      />
      <div
        className={`flex flex-col h-screen transition-all duration-300 ${
          sidebarState ? "ml-64" : "ml-0"
        }`}
      >
        <Navigation
          updatePage={updatePage}
          updateSidebar={updateSidebar}
          deleteTab={deleteTab}
          openTabs={openTabs}
          page={page}
        />
        <div className="flex flex-1 overflow-hidden">
          <VerticalNumbering />
          <div className="flex-1 bg-[var(--bg)] text-[var(--text)]">
            {page === "bibliography" && (
              <BibliographyCard toggleSidebar={updateSidebar} />
            )}
            {page === "friends" && <FriendsCard />}
            {page === "contact" && <ContactCard />}
            {page === "changelog" && <ChangelogCard />}
            {projects.some((project) => project.meta.name === page) && (
              <ProjectCard
                project={projects.find((project) => project.meta.name === page)}
              />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Portfolio;
