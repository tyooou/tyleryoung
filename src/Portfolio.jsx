import { useState, useEffect } from "react";
import fm from "front-matter";
import ProjectCard from "./components/project/ProjectCard";
import Sidebar from "./components/sidebar/Sidebar";
import BibliographyCard from "./components/BibliographyCard";
import Navigation from "./components/Navigation";
import VerticalNumbering from "./components/VerticalNumbering";
import Footer from "./components/Footer";
import FriendsCard from "./components/FriendsCard";
import ContactCard from "./components/ContactCard";
import ChangelogCard from "./components/ChangelogCard";
import LeetcodeCard from "./components/pages/LeetcodeCard";

function Portfolio() {
  const [sidebarState, setSidebar] = useState(() => {
    return window.innerWidth >= 768;
  });
  const [page, setPage] = useState("bibliography");
  const [openTabs, setOpenTabs] = useState(["bibliography"]);
  const [projects, setProjects] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    async function findProjects() {
      const res = await fetch(
        import.meta.env.BASE_URL + "projects/projects.json"
      );
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
          const res = await fetch(
            import.meta.env.BASE_URL + `projects/${project}/README.md`
          );
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

  // Swipe detection
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Only handle swipes on mobile
    if (window.innerWidth < 768) {
      if (isRightSwipe && !sidebarState) {
        // Swipe right to open sidebar
        setSidebar(true);
      } else if (isLeftSwipe && sidebarState) {
        // Swipe left to close sidebar
        setSidebar(false);
      }
    }
  };

  return (
    <>
      <Sidebar
        updatePage={updatePage}
        updateSidebar={updateSidebar}
        state={sidebarState}
        projects={projects.map((project) => project.meta.name)}
      />
      <div
        className={`flex flex-col h-screen transition-all duration-300 ${
          sidebarState ? "translate-x-full sm:translate-x-0 sm:ml-64" : "ml-0"
        }`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Navigation
          updatePage={updatePage}
          updateSidebar={updateSidebar}
          deleteTab={deleteTab}
          openTabs={openTabs}
          page={page}
        />
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden sm:block">
            <VerticalNumbering />
          </div>
          <div className="flex-1 bg-[var(--bg)] text-[var(--text)]">
            {page === "bibliography" && (
              <BibliographyCard toggleSidebar={updateSidebar} />
            )}
            {page === "leetcode" && <LeetcodeCard />}
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
