// EditQuestionsDialog.jsx — "Select questions" (Unified-survey-page frame)
// Tabs: Library questions | Custom questions | Themes | Templates. The library
// tab shows ONLY library content grouped by library topics — custom questions
// and custom topics live in the questionnaire (and the Custom questions tab),
// never in the library view. Rows keep selection in the checkbox with hover
// tooltips.
import { useState, useMemo, useRef, useEffect } from "react";
import { Icon } from "./Icon.jsx";
import { themeStatus, themesOf, groupQuestions, QTypeIcon, Checkbox, Tooltip, ThemeTag, CustomTag, RequiredMarker } from "./shared.jsx";
import { CustomQuestionDialog } from "./CustomQuestionDialog.jsx";
import { THEMES, POOL, TEMPLATES, BADGE_COLORS, ORG_CUSTOM } from "../data/data.js";
import { templatePoolQuestions, TEMPLATE_META } from "../data/qlib.js";

// Marks every occurrence of the live query inside a result's text, so it is
// obvious WHY a row matched.
function Highlight({ text, q }) {
  if (!q) return text;
  const parts = [];
  const lower = (text || "").toLowerCase();
  let at = 0;
  for (let i = lower.indexOf(q); i >= 0; i = lower.indexOf(q, at)) {
    if (i > at) parts.push(text.slice(at, i));
    parts.push(<mark key={i} className="eq-hl">{text.slice(i, i + q.length)}</mark>);
    at = i + q.length;
  }
  if (at === 0) return text;
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts}</>;
}

// Two-line tooltip for a "select the whole subject" checkbox — names the current
// state and the action a click performs (select the rest, or clear them).
// Per-topic select-all control. Deliberately a BUTTON, not a checkbox: a
// checkbox reads as "the topic is selected", but what you actually do is add the
// topic's questions — in the questionnaire the topic is only structure. Labels
// stay short ("Select all" / "Deselect all") so translations can't break the
// row, and the topic's total question count rides along in a grey pill.
// Org-required questions can't be deselected; their own marker carries that.
function SelectAllTopic({ allOn, total, onToggle }) {
  return (
    <button className="btn btn-tertiary aql-selectall" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
      {allOn ? "Deselect all" : "Select all"}
      <span className="tag tag-count">{total}</span>
    </button>
  );
}

function selectAllTip(nSel, total) {
  if (total === 0) return "Select all";
  if (nSel === 0) return "Select all questions";
  if (nSel >= total) return <><span className="tt-title">All {total} selected</span>Deselect all questions</>;
  return <><span className="tt-title">{nSel} of {total} selected</span>Select all questions</>;
}

// Checkbox + tooltip for one question row: unchecked = add, checked = added.
function RowCheckbox({ on, onClick }) {
  const label = on ? "Added to questionnaire" : "Add to questionnaire";
  return (
    <Tooltip label={label} pos="is-above" float>
      <Checkbox on={on} large onClick={onClick} />
    </Tooltip>
  );
}

// Which survey a custom question is already used in. Truncates; the tooltip
// carries the whole sentence.
function UsedInTag({ survey }) {
  return (
    <Tooltip label={`Custom question used in ${survey}`} pos="is-above" float>
      <span className="tag tag-draft text-w500 eq-usedin">{survey}</span>
    </Tooltip>
  );
}

function QRow({ q, on, onToggle, onRequiredPress, rowRef, leaving, themeInfo, onOpenTheme, onEditCustom, usedInTag, hl }) {
  const required = q.required;
  // Required questions keep an INTERACTIVE (checked) checkbox — pressing it can't
  // uncheck it; instead it surfaces a live info notification explaining why. A
  // static asterisk marker on the right is the persistent "required" cue.
  return (
    <div ref={rowRef} className={"aql-row" + (leaving ? " is-leaving" : "")}
      onClick={leaving ? undefined : (required ? onRequiredPress : onToggle)}>
      {required
        ? <Checkbox on large locked onClick={(e) => { e.stopPropagation(); onRequiredPress(); }} />
        : <RowCheckbox on={on} onClick={(e) => { e.stopPropagation(); onToggle(); }} />}
      <div className="aql-text">{hl ? <Highlight text={q.text} q={hl} /> : q.text}</div>
      {/* On the Custom questions page the "Custom question" tag is redundant —
          you are on that page. The space carries where the question is used
          instead, truncated, with the full sentence in its tooltip. */}
      {q.theme
        ? <ThemeTag theme={q.theme} kept={themeInfo ? themeInfo.kept : 0} total={themeInfo ? themeInfo.total : 0} pos="is-above" float
            onOpen={onOpenTheme ? () => onOpenTheme(q.theme) : undefined} />
        : usedInTag
          ? (q.from ? <UsedInTag survey={q.from} /> : null)
          : q.custom ? <CustomTag label="Custom question" pos="is-above" float onOpen={onEditCustom ? () => onEditCustom(q) : undefined} /> : null}
      {required && <RequiredMarker size={24} />}
      <QTypeIcon type={q.type} size={24} tip pos="is-above" float />
    </div>
  );
}

// A theme card (Themes tab). Clicking the card adds/removes the whole theme; a
// progress bar shows how far the theme is toward complete, and a composite-score
// line explains that a complete theme becomes one benchmarked score in results.
// A theme / template card share one shape: title · description · a count (+
// progress bar for themes) · a Select/Active toggle button and a View details
// link. "Active" (all questions selected) highlights the card and turns the
// button into a filled "✓ Active"; clicking it again clears the selection.
// `art` is a template's DS illustration path (the same SVG the create-survey
// dialog shows); `illus` stays the icon tile themes use.
function ChoiceCard({ variant, title, desc, illus, art, selCount, total, hl, onToggle, onDetails }) {
  const isTemplate = variant === "template";
  const allOn = total > 0 && selCount >= total;
  const pct = total ? Math.round((selCount / total) * 100) : 0;
  // Once every question is in, the button already reads "Active", so the count
  // drops the "All questions selected" phrasing back to a plain question total.
  const countText = (allOn || selCount === 0) ? `${total} ${total === 1 ? "question" : "questions"}`
    : `${selCount} of ${total} questions selected`;
  // Clicking the card body opens View details; only the Select/Active button
  // toggles it into the questionnaire.
  return (
    <div className={"cc-card " + (isTemplate ? "cc-template" : "cc-theme") + (allOn ? " is-active" : "")}
      role="button" tabIndex={0} onClick={onDetails}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDetails(); } }}>
      <div className="cc-head">
        {art
          ? <img className="cc-art" src={"assets/illustrations/" + art} alt="" />
          : illus && <span className="cc-illus" style={{ background: illus.bg, color: illus.fg }}><Icon name={illus.icon} size={30} /></span>}
        <span className="cc-title">{hl ? <Highlight text={title} q={hl} /> : title}</span>
        <p className="cc-desc">{hl ? <Highlight text={desc} q={hl} /> : desc}</p>
      </div>
      {isTemplate ? (
        <span className="cc-count">{countText}</span>
      ) : (
        <div className="cc-meter">
          <span className="cc-count">{countText}</span>
          <div className="cc-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            {pct > 0 && <div className="cc-progress-fill" style={{ width: pct + "%" }} />}
          </div>
        </div>
      )}
      <div className="cc-foot">
        <button className={"btn " + (allOn ? "btn-primary" : "btn-secondary")} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          {allOn ? <><Icon name="check" size={16} />Active</> : "Select"}</button>
        <button className="btn btn-tertiary" onClick={(e) => { e.stopPropagation(); onDetails(); }}>View details</button>
      </div>
    </div>
  );
}

