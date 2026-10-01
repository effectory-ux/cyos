// Shell.jsx — sidebar + Surveys landing page (Engage DS)
// The Surveys page is a port of the DS "All surveys" reference prototype:
// a .ph page header, a Latest-projects carousel, and an elevated list card with
// a working filter bar (search + my-only + Sort + Status) over .srow rows with
// status pills + response-rate bars. Sidebar uses the DS Main Navigation.
import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";

export function Sidebar() {
  const nav = [
    { icon: "home", label: "Home" },
    { icon: "clipboard", label: "Surveys", open: true, children: ["All surveys", "Projects"] },
    { icon: "refresh", label: "360° Feedback" },
    { icon: "structure", label: "Organization", chevron: true },
  ];
  return (
    <div className="mainnav">
      <div className="mn-portal">
        <span className="mn-logo" />
        <button className="mn-portal-btn"><b>Coordinator</b><Icon name="chevron-down" className="mn-chev" /></button>
      </div>
      <nav className="mn-nav" aria-label="Main">
        {nav.map(item => (
          <div key={item.label}>
            <a className="mn-item">
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {(item.open || item.chevron) && <Icon name={item.open ? "chevron-up" : "chevron-down"} className="mn-chev" />}
            </a>
            {item.open && (
              <div className="mn-sub">
                {item.children.map((c, i) => (
                  <a key={c} className={"mn-subitem" + (i === 0 ? " is-active" : "")}>{c}</a>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="mn-foot">
        <a className="mn-item"><Icon name="help" /><span>Help &amp; learn</span></a>
        <div className="mn-foot-divider" />
        <div className="mn-user">
          <div className="av av-36 av-blue">JR</div>
          <div className="mn-meta">
            <div className="mn-name">Jamal van Rooijen</div>
            <div className="mn-org">Effectory B.V.</div>
          </div>
          <Icon name="chevron-up" />
        </div>
      </div>
    </div>
  );
}

// Per-row actions menu. Drafts can be deleted; other statuses show the action
// disabled (only drafts are deletable from here).
function SurveyRowMenu({ row, onDeleteDraft }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const isDraft = row.status === "Draft";
  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      <Tooltip label="More options">
        <button className="ib ib-36 ib-tertiary" aria-label="More options" aria-haspopup="menu" aria-expanded={open}
          onClick={() => setOpen(o => !o)}><Icon name="more-vertical" size={16} /></button>
      </Tooltip>
      {open && (
        <div className="menu" role="menu" style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, width: 232, zIndex: 20 }}>
          {isDraft ? (
            <div className="menu-item" role="menuitem" onClick={() => { setOpen(false); onDeleteDraft(row.id); }}>
              <span className="menu-item-icon" style={{ color: "var(--content-negative-secondary)" }}><Icon name="trash" size={16} /></span>
              <span className="menu-item-body"><span className="menu-item-title" style={{ color: "var(--content-negative-secondary)" }}>Delete draft</span></span>
            </div>
          ) : (
            <div className="menu-item is-disabled" role="menuitem" aria-disabled="true">
              <span className="menu-item-icon"><Icon name="trash" size={16} /></span>
              <span className="menu-item-body">
                <span className="menu-item-title">Delete</span>
                <span className="menu-item-sub">Only drafts can be deleted</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Out-of-scope destinations for non-editable statuses (open separate prototypes).
const OUT_OF_SCOPE = {
  Live:    { dest: "live response monitoring", icon: "activity" },
  Closed:  { dest: "results & reporting", icon: "pie-chart" },
  default: { dest: "another part of the product", icon: "external-link" },
};
export function OutOfScopeDialog({ row, onClose }) {
  const info = OUT_OF_SCOPE[row.status] || OUT_OF_SCOPE.default;
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="oos-title">
        <Tooltip label="Close" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onClose}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm">
          <div className="dialog-header-top">
            <Icon name={info.icon} size={20} className="dialog-header-icon" />
            <h3 className="dialog-title" id="oos-title">{row.name}</h3>
          </div>
          <p className="dialog-subtitle">
            This is a <b>{row.status}</b> survey. Opening it would take you to <b>{info.dest}</b> —
            a separate prototype that isn’t part of this flow yet.
          </p>
        </div>
        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}

// Draft & Planned surveys are editable here; others open an out-of-scope prototype.
const EDITABLE = new Set(["Draft", "Planned"]);

// Each app status → a DS status pill + contextual text. The pill's canonical
// name (In Progress, Completed…) is what the Status filter lists — matching the
// live app, where the row text is contextual ("Running until…") but the filter
// uses the formal name.
const STATUS_META = {
  Live:    { canon: "In Progress", cls: "spill-running",   text: (r) => <><b>Running</b> until {r.date.replace(/^Closes\s*/i, "")}</> },
  Planned: { canon: "Planned",     cls: "spill-starts",    text: (r) => <><b>Starts</b> on {r.date.replace(/^Starts\s*/i, "")}</> },
  Closed:  { canon: "Completed",   cls: "spill-completed", text: (r) => <><b>Completed</b> on {r.date.replace(/^Closed\s*/i, "")}</> },
  Draft:   { canon: "Draft",       cls: "spill-draft",     text: () => <b>Draft</b> },
};
const STATUS_FILTERS = [
  { canon: "Draft", cls: "spill-draft" },
  { canon: "Planned", cls: "spill-starts" },
  { canon: "In Progress", cls: "spill-running" },
  { canon: "Completed", cls: "spill-completed" },
];
const SORT_OPTIONS = ["Created last", "Created first", "A-Z", "Z-A"];
const canonOf = (r) => (STATUS_META[r.status] || STATUS_META.Draft).canon;
const respPct = (r) => { const n = parseInt((r.resp || "").replace(/[^0-9]/g, ""), 10); return isNaN(n) ? 0 : n; };

// A filter-bar dropdown (Sort / Status). The popover is position:fixed and
// anchored to its trigger by JS, so the list card's overflow:hidden never clips
// it — right-aligned, flipping up when it wouldn't fit below.
function FilterDropdown({ icon, name, value, sort, children }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null), menuRef = useRef(null);
  const position = () => {
    const b = btnRef.current?.getBoundingClientRect(), m = menuRef.current;
    if (!b || !m) return;
    const mh = m.offsetHeight, mw = m.offsetWidth;
    let top = b.bottom + 4;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, b.top - 4 - mh);
    setCoords({ top, left: Math.max(8, b.right - mw) });
  };
  useLayoutEffect(() => { if (open) position(); }, [open]); // eslint-disable-line
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false); };
    const onMove = () => position();
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", onMove);
    document.addEventListener("scroll", onMove, true);
    return () => { document.removeEventListener("mousedown", onDoc); window.removeEventListener("resize", onMove); document.removeEventListener("scroll", onMove, true); };
  }, [open]); // eslint-disable-line
  return (
    <div className="flt-ctl">
      <button ref={btnRef} className="sel-btn sel-btn-inline" aria-haspopup="listbox" aria-expanded={open}
        onClick={() => setOpen(o => !o)}>
        <Icon name={icon} size={16} />
        <span className="sel-btn-name">{name}:</span>
        <span className="sel-btn-value">{value}</span>
      </button>
      {open && (
        <div ref={menuRef} className={"menu flt-menu" + (sort ? " flt-sort" : "")} role="listbox"
          style={{ top: coords ? coords.top : -9999, left: coords ? coords.left : -9999 }}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

// Latest projects — up to 3 cards fill the row, the rest page in via the arrows.
function ProjectsCarousel({ projects }) {
  const PER = 3, GAP = 16;
  const [page, setPage] = useState(0);
  const [offset, setOffset] = useState(0);
  const trackRef = useRef(null);
  const pages = Math.max(1, Math.ceil(projects.length / PER));
  const pageWidth = () => {
    const first = trackRef.current && trackRef.current.children[0];
    return first ? PER * (first.getBoundingClientRect().width + GAP) : 0;
  };
  useLayoutEffect(() => { setOffset(page * pageWidth()); }, [page, projects.length]);
  useEffect(() => {
    const onResize = () => setOffset(page * pageWidth());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [page]);
  const atStart = page <= 0, atEnd = page >= pages - 1;
  return (
    <section>
      <div className="sec-head">
        <h2 className="text-l4">Latest projects</h2>
        <button className="btn btn-tertiary">Go to projects</button>
        <Tooltip label="Previous projects">
          <button className={"ib ib-36 ib-secondary" + (atStart ? " is-disabled" : "")} disabled={atStart}
            aria-label="Previous projects" onClick={() => setPage(p => Math.max(0, p - 1))}><Icon name="arrow-left" size={16} /></button>
        </Tooltip>
        <Tooltip label="Next projects">
          <button className={"ib ib-36 ib-secondary" + (atEnd ? " is-disabled" : "")} disabled={atEnd}
            aria-label="Next projects" onClick={() => setPage(p => Math.min(pages - 1, p + 1))}><Icon name="arrow-right" size={16} /></button>
        </Tooltip>
      </div>
      <div className="proj-viewport">
        <div className="proj-track" ref={trackRef} style={{ transform: `translateX(-${offset}px)` }}>
          {projects.map((p, i) => (
            <a key={p.name + i} className="card card-elevated is-interactive proj-card">
              <div className="proj-title">{p.name}</div>
              <div className="proj-meta"><Icon name="clipboard" size={16} />{p.count} {p.count === 1 ? "survey" : "surveys"}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SurveysPage({ rows, onCreate, onDeleteDraft, onOpen }) {
  const [q, setQ] = useState("");
  const [mine, setMine] = useState(false);
  const [sort, setSort] = useState("Created last");
  const [statuses, setStatuses] = useState(() => new Set(STATUS_FILTERS.map(s => s.canon)));
  const toggleStatus = (c) => setStatuses(s => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; });

  // Latest-projects cards derived from the surveys (grouped by project).
  const projects = useMemo(() => {
    const m = new Map();
    rows.forEach(r => m.set(r.proj, (m.get(r.proj) || 0) + 1));
    return [...m.entries()].map(([name, count]) => ({ name, count }));
  }, [rows]);

  // Filters (status ∩ mine ∩ search) then sort — one pass, live.
  const visible = useMemo(() => {
    let list = rows.filter(r => statuses.has(canonOf(r)) && (!mine || r.mine) && (!q || r.name.toLowerCase().includes(q.toLowerCase())));
    if (sort === "Created first") list = [...list].reverse();
    else if (sort === "A-Z") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "Z-A") list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    return list;
  }, [rows, statuses, mine, q, sort]);

  const statusLabel = statuses.size === STATUS_FILTERS.length ? `All (${STATUS_FILTERS.length})`
    : statuses.size === 0 ? "None" : `${statuses.size} selected`;

  return (
    <div className="surveys-page scroll-y">
      <div className="surveys-inner">

        <div className="ph">
          <div className="ph-row">
            <div className="ph-left">
              <h1 className="ph-title">Surveys</h1>
              <div className="ph-meta">See your most recent surveys and projects</div>
            </div>
            <div className="ph-controls">
              <button className="btn btn-primary" onClick={onCreate}><Icon name="plus" size={16} />Create survey</button>
            </div>
          </div>
        </div>

        <ProjectsCarousel projects={projects} />

        <section>
          <h2 className="text-l4" style={{ margin: "0 0 var(--spacing-loose)" }}>All surveys</h2>
          <div className="card card-elevated surveys-list">

            <div className="flt-bar">
              <div className="search-wrap">
                <span className="search-icon"><Icon name="search" size={16} /></span>
                <input type="search" className="srch" placeholder="Search" aria-label="Search surveys" value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <label className="flt-cb">
                <span className="cb-wrap"><input type="checkbox" className="cb" checked={mine} onChange={e => setMine(e.target.checked)} /></span>
                Show only my surveys
              </label>
              <FilterDropdown icon="sort-descending" name="Sort by" value={sort} sort>
                {(close) => SORT_OPTIONS.map(o => (
                  <div key={o} className={"menu-item" + (o === sort ? " is-selected" : "")} role="option" aria-selected={o === sort}
                    onClick={() => { setSort(o); close(); }}>
                    <span className="menu-item-body"><span className="menu-item-title">{o}</span></span>
                    <Icon name="check" size={16} className="menu-item-check" />
                  </div>
                ))}
              </FilterDropdown>
              <FilterDropdown icon="filter" name="Status" value={statusLabel}>
                {() => STATUS_FILTERS.map(s => (
                  <div key={s.canon} className={"menu-item" + (statuses.has(s.canon) ? " is-selected" : "")} role="option" aria-selected={statuses.has(s.canon)}
                    onClick={() => toggleStatus(s.canon)}>
                    <span className="menu-cb"><Icon name="check" size={14} /></span>
                    <span className="menu-item-body"><span className={"spill " + s.cls}><b>{s.canon}</b></span></span>
                  </div>
                ))}
              </FilterDropdown>
            </div>

            {visible.map(r => {
              const meta = STATUS_META[r.status] || STATUS_META.Draft;
              const pct = respPct(r);
              return (
                <div key={r.id} className="srow" role="button" tabIndex={0}
                  aria-label={`Open ${r.name}${EDITABLE.has(r.status) ? "" : " (opens a separate prototype)"}`}
                  onClick={() => onOpen(r)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(r); } }}>
                  <div className="srow-info">
                    <div className="srow-name">{r.name}</div>
                    <div className="srow-proj"><Icon name="folder" size={12} /><span>{r.proj}</span></div>
                  </div>
                  <span className={"spill " + meta.cls}>{meta.text(r)}</span>
                  <div className="srow-rr">
                    <div className="srow-rr-top"><Icon name="user" size={14} />{pct}%</div>
                    <div className="srow-bar"><div className="srow-bar-fill" style={{ width: pct + "%" }} /></div>
                  </div>
                  <SurveyRowMenu row={r} onDeleteDraft={onDeleteDraft} />
                </div>
              );
            })}
            {visible.length === 0 && <div className="srow-empty">No surveys match your filters.</div>}
          </div>
        </section>

      </div>
    </div>
  );
}
