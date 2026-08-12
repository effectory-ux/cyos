// shared.jsx — small reusable pieces built on the Engage DS.
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";
import { POOL, THEMES, CUSTOM_GROUP, QTYPES } from "../data/data.js";

// ---- theme integrity --------------------------------------------------
// A question usually belongs to ONE theme (`q.theme`), but a small percentage
// can belong to several (`q.themes`) — removing such a question can break more
// than one theme at once. `themesOf` is the single source of truth; it defaults
// to `[q.theme]` so single-theme questions behave exactly as before.
export const themesOf = (q) => (q.themes && q.themes.length ? q.themes : (q.theme ? [q.theme] : []));

// A theme's composite score shows only if ALL its pool questions are kept.
// Computes over the given `pool` (defaults to the shared POOL) — pass the
// survey's own pool so template-built surveys (whose ids aren't in POOL) still
// register their themes as complete for the soft-lock.
export function themeStatus(selectedIds, pool = POOL) {
  const sel = new Set(selectedIds);
  const map = {};
  pool.forEach(q => themesOf(q).forEach(name => {
    map[name] = map[name] || { total: 0, kept: 0, name };
    map[name].total++;
    if (sel.has(q.id)) map[name].kept++;
  }));
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
export function QTypeIcon({ type, size = 24, tip = false, pos = "is-above", float = false }) {
  const m = QTYPES[type];
  const tile = (
    <span className="qtile" style={{ background: m.bg, color: m.fg, width: size, height: size }} title={tip ? undefined : m.label}>
      <Icon name={m.icon} size={size === 24 ? 16 : Math.round(size * 0.66)} />
    </span>
  );
  return tip ? <Tooltip label={m.label} pos={pos} float={float}>{tile}</Tooltip> : tile;
}

// Marker shown in place of the checkbox (dialog) / as an extra tile (builder) for
// an org-required question — always selected, can't be toggled or removed.
export function RequiredMarker({ size = 20 }) {
  return (
    <Tooltip label="Question is set-up as required">
      <span className="req-mark" style={{ width: size, height: size }} aria-label="Required question">
        <Icon name="asterisk" size={size >= 24 ? 16 : 12} />
      </span>
    </Tooltip>
  );
}

// ---- tooltip -----------------------------------------------------------
// Wraps a trigger (icon-only buttons must still carry their own aria-label).
// The bubble ALWAYS renders in a portal with fixed positioning (so it escapes
// any `overflow` clipping) and ALWAYS sits ABOVE or BELOW the trigger — never on
// the sides — flipping below only when there isn't room above near the viewport
// top. `pos`/`float` props are accepted but ignored (legacy call sites).
// `wrapClass` lets an absolutely-positioned target (e.g. .dialog-close) hand its
// positioning to the wrapper — see `.dialog-close-tt`.
export function Tooltip({ label, wrapClass, children }) {
  const [show, setShow] = useState(false);
  const [xy, setXY] = useState(null);
  const ref = useRef(null);
  const measure = () => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect(), gap = 10;
    // Prefer above; flip below when the trigger is too close to the viewport top
    // for a (possibly two-line) bubble to fit.
    const below = r.top < 96;
    setXY({ side: below ? "is-below" : "is-above",
      left: r.left + r.width / 2, top: below ? r.bottom + gap : r.top - gap });
  };
  const open = () => { measure(); setShow(true); };
  const close = () => setShow(false);
  return (
    <span ref={ref} className={"tt-demo" + (wrapClass ? " " + wrapClass : "")}
      onMouseEnter={open} onMouseLeave={close} onMouseDown={close} onFocus={open} onBlur={close}>
      {children}
      {show && xy && createPortal(
        <span className={"tooltip tooltip-float " + xy.side} role="tooltip" style={{ left: xy.left, top: xy.top }}>{label}</span>,
        document.body)}
    </span>
  );
}

// ---- tags --------------------------------------------------------------
export function Tag({ kind, icon, children }) {
  return <span className={"tag tag-" + kind}>{icon && <Icon name={icon} size={14} />}{children}</span>;
}

