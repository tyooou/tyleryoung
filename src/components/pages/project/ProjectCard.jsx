import { lazy, Suspense } from "react";
import ProjectCarousel from "./ProjectCarousel";
import ExternalLink from "../../ExternalLink";

// tech-stack-icons bundles 690+ SVGs as one ~8MB module with no
// per-icon entry points — split into its own chunk instead of the main
// bundle, since this card doesn't need it until it's actually opened.
const TechStack = lazy(() => import("./TechStack"));

function ProjectCard({ project }) {
  const getTitleSizeClass = (title) => {
    if (title.length > 20) {
      return "text-5xl sm:text-6xl";
    } else if (title.length > 10) {
      return "text-6xl sm:text-7xl";
    } else {
      return "text-7xl sm:text-8xl";
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row w-full sm:h-full select-none cursor-default">
        <div className="flex-2 flex-col p-3 sm:p-6">
          <h1
            className={`font-mono font-bold ${getTitleSizeClass(
              project.meta.title
            )}`}
          >
            {project.meta.title}
          </h1>
          <div className="ml-2 mt-4 space-y-2">
            <h2 className="font-mono font-bold text-xl sm:text-xl italic text-[var(--text-secondary)]">
              {project.meta.subtitle}
            </h2>
            <p className="font-mono text-lg sm:text-sm mt-4 whitespace-pre-line">
              {project.content}
            </p>
            <Suspense fallback={null}>
              <TechStack techStack={project.meta.techStack} />
            </Suspense>
            <div className="flex flex-col space-y-2 font-mono mt-6 text-lg sm:text-sm">
              {project?.meta?.code != null && (
                <ExternalLink text="→ Code" link={project.meta.code} />
              )}
              {project?.meta?.preview != null && (
                <ExternalLink text="→ Preview" link={project.meta.preview} />
              )}
            </div>
          </div>
        </div>
        <div className="flex-3 pt-6 w-full sm:w-auto">
          <ProjectCarousel media={project.meta.media} />
        </div>
      </div>
    </>
  );
}

export default ProjectCard;