// Theme details (Figma 6154:13236): explanation, a composite-score notification
// that flips from info ("not shown") to positive ("unlocked") once every question
// is in, and the theme's questions to toggle one by one. Toggles apply live and
// skip the soft-lock; Cancel reverts this theme's questions to how they were on
// open, Got it keeps them.
export function ThemeDetailsDialog({ theme, sel, onToggle, onToggleAll, onClose }) {
  const { name, about, desc, questions, kept, total } = theme;
  const complete = total > 0 && kept >= total;
  // Snapshot the theme's selection on open so Cancel can restore it.
  const initial = useMemo(() => new Set(questions.filter(qq => sel.has(qq.id)).map(qq => qq.id)), []); // eslint-disable-line
  const cancel = () => {
    questions.forEach(qq => { if (initial.has(qq.id) !== sel.has(qq.id)) onToggle(qq.id); });
    onClose();
  };
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 65 }}
      onMouseDown={e => { if (e.target === e.currentTarget) cancel(); }}>
      <div className="dialog dialog-m dialog-worksurface" role="dialog" aria-modal="true" aria-labelledby="thd-title"
        style={{ display: "flex", flexDirection: "column", maxHeight: "min(880px, calc(100vh - 96px))" }}>
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={cancel}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h2 className="dialog-title" id="thd-title">{name}</h2>
          <p className="dialog-subtitle">{about || desc}</p>
        </div>
        <div className={"inline-notif " + (complete ? "is-success" : "is-info")}>
          <img className="inline-notif-icon" alt="" width="24" height="24"
            src={"assets/icons/notification-" + (complete ? "positive" : "information") + ".svg"} />
          <div className="inline-notif-content">
            <div className="inline-notif-text">
              <span className="inline-notif-title">{complete ? "Theme score unlocked for the results!" : "Theme score not shown in results"}</span>
              <span className="inline-notif-msg">{complete
                ? "When all questions in a theme are included, their answers combine into one theme score."
                : "All theme questions need to be selected for a theme to show in the results."}</span>
            </div>
          </div>
        </div>
        <div className="dialog-body scroll-y">
          {/* Same header as a topic's: title, then the select-all button with the
              total in a grey pill. One component, one behaviour. */}
          <div className="aql-sechead" style={{ paddingTop: 0 }}>
            <h3>Theme questions</h3>
            <div className="spacer" />
            <SelectAllTopic allOn={complete} total={total} onToggle={() => onToggleAll(kept < total)} />
          </div>
          {questions.map(qq => (
            <div key={qq.id} className="aql-row" onClick={() => onToggle(qq.id)}>
              <Tooltip label={sel.has(qq.id) ? "Remove from questionnaire" : "Add to questionnaire"} pos="is-above" float>
                <Checkbox on={sel.has(qq.id)} large onClick={(e) => { e.stopPropagation(); onToggle(qq.id); }} />
              </Tooltip>
              <div className="aql-text">
                <span className="thm-q-text">{qq.text}</span>
                {qq.topic && <span className="thm-q-topic">Found under {qq.topic}</span>}
              </div>
              <QTypeIcon type={qq.type} size={24} tip pos="is-above" float />
            </div>
          ))}
        </div>
        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={cancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// DS system notification, top-right, auto-dismissing — confirms a custom
// question was added and names the topic it landed in.
function AddedToast({ topic, onClose }) {
  return (
    <div className="sysnotif-stack">
      <div className="sysnotif" role="status">
        <div className="sysnotif-title">Custom question added</div>
        <div className="sysnotif-desc">Added to “{topic}” and selected in your questionnaire</div>
        <button className="sysnotif-close" aria-label="Dismiss" onClick={onClose}><Icon name="cross" size={16} /></button>
      </div>
    </div>
  );
}

// Info notification shown when a required question is pressed, or when a
// "Deselect all" keeps required questions selected — a live region
// (role=status + aria-live) so the reason is announced, not just seen.
function RequiredNotice({ count = 1, onClose }) {
  return (
    <div className="sysnotif-stack">
      <div className="sysnotif is-info" role="status" aria-live="polite">
        <div className="sysnotif-title">{count > 1 ? `${count} questions are required` : "This question is required"}</div>
        <div className="sysnotif-desc">{count > 1
          ? "They’re set up as required and stay selected in this survey"
          : "It’s set up as required and is always included in this survey"}</div>
        <button className="sysnotif-close" aria-label="Dismiss" onClick={onClose}><Icon name="cross" size={16} /></button>
      </div>
    </div>
  );
}

// First sentence of a description (for the multi-theme stacked cards, which cut
// the description to one sentence instead of the usual two).
const firstSentence = (t) => { const m = (t || "").match(/^.*?[.!?](\s|$)/); return m ? m[0].trim() : (t || ""); };
// Join theme names as “A”, “B” and “C”.
const joinThemes = (names) => {
  const q = names.map(n => `“${n}”`);
  return q.length <= 1 ? (q[0] || "") : q.slice(0, -1).join(", ") + " and " + q[q.length - 1];
};

// The soft-lock example card for one theme: name, description and the two score
// bars. `multi` cuts the description to a single (clamped) sentence.
function TcThemeCard({ name, multi, style }) {
  const th = THEMES[name] || {};
  const groupPct = Math.round((th.score ?? 8.1) * 10);
  const benchPct = Math.round((th.benchmark ?? 7.6) * 10);
  const desc = multi ? firstSentence(th.desc) : (th.desc || "");
  return (
    <div className={"tc-theme-card" + (multi ? " is-multi" : "")} style={style}>
      <div className="tc-theme-name">{name}</div>
      {desc && <p className="tc-theme-desc">{desc}</p>}
      <div className="tc-bars">
        <div className="tc-pbar">
          <div className="tc-pbar-lbl"><span className="tc-pbar-name">Group score</span><span className="tc-pbar-val">{groupPct}%</span></div>
          <div className="tc-track"><div className="tc-fill tc-fill-current" style={{ width: groupPct + "%" }} /></div>
        </div>
        <div className="tc-pbar">
          <div className="tc-pbar-lbl"><span className="tc-pbar-name">Benchmark</span><span className="tc-pbar-val">{benchPct}%</span></div>
          <div className="tc-track"><div className="tc-fill tc-fill-bench" style={{ width: benchPct + "%" }} /></div>
        </div>
      </div>
    </div>
  );
}

export function ThemeConfirm({ q, themes, pool, onKeep, onRemove }) {
  const list = themes && themes.length ? themes : (q.theme ? [q.theme] : []);
  const multi = list.length > 1;
  const count = (pool || POOL).filter(p => themesOf(p).includes(list[0])).length;
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 70 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onKeep(); }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="tc-title">
        <Tooltip label="Close" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onKeep}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h3 className="dialog-title" id="tc-title">{multi ? "Keep the multiple themes complete" : `Keep the “${list[0]}” theme complete`}</h3>
          <p className="dialog-subtitle">
            {multi
              ? <>This is the last question that is holding the themes {joinThemes(list)} complete. You need the average score of all questions to unlock the theme scores.</>
              : <>This is the last question that is holding the theme {joinThemes(list)} complete. You need the average score of all {count} questions to unlock the composite score.</>}
          </p>
        </div>
        <div className="tc-example" aria-hidden="true">
          <span className="tc-example-tag">Not real scores</span>
          {multi ? (
            <div className="tc-stack">
              {list.map((name, i) => <TcThemeCard key={name} name={name} multi style={{ zIndex: i + 1 }} />)}
            </div>
          ) : (
            <TcThemeCard name={list[0]} />
          )}
        </div>
        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onRemove}>Remove anyway</button>
          <button className="btn btn-primary" onClick={onKeep}>Keep question</button>
        </div>
      </div>
    </div>
  );
}

