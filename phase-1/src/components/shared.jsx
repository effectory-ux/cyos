// shared.jsx — small reusable pieces built on the Engage DS.
import { useState, useRef, useEffect } from "react";
import { Icon } from "./Icon.jsx";
import { POOL, THEMES, CUSTOM_GROUP, QTYPES } from "../data/data.js";

// ---- theme integrity --------------------------------------------------
// A theme's composite score shows only if ALL its pool questions are kept.
export function themeStatus(selectedIds) {
  const sel = new Set(selectedIds);
  const map = {};
  POOL.forEach(q => {
    if (!q.theme) return;
    map[q.theme] = map[q.theme] || { total: 0, kept: 0, name: q.theme };
    map[q.theme].total++;
    if (sel.has(q.id)) map[q.theme].kept++;
  });
  return Object.values(map).map(t => ({ ...t, complete: t.kept === t.total, touched: t.kept > 0 }));
}

// ---- grouping ----------------------------------------------------------
// Topics/themes are ordered by first appearance in `items`, so any template's
// own questions render under their own sections (not just the curated library's
// fixed TOPICS). For the curated pool this is identical to the old fixed order.
const distinct = (items, key) => {
  const seen = [];
  items.forEach(q => { const v = q[key]; if (v && !seen.includes(v)) seen.push(v); });
  return seen;
};
export function groupQuestions(items, sort) {
  const groups = [];
  if (sort === "theme") {
    distinct(items, "theme").forEach(name => {
      const its = items.filter(q => q.theme === name);
      groups.push({ key: name, label: name, kind: "theme", theme: name, desc: (THEMES[name] || {}).desc, items: its });
    });
    const other = items.filter(q => !q.theme && !q.custom);
    if (other.length) groups.push({ key: "__other", label: "Not part of a theme", kind: "other", items: other });
  } else {
    distinct(items, "topic").forEach(t => {
      // A topic section holds every question assigned to it — library questions
      // AND custom questions the user dropped into the topic via "Add to topic".
      const its = items.filter(q => q.topic === t);
      if (its.length) groups.push({ key: t, label: t, kind: "topic", items: its });
    });
  }
  // Only un-filed custom questions fall through to the catch-all group.
  const customs = items.filter(q => q.custom && (sort === "theme" || !q.topic));
  if (customs.length) groups.push({ key: "__custom", label: CUSTOM_GROUP, kind: "custom", items: customs });
  return groups;
}
export function rowSubtext(q, sort) {
  if (q.custom) return null;
  if (sort === "theme") return q.topic || null;
  return q.theme || null;
}

// ---- type tile ---------------------------------------------------------
// `tip` wraps the (label-less) tile in a DS tooltip naming the question type —
// used where the icon stands alone, e.g. the Add questions dialog rows.
export function QTypeIcon({ type, size = 24, tip = false }) {
  const m = QTYPES[type];
  const tile = (
    <span className="qtile" style={{ background: m.bg, color: m.fg, width: size, height: size }} title={tip ? undefined : m.label}>
      <Icon name={m.icon} size={size === 24 ? 16 : Math.round(size * 0.66)} />
    </span>
  );
  return tip ? <Tooltip label={m.label} pos="is-above">{tile}</Tooltip> : tile;
}

// ---- tooltip -----------------------------------------------------------
// Wraps an icon-only button (which must still carry its own aria-label) in the
// DS .tt-demo/.tooltip pattern, revealed on hover/focus (CSS in app.css).
// `wrapClass` lets an absolutely-positioned target (e.g. .dialog-close) hand its
// positioning to the wrapper — see `.dialog-close-tt`.
export function Tooltip({ label, pos = "is-below", wrapClass, children }) {
  return (
    <span className={"tt-demo" + (wrapClass ? " " + wrapClass : "")}>
      {children}
      <span className={"tooltip " + pos} role="tooltip">{label}</span>
    </span>
  );
}

// ---- tags --------------------------------------------------------------
export function Tag({ kind, icon, children }) {
  return <span className={"tag tag-" + kind}>{icon && <Icon name={icon} size={14} />}{children}</span>;
}

// ---- DS checkbox -------------------------------------------------------
// Visual checkbox using the DS .cb pattern. Non-native (click handled by parent row).
export function Checkbox({ on, indeterminate, large, onClick }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate && !on; }, [indeterminate, on]);
  return (
    <span className="cb-wrap" onClick={onClick} style={{ cursor: "pointer" }}>
      <input ref={ref} type="checkbox" className={"cb" + (large ? " cb-lg" : "")} checked={on}
        readOnly tabIndex={-1} style={{ pointerEvents: "none" }} />
    </span>
  );
}

// ---- Sort-by control (DS sel-btn + menu) ------------------------------
export function SortBy({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const cur = options.find(o => o.value === value) || options[0];
  return (
    <div ref={ref} style={{ position: "relative", flex: "none" }}>
      <button className={"sel-btn" + (open ? " is-pressed" : "")} onClick={() => setOpen(o => !o)}>
        <Icon name="filter" size={16} style={{ color: "var(--content-secondary)" }} />
        <span className="sel-btn-name">Sort by</span>
        <span className="sel-btn-value">{cur.label}</span>
        <Icon name="chevron-down" size={16} style={{ color: "var(--content-secondary)" }} />
      </button>
      {open && (
        <div className="menu" style={{ position: "absolute", right: 0, top: 44, width: 280, zIndex: 30 }}>
          {options.map(o => (
            <div key={o.value} className={"menu-item" + (o.value === value ? " is-selected" : "")}
              onClick={() => { onChange(o.value); setOpen(false); }}>
              <span className="menu-item-body">
                <span className="menu-item-title">{o.label}</span>
                {o.hint && <span className="menu-item-sub">{o.hint}</span>}
              </span>
              {o.value === value && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
