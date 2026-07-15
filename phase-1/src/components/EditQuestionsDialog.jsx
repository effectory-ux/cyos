// EditQuestionsDialog.jsx — "Add question from library" (Unified-survey-page frame)
// Tabs (Questions | Themes placeholder), search + Show-filter + Create custom
// question toolbar, sections with select-all checkboxes, and rows whose
// selection state lives in the checkbox (solid = added this session, subtle =
// from the template), each with an explanatory hover tooltip.
import { useState, useMemo, useRef, useEffect } from "react";
import { Icon } from "./Icon.jsx";
import { themeStatus, groupQuestions, QTypeIcon, Checkbox, Tooltip, ThemeTag, CustomTag } from "./shared.jsx";
import { CustomQuestionDialog } from "./CustomQuestionDialog.jsx";
import { THEMES, POOL } from "../data/data.js";

// Checkbox + tooltip for one question row. State semantics (per the frame):
//   empty  → "Add to questionnaire"
//   subtle → "Added to questionnaire from template" (was selected on open)
//   solid  → "Just added to questionnaire" (selected during this session)
function RowCheckbox({ on, fromTemplate, onClick }) {
  const label = !on ? "Add to questionnaire"
    : fromTemplate ? "Added to questionnaire from template" : "Just added to questionnaire";
  return (
    <Tooltip label={label} pos="is-right">
      <Checkbox on={on} large subtle={on && fromTemplate} onClick={onClick} />
    </Tooltip>
  );
}

function QRow({ q, on, fromTemplate, onToggle, rowRef, leaving, themeInfo, onOpenTheme, onEditCustom }) {
  return (
    <div ref={rowRef} className={"aql-row" + (leaving ? " is-leaving" : "")} onClick={leaving ? undefined : onToggle}>
      <RowCheckbox on={on} fromTemplate={fromTemplate} onClick={(e) => { e.stopPropagation(); onToggle(); }} />
      <div className="aql-text">{q.text}</div>
      {q.theme
        ? <ThemeTag theme={q.theme} kept={themeInfo ? themeInfo.kept : 0} total={themeInfo ? themeInfo.total : 0} pos="is-left"
            onOpen={onOpenTheme ? () => onOpenTheme(q.theme) : undefined} />
        : q.custom ? <CustomTag label="Custom question" pos="is-left" onOpen={onEditCustom ? () => onEditCustom(q) : undefined} /> : null}
      <QTypeIcon type={q.type} size={24} tip pos="is-left" />
    </div>
  );
}

