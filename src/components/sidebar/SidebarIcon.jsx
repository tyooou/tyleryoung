import React from "react";

function SidebarIcon({ href, label, children }) {
  return (
    <a
      className="group relative inline-block hover:bg-[var(--bg-tertiary)] rounded py-1 px-2"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <div className="absolute top-full left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none text-xs font-mono py-0 pt-1 z-10 whitespace-nowrap">
        {label}
      </div>
    </a>
  );
}

export default SidebarIcon;
