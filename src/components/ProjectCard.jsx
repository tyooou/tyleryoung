import { useState } from "react";
import TechStack from "./TechStack";
import ProjectCarousel from "./ProjectCarousel";
import ExternalLink from "./ExternalLink";

function ProjectCard({ project }) {
  return (
    <>
      <div className="flex w-full h-full select-none cursor-default">
        <div className="flex-2 flex-col p-6">
          <h1 className="font-mono font-bold text-8xl">{project.meta.name}</h1>
          <div className="ml-2 mt-4 space-y-2">
            <h2 className="font-mono font-bold text-xl italic text-[var(--text-secondary)]">
              {project.meta.subtitle}
            </h2>
            <p className="font-mono text-sm mt-4">{project.content}</p>
            <TechStack techStack={project.meta.techStack} />
            <div className="flex flex-col space-y-2 font-mono mt-6">
              <ExternalLink text="→ Code" link={project.meta.code} />
              <ExternalLink text="→ Preview" link={project.meta.preview} />
            </div>
          </div>
        </div>
        <div className="flex-3">
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
