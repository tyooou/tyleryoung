import TechStack from "./TechStack";
import ProjectCarousel from "./ProjectCarousel";
import ExternalLink from "../../ExternalLink";

function ProjectCard({ project }) {
  // Determine title size based on length
  const getTitleSizeClass = (title) => {
    console.log(title.length);
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
      <div className="flex w-full h-full select-none cursor-default">
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
            <TechStack techStack={project.meta.techStack} />
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
        <div className="flex-3 pt-6 hidden sm:block">
          <ProjectCarousel
            folderName={project.meta.name}
            media={project.meta.media}
          />
        </div>
      </div>
    </>
  );
}

export default ProjectCard;
