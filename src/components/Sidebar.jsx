import {
  FileUser,
  Mail,
  Linkedin,
  Github,
  X,
  User,
  Briefcase,
  Book,
  ListTodo,
  Users,
  Mail as MailIcon,
  History,
  Folder,
  Keyboard,
} from "lucide-react";

function SidebarIcon({ href, label, children }) {
  return (
    <a
      className="group relative inline-block hover:bg-[var(--bg-tertiary)] rounded py-2 sm:py-1 px-2"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <div className="absolute top-full left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none text-md sm:text-xs font-mono py-0 pt-1 z-10 whitespace-nowrap">
        {label}
      </div>
    </a>
  );
}

function SidebarLink({ text, updatePage, updateSidebar, projectName, icon }) {
  const handleClick = () => {
    updatePage(projectName || text);
    if (window.innerWidth < 768) {
      updateSidebar(false);
    }
  };

  return (
    <a
      className="font-mono text-lg sm:text-xs hover:bg-[var(--bg)] px-10 sm:px-5 py-2 inline-block group relative cursor-pointer"
      onClick={handleClick}
    >
      <span className="flex items-center w-full">
        {icon && (
          <span className="mr-2 flex items-center transition-transform duration-200 group-hover:translate-x-2">
            {icon}
          </span>
        )}
        <span className="transition-transform duration-200 group-hover:translate-x-2">
          {text}
        </span>
        <span className="ml-auto flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          →
        </span>
      </span>
    </a>
  );
}

function Sidebar({ updatePage, updateSidebar, state, projects }) {
  return (
    <>
      <div
        className={`font-mono fixed left-0 h-full w-full sm:w-64 bg-[var(--bg-secondary)] text-[var(--text)] border-[var(--border-secondary)] border-r transition-transform duration-300 select-none z-30 ${
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
            label="cv"
          >
            <FileUser className="w-6 sm:w-4" />
          </SidebarIcon>
        </div>
        <div className="flex flex-col">
          <h2 className="font-bold text-xl sm:text-xs text-[var(--text-secondary)] px-6 sm:px-3 py-2 sm:py-1 pt-10 sm:pt-5">
            PROJECTS
          </h2>
          {projects.map((project, index) => {
            return (
              <SidebarLink
                key={project.name}
                text={project.title}
                updatePage={updatePage}
                updateSidebar={updateSidebar}
                projectName={project.name}
                icon={<Folder size={15} />}
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
            icon={<User size={15} />}
          />
          <SidebarLink
            text="experience"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
            icon={<Briefcase size={15} />}
          />
          <SidebarLink
            text="books"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
            icon={<Book size={15} />}
          />
          {/* <SidebarLink text="leetcode" updatePage={updatePage} updateSidebar={updateSidebar} icon={<ListTodo size={15}/>} /> */}
          <SidebarLink
            text="typing"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
            icon={<Keyboard size={15} />}
          />
          <SidebarLink
            text="friends"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
            icon={<Users size={15} />}
          />
          <SidebarLink
            text="contact"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
            icon={<MailIcon size={15} />}
          />
          <SidebarLink
            text="changelog"
            updatePage={updatePage}
            updateSidebar={updateSidebar}
            icon={<History size={15} />}
          />
        </div>
      </div>
    </>
  );
}

export default Sidebar;
