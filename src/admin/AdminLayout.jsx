function AdminLayout({ sections, activeSection, onSelectSection, onLogout, children }) {
  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-[var(--bg)] text-[var(--text)] font-mono">
      <nav className="sm:w-56 sm:h-screen border-b sm:border-b-0 sm:border-r border-[var(--border-secondary)] bg-[var(--bg-secondary)] flex sm:flex-col">
        <div className="p-4 font-bold text-sm hidden sm:block">CMS Admin</div>
        <div className="flex sm:flex-col flex-1 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSection(s.id)}
              className={`text-left text-xs px-4 py-3 whitespace-nowrap cursor-pointer ${
                activeSection === s.id
                  ? "bg-[var(--bg)] font-bold"
                  : "hover:bg-[var(--bg-tertiary)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          onClick={onLogout}
          className="text-left text-xs px-4 py-3 whitespace-nowrap hover:bg-[var(--bg-tertiary)] cursor-pointer sm:mt-auto"
        >
          Log out
        </button>
      </nav>
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
    </div>
  );
}

export default AdminLayout;
