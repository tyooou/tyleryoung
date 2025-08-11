import SidebarLink from "./SidebarLink";
import SidebarIcon from "./SidebarIcon";
import { FileUser, Mail, Linkedin, Github, X } from "lucide-react";

function Sidebar({ updatePage, updateSidebar, state, projects }) {
  return (
    <>
      <div
        className={`font-mono fixed top-0 left-0 h-full w-full sm:w-64 bg-[var(--bg-secondary)] text-[var(--text)] border-[var(--border-secondary)] border-r transition-transform duration-300 select-none ${
          state ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close button */}
        <div className="flex justify-end p-2 sm:hidden">
          <button
            className="hover:bg-[var(--bg-tertiary)] mt-2 mr-2 py-2 px-2 rounded cursor-pointer"
            onClick={() => updateSidebar(false)}
          >
            <X className="w-6" />
          </button>
        </div>

        <div className="flex items-center justify-center space-x-2 sm:p-2">
          <SidebarIcon href="https://github.com/tyooou" label="github">
            <Github className="w-6 sm:w-4" />
          </SidebarIcon>
          <SidebarIcon
            href="https://nz.linkedin.com/in/tylerhyoung"
            label="linkedin"
          >
            <Linkedin className="w-6 sm:w-4" />
          </SidebarIcon>
          <SidebarIcon href="mailto:young.h.tyler@gmail.com" label="e-mail">
            <Mail className="w-6 sm:w-4" />
          </SidebarIcon>
          <SidebarIcon
            href="https://drive.google.com/file/d/14Aru2JXekxazMWw34HCe7SZbIk4kuTkP/view?usp=sharing"
            label="résumé"
          >
            <FileUser className="w-6 sm:w-4" />
          </SidebarIcon>
        </div>
        <div className="flex flex-col">
          <h2 className="font-bold text-xl sm:text-xs text-[var(--text-secondary)] px-6 sm:px-3 py-2 sm:py-1 pt-10 sm:pt-5">
            PROJECTS
          </h2>
          {projects.map((projectName, index) => {
            return (
              <SidebarLink
                key={projectName}
                text={projectName}
                updatePage={updatePage}
                updateSidebar={updateSidebar}
              />
            );
          })}
        </div>
        <div className="flex flex-col">
          <h2 className="font-bold text-xl sm:text-xs text-[var(--text-secondary)] px-6 sm:px-3 py-1  pt-4">
            CONTENTS
          </h2>
          <SidebarLink
            text="bibliography"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
          />
          <SidebarLink
            text="contact"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
          />
          <SidebarLink
            text="leetcode"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
          />
          <SidebarLink
            text="friends"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
          />
          <SidebarLink
            text="changelog"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
          />
        </div>
      </div>
    </>
  );
}

export default Sidebar;
