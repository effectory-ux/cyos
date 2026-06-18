// Shell.jsx — sidebar + Surveys landing page (Engage DS)
// Sidebar uses the DS Main Navigation component (.mainnav / .mn-*) and Avatar (.av).
import { useState, useEffect, useRef } from "react";
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";

export function Sidebar() {
  const nav = [
    { icon: "home", label: "Home" },
    { icon: "book-open", label: "Surveys", open: true, children: ["All surveys", "Projects"] },
    { icon: "refresh", label: "360 feedback" },
    { icon: "globe", label: "Organization", chevron: true },
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
          <div className="av av-36 av-blue">MJ</div>
          <div className="mn-meta">
            <div className="mn-name">Mariëlle de Jong</div>
            <div className="mn-org">Effectory B.V.</div>
          </div>
          <Icon name="chevron-down" />
        </div>
      </div>
    </div>
  );
}

function StatusTag({ s }) {
  const map = {
    Live:    { cls: "tag", bg: "var(--bg-positive-subtle)", fg: "var(--content-positive-base)" },
    Planned: { cls: "tag", bg: "var(--bg-highlight-subtle)", fg: "var(--content-highlight-base)" },
    Draft:   { cls: "tag tag-draft" },
    Closed:  { cls: "tag", bg: "var(--bg-info-subtle)", fg: "var(--content-info-base)" },
  };
  const c = map[s];
  return <span className={c.cls} style={c.bg ? { background: c.bg, color: c.fg } : undefined}>{s}</span>;
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
    <div ref={ref} style={{ position: "relative", justifySelf: "center" }} onClick={(e) => e.stopPropagation()}>
      <Tooltip label="Survey actions" pos="is-left">
        <button className="ib ib-36 ib-tertiary" aria-label="Survey actions" aria-haspopup="menu" aria-expanded={open}
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
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
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

export function SurveysPage({ rows, onCreate, onDeleteDraft, onOpen }) {
  const cols = "2.4fr 1.4fr 1fr .8fr 1.2fr 40px";
  return (
    <div className="scroll-y" style={{ flex: 1, padding: "var(--spacing-super-loose) var(--spacing-super-extra-loose)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 36 }}>
          <div style={{ flex: 1 }}>
            <h1 className="text-l2" style={{ margin: 0 }}>Surveys</h1>
            <p className="text-large text-subdued" style={{ margin: "6px 0 0" }}>See your most recent surveys and projects</p>
          </div>
          <button className="btn btn-primary" onClick={onCreate}><Icon name="plus" size={16} />Create survey</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <h2 className="text-l5" style={{ margin: 0 }}>All surveys</h2>
          <span className="tag tag-count">{rows.length}</span>
        </div>
        <div className="card" style={{ overflow: "visible" }}>
          <div style={{ display: "grid", gridTemplateColumns: cols, padding: "14px 24px", fontSize: 12, fontWeight: 600,
            color: "var(--content-subtle)", textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border-base)" }}>
            <div>Survey</div><div>Project</div><div>Status</div><div>Response</div><div>Timeline</div><div />
          </div>
          {rows.map((r, i) => (
            <div key={r.id} className="survey-row" role="button" tabIndex={0}
              aria-label={`Open ${r.name}${EDITABLE.has(r.status) ? "" : " (opens a separate prototype)"}`}
              onClick={() => onOpen(r)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(r); } }}
              style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", padding: "18px 24px",
              fontSize: 14, borderBottom: i < rows.length - 1 ? "1px solid var(--border-base)" : "none" }}>
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              <div style={{ color: "var(--content-secondary)" }}>{r.proj}</div>
              <div><StatusTag s={r.status} /></div>
              <div style={{ color: "var(--content-secondary)" }}>{r.resp}</div>
              <div style={{ color: "var(--content-subtle)" }}>{r.date}</div>
              <SurveyRowMenu row={r} onDeleteDraft={onDeleteDraft} />
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-medium text-subdued" style={{ padding: "48px 0", textAlign: "center" }}>No surveys yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