// A theme card (Themes tab). Clicking the card adds/removes the whole theme; a
// progress bar shows how far the theme is toward complete, and a composite-score
// line explains that a complete theme becomes one benchmarked score in results.
function ThemeCard({ theme, onToggleAll, onDetails }) {
  const { name, desc, kept, total } = theme;
  const allOn = total > 0 && kept >= total;
  const pct = total ? Math.round((kept / total) * 100) : 0;
  const countText = kept === 0 ? `${total} ${total === 1 ? "question" : "questions"}`
    : allOn ? `All questions selected (${total})`
      : `${kept} of ${total} questions selected`;
  return (
    <div className={"thm-card" + (allOn ? " is-complete" : "")} role="button" tabIndex={0}
      aria-pressed={allOn} onClick={onToggleAll}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggleAll(); } }}>
      <div className="thm-card-head">
        <Checkbox on={allOn} large onClick={(e) => { e.stopPropagation(); onToggleAll(); }} />
        <span className="thm-card-title">{name}</span>
      </div>
      <p className="thm-card-desc">{desc}</p>
      <div className="thm-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        {pct > 0 && <div className="thm-progress-fill" style={{ width: pct + "%" }} />}
      </div>
      <div className="thm-card-foot">
        <span className="thm-card-count">{countText}</span>
        <button className="btn btn-tertiary" onClick={(e) => { e.stopPropagation(); onDetails(); }}>View details<Icon name="info" size={16} /></button>
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
  const count = kept === 0 ? `${total} ${total === 1 ? "question" : "questions"}`
    : complete ? `All questions selected (${total})`
      : `${kept} of ${total} questions selected`;
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
          <div className="aql-sechead" style={{ paddingTop: 0 }}>
            <Checkbox on={complete} indeterminate={kept > 0 && !complete} large onClick={() => onToggleAll(kept < total)} />
            <h3>Theme questions</h3>
            <div className="spacer" />
            <span className="aql-count">{count}</span>
          </div>
          {questions.map(qq => (
            <div key={qq.id} className="aql-row" onClick={() => onToggle(qq.id)}>
              <Tooltip label={sel.has(qq.id) ? "Remove from questionnaire" : "Add to questionnaire"} pos="is-right">
                <Checkbox on={sel.has(qq.id)} large onClick={(e) => { e.stopPropagation(); onToggle(qq.id); }} />
              </Tooltip>
              <div className="aql-text">
                <span className="thm-q-text">{qq.text}</span>
                {qq.topic && <span className="thm-q-topic">Found under {qq.topic}</span>}
              </div>
              <QTypeIcon type={qq.type} size={24} tip pos="is-left" />
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
        <div className="sysnotif-desc">Added to “{topic}” — selected and ready in your questionnaire.</div>
        <button className="sysnotif-close" aria-label="Dismiss" onClick={onClose}><Icon name="cross" size={16} /></button>
      </div>
    </div>
  );
}

export function ThemeConfirm({ q, onKeep, onRemove }) {
  const th = THEMES[q.theme] || {};
  const desc = th.desc || "";
  const score = th.score ?? 8.1, bench = th.benchmark ?? 7.6;
  const groupPct = Math.round(score * 10);
  const benchPct = Math.round(bench * 10);
  const count = POOL.filter(p => p.theme === q.theme).length;
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 70 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onKeep(); }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="tc-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onKeep}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h3 className="dialog-title" id="tc-title">Keep the “{q.theme}” theme complete</h3>
          <p className="dialog-subtitle">
            This is the last question that is holding the theme “{q.theme}” complete. You need the
            average score of all {count} questions to unlock the composite score.</p>
        </div>
        <div className="tc-example" aria-hidden="true">
          <span className="tc-example-tag">Results example</span>
          <div className="tc-theme-card">
            <div className="tc-theme-name">{q.theme}</div>
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
function ShowFilter({ value, onChange, options = SHOW_OPTIONS }) {
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
        <span className="sel-btn-name">Show:</span>
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

export function EditQuestionsDialog({ initialPool, initialSelected, tweaks, onClose, onSave }) {
  const [pool, setPool] = useState(initialPool);
  const [sel, setSel] = useState(() => new Set(initialSelected));
  const initial = useMemo(() => new Set(initialSelected), []); // selection when the dialog opened
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("questions");
  const [show, setShow] = useState("all");
  const [themeQ, setThemeQ] = useState("");       // Themes tab search
  const [themeShow, setThemeShow] = useState("all"); // Themes tab completion filter
  const [customOpen, setCustomOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [justAdded, setJustAdded] = useState(null); // scroll target right after adding a custom question
  const [toast, setToast] = useState(null);         // { topic }
  const [themeDetails, setThemeDetails] = useState(null); // theme name whose details dialog is open
  const [editCustomQ, setEditCustomQ] = useState(null);   // custom question being edited (via its tag)
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

  const status = useMemo(() => themeStatus([...sel]), [sel]);
  const statusFor = (name) => status.find(t => t.name === name);

  // Themes present in this pool, with their questions and selection progress.
  const themeGroups = useMemo(() => {
    const map = {};
    pool.forEach(qq => { if (qq.theme) (map[qq.theme] = map[qq.theme] || []).push(qq); });
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
  // Editing a custom question from its tag: update / delete it in the pool.
  const saveCustomEdit = (nq) => { setPool(p => p.map(x => x.id === nq.id ? nq : x)); setEditCustomQ(null); };
  const deleteCustomQ = (nq) => {
    setPool(p => p.filter(x => x.id !== nq.id));
    setSel(s => { const n = new Set(s); n.delete(nq.id); return n; });
    setEditCustomQ(null);
  };
  // Flip one question without the theme soft-lock (used inside a theme card / details).
  const plainToggle = (id) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Scroll the just-added question into view inside the dialog body.
  useEffect(() => {
    if (justAdded && addedRef.current) addedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [justAdded]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const toggle = (qq) => {
    const isOn = sel.has(qq.id);
    if (isOn && qq.theme && tweaks.integrity === "lock" && statusFor(qq.theme)?.complete) { setConfirm(qq); return; }
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
  const close = () => { setShow("all"); setThemeShow("all"); onClose(); };
  const apply = () => { setShow("all"); setThemeShow("all"); onSave([...sel], pool); };
  const setMany = (ids, on) => setSel(s => { const n = new Set(s); ids.forEach(id => on ? n.add(id) : n.delete(id)); return n; });
  const addCustom = (nq) => {
    setPool(p => [...p, nq]); setSel(s => new Set([...s, nq.id])); setCustomOpen(false);
    // Make the new question visible where it landed: clear search/filter,
    // switch to the Questions tab, scroll to the row, and toast.
    setQ(""); setShow("all"); setTab("questions");
    setJustAdded(nq.id); setToast({ topic: nq.topic });
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => setJustAdded(null), 2600),
      setTimeout(() => setToast(null), 5000),
    ];
  };

  const visible = pool.filter(x => [x.text, x.theme, x.topic].some(v => (v || "").toLowerCase().includes(q.toLowerCase())))
    .filter(x => (show === "all" ? true : show === "selected" ? sel.has(x.id) : !sel.has(x.id)) || leaving.has(x.id));
  const groups = groupQuestions(visible, "library");
  const selCount = [...sel].length;

  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="dialog dialog-l dialog-worksurface" role="dialog" aria-modal="true" aria-labelledby="eq-title"
        style={{ display: "flex", flexDirection: "column", height: "min(940px, calc(100vh - 64px))" }}>
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={close}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header" style={{ paddingRight: 24 }}>
          <h2 className="dialog-title" id="eq-title" style={{ fontSize: 20, lineHeight: "28px" }}>Add question from library</h2>
        </div>

        <div className="tabs" role="tablist">
          <button className={"tab" + (tab === "questions" ? " is-active" : "")} role="tab" aria-selected={tab === "questions"}
            onClick={() => setTab("questions")}><Icon name="list-unordered" size={16} />Questions</button>
          <button className={"tab" + (tab === "themes" ? " is-active" : "")} role="tab" aria-selected={tab === "themes"}
            onClick={() => setTab("themes")}><Icon name="themes" size={16} />Themes</button>
        </div>

        {tab === "questions" && (
          <div style={{ display: "flex", gap: "var(--spacing-base-tight)", alignItems: "center" }}>
            <div className="search-wrap" style={{ flex: 1 }}>
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input type="search" className="srch" placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <ShowFilter value={show} onChange={setShow} />
            <button className="btn btn-secondary" style={{ flex: "none" }} onClick={() => setCustomOpen(true)}>
              <Icon name="plus" size={16} />Create custom question</button>
          </div>
        )}

        {tab === "themes" && themeGroups.length > 0 && (
          <div style={{ display: "flex", gap: "var(--spacing-base-tight)", alignItems: "center" }}>
            <div className="search-wrap" style={{ flex: 1 }}>
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input type="search" className="srch" placeholder="Search themes" value={themeQ} onChange={e => setThemeQ(e.target.value)} />
            </div>
            <ShowFilter value={themeShow} onChange={setThemeShow} options={THEME_SHOW_OPTIONS} />
          </div>
        )}

        <div className="dialog-body scroll-y">
          {tab === "themes" ? (
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
                    {visibleThemes.map(t => <ThemeCard key={t.name} theme={t}
                      onToggleAll={() => setMany(t.questions.map(x => x.id), t.kept < t.total)}
                      onDetails={() => setThemeDetails(t.name)} />)}
                  </div>
                )}
              </>
            )
          ) : (
            <>
              {groups.map(g => {
                const ids = g.items.map(x => x.id);
                const allOn = ids.every(id => sel.has(id));
                const someOn = ids.some(id => sel.has(id));
                const nSel = g.items.filter(x => sel.has(x.id)).length;
                return (
                  <section key={g.key} className="aql-sec">
                    <div className="aql-sechead">
                      <Checkbox on={allOn} indeterminate={someOn && !allOn} large onClick={() => setMany(ids, !allOn)} />
                      <h3>{g.label}</h3>
                      <div className="spacer" />
                      <span className="aql-count">{someOn ? `${nSel} of ${ids.length} questions selected` : `${ids.length} questions`}</span>
                    </div>
                    {g.items.map(qq => <QRow key={qq.id} q={qq} on={sel.has(qq.id)} fromTemplate={initial.has(qq.id)}
                      leaving={leaving.has(qq.id)} themeInfo={qq.theme ? themeCountFor(qq.theme) : null}
                      onOpenTheme={setThemeDetails} onEditCustom={setEditCustomQ}
                      onToggle={() => toggle(qq)} rowRef={qq.id === justAdded ? addedRef : null} />)}
                  </section>
                );
              })}
              {groups.length === 0 && (
                <div className="aql-themes-empty"><div className="text-medium">No questions match your search or filter.</div></div>
              )}
            </>
          )}
        </div>

        <div className="dialog-footer">
          <span className="text-medium text-w500" style={{ color: "var(--content-base)" }}>{selCount} total {selCount === 1 ? "question" : "questions"} selected</span>
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={close}>Cancel</button>
          <button className="btn btn-primary" onClick={apply}>Confirm</button>
        </div>
      </div>

      {customOpen && <CustomQuestionDialog topics={[...new Set(pool.filter(x => sel.has(x.id) && x.topic).map(x => x.topic))]}
        onCancel={() => setCustomOpen(false)} onAdd={addCustom} />}
      {editCustomQ && <CustomQuestionDialog question={editCustomQ}
        topics={[...new Set(pool.filter(x => (sel.has(x.id) || x.id === editCustomQ.id) && x.topic).map(x => x.topic))]}
        onCancel={() => setEditCustomQ(null)} onSubmit={saveCustomEdit} onDelete={deleteCustomQ} />}
      {confirm && <ThemeConfirm q={confirm} onKeep={() => setConfirm(null)} onRemove={() => doRemove(confirm)} />}
      {detailTheme && <ThemeDetailsDialog theme={detailTheme} sel={sel}
        onToggle={plainToggle} onToggleAll={(on) => setMany(detailTheme.questions.map(x => x.id), on)}
        onClose={() => setThemeDetails(null)} />}
      {toast && <AddedToast topic={toast.topic} onClose={() => setToast(null)} />}
    </div>
  );
}
