import StatTile from "../StatTile";

function formatMonthYear(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);
  return `${month} '${year}`;
}

// `end` sometimes holds the literal string "Present" rather than being left
// blank (how the existing data was entered) — treat anything that isn't a
// parseable date as "still ongoing," not just a blank value.
function isOngoing(end) {
  return !end || isNaN(new Date(end));
}

function resolveEnd(end) {
  return isOngoing(end) ? new Date() : new Date(end);
}

function formatSpan(totalMonths) {
  const years = Math.floor(totalMonths / 12);
  const months = Math.round(totalMonths % 12);
  if (years === 0) return `${months}mo`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}mo`;
}

function ExperienceBox({
  role,
  company,
  location,
  description,
  start,
  end,
  slug,
  updatePage,
}) {
  return (
    <button
      onClick={() => updatePage(slug)}
      className="group flex flex-col gap-1 border border-[var(--border-secondary)] rounded p-3 hover:bg-[var(--bg-secondary)] text-left cursor-pointer"
    >
      <p className="text-sm font-bold underline decoration-transparent group-hover:decoration-current transition-colors">
        {role} @ {company}
      </p>
      <p className="text-xs text-[var(--text-secondary)]">
        {formatMonthYear(start)} to{" "}
        {isOngoing(end) ? "Present" : formatMonthYear(end)}
        {location ? ` — ${location}` : ""}
      </p>
      {description && (
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1">
          {description}
        </p>
      )}
    </button>
  );
}

function RecentProject({ project, updatePage }) {
  const { name, title, subtitle } = project.meta;
  return (
    <button
      onClick={() => updatePage(name)}
      className="group flex flex-col gap-1 border border-[var(--border-secondary)] rounded p-3 hover:bg-[var(--bg-secondary)] text-left cursor-pointer"
    >
      <p className="text-sm font-bold underline decoration-transparent group-hover:decoration-current transition-colors">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
          {subtitle}
        </p>
      )}
    </button>
  );
}

// Horizontal bar per role spanning its active date range, all sharing one
// timeline — shows at a glance which roles overlapped and how long ago each
// one was, which a flat list can't. Deliberately not extended to cover
// projects too: projects only carry a single `_createdAt` timestamp, not a
// start/end range, so there's no real span to draw for them.
function ExperienceTimeline({ spans, timelineStart, timelineEnd }) {
  if (spans.length === 0 || !timelineStart || !timelineEnd) return null;
  const totalMs = timelineEnd - timelineStart || 1;

  return (
    <div>
      <p className="font-bold text-lg mb-3">Timeline</p>
      <div className="flex flex-col gap-4">
        {spans.map((exp) => {
          const leftPct = ((exp.startDate - timelineStart) / totalMs) * 100;
          const widthPct = Math.max(
            ((exp.endDate - exp.startDate) / totalMs) * 100,
            1.5,
          );
          return (
            <div key={exp.slug} className="flex items-center gap-3">
              <span className="w-56 shrink-0 text-xs text-[var(--text-secondary)] leading-tight">
                <span className="block">{exp.role}</span>
                <span className="block">@ {exp.company}</span>
              </span>
              <div className="relative flex-1 h-5 bg-[var(--bg-tertiary)] rounded overflow-hidden">
                <div
                  className={`absolute top-0 h-full rounded ${
                    exp.ongoing
                      ? "bg-[var(--accent)]"
                      : "bg-[var(--accent-secondary)]"
                  }`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`${formatMonthYear(exp.start)} – ${
                    exp.ongoing ? "Present" : formatMonthYear(exp.end)
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <span className="w-56 shrink-0" />
        <div className="flex-1 flex justify-between text-[10px] text-[var(--text-secondary)]">
          <span>
            {timelineStart.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
          <span>
            {timelineEnd.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mt-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-secondary)]" />{" "}
          Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent)]" /> Ongoing
        </span>
      </div>
    </div>
  );
}

// The Overview for the whole Experience section — work history and
// projects both, not just the professional/Work side of it.
function ExperienceCard({
  experiences = [],
  projects = [],
  updatePage = () => {},
}) {
  const now = new Date();
  const spans = experiences.map((exp) => ({
    ...exp,
    startDate: new Date(exp.start),
    endDate: resolveEnd(exp.end),
    ongoing: isOngoing(exp.end),
  }));

  const timelineStart = spans.length
    ? new Date(Math.min(...spans.map((s) => s.startDate)))
    : null;
  const timelineEnd = spans.length
    ? new Date(Math.max(...spans.map((s) => s.endDate), now))
    : null;
  const totalMonths =
    timelineStart && timelineEnd
      ? (timelineEnd.getFullYear() - timelineStart.getFullYear()) * 12 +
        (timelineEnd.getMonth() - timelineStart.getMonth())
      : 0;

  const uniqueTech = new Set();
  for (const exp of experiences)
    (exp.techStack || []).forEach((t) => t && uniqueTech.add(t));
  for (const project of projects)
    (project.meta.techStack || []).forEach((t) => t && uniqueTech.add(t));

  // Capped to however many rows the timeline draws, so the recent-projects
  // column reads as roughly the same height as the graph it sits beside
  // instead of an arbitrary, unrelated count.
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.meta._createdAt) - new Date(a.meta._createdAt))
    .slice(0, Math.max(spans.length, 1));

  return (
    <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default overflow-y-auto">
      <div className="flex flex-col">
        <h2 className="font-bold text-5xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
          Experience.
        </h2>
        <p className="text-base md:text-xl mt-3 ml-2">
          Everywhere I've learnt, built, and grown — work and personal projects
          alike.
        </p>

        <div className="ml-2 mt-6">
          <ul className="flex flex-wrap gap-8 mb-10">
            <StatTile
              label="Years Active"
              value={timelineStart ? formatSpan(totalMonths) : "—"}
            />
            <StatTile label="Roles" value={experiences.length} />
            <StatTile label="Projects" value={projects.length} />
            <StatTile label="Technologies" value={uniqueTech.size} />
          </ul>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-10">
            <div className="lg:col-span-2 min-w-0">
              <ExperienceTimeline
                spans={spans}
                timelineStart={timelineStart}
                timelineEnd={timelineEnd}
              />
            </div>
            <div>
              <p className="font-bold text-lg mb-3">Recent Projects</p>
              <div className="flex flex-col gap-2">
                {recentProjects.length > 0 ? (
                  recentProjects.map((project) => (
                    <RecentProject
                      key={project.meta.name}
                      project={project}
                      updatePage={updatePage}
                    />
                  ))
                ) : (
                  <p className="text-[var(--text-secondary)]">
                    No projects found :(
                  </p>
                )}
              </div>
            </div>
          </div>

          <p className="font-bold text-lg mb-3">Work</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {experiences.length > 0 ? (
              experiences
                .slice(0, 6)
                .map((exp) => (
                  <ExperienceBox
                    key={exp.slug}
                    {...exp}
                    updatePage={updatePage}
                  />
                ))
            ) : (
              <p className="text-[var(--text-secondary)]">
                No experiences found :(
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExperienceCard;