// "Show:" filter — DS selection button + menu (All / Selected / Not selected).
const SHOW_OPTIONS = [
  { value: "all", label: "All questions" },
  { value: "selected", label: "Selected" },
  { value: "unselected", label: "Not selected" },
];
const THEME_SHOW_OPTIONS = [
  { value: "all", label: "All themes" },
  { value: "complete", label: "Complete" },
  { value: "incomplete", label: "Incomplete" },
];
const TEMPLATE_SHOW_OPTIONS = [
  { value: "all", label: "All templates" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Not active" },
];
// Sidebar variant: the filter row sits next to the ONE global search and works
// on whichever section is open, so its labels stay general ("Show: All").
const RESULT_FILTERS = [
  { value: "all", label: "All results" },
  { value: "questions", label: "Questions" },
  { value: "themes", label: "Themes" },
  { value: "templates", label: "Templates" },
];
const GENERIC_SHOW = {
  questions: [
    { value: "all", label: "All" }, { value: "selected", label: "Selected" }, { value: "unselected", label: "Not selected" }],
  custom: [
    { value: "all", label: "All" }, { value: "selected", label: "Selected" }, { value: "unselected", label: "Not selected" }],
  themes: [
    { value: "all", label: "All" }, { value: "complete", label: "Complete" }, { value: "incomplete", label: "Incomplete" }],
  templates: [
    { value: "all", label: "All" }, { value: "active", label: "Active" }, { value: "inactive", label: "Not active" }],
};
function ShowFilter({ value, onChange, options = SHOW_OPTIONS, label = "Show:" }) {
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
        <span className="sel-btn-name">{label}</span>
        <span className="sel-btn-value">{cur.label}</span>
      </button>
      {open && (
        <div className="menu" style={{ position: "absolute", right: 0, top: 44, width: 220, zIndex: 30 }}>
          {options.map(o => (
            <div key={o.value} className={"menu-item" + (o.value === value ? " is-selected" : "")}
              onClick={() => { onChange(o.value); setOpen(false); }}>
              <span className="menu-item-body"><span className="menu-item-title">{o.label}</span></span>
              {o.value === value && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Templates tab → "View details": a full-takeover view (replaces the tabs +
// toolbar + list) showing a template's questionnaire, with per-question
// checkboxes and a "Select all questions" toggle. Selecting here is the same
// action as the card's Select button — it just works question by question.
function TemplateDetailView({ t, sel, onBack, onToggleQuestion, onSelectAll }) {
  const b = BADGE_COLORS[t.badge] || {};
  const meta = TEMPLATE_META[t.id] || {};
  const groups = groupQuestions(t.questions, "library");
  const allOn = t.total > 0 && t.selCount >= t.total;
  return (
    <>
      <div className="dialog-header" style={{ paddingRight: 48 }}>
        <div className="tpv-topbar">
          <button className="btn btn-secondary" onClick={onBack}><Icon name="arrow-left" size={16} />Back to templates</button>
        </div>
      </div>
      <div className="dialog-body scroll-y" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-loose)" }}>
        <div className="tpv-hero">
          <img className="tpv-illus tpv-illus-fit" src={"assets/illustrations/" + t.illus} alt="" />
          <div style={{ minWidth: 0 }}>
            <h2 className="dialog-title" id="tpv-title">{t.name}</h2>
            <div className="tpv-meta">Standard template · {t.total} questions · {meta.minutes || Math.max(3, Math.round(t.total * 0.5))} minutes</div>
          </div>
        </div>
        <p className="text-medium" style={{ margin: 0, color: "var(--content-secondary)", lineHeight: 1.6 }}>{t.desc}</p>
        {t.why && (
          <div>
            <h3 className="tpv-section-title">Why is it valuable?</h3>
            <p className="text-medium" style={{ margin: 0, color: "var(--content-secondary)", lineHeight: 1.6 }}>{t.why}{t.why2 ? " " + t.why2 : ""}</p>
          </div>
        )}
        <div className="tmpl-qpanel">
          <div className="tmpl-qpanel-head">
            <h3 className="tpv-section-title" style={{ fontSize: 20, margin: 0 }}>Questionnaire</h3>
            <button className="btn btn-secondary" onClick={() => onSelectAll(!allOn)}>{allOn ? "Deselect all questions" : "Select all questions"}</button>
          </div>
          {groups.map(g => {
            const ids = g.items.map(x => x.id);
            const gAll = ids.every(id => sel.has(id));
            const gSome = ids.some(id => sel.has(id));
            const nSel = g.items.filter(x => sel.has(x.id)).length;
            return (
              <section key={g.key} className="tmpl-qsec">
                <div className="aql-sechead tmpl-qsec-head">
                  <h3>{g.label}</h3>
                  <div className="spacer" />
                  <SelectAllTopic allOn={gAll} total={ids.length}
                    onToggle={() => ids.forEach(id => { if (gAll ? sel.has(id) : !sel.has(id)) onToggleQuestion(id); })} />
                </div>
                {g.items.map(qq => (
                  <div key={qq.id} className="aql-row" onClick={() => onToggleQuestion(qq.id)}>
                    <Tooltip label={sel.has(qq.id) ? "Remove from questionnaire" : "Add to questionnaire"} pos="is-above" float>
                      <Checkbox on={sel.has(qq.id)} large onClick={(e) => { e.stopPropagation(); onToggleQuestion(qq.id); }} />
                    </Tooltip>
                    <div className="aql-text">{qq.text}</div>
                    <QTypeIcon type={qq.type} size={24} tip pos="is-above" float />
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

// `nav` switches the dialog's navigation (prototype variant, toolbar-driven):
// "tabs"    — the four tabs on top, search scoped to the active tab (current).
// "sidebar" — Miro/Qualtrics-style: a left rail to browse (with the topics as
//             jump anchors) and ONE search on top that looks across questions,
//             themes and templates, results grouped by where they came from.
export function EditQuestionsDialog({ initialPool, initialSelected, tweaks, initialTab = "questions", nav = "tabs", onClose, onSave }) {
  const [pool, setPool] = useState(initialPool);
  const [sel, setSel] = useState(() => new Set(initialSelected));
  const initial = useMemo(() => new Set(initialSelected), []); // selection when the dialog opened
  const [q, setQ] = useState("");
  const [gq, setGq] = useState("");                 // sidebar variant: the one global query
  // Narrowing AFTER the query (Miro's "Filter by"): the search always looks
  // at everything, and this trims the results to one kind — so you never miss
  // a match by pre-scoping, but you can still get precision on demand.
  const [resFilter, setResFilter] = useState("all");
  const [tab, setTab] = useState(initialTab);
  const [show, setShow] = useState("all");
  const [themeQ, setThemeQ] = useState("");       // Themes tab search
  const [themeShow, setThemeShow] = useState("all"); // Themes tab completion filter
  const [tmplQ, setTmplQ] = useState("");         // Templates tab search
  const [tmplShow, setTmplShow] = useState("all"); // Templates tab active filter
  const [templateDetail, setTemplateDetail] = useState(null); // template id whose detail takeover is open
  const [customOpen, setCustomOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [justAdded, setJustAdded] = useState(null); // scroll target right after adding a custom question
  const [toast, setToast] = useState(null);         // { topic }
  const [reqNotice, setReqNotice] = useState(0);    // key: increments each time a required question is pressed (re-announces)
  const [reqCount, setReqCount] = useState(1);      // how many required questions the notice is about
  const [themeDetails, setThemeDetails] = useState(null); // theme name whose details dialog is open
  const [editCustomQ, setEditCustomQ] = useState(null);   // custom question being edited (via its tag)
  const [collapsed, setCollapsed] = useState(() => new Set()); // collapsed Question-tab section keys
  // Rows the active filter is about to hide (a question toggled under the
  // Selected / Not-selected filter): kept in view briefly so they ease out
  // instead of vanishing.
  const [leaving, setLeaving] = useState(() => new Set());
  const addedRef = useRef(null);
  const timers = useRef([]);
  const easeOut = (id) => {
    setLeaving(s => new Set(s).add(id));
    timers.current.push(setTimeout(() => setLeaving(s => { const n = new Set(s); n.delete(id); return n; }), 260));
  };

  const status = useMemo(() => themeStatus([...sel], pool), [sel, pool]);
  const statusFor = (name) => status.find(t => t.name === name);
  // Org-required questions are always selected and can't be toggled/deselected.
  const requiredIds = useMemo(() => new Set(pool.filter(qq => qq.required).map(qq => qq.id)), [pool]);

  // Themes present in this pool, with their questions and selection progress.
  const themeGroups = useMemo(() => {
    const map = {};
    pool.forEach(qq => themesOf(qq).forEach(nm => (map[nm] = map[nm] || []).push(qq)));
    return Object.entries(map).map(([name, questions]) => {
      const meta = THEMES[name] || {};
      return {
        name, questions, ...meta,
        desc: meta.desc || "A group of related questions that combine into one theme score.",
        about: meta.about || meta.desc || "Add all of this theme's questions to read them together as one benchmarked score in your results.",
        kept: questions.filter(qq => sel.has(qq.id)).length, total: questions.length,
      };
    });
  }, [pool, sel]);
  const detailTheme = themeGroups.find(t => t.name === themeDetails) || null;
  const themeCountFor = (name) => themeGroups.find(t => t.name === name);

  // Themes tab: filter cards by search text + completion state.
  const visibleThemes = themeGroups.filter(t => {
    const matchesText = [t.name, t.desc].some(v => (v || "").toLowerCase().includes(themeQ.toLowerCase()));
    const done = t.total > 0 && t.kept >= t.total;
    const matchesShow = themeShow === "all" || (themeShow === "complete" ? done : !done);
    return matchesText && matchesShow;
  });
  // Templates tab: every template with its own question set + how much of it is
  // currently selected. "active" = the template is fully in the questionnaire
  // (all its questions selected) — i.e. used as a starting point.
  const templateCards = useMemo(() => TEMPLATES.map(t => {
    const questions = templatePoolQuestions(t.id);
    const selCount = questions.filter(qq => sel.has(qq.id)).length;
    return { ...t, questions, total: questions.length, selCount, active: questions.length > 0 && selCount === questions.length };
  }), [sel]);
  const detailTemplate = templateCards.find(t => t.id === templateDetail) || null;

  // Sidebar variant: one query across everything. A search should never come
  // back empty because the match lived under another tab.
  const gqt = nav === "sidebar" ? gq.trim().toLowerCase() : "";
  // Custom questions created OUTSIDE this survey (other coordinators/surveys):
  // shown as their own group — customer content stays split from the library,
  // and from this survey's own customs. Adding one pulls it into this survey.
  const poolIds = useMemo(() => new Set(pool.map(x => x.id)), [pool]);
  // Grouping follows WHERE a question was created, not whether this survey uses
  // it: adding one from another survey must not move it between groups, so the
  // overview stays put while you work through it.
  const orgCustomQs = tweaks.orgCustoms === false ? [] : ORG_CUSTOM;
  // Selecting one that isn't in this survey's pool yet pulls it in first.
  const toggleOrgQuestion = (oq) => {
    if (poolIds.has(oq.id)) { toggle(oq); return; }
    setPool(p => [...p, oq]);
    setSel(s2 => new Set([...s2, oq.id]));
  };

  // Result priority: library questions first (validated + benchmarked, the
  // answer we want found), then this survey's customs, then the org's — the
  // other content types follow in their own groups below.
  const bySource = (a, b) => (b.bench ? 1 : 0) - (a.bench ? 1 : 0);
  const gRes = gqt ? (() => {
    const direct = pool.filter(x => (x.text || "").toLowerCase().includes(gqt)).sort(bySource);
    const seen = new Set(direct.map(x => x.id));
    // A theme or topic whose NAME matches brings its questions along. The
    // reason they matched is the group they sit in, not their own wording, so
    // they arrive collapsed under that name instead of padding the direct hits.
    // A matching THEME is already answered by its card in the Themes group
    // (with Select all and View details), so it doesn't get a second section
    // here. A topic has no card anywhere, so it does.
    const topicNames = [...new Set(pool.map(x => x.topic).filter(Boolean))];
    const viaTopic = topicNames
      .filter(n => n.toLowerCase().includes(gqt))
      .map(n => ({ kind: "topic", key: "tp:" + n, name: n,
        questions: pool.filter(x => x.topic === n && !seen.has(x.id)) }))
      .filter(g => g.questions.length);
    viaTopic.forEach(g => g.questions.forEach(x => seen.add(x.id)));
    return {
      questions: direct,
      // One pool for search: org-created customs join the results,
      // differentiated by their tags and source — never excluded.
      orgQuestions: orgCustomQs.filter(x => !poolIds.has(x.id) && x.text.toLowerCase().includes(gqt)),
      indirect: viaTopic,
      themes: themeGroups.filter(t => t.name.toLowerCase().includes(gqt) || (t.desc || "").toLowerCase().includes(gqt)),
      templates: templateCards.filter(t => t.name.toLowerCase().includes(gqt) || (t.desc || "").toLowerCase().includes(gqt)),
    };
  })() : null;
  // Indirect groups start collapsed; opening one is per-group.
  const [resOpen, setResOpen] = useState(() => new Set());
  const toggleResGroup = (k) => setResOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const visibleTemplates = templateCards.filter(t => {
    const matchesText = [t.name, t.desc].some(v => (v || "").toLowerCase().includes(tmplQ.toLowerCase()));
    const matchesShow = tmplShow === "all" || (tmplShow === "active" ? t.active : !t.active);
    return matchesText && matchesShow;
  });
  // Selecting a template adds any of its questions missing from the pool, then
  // selects (or clears) the whole set — several templates can be active at once.
  const mergeIntoPool = (qs) => setPool(p => {
    const have = new Set(p.map(x => x.id));
    const add = qs.filter(qq => !have.has(qq.id));
    return add.length ? [...p, ...add] : p;
  });
  const setTemplate = (t, on) => {
    const ids = t.questions.map(qq => qq.id);
    if (on) mergeIntoPool(t.questions);
    setSel(s => { const n = new Set(s); ids.forEach(id => on ? n.add(id) : n.delete(id)); return n; });
  };
  const toggleTemplateQuestion = (t, id) => {
    mergeIntoPool(t.questions.filter(qq => qq.id === id));
    setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // Editing a custom question from its tag: update / delete it in the pool.
  const saveCustomEdit = (nq) => { setPool(p => p.map(x => x.id === nq.id ? nq : x)); setEditCustomQ(null); };
  const deleteCustomQ = (nq) => {
    setPool(p => p.filter(x => x.id !== nq.id));
    setSel(s => { const n = new Set(s); n.delete(nq.id); return n; });
    setEditCustomQ(null);
  };
  // Flip one question without the theme soft-lock (used inside a theme card / details).
  const plainToggle = (id) => { if (requiredIds.has(id)) return; setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  // Scroll the just-added question into view inside the dialog body.
  useEffect(() => {
    if (justAdded && addedRef.current) addedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [justAdded]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Pressing a required question surfaces the info notice (re-mounted via key so
  // it re-plays + re-announces on each press), auto-dismissing after a moment.
  const reqTimer = useRef(null);
  const showReqNotice = (count = 1) => {
    setReqCount(count);
    setReqNotice(n => n + 1);
    if (reqTimer.current) clearTimeout(reqTimer.current);
    reqTimer.current = setTimeout(() => setReqNotice(0), 4000);
  };
  const toggle = (qq) => {
    if (qq.required) return; // required questions are locked on
    const isOn = sel.has(qq.id);
    if (isOn && tweaks.integrity === "lock") {
      // Removing this question may break one OR several complete themes.
      const broken = themesOf(qq).filter(name => statusFor(name)?.complete);
      if (broken.length) { setConfirm({ q: qq, themes: broken }); return; }
    }
    const willBeOn = !isOn;
    setSel(s => { const n = new Set(s); isOn ? n.delete(qq.id) : n.add(qq.id); return n; });
    // Under a Selected / Not-selected filter the row no longer matches — ease it out.
    if ((show === "selected" && !willBeOn) || (show === "unselected" && willBeOn)) easeOut(qq.id);
  };
  const doRemove = (qq) => {
    setSel(s => { const n = new Set(s); n.delete(qq.id); return n; }); setConfirm(null);
    if (show === "selected") easeOut(qq.id);
  };
  // Closing always drops the dialog back to the default (unfiltered) view.
  const close = () => { setShow("all"); setThemeShow("all"); setTmplShow("all"); onClose(); };
  const apply = () => { setShow("all"); setThemeShow("all"); setTmplShow("all"); onSave([...sel], pool); };
  const setMany = (ids, on) => {
    // Deselect all keeps required questions — and says so, same notice as
    // pressing one directly.
    if (!on) {
      const kept = ids.filter(id => requiredIds.has(id) && sel.has(id)).length;
      if (kept > 0) showReqNotice(kept);
    }
    setSel(s => { const n = new Set(s); ids.forEach(id => { if (!on && requiredIds.has(id)) return; on ? n.add(id) : n.delete(id); }); return n; });
  };
  const addCustom = (nq) => {
    setPool(p => [...p, nq]); setSel(s => new Set([...s, nq.id])); setCustomOpen(false);
    // Make the new question visible where it landed: clear search/filter,
    // switch to the Questions tab, scroll to the row, and toast.
    setQ(""); setShow("all"); setTab("custom");
    setJustAdded(nq.id); setToast({ topic: nq.topic });
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => setJustAdded(null), 2600),
      setTimeout(() => setToast(null), 5000),
    ];
  };

  const customQs = pool.filter(x => x.custom && !x.from);   // written in this survey
  const visible = pool.filter(x => !x.custom)
    .filter(x => [x.text, x.theme, x.topic].some(v => (v || "").toLowerCase().includes(q.toLowerCase())))
    .filter(x => (show === "all" ? true : show === "selected" ? sel.has(x.id) : !sel.has(x.id)) || leaving.has(x.id));
  const groups = groupQuestions(visible, "library");
  const selCount = [...sel].length;
  // Per-section collapse (Questions tab): a chevron per header, plus a
  // collapse-all / expand-all toolbar toggle over the currently visible groups.
  // Collapse all acts on the sections of the page you are on.
  const secKeys = tab === "custom"
    ? [...(customQs.length ? ["cq:own"] : []), ...(orgCustomQs.length ? ["cq:org"] : [])]
    : groups.map(g => g.key);
  const allCollapsed = secKeys.length > 0 && secKeys.every(k => collapsed.has(k));
  const toggleSec = (k) => setCollapsed(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const toggleAllSecs = () => setCollapsed(allCollapsed ? new Set() : new Set(secKeys));

  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div className={"dialog dialog-l dialog-worksurface" + (nav === "sidebar" ? " eq-wide" : "")} role="dialog" aria-modal="true" aria-labelledby="eq-title"
        style={{ display: "flex", flexDirection: "column", height: "min(940px, calc(100vh - 64px))" }}>
        {nav === "tabs" && (
          <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
            <button className="dialog-close" aria-label="Close" onClick={close}><Icon name="cross" /></button>
          </Tooltip>
        )}
        {templateDetail && detailTemplate ? (
          <TemplateDetailView t={detailTemplate} sel={sel} onBack={() => setTemplateDetail(null)}
            onToggleQuestion={(id) => toggleTemplateQuestion(detailTemplate, id)}
            onSelectAll={(on) => setTemplate(detailTemplate, on)} />
        ) : (
        <>
        {nav === "tabs" && (
          <div className="dialog-header" style={{ paddingRight: 24 }}>
            <h2 className="dialog-title" id="eq-title" style={{ fontSize: 20, lineHeight: "28px" }}>Select questions</h2>
          </div>
        )}

        {nav === "tabs" && (
        <div className="tabs" role="tablist">
          <button className={"tab" + (tab === "questions" ? " is-active" : "")} role="tab" aria-selected={tab === "questions"}
            onClick={() => setTab("questions")}><Icon name="list-unordered" size={16} />Library questions</button>
          <button className={"tab" + (tab === "custom" ? " is-active" : "")} role="tab" aria-selected={tab === "custom"}
            onClick={() => setTab("custom")}><Icon name="edit" size={16} />Custom questions</button>
          <button className={"tab" + (tab === "themes" ? " is-active" : "")} role="tab" aria-selected={tab === "themes"}
            onClick={() => setTab("themes")}><Icon name="themes" size={16} />Themes</button>
          <button className={"tab" + (tab === "templates" ? " is-active" : "")} role="tab" aria-selected={tab === "templates"}
            onClick={() => setTab("templates")}><Icon name="layout" size={16} />Templates</button>
        </div>
        )}

        <div className={nav === "sidebar" ? "eq-frame" : "eq-col"}>
        {nav === "sidebar" && (
          <div className="eq-rail" role="tablist" aria-orientation="vertical">
            <div className="eq-rail-title" id="eq-title">Add questions</div>
            {/* Source is a place (Library / Custom); the global search is the
                everything view. While a query is live NO rail item is active —
                the results belong to the whole library, not to a section. */}
            <button className={"eq-rail-item" + (tab === "questions" && !gqt ? " is-active" : "")} role="tab" aria-selected={tab === "questions"}
              onClick={() => { setTab("questions"); setGq(""); setResFilter("all"); }}><Icon name="list-unordered" size={16} />Library questions</button>
            <button className={"eq-rail-item" + (tab === "custom" && !gqt ? " is-active" : "")} role="tab" aria-selected={tab === "custom"}
              onClick={() => { setTab("custom"); setGq(""); setResFilter("all"); }}><Icon name="edit" size={16} />Custom questions</button>
            {/* Questions are atoms; themes and templates SELECT sets of them.
                Naming the group teaches the library's structure instead of
                listing four equal destinations. */}
            <div className="eq-rail-group">Question sets</div>
            <button className={"eq-rail-item" + (tab === "themes" && !gqt ? " is-active" : "")} role="tab" aria-selected={tab === "themes"}
              onClick={() => { setTab("themes"); setGq(""); setResFilter("all"); }}><Icon name="themes" size={16} />Themes</button>
            <button className={"eq-rail-item" + (tab === "templates" && !gqt ? " is-active" : "")} role="tab" aria-selected={tab === "templates"}
              onClick={() => { setTab("templates"); setGq(""); setResFilter("all"); }}><Icon name="layout" size={16} />Templates</button>
          </div>
        )}
        <div className="eq-main">
        {nav === "sidebar" && (
          <div className="eq-toolbar">
            <div className="search-wrap eq-toolbar-search">
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input type="search" className="srch" placeholder="Search questions, themes and templates"
                value={gq} onChange={e => setGq(e.target.value)} />
            </div>
            {gqt && (
              <ShowFilter label="Filter by:" value={resFilter} onChange={setResFilter} options={RESULT_FILTERS} />
            )}
            {!gqt && (
              <ShowFilter
                value={tab === "themes" ? themeShow : tab === "templates" ? tmplShow : show}
                onChange={tab === "themes" ? setThemeShow : tab === "templates" ? setTmplShow : setShow}
                options={GENERIC_SHOW[tab] || GENERIC_SHOW.questions} />
            )}
            {/* Creating a custom question is reachable from every page: it is
                the answer when the library does not cover something, and that
                is a realisation you have while browsing it. */}
            <button className="btn btn-secondary" style={{ flex: "none" }} onClick={() => setCustomOpen(true)}>
              <Icon name="plus" size={16} />Custom question</button>
            <span className="eq-tool-div" aria-hidden="true" />
            <Tooltip label="Close" pos="is-left">
              <button className="ib ib-36 ib-tertiary" aria-label="Close" onClick={close}><Icon name="cross" size={16} /></button>
            </Tooltip>
          </div>
        )}

        {/* The top bar carries only what every page uses (search + the
            filter); an action that belongs to ONE page sits on that page's
            title row instead, tertiary, hard right. */}
        {nav === "sidebar" && (
          <div className="eq-section-row">
            <h3 className="eq-section-title">{gqt
              ? `Results for “${gq.trim()}”`
              : tab === "questions" ? "Library questions"
              : tab === "custom" ? "Custom questions"
              : tab === "themes" ? "Themes" : "Templates"}</h3>
            <span className="spacer" />
            {!gqt && (tab === "questions" || tab === "custom") && secKeys.length > 0 && (
              <button className="btn btn-tertiary" onClick={toggleAllSecs}>
                <Icon name={allCollapsed ? "double-chevron-down" : "double-chevron-up"} size={16} />{allCollapsed ? "Expand all" : "Collapse all"}</button>
            )}
          </div>
        )}


        {nav === "tabs" && tab === "questions" && (
          <div style={{ display: "flex", gap: "var(--spacing-base-tight)", alignItems: "center" }}>
            <div className="search-wrap" style={{ flex: 1 }}>
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input type="search" className="srch" placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <ShowFilter value={show} onChange={setShow} />
            <button className={"btn btn-secondary" + (secKeys.length === 0 ? " is-disabled" : "")} disabled={secKeys.length === 0}
              style={{ flex: "none" }} onClick={toggleAllSecs}>
              <Icon name={allCollapsed ? "double-chevron-down" : "double-chevron-up"} size={16} />{allCollapsed ? "Expand all" : "Collapse all"}</button>
          </div>
        )}

        {nav === "tabs" && tab === "custom" && customQs.length > 0 && (
          <div style={{ display: "flex", gap: "var(--spacing-base-tight)", alignItems: "center" }}>
            <span className="text-medium text-subdued" style={{ flex: 1 }}>Your own questions for this survey. No benchmark comparisons.</span>
            <button className="btn btn-secondary" style={{ flex: "none" }} onClick={() => setCustomOpen(true)}>
              <Icon name="plus" size={16} />Create custom question</button>
          </div>
        )}

        {nav === "tabs" && tab === "themes" && themeGroups.length > 0 && (
          <div style={{ display: "flex", gap: "var(--spacing-base-tight)", alignItems: "center" }}>
            <div className="search-wrap" style={{ flex: 1 }}>
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input type="search" className="srch" placeholder="Search themes" value={themeQ} onChange={e => setThemeQ(e.target.value)} />
            </div>
            <ShowFilter value={themeShow} onChange={setThemeShow} options={THEME_SHOW_OPTIONS} />
          </div>
        )}

        {nav === "tabs" && tab === "templates" && (
          <div style={{ display: "flex", gap: "var(--spacing-base-tight)", alignItems: "center" }}>
            <div className="search-wrap" style={{ flex: 1 }}>
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input type="search" className="srch" placeholder="Search templates" value={tmplQ} onChange={e => setTmplQ(e.target.value)} />
            </div>
            <ShowFilter value={tmplShow} onChange={setTmplShow} options={TEMPLATE_SHOW_OPTIONS} />
          </div>
        )}

        <div className="dialog-body scroll-y">
          {gRes ? (
            (resFilter === "all" ? gRes.questions.length + gRes.orgQuestions.length + gRes.indirect.length + gRes.themes.length + gRes.templates.length
              : resFilter === "questions" ? gRes.questions.length + gRes.orgQuestions.length + gRes.indirect.length
              : resFilter === "themes" ? gRes.themes.length : gRes.templates.length) === 0 ? (
              <div className="eq-empty">
                <img className="eq-empty-art" src="assets/illustrations/templates/search-no-results-illustration.svg" alt="" />
                <div className="eq-empty-title">We couldn't find any matches for "{gq.trim()}"</div>
                <p className="eq-empty-body">{resFilter === "all"
                  ? "Check the spelling or try another word"
                  : "No matches of this kind. Choose All results to see everything"}</p>
              </div>
            ) : (
              <>
                {(resFilter === "all" || resFilter === "questions") && gRes.questions.length + gRes.orgQuestions.length + gRes.indirect.length > 0 && (
                  <section className="eq-gres">
                    <div className="eq-gres-head">Questions <span className="tag tag-count">
                      {gRes.questions.length + gRes.orgQuestions.length
                        + gRes.indirect.reduce((n, g) => n + g.questions.length, 0)}</span></div>
                    {gRes.questions.map(qq => <QRow key={qq.id} q={qq} on={sel.has(qq.id)} hl={gqt}
                      leaving={leaving.has(qq.id)} themeInfo={qq.theme ? themeCountFor(qq.theme) : null}
                      onOpenTheme={setThemeDetails} onEditCustom={setEditCustomQ}
                      onToggle={() => toggle(qq)} onRequiredPress={showReqNotice} rowRef={null} />)}
                    {gRes.orgQuestions.map(oq => (
                      <div key={oq.id} className="aql-row" onClick={() => toggleOrgQuestion(oq)}>
                        <Tooltip label="Add to questionnaire" pos="is-above" float>
                          <Checkbox on={false} large onClick={(e) => { e.stopPropagation(); toggleOrgQuestion(oq); }} />
                        </Tooltip>
                        <div className="aql-text"><Highlight text={oq.text} q={gqt} /></div>
                        <CustomTag label="Custom question" pos="is-above" float />
                        <UsedInTag survey={oq.from} />
                        <QTypeIcon type={oq.type} size={24} tip pos="is-above" float />
                      </div>
                    ))}
                    {/* A theme or topic that matched by name renders exactly like a
                        section in the library list: same header, same count pill,
                        same collapse chevron. It IS that group, just reached
                        through search. */}
                    {gRes.indirect.map(g => {
                      const open = resOpen.has(g.key);
                      const ids = g.questions.map(x => x.id);
                      const allOn = ids.every(id => sel.has(id));
                      return (
                        <section key={g.key} className={"aql-sec eq-res-sec" + (open ? "" : " is-collapsed")}>
                          <div className="aql-sechead">
                            <h3><Highlight text={g.name} q={gqt} /></h3>
                            <span className="text-medium text-subdued">{g.kind}</span>
                            <div className="spacer" />
                            <SelectAllTopic allOn={allOn} total={ids.length} onToggle={() => setMany(ids, !allOn)} />
                            <Tooltip label={open ? "Collapse" : "Expand"} pos="is-above" float>
                              <button className="ib ib-tertiary aql-sec-toggle" aria-label={open ? "Collapse questions" : "Expand questions"}
                                aria-expanded={open} onClick={() => toggleResGroup(g.key)}>
                                <Icon name="chevron-down" size={16} className={"aql-chevron" + (open ? " is-expanded" : "")} />
                              </button>
                            </Tooltip>
                          </div>
                          {open && g.questions.map(qq => <QRow key={qq.id} q={qq} on={sel.has(qq.id)}
                            leaving={leaving.has(qq.id)} themeInfo={qq.theme ? themeCountFor(qq.theme) : null}
                            onOpenTheme={setThemeDetails} onEditCustom={setEditCustomQ}
                            onToggle={() => toggle(qq)} onRequiredPress={showReqNotice} rowRef={null} />)}
                        </section>
                      );
                    })}
                  </section>
                )}
                {(resFilter === "all" || resFilter === "themes") && gRes.themes.length > 0 && (
                  <section className="eq-gres">
                    <div className="eq-gres-head">Themes <span className="tag tag-count">{gRes.themes.length}</span></div>
                    <div className="thm-grid">
                      {gRes.themes.map(t => <ChoiceCard key={t.name} variant="theme" hl={gqt}
                        title={t.name} desc={t.desc} selCount={t.kept} total={t.total}
                        onToggle={() => setMany(t.questions.map(x => x.id), t.kept < t.total)}
                        onDetails={() => setThemeDetails(t.name)} />)}
                    </div>
                  </section>
                )}
                {(resFilter === "all" || resFilter === "templates") && gRes.templates.length > 0 && (
                  <section className="eq-gres">
                    <div className="eq-gres-head">Templates <span className="tag tag-count">{gRes.templates.length}</span></div>
                    <div className="thm-grid">
                      {gRes.templates.map(t => <ChoiceCard key={t.id} variant="template" hl={gqt}
                        title={t.name} desc={t.desc} art={t.illus} selCount={t.selCount} total={t.total}
                        onToggle={() => setTemplate(t, !t.active)}
                        onDetails={() => setTemplateDetail(t.id)} />)}
                    </div>
                  </section>
                )}
              </>
            )
          ) : tab === "themes" ? (
            themeGroups.length === 0 ? (
              <div className="aql-themes-empty">
                <Icon name="themes" size={32} />
                <div className="text-l5" style={{ color: "var(--content-secondary)" }}>No themes in this library</div>
                <div className="text-medium">Add individual questions from the Questions tab.</div>
              </div>
            ) : (
              <>
                {visibleThemes.length === 0 ? (
                  <div className="aql-themes-empty"><div className="text-medium">No themes match your search or filter.</div></div>
                ) : (
                  <div className="thm-grid">
                    {visibleThemes.map(t => <ChoiceCard key={t.name} variant="theme"
                      title={t.name} desc={t.desc} selCount={t.kept} total={t.total}
                      onToggle={() => setMany(t.questions.map(x => x.id), t.kept < t.total)}
                      onDetails={() => setThemeDetails(t.name)} />)}
                  </div>
                )}
              </>
            )
          ) : tab === "custom" ? (
            customQs.length === 0 && orgCustomQs.length === 0 ? (
              <div className="eq-empty">
                <img className="eq-empty-art" src="assets/illustrations/templates/search-no-results-illustration.svg" alt="" />
                <div className="eq-empty-title">No custom questions yet</div>
                <p className="eq-empty-body">
                  The library covers most of what organizations measure. Write your own for
                  something specific to your context. Custom questions don't carry a benchmark.
                </p>
                <button className="btn btn-primary" onClick={() => setCustomOpen(true)}>
                  <Icon name="plus" size={16} />Custom question</button>
              </div>
            ) : (
              <>
                {/* Two groups, behaving like the library's topics: count pill,
                    collapse chevron, and Select all where selecting is what the
                    checkbox does. */}
                {customQs.length > 0 && (
                  <section className={"aql-sec" + (collapsed.has("cq:own") ? " is-collapsed" : "")}>
                    <div className="aql-sechead">
                      <h3>Created in this survey</h3>
                      <div className="spacer" />
                      <SelectAllTopic allOn={customQs.every(x => sel.has(x.id))} total={customQs.length}
                        onToggle={() => setMany(customQs.map(x => x.id), !customQs.every(x => sel.has(x.id)))} />
                      <Tooltip label={collapsed.has("cq:own") ? "Expand" : "Collapse"} pos="is-above" float>
                        <button className="ib ib-tertiary aql-sec-toggle" aria-label="Collapse questions"
                          aria-expanded={!collapsed.has("cq:own")} onClick={() => toggleSec("cq:own")}>
                          <Icon name="chevron-down" size={16} className={"aql-chevron" + (collapsed.has("cq:own") ? "" : " is-expanded")} />
                        </button>
                      </Tooltip>
                    </div>
                    {!collapsed.has("cq:own") && customQs.map(qq => <QRow key={qq.id} q={qq} on={sel.has(qq.id)} usedInTag
                      leaving={leaving.has(qq.id)} themeInfo={null}
                      onOpenTheme={setThemeDetails} onEditCustom={setEditCustomQ}
                      onToggle={() => toggle(qq)} onRequiredPress={showReqNotice} rowRef={qq.id === justAdded ? addedRef : null} />)}
                  </section>
                )}
                {orgCustomQs.length > 0 && (
                  <section className={"aql-sec" + (collapsed.has("cq:org") ? " is-collapsed" : "")}>
                    <div className="aql-sechead">
                      <h3>Created and used in other surveys</h3>
                      <div className="spacer" />
                      <span className="tag tag-count">{orgCustomQs.length}</span>
                      <Tooltip label={collapsed.has("cq:org") ? "Expand" : "Collapse"} pos="is-above" float>
                        <button className="ib ib-tertiary aql-sec-toggle" aria-label="Collapse questions"
                          aria-expanded={!collapsed.has("cq:org")} onClick={() => toggleSec("cq:org")}>
                          <Icon name="chevron-down" size={16} className={"aql-chevron" + (collapsed.has("cq:org") ? "" : " is-expanded")} />
                        </button>
                      </Tooltip>
                    </div>
                    {!collapsed.has("cq:org") && orgCustomQs.map(oq => (
                      <div key={oq.id} className="aql-row" onClick={() => toggleOrgQuestion(oq)}>
                        <Tooltip label={sel.has(oq.id) ? "Added to questionnaire" : "Add to questionnaire"} pos="is-above" float>
                          <Checkbox on={sel.has(oq.id)} large onClick={(e) => { e.stopPropagation(); toggleOrgQuestion(oq); }} />
                        </Tooltip>
                        <div className="aql-text">{oq.text}</div>
                        <UsedInTag survey={oq.from} />
                        <QTypeIcon type={oq.type} size={24} tip pos="is-above" float />
                      </div>
                    ))}
                  </section>
                )}
              </>
            )
          ) : tab === "templates" ? (
            visibleTemplates.length === 0 ? (
              <div className="aql-themes-empty"><div className="text-medium">No templates match your search or filter.</div></div>
            ) : (
              <div className="thm-grid">
                {visibleTemplates.map(t => <ChoiceCard key={t.id} variant="template"
                  title={t.name} desc={t.desc} art={t.illus} selCount={t.selCount} total={t.total}
                  onToggle={() => setTemplate(t, !t.active)}
                  onDetails={() => setTemplateDetail(t.id)} />)}
              </div>
            )
          ) : (
            <>
              {groups.map(g => {
                const ids = g.items.map(x => x.id);
                const allOn = ids.every(id => sel.has(id));
                const someOn = ids.some(id => sel.has(id));
                const nSel = g.items.filter(x => sel.has(x.id)).length;
                const isColl = collapsed.has(g.key);
                return (
                  <section key={g.key} id={"eq-sec-" + g.key} className={"aql-sec" + (isColl ? " is-collapsed" : "")}>
                    <div className="aql-sechead">
                      <h3>{g.label}</h3>
                      <div className="spacer" />
                      <SelectAllTopic allOn={allOn} total={ids.length} onToggle={() => setMany(ids, !allOn)} />
                      <Tooltip label={isColl ? "Expand" : "Collapse"} pos="is-above" float>
                        <button className="ib ib-tertiary aql-sec-toggle" aria-label={isColl ? "Expand questions" : "Collapse questions"}
                          aria-expanded={!isColl} onClick={() => toggleSec(g.key)}>
                          <Icon name="chevron-down" size={16} className={"aql-chevron" + (isColl ? "" : " is-expanded")} />
                        </button>
                      </Tooltip>
                    </div>
                    {!isColl && g.items.map(qq => <QRow key={qq.id} q={qq} on={sel.has(qq.id)}
                      leaving={leaving.has(qq.id)} themeInfo={qq.theme ? themeCountFor(qq.theme) : null}
                      onOpenTheme={setThemeDetails} onEditCustom={setEditCustomQ}
                      onToggle={() => toggle(qq)} onRequiredPress={showReqNotice} rowRef={qq.id === justAdded ? addedRef : null} />)}
                  </section>
                );
              })}
              {groups.length === 0 && (
                <div className="aql-themes-empty"><div className="text-medium">No questions match your search or filter.</div></div>
              )}
            </>
          )}
        </div>
        </div>
        </div>
        </>
        )}

        <div className="dialog-footer">
          <span className="text-medium text-w500" style={{ color: "var(--content-base)" }}>{selCount} total {selCount === 1 ? "question" : "questions"} selected</span>
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={close}>Cancel</button>
          <button className="btn btn-primary" onClick={apply}>Confirm</button>
        </div>
      </div>

      {customOpen && <CustomQuestionDialog topics={[...new Set(pool.filter(x => sel.has(x.id) && x.topic).map(x => x.topic))].map(t => ({ value: t, label: t }))}
        pool={[...pool, ...orgCustomQs]} selectedIds={[...sel]}
        onUseSuggestion={(q) => { if (pool.some(pq => pq.id === q.id)) setMany([q.id], true); else toggleOrgQuestion(q); setCustomOpen(false); }}
        onCancel={() => setCustomOpen(false)} onAdd={addCustom} />}
      {editCustomQ && <CustomQuestionDialog question={editCustomQ}
        topics={[...new Set(pool.filter(x => (sel.has(x.id) || x.id === editCustomQ.id) && x.topic).map(x => x.topic))].map(t => ({ value: t, label: t }))}
        onCancel={() => setEditCustomQ(null)} onSubmit={saveCustomEdit} onDelete={deleteCustomQ} />}
      {confirm && <ThemeConfirm q={confirm.q} themes={confirm.themes} pool={pool} onKeep={() => setConfirm(null)} onRemove={() => doRemove(confirm.q)} />}
      {detailTheme && <ThemeDetailsDialog theme={detailTheme} sel={sel}
        onToggle={plainToggle} onToggleAll={(on) => setMany(detailTheme.questions.map(x => x.id), on)}
        onClose={() => setThemeDetails(null)} />}
      {toast && <AddedToast topic={toast.topic} onClose={() => setToast(null)} />}
      {reqNotice > 0 && <RequiredNotice key={reqNotice} count={reqCount} onClose={() => setReqNotice(0)} />}
    </div>
  );
}
