type WorkspaceSection = {
  href: string;
  eyebrow: string;
  title: string;
  summary: string;
  meta: string;
};

function WorkspaceIcon({ href }: { href: string }) {
  switch (href) {
    case "/decision-support":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6h9" />
          <path d="M5 12h14" />
          <path d="M5 18h7" />
          <path d="m16 5 3 3-5 5-3 1 1-3 4-6Z" />
        </svg>
      );
    case "/forex":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16" />
          <path d="M12 4c2.4 2.2 3.6 4.9 3.6 8s-1.2 5.8-3.6 8" />
          <path d="M12 4c-2.4 2.2-3.6 4.9-3.6 8s1.2 5.8 3.6 8" />
        </svg>
      );
    case "/crypto":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 3 7 9-7 9-7-9 7-9Z" />
          <path d="M5 12h14" />
          <path d="m12 3 2.5 9L12 21 9.5 12 12 3Z" />
        </svg>
      );
    case "/stocks":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 19V9" />
          <path d="M12 19V5" />
          <path d="M19 19v-7" />
          <path d="M3 19h18" />
        </svg>
      );
    case "/derivatives":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 18 9 8l5 8 3-6 3 8" />
          <path d="M4 18h16" />
          <path d="M9 8h4" />
          <path d="M14 16h4" />
        </svg>
      );
    case "/strategies":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 5h8a4 4 0 0 1 4 4v10H9a3 3 0 0 0-3-3V5Z" />
          <path d="M6 16a3 3 0 0 1 3 3" />
          <path d="M10 9h4" />
          <path d="M10 13h5" />
        </svg>
      );
    case "/run":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5v14l11-7L8 5Z" />
          <path d="M4 6v12" />
        </svg>
      );
    case "/reports":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4h8l3 3v13H7V4Z" />
          <path d="M15 4v4h3" />
          <path d="M10 12h5" />
          <path d="M10 16h4" />
        </svg>
      );
    case "/alerts":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 17h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v4.5L6 17Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
          <path d="M12 3v2" />
        </svg>
      );
    case "/tutorial":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 5h14v14H5V5Z" />
          <path d="M9 9h6" />
          <path d="M9 13h4" />
          <path d="M8 17h.01" />
          <path d="M12 17h.01" />
          <path d="M16 17h.01" />
        </svg>
      );
    case "/faq":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 8a5 5 0 1 1 7 4.6c-1.2.6-2 1.2-2 2.4" />
          <path d="M12 19h.01" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 5h14v14H5V5Z" />
          <path d="M9 9h6" />
          <path d="M9 15h6" />
        </svg>
      );
  }
}

export function DashboardWorkspaceMenu({ sections }: { sections: WorkspaceSection[] }) {
  return (
    <div className="workspaceMenuShell">
      <aside className="workspaceSideMenu" aria-label="Grouped trading workspaces">
        <div className="workspaceSideMenuTop">
          <div className="workspaceSideMenuTitle">
            <span>Dashboard Pages</span>
            <strong>Trading Workspaces</strong>
          </div>
          <input aria-label="Collapse or expand workspace menu" className="workspaceMenuToggle workspaceMenuState" type="checkbox" />
        </div>

        <nav className="workspaceNavList">
          {sections.map((section) => (
            <a className="workspaceNavItem" href={section.href} key={section.href} title={section.title} aria-label={section.title}>
              <span className="workspaceNavIcon" aria-hidden="true">
                <WorkspaceIcon href={section.href} />
              </span>
              <span className="workspaceNavText">
                <small>{section.eyebrow}</small>
                <strong>{section.title}</strong>
                <em>{section.meta}</em>
              </span>
            </a>
          ))}
        </nav>
      </aside>
    </div>
  );
}
