import { useState, useEffect } from "react";
import fm from "front-matter";
import ProjectCard from "./components/pages/project/ProjectCard";
import Sidebar from "./components/Sidebar";
import BibliographyCard from "./components/pages/BibliographyCard";
import Navigation from "./components/Navigation";
import VerticalNumbering from "./components/pages/VerticalNumbering";
import Footer from "./components/Footer";
import FriendsCard from "./components/pages/FriendsCard";
import ContactCard from "./components/pages/ContactCard";
import ChangelogCard from "./components/pages/ChangelogCard";
import LeetcodeCard from "./components/pages/leetcode/LeetcodeCard";
import ExperienceCard from "./components/pages/ExperienceCard";
import BooksCard from "./components/pages/BooksCard";
import { useTheme } from "./components/ThemeContext";
import SearchBar from "./components/SearchBar";

function Portfolio() {
  const { cycleTheme } = useTheme();
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
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "b") {
        event.preventDefault();
        setSidebar((prev) => !prev);
      }

      if (event.ctrlKey && event.key === "w") {
        event.preventDefault();
        if (page !== "bibliography") {
          deleteTab(page);
        }
      }

      if (event.ctrlKey && event.key === "c") {
        event.preventDefault();
        cycleTheme();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [page, cycleTheme]);

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
      if (newTabs.length > 0) {
        const deletedIndex = openTabs.indexOf(targetTab);
        const nextIndex = deletedIndex > 0 ? deletedIndex - 1 : 0;
        setPage(newTabs[nextIndex]);
      } else {
        setPage("bibliography");
      }
    }
  };

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

    if (window.innerWidth < 768) {
      if (isRightSwipe && !sidebarState) {
        setSidebar(true);
      } else if (isLeftSwipe && sidebarState) {
        setSidebar(false);
      }
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen fixed w-full">
        <SearchBar updateSidebar={updateSidebar} />
        <div className="flex-1 flex flex-row w-full h-full">
          <Sidebar
            updatePage={updatePage}
            updateSidebar={updateSidebar}
            state={sidebarState}
            projects={projects.map((project) => project.meta)}
          />
          <div
            className={`flex flex-col flex-1 h-full transition-all duration-300 ${
              sidebarState ? "translate-x-full sm:translate-x-0 sm:ml-64" : "ml-0"
            }`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <Navigation
              updatePage={updatePage}
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
                {page === "experience" && <ExperienceCard />}
                {page === "books" && <BooksCard />}
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
        </div>
        <Footer />
      </div>
    </>
  );
}

export default Portfolio;