// A 10px ring showing how far along a theme is (added / total questions).
function ProgressRing({ pct }) {
  const r = 4, c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  return (
    <svg className="tag-ring" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <circle cx="5" cy="5" r={r} fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth="1.5" />
      <circle cx="5" cy="5" r={r} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 5 5)" />
    </svg>
  );
}

// Theme tag whose look tracks how much of the theme is in the questionnaire:
//   neutral (grey)      — no questions of the theme added yet
//   in progress (light) — some added; a ring shows the fraction
//   complete (filled)   — every question added; a check replaces the ring
// Interactivity handlers shared by the clickable tags (open a dialog on click,
// keyboard-accessible, and stop the click from also toggling the row it sits in).
function tagActivate(onOpen) {
  if (!onOpen) return {};
  return {
    role: "button", tabIndex: 0,
    onClick: (e) => { e.stopPropagation(); onOpen(); },
    onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onOpen(); } },
  };
}

export function ThemeTag({ theme, kept = 0, total = 0, pos = "is-left", float = false, onOpen }) {
  const complete = total > 0 && kept >= total;
  const partial = kept > 0 && !complete;
  const state = complete ? "is-complete" : partial ? "is-progress" : "is-neutral";
  // Short, scannable status (theme name on line 1, status on line 2).
  const status = complete ? `All ${total} questions added`
    : partial ? `Add ${total - kept} more to complete`
      : `Add ${total} questions to complete`;
  return (
    <Tooltip label={<><span className="tt-title">{theme}</span>{status}</>} pos={pos} float={float}>
      <span className={"tag tag-thm " + state + (onOpen ? " is-interactive" : "")} {...tagActivate(onOpen)}>
        {/* Complete needs no icon: the inverted fill (dark green, light text)
            already reads as a distinct state next to neutral's light grey. */}
        {partial ? <ProgressRing pct={kept / total} /> : null}
        <span className="tag-ellip">{theme}</span>
      </span>
    </Tooltip>
  );
}

// "Edited" provenance chip — the quiet marker for anything that diverges from
// the library in THIS survey (renamed topic, added description). Clicking it
// opens a small popover that names the original, states the survey-only scope,
// and offers a reset. Standard, untouched items never get a chip.
export function EditedTag({ label = "Edited", title = "Edited for this survey", lines = [], resetLabel, onReset }) {
  const [open, setOpen] = useState(false);
  const [xy, setXY] = useState(null);
  const ref = useRef(null);
  const toggle = (e) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    // Below the chip, left-aligned; clamped so the 280px popover stays on-screen.
    setXY({ left: Math.min(r.left, window.innerWidth - 296), top: r.bottom + 6 });
    setOpen(true);
  };
  return (
    <span ref={ref} style={{ display: "inline-flex" }}>
      <span className="tag tag-edited is-interactive" role="button" tabIndex={0}
        aria-haspopup="dialog" aria-expanded={open}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(e); } }}>
        <Icon name="edit-inline" size={10} /><span className="tag-ellip">{label}</span>
      </span>
      {open && xy && createPortal(
        <>
          <div className="prov-scrim" onMouseDown={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="prov-pop" role="dialog" aria-label={title} style={{ left: xy.left, top: xy.top }}>
            <div className="prov-title">{title}</div>
            {lines.map((ln, i) => <div key={i} className="prov-line">{ln}</div>)}
            <div className="prov-scope"><Icon name="info" size={14} />Applies to this survey only</div>
            {onReset && (
              <button className="btn btn-tertiary prov-reset"
                onClick={(e) => { e.stopPropagation(); setOpen(false); onReset(); }}>
                <Icon name="refresh" size={16} />{resetLabel || "Reset"}
              </button>
            )}
          </div>
        </>,
        document.body)}
    </span>
  );
}

// Custom-question tag. Interactive (with an edit tooltip) when `onOpen` is given.
export function CustomTag({ label = "Custom", pos = "is-left", float = false, onOpen }) {
  return (
    <Tooltip label={onOpen ? "Edit custom question" : "Custom question"} pos={pos} float={float}>
      <span className={"tag tag-custom-q" + (onOpen ? " is-interactive" : "")} {...tagActivate(onOpen)}>
        <Icon name="edit-inline" size={10} /><span className="tag-ellip">{label}</span>
      </span>
    </Tooltip>
  );
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
