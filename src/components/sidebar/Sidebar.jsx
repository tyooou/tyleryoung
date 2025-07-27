import { useState } from "react";
import SidebarLink from "./SidebarLink";
import SidebarIcon from "./SidebarIcon";
import { FileUser, Mail, Linkedin, Github } from "lucide-react";

function Sidebar({ updatePage, state, projects }) {
  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--bg-secondary)] text-[var(--text)] border-[var(--border-secondary)] border-r transition-transform duration-300 select-none ${
          state ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-center space-x-2 p-2">
          <SidebarIcon href="https://github.com/tyooou" label="github">
            <Github className="w-4" />
          </SidebarIcon>
          <SidebarIcon
            href="https://nz.linkedin.com/in/tylerhyoung"
            label="linkedin"
          >
            <Linkedin className="w-4" />
          </SidebarIcon>
          <SidebarIcon href="mailto:young.h.tyler@gmail.com" label="e-mail">
            <Mail className="w-4" />
          </SidebarIcon>
          <SidebarIcon
            href="https://drive.google.com/file/d/14Aru2JXekxazMWw34HCe7SZbIk4kuTkP/view?usp=sharing"
            label="résumé"
          >
            <FileUser className="w-4" />
          </SidebarIcon>
        </div>
        <div className="flex flex-col font-mono">
          <h2 className="font-bold text-xs text-[var(--text-secondary)] px-3 py-1 pt-4">
            PROJECTS
          </h2>
          {projects.map((projectName, index) => {
            return (
              <SidebarLink
                key={projectName}
                text={projectName}
                updatePage={updatePage}
              />
            );
          })}
        </div>
        <div className="flex flex-col font-mono">
          <h2 className="font-bold text-xs text-[var(--text-secondary)] px-3 py-1 pt-4">
            CONTENTS
          </h2>
          <SidebarLink text="bibliography" updatePage={updatePage} />
          <SidebarLink text="contact" updatePage={updatePage} />
          <SidebarLink text="friends" updatePage={updatePage} />
          <SidebarLink text="changelog" updatePage={updatePage} />
        </div>
      </div>
    </>
  );
}

export default Sidebar;
