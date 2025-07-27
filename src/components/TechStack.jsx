import { useState } from "react";
import StackIcon from "tech-stack-icons";

function TechStack({ techStack }) {
  return (
    <div>
      <h2 className="font-mono font-bold text-sm py-2">Built with</h2>
      <div className="flex w-max p-2 items-center justify-center space-x-2">
        {techStack.map((tech, index) => (
          <div className="relative group inline-block">
            <StackIcon name={tech} className="w-8 filter grayscale" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none text-xs font-mono py-0 z-10 whitespace-nowrap">
              {tech}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TechStack;
