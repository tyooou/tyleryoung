import {
  FileUser,
  Palette,
  Briefcase,
  Code2,
  Compass,
  Sparkles,
  Folder,
  Github,
  Linkedin,
  Mail,
} from "lucide-react";
import DecodeText from "../DecodeText";
import ExternalLink from "../ExternalLink";
import { useTheme } from "../../lib/theme";

const HIGHLIGHTS = [
  {
    title: "Software Engineer",
    body: "Building things end to end, from backend systems to polished UI.",
  },
  {
    title: "Creative Technologist",
    body: "Where design instincts and engineering discipline meet.",
  },
  {
    title: "Student",
    body: "Undergraduate, studying software engineering at the University of Auckland.",
  },
];

// A single "Start"-section row: icon + label, VS Code welcome-page style.
function StartLink({ icon, text, onClick }) {
  const Icon = icon;
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 text-left w-full py-1.5 hover:bg-[var(--bg-secondary)] px-2 -mx-2 rounded cursor-pointer"
    >
      <Icon size={16} className="shrink-0 text-[var(--text-secondary)]" />
      <span className="text-sm sm:text-base underline decoration-transparent group-hover:decoration-current transition-colors">
        {text}
      </span>
    </button>
  );
}

function BibliographyCard({
  toggleSidebar,
  updatePage = () => {},
  quickLinks = [],
  projects = [],
  startTour = () => {},
}) {
  const { cycleTheme } = useTheme();
  const cv = quickLinks.find((q) => q.id === "cv");
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.meta._createdAt) - new Date(a.meta._createdAt))
    .slice(0, 3);

  return (
    <div className="w-full h-full p-3 sm:p-6 font-mono select-none cursor-default overflow-y-auto">
      <div className="flex items-center gap-4 ml-2">
        <DecodeText text="Tyler Young" speed={80} />
      </div>
      <p className="text-lg sm:text-xl mt-3 ml-2 font-bold text-[var(--text-secondary)] p-6">
        Creative by design. <span className="italic">Technical by habit.</span>
      </p>

      <div className="mt-8 sm:mt-10 ml-2 grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-8 max-w-4xl">
        <div>
          <h3 className="font-bold text-xl sm:text-2xl mb-3">Start</h3>
          <div className="flex flex-col">
            <StartLink
              icon={Sparkles}
              text="Take a Tour"
              onClick={startTour}
            />
            {cv && (
              <StartLink
                icon={FileUser}
                text="View Résumé"
                onClick={() => updatePage(cv.name)}
              />
            )}
            <StartLink
              icon={Briefcase}
              text="View Experience"
              onClick={() => updatePage("experience")}
            />
            <StartLink
              icon={Code2}
              text="Explore LeetCode"
              onClick={() => updatePage("leetcode")}
            />
            <StartLink
              icon={Palette}
              text="Switch Theme"
              onClick={cycleTheme}
            />
            <div className="sm:hidden">
              <StartLink
                icon={Compass}
                text="Start Exploring"
                onClick={() => toggleSidebar(true)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-xl sm:text-2xl mb-3">Recent</h3>
          <div className="flex flex-col">
            {recentProjects.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No projects yet.
              </p>
            ) : (
              recentProjects.map((project) => (
                <button
                  key={project.meta.name}
                  onClick={() => updatePage(project.meta.name)}
                  className="group flex items-start gap-3 text-left w-full py-1.5 hover:bg-[var(--bg-secondary)] px-2 -mx-2 rounded cursor-pointer"
                >
                  <Folder
                    size={16}
                    className="shrink-0 mt-0.5 text-[var(--text-secondary)]"
                  />
                  <span className="text-sm sm:text-base">
                    <span className="font-bold underline decoration-transparent group-hover:decoration-current transition-colors">
                      {project.meta.title}
                    </span>
                    {project.meta.subtitle && (
                      <span className="text-[var(--text-secondary)]">
                        {" "}
                        — {project.meta.subtitle}
                      </span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 ml-2 max-w-4xl">
        <h3 className="font-bold text-xl sm:text-2xl mb-3">Walkthroughs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {HIGHLIGHTS.map((card) => (
            <div
              key={card.title}
              className="border border-[var(--border-secondary)] rounded p-4 bg-[var(--bg-secondary)]"
            >
              <p className="font-bold text-sm sm:text-base mb-1">
                {card.title}
              </p>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 mb-6 ml-2 max-w-4xl">
        <h3 className="font-bold text-xl sm:text-2xl mb-3">Help</h3>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm sm:text-base">
          <span className="flex items-center gap-2 px-2 py-1">
            <Github size={16} className="text-[var(--text-secondary)]" />
            <ExternalLink
              text="GitHub"
              link="https://github.com/tyooou"
              hover={false}
            />
          </span>
          <span className="flex items-center gap-2 px-2 py-1">
            <Linkedin size={16} className="text-[var(--text-secondary)]" />
            <ExternalLink
              text="LinkedIn"
              link="https://nz.linkedin.com/in/tylerhyoung"
              hover={false}
            />
          </span>
          <span className="flex items-center gap-2 px-2 py-1">
            <Mail size={16} className="text-[var(--text-secondary)]" />
            <ExternalLink
              text="Email"
              link="mailto:young.h.tyler@gmail.com"
              hover={false}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

export default BibliographyCard;
