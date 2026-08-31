// Builder.jsx — Questionnaire step, full-width (Engage DS)
import { useState, useEffect, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";
import { groupQuestions, QTypeIcon, ThemeTag, CustomTag, Tooltip, RequiredMarker, themesOf, useMediaQuery } from "./shared.jsx";
import { ThemeDetailsDialog } from "./EditQuestionsDialog.jsx";
import { BenchmarkQuestionDialog } from "./BenchmarkQuestionDialog.jsx";
import { TopicDialog } from "./TopicDialog.jsx";
import { TranslationsDialog } from "./TranslationsDialog.jsx";
import { THEMES, CUSTOM_GROUP } from "../data/data.js";
import { DESIGNS, designById, designWash } from "../data/designs.js";
import { LANGUAGES, PRIMARY_LANGUAGE, flagSrc, autoTranslation } from "../data/i18n.js";

// Small rename dialog — used for the survey name and for a topic's
// questionnaire-specific label. `note` adds one quiet scope line under the field.
function RenameDialog({ title, label, value, note, tid, onCancel, onSave }) {
  const [v, setV] = useState(value || "");
  const valid = v.trim().length > 0;
  const save = () => { if (valid) onSave(v.trim()); };
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 75 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="rn-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onCancel}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h3 className="dialog-title" id="rn-title">{title}</h3>
        </div>
        <div>
          <span className="cq-lbl">{label}</span>
          <input className="tf" autoFocus value={v} placeholder={label} data-t={tid}
            onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === "Enter") save(); }} />
          {note && <div className="qsp-note" style={{ marginTop: 8 }}><Icon name="info" size={14} />{note}</div>}
        </div>
        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-tertiary" onClick={onCancel}>Cancel</button>
          <button className={"btn btn-primary" + (valid ? "" : " is-disabled")} disabled={!valid} onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

// Topic descriptions are edited via the (upcoming) topic dialog; the
// questionnaire only displays an existing description as static text.

// Warning shown before removing a topic that still holds questions. Offers a
// "don't show again" opt-out (persisted); skipped entirely for empty topics.
function TopicRemoveWarning({ label, count, onCancel, onConfirm }) {
  const [dontShow, setDontShow] = useState(false);
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 78 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="trw-title">
        <div className="dialog-header is-sm">
          <div className="dialog-header-top">
            <Icon name="alert-triangle" size={20} className="dialog-header-icon is-warning" />
            <h3 className="dialog-title" id="trw-title">Remove “{label}”?</h3>
          </div>
          <p className="dialog-subtitle">
            This removes the topic and the <b>{count} {count === 1 ? "question" : "questions"}</b> in it from your
            questionnaire. You can select them again later via <b>Select questions</b>.
          </p>
        </div>
        <label className="cb-label-wrap" style={{ display: "flex", alignItems: "center", gap: "var(--spacing-tight)", cursor: "pointer" }}>
          <span className="cb-wrap"><input type="checkbox" className="cb" checked={dontShow} onChange={e => setDontShow(e.target.checked)} /></span>
          <span className="text-medium">Don’t show this again</span>
        </label>
        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-tertiary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={() => onConfirm(dontShow)}><Icon name="trash" size={16} />Remove topic</button>
        </div>
      </div>
    </div>
  );
}

// Top bar on the Figma _CYOS alt-menu (6293:26515): Draft tag + name + Edit
// name on the left; the four steps as pills on the right, each with the
// overlapping number-badge + icon pair; then a divider and the kebab. No
// bottom border on this page — the context bar below seams to it with its own
// white hairline.
// The four steps as a menu, for a window too narrow to hold them as pills.
// The steps beyond the questionnaire are out of this prototype's scope, so the
// menu shows where you are and what exists — it does not pretend to navigate.
function StepsMenu({ steps, badge }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const here = steps.find(st => st.active);
  return (
    <div ref={ref} style={{ position: "relative", flex: "none" }}>
      <Tooltip label={here ? "Steps: " + here.label : "Steps"} pos="is-below">
        <button className={"ib ib-36 ib-secondary" + (open ? " is-pressed" : "")} aria-label="Steps"
          aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <Icon name="menu" size={16} />
        </button>
      </Tooltip>
      {open && (
        <div className="menu" role="menu" style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", width: 260, zIndex: 60 }}>
          {steps.map(st => (
            <div key={st.label} className={"menu-item" + (st.active ? " is-selected" : "")} role="menuitem"
              aria-current={st.active ? "step" : undefined} aria-disabled={!st.active || undefined}>
              <span className="menu-item-icon" style={{ ...badge(st), width: 22, height: 22, borderRadius: "50%",
                display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600 }}>
                {st.done ? <Icon name="check" size={13} /> : st.n}</span>
              <span className="menu-item-body">
                <span className="menu-item-title">{st.label}</span>
                {st.done && <span className="menu-item-sub">Done</span>}
              </span>
              {st.active && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopNav({ name, onRename, compact, mobile }) {
  const steps = [
    { n: 1, icon: "clipboard-a", label: "Questionnaire", active: true },
    { n: 2, icon: "group", label: "Participants" },
    { n: 3, icon: "calendar", label: "Schedule" },
    { n: 4, icon: "pen-tool", label: "Layout & e-mails", done: true },
  ];
  const badge = (st) => st.done
    ? { background: "var(--bg-positive)", color: "var(--content-on-brand-base)" }
    : st.active
      ? { background: "var(--bg-brand)", color: "var(--content-on-brand-base)" }
      : { background: "var(--bg-tertiary)", color: "var(--content-secondary)" };
  return (
    <div style={{ background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 12px 12px 16px", flex: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <span className="tag tag-draft">Draft</span>
        <h1 data-t="1" style={{ margin: 0, fontWeight: 600, fontSize: 16, lineHeight: "24px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto", minWidth: 64, maxWidth: 340 }}>{name}</h1>
        {/* On a narrow window the name itself is what matters; the action
            keeps its icon and moves its label into the tooltip. */}
        {compact ? (
          <Tooltip label="Edit name" pos="is-below">
            <button className="ib ib-36 ib-tertiary" aria-label="Edit name" onClick={onRename}><Icon name="edit" size={16} /></button>
          </Tooltip>
        ) : (
          <button className="btn btn-link" style={{ padding: "6px 12px", flex: "none" }} onClick={onRename}><Icon name="edit" size={16} />Edit name</button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
        {mobile && <StepsMenu steps={steps} badge={badge} />}
        {!mobile && steps.map(st => (
          <div key={st.label} title={compact ? st.label : undefined}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: compact ? 8 : "8px 12px 8px 8px",
            borderRadius: 12, background: st.active ? "var(--bg-brand-subtle-selected)" : "transparent" }}>
            <div style={{ display: "flex", alignItems: "center", height: 28 }}>
              <span style={{ ...badge(st), width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--border-white)",
                display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600, lineHeight: "16px",
                marginRight: -5, position: "relative", zIndex: 2, boxSizing: "border-box" }}>
                {st.done ? <Icon name="check" size={14} /> : st.n}</span>
              <span style={{ background: st.active ? "var(--bg-brand-subtle-selected)" : "var(--bg-tertiary)",
                border: "2px solid var(--border-white)", borderRadius: 6, padding: 6, display: "flex", boxSizing: "content-box" }}>
                <Icon name={st.icon} size={16} /></span>
            </div>
            {/* The number + icon pair already identifies a step; below the
                breakpoint the labels go and the pills stay readable. */}
            {!compact && (
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: "22.4px", whiteSpace: "nowrap",
                color: st.active ? "var(--content-base)" : "var(--content-secondary)" }}>{st.label}</span>
            )}
          </div>
        ))}
        {!mobile && <span style={{ width: 1, height: 24, background: "var(--border-base)", flex: "none" }} aria-hidden="true" />}
        <Tooltip label="More options" pos="is-below"><button className="ib ib-36 ib-tertiary" aria-label="More options"><Icon name="more-vertical" size={16} /></button></Tooltip>
      </div>
    </div>
  );
}

function BuilderRow({ q, meta, tr, showDesc, onRemove, onEdit, onSettings, onResetDesc, onMoveUp, onMoveDown, canUp, canDown, topics, onMoveTopic, dragging, entering, pulsing, onSeen, themeInfo, onOpenTheme, onDragStart, onDragEnd }) {
  const [menu, setMenu] = useState(false);
  // "Move to topic" opens a nested submenu BESIDE the menu (DS pattern: a
  // trailing .menu-chevron item flying out a second .menu) instead of swapping
  // the menu's contents. Rendered in a fixed layer so no card/scroll ancestor
  // can clip it; `subAt` holds the measured position.
  const [subAt, setSubAt] = useState(null);
  const moveRef = useRef(null);
  const close = () => { setMenu(false); setSubAt(null); };
  const openSub = () => {
    const el = moveRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const W = 240, gap = 4;
    // Flyout to the left of the menu (it sits at the row's right edge); flip
    // right if there isn't room, and keep it inside the viewport vertically.
    const left = r.left - W - gap >= 8 ? r.left - W - gap : Math.min(r.right + gap, window.innerWidth - W - 8);
    setSubAt({ left, top: Math.min(r.top - 8, window.innerHeight - 260), width: W });
  };
  const hasMove = canUp || canDown;
  const effTopic = (meta && meta.topic) || q.topic;
  const otherTopics = (topics || []).filter(t => t.key !== effTopic);
  // Survey-scoped extras on a standard question (custom questions carry their
  // own): a chosen alternative wording and/or an added description. Both are
  // shown and edited in the question settings dialog; the row only carries the
  // provenance chip.
  const variant = !q.custom && meta ? meta.variant : undefined;
  // The whole row opens the question's settings — clicks on interactive
  // children (drag handle, tags, menus, inputs) keep their own behaviour.
  const rowClick = (e) => {
    if (e.target.closest("button, input, textarea, a, .menu, [role='button'], [role='menu']")) return;
    onSettings && onSettings(q);
  };
  const text = tr(`q:${q.id}:text`, variant || q.text);
  // A description shows only when the user asked to see them (Display menu) and
  // this question actually has one — added here or shipped with a custom one.
  const desc = meta && meta.descHidden ? undefined : ((meta && meta.desc) || q.desc);
  return (
    <div className={"qrow" + (dragging ? " is-dragging" : "") + (entering ? " is-entering" : "") + (pulsing ? " is-fresh" : "")} data-qid={q.id}
      onClick={rowClick} onMouseEnter={pulsing && onSeen ? onSeen : undefined}>
      <Tooltip label="Drag to reorder" pos="is-left">
        <button className="ib ib-36 ib-tertiary drag-ib" aria-label="Drag to reorder" draggable
          onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={e => e.preventDefault()}>
          <Icon name="drag-drop" size={16} /></button>
      </Tooltip>
      <div className="qrow-main">
        <div data-t={"q-" + q.id} style={{ fontSize: 14, fontWeight: 500, lineHeight: "22.4px" }}>{text}</div>
        {showDesc && desc && <div className="qrow-desc">{tr(`q:${q.id}:desc`, desc)}</div>}
      </div>
      <div className="qrow-meta">
        {q.theme
          ? <ThemeTag theme={q.theme} kept={themeInfo ? themeInfo.kept : 0} total={themeInfo ? themeInfo.total : 0} pos="is-left"
              onOpen={onOpenTheme ? () => onOpenTheme(q.theme) : undefined} />
          : q.custom ? <CustomTag pos="is-left" onOpen={() => onEdit && onEdit(q)} /> : null}
        {q.required && <RequiredMarker size={24} />}
        <QTypeIcon type={q.type} size={24} tip />
        <div className="qrow-menu-wrap">
          <Tooltip label="Question actions" pos="is-right"><button className="ib ib-36 ib-tertiary" aria-label="Question actions" aria-haspopup="menu" aria-expanded={menu}
            onClick={() => setMenu(o => !o)} draggable={false} onDragStart={e => e.preventDefault()}><Icon name="more-vertical" size={16} /></button></Tooltip>
          {menu && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onMouseDown={close} />
              <div className="menu" role="menu" style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, width: 240, zIndex: 2 }}>
                  <>
                    {q.custom ? (
                      <div className="menu-item" role="menuitem" onClick={() => { close(); onEdit && onEdit(q); }}>
                        <span className="menu-item-icon"><Icon name="edit" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title">Edit question</span></span>
                      </div>
                    ) : (
                      <div className="menu-item" role="menuitem" onClick={() => { close(); onSettings && onSettings(q); }}>
                        <span className="menu-item-icon"><Icon name="sliders" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title">Question settings</span></span>
                      </div>
                    )}
                    <div className="menu-divider" />
                    {canUp && (
                      <div className="menu-item" role="menuitem" onClick={() => { close(); onMoveUp && onMoveUp(); }}>
                        <span className="menu-item-icon"><Icon name="arrow-up" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title">Move up</span></span>
                      </div>
                    )}
                    {canDown && (
                      <div className="menu-item" role="menuitem" onClick={() => { close(); onMoveDown && onMoveDown(); }}>
                        <span className="menu-item-icon"><Icon name="arrow-down" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title">Move down</span></span>
                      </div>
                    )}
                    <div ref={moveRef} className={"menu-item" + (subAt ? " is-hover" : "")} role="menuitem"
                      aria-haspopup="menu" aria-expanded={!!subAt}
                      onMouseEnter={openSub} onClick={() => (subAt ? setSubAt(null) : openSub())}>
                      <span className="menu-item-icon"><Icon name="import-export" size={16} /></span>
                      <span className="menu-item-body"><span className="menu-item-title">Move to topic</span></span>
                      <span className="menu-chevron"><Icon name="chevron-right" size={16} /></span>
                    </div>
                    <div className="menu-divider" />
                    {q.custom ? (
                      <div className="menu-item" role="menuitem" onClick={() => { close(); onRemove && onRemove(q); }}>
                        <span className="menu-item-icon" style={{ color: "var(--content-negative-secondary)" }}><Icon name="trash" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title" style={{ color: "var(--content-negative-secondary)" }}>Delete question</span></span>
                      </div>
                    ) : q.required ? (
                      <div className="menu-item is-disabled" role="menuitem" aria-disabled="true">
                        <span className="menu-item-icon"><Icon name="asterisk" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title">Remove from questionnaire</span><span className="menu-item-sub">This question is required</span></span>
                      </div>
                    ) : (
                      <div className="menu-item" role="menuitem" onClick={() => { close(); onRemove && onRemove(q); }}>
                        <span className="menu-item-icon" style={{ color: "var(--content-negative-secondary)" }}><Icon name="cross" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title" style={{ color: "var(--content-negative-secondary)" }}>Remove from questionnaire</span></span>
                      </div>
                    )}
                  </>
              </div>
              {subAt && createPortal(
                <div className="menu qrow-submenu" role="menu" aria-label="Move to topic"
                  style={{ left: subAt.left, top: subAt.top, width: subAt.width }}
                  onMouseLeave={() => setSubAt(null)}>
                  <div className="menu-group-lbl">Move to topic</div>
                  {otherTopics.map(t => (
                    <div key={t.key} className="menu-item" role="menuitem"
                      onClick={() => { close(); onMoveTopic && onMoveTopic(t.key); }}>
                      <span className="menu-item-body"><span className="menu-item-title">{t.label}</span></span>
                    </div>
                  ))}
                  {otherTopics.length === 0 && (
                    <div className="menu-item is-disabled"><span className="menu-item-body"><span className="menu-item-title">No other topics</span></span></div>
                  )}
                </div>, document.body)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Reconcile the editable on-page ordering with the current selection: keep the
// user's drag order for surviving questions, append newly-added ones to their
// topic, drop removed ones, and add/remove whole sections as needed.
// Smooth-scroll `sc` to `top`, with a guard: smooth scrolling is driven by
// animation frames, which some embedded/background contexts never grant — if
// nothing moved shortly after the call, jump there outright.
function scrollContainerTo(sc, top) {
  const from = sc.scrollTop;
  sc.scrollTo({ top, behavior: "smooth" });
  setTimeout(() => { if (Math.abs(sc.scrollTop - from) < 4 && Math.abs(top - from) >= 4) sc.scrollTop = top; }, 250);
}

function reconcileLayout(prev, groups) {
  const byKey = {}; groups.forEach(g => { byKey[g.key] = g; });
  const seen = new Set();
  const next = [];
  prev.forEach(ps => {
    const g = byKey[ps.key]; if (!g) return;
    const fresh = {}; g.items.forEach(q => { fresh[q.id] = q; });
    const kept = new Set(); const items = [];
    ps.items.forEach(pi => { if (fresh[pi.id]) { items.push(fresh[pi.id]); kept.add(pi.id); } });
    g.items.forEach(q => { if (!kept.has(q.id)) items.push(q); });
    next.push({ key: g.key, label: ps.label, items }); // preserve a renamed topic label
    seen.add(g.key);
  });
  groups.forEach(g => { if (!seen.has(g.key)) next.push({ key: g.key, label: g.label, items: g.items }); });
  // "No topic" is the bottom of the questionnaire by definition, so it is
  // pinned there whatever order the sections were dragged or added in.
  const tail = next.filter(s2 => s2.key === "__custom");
  return tail.length ? [...next.filter(s2 => s2.key !== "__custom"), ...tail] : next;
}

export function Builder({ survey, onDetachQuestion, onEditQuestions, onExit, onSaveClose, onRemoveQuestion, onEditCustom, onRename, onRemoveTopic, onMoveTopic, onToggleQuestion, onSetManyQuestions, onOpenTemplates, onUpdateTopicMeta, onAddTopic, onUpdateQMeta, onUpdateIntro, onSetDesign, onNewCustom, onSaveTranslation, edges = {}, openDialog, onDialogChange }) {
  const { name, design: designId, selectedIds, pool, topicMeta = {}, customTopics = [], qMeta = {}, i18nEdits = {}, intro = {} } = survey;
  // Below this the questionnaire page tightens: step labels go, the page
  // padding and the gaps between cards shrink, "Edit name" becomes an icon.
  const compact = useMediaQuery("(max-width: 1100px)");
  // Narrower still: the step pills don't fit at all and become a menu.
  const mobile = useMediaQuery("(max-width: 760px)");
  const [menuKey, setMenuKey] = useState(null);
  const [rename, setRename] = useState(null);
  const [topicWarn, setTopicWarn] = useState(null); // section pending removal confirmation
  const [themeDetail, setThemeDetail] = useState(null); // theme name whose details dialog is open (from a tag)
  // { creating: true } or { key } — the topic dialog currently open.
  const [topicDialog, setTopicDialog] = useState(null);
  const [settingsQId, setSettingsQId] = useState(null); // standard question whose dialog is open
  const [translationsOpen, setTranslationsOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);   // participant intro screen
  // Context-bar menus (one open at a time) and the two view settings they hold.
  // Both are VIEW state: they change what this page shows, never the survey.
  const [barMenu, setBarMenu] = useState(null);        // "display" | "add" | null
  const [viewLang, setViewLang] = useState("en");
  // The survey's design (a survey property, picked in the bar). In the builder
  // it tints the page behind the cards — the cards themselves stay white.
  const design = designById(designId);
  const [showDesc, setShowDesc] = useState(true);
  // Every builder dialog has a URL: report which one is open, and restore one
  // asked for by a deep link or the prototype toolbar.
  useEffect(() => {
    if (!onDialogChange) return;
    if (settingsQId) onDialogChange({ dialog: "question-settings", arg: settingsQId });
    else if (topicDialog) onDialogChange(topicDialog.creating ? { dialog: "add-topic" } : { dialog: "topic", arg: topicDialog.key });
    else if (translationsOpen) onDialogChange({ dialog: "translations" });
    else if (themeDetail) onDialogChange({ dialog: "theme", arg: themeDetail });
    else if (introOpen) onDialogChange({ dialog: "intro-screen" });

    else onDialogChange(null);
  }, [settingsQId, topicDialog, translationsOpen, themeDetail, introOpen]); // eslint-disable-line
  useEffect(() => {
    if (!openDialog) return;
    const { dialog, arg } = openDialog;
    if (dialog === "question-settings" && arg) setSettingsQId(arg);
    else if (dialog === "topic" && arg) setTopicDialog({ key: arg });
    else if (dialog === "add-topic") setTopicDialog({ creating: true });
    else if (dialog === "translations") setTranslationsOpen(true);
    else if (dialog === "theme" && arg) setThemeDetail(arg);
    else if (dialog === "intro-screen") setIntroOpen(true);

  }, [openDialog]); // eslint-disable-line

  const sel = new Set(selectedIds);
  const customTopicSet = new Set(customTopics);
  // A topic's display name in THIS survey (library name is the stable key).
  // Section labels: a survey-scoped rename wins, then the group's own name.
  // "__custom" is the catch-all at the bottom for questions with no topic (a
  // custom question written without one, or one reused from another survey), so
  // it carries that name rather than its internal key.
  const topicName = (key) => (topicMeta[key] && topicMeta[key].name)
    || (key === "__custom" ? CUSTOM_GROUP : key);
  // A question's effective topic: survey-scoped move override, else its own.
  const effTopic = (q) => (qMeta[q.id] && qMeta[q.id].topic) || q.topic;
  const chosen = pool.filter(q => sel.has(q.id));
  // Rough completion-time estimate (~20s per question) for the overview card.
  const estMinutes = Math.max(1, Math.round((chosen.length * 20) / 60));
  // Theme groups from THIS survey's pool (POOL + library): used for the row tags'
  // progress (real fraction added) and the "View details" dialog opened from a tag.
  const themeGroups = (() => {
    const m = {};
    pool.forEach(qp => themesOf(qp).forEach(nm => (m[nm] = m[nm] || []).push(qp)));
    return Object.entries(m).map(([nm, questions]) => {
      const meta = THEMES[nm] || {};
      return { name: nm, questions, ...meta,
        desc: meta.desc || "A group of related questions that combine into one theme score.",
        about: meta.about || meta.desc || "Add all of this theme's questions to read them together as one benchmarked score in your results.",
        kept: questions.filter(x => sel.has(x.id)).length, total: questions.length };
    });
  })();
  const themeMap = {}; themeGroups.forEach(t => { themeMap[t.name] = t; });
  const detailTheme = themeGroups.find(t => t.name === themeDetail) || null;
  // Group by EFFECTIVE topic (survey-scoped moves included); the Add-questions
  // dialog keeps grouping by the canonical library topic. Empty custom topics
  // still render as sections so they can be filled by drag or move-to.
  const groups = groupQuestions(chosen.map(q => effTopic(q) !== q.topic ? { ...q, topic: effTopic(q) } : q), "library");
  customTopics.forEach(k => { if (!groups.find(g => g.key === k)) groups.push({ key: k, label: k, kind: "topic", items: [] }); });
  // A theme is "active" when every one of its questions is selected — that is
  // what earns a composite score in the results.
  const activeThemes = themeGroups.filter(t => t.total > 0 && t.kept >= t.total).length;


  // Suggestions (the guidance panel + its pre-flight on "Next step") are out
  // for now — the rules in data/suggestions.js and SuggestionsPanel.jsx are
  // left in place, unused, until we know what guidance this step should give.

  // Preview language: a reviewed translation if there is one, otherwise the
  // automatic one. Standard library text ships pre-translated in production;
  // the prototype fakes it with the same translator.
  // The platform's default intro until the coordinator writes their own.
  const introTitle = intro.title || "Hello!";
  const introDesc = intro.desc || "Thank you for participating in this survey. We really appreciate your feedback!";
  const tr = (key, text) => {
    if (viewLang === "en" || !text) return text;
    return (i18nEdits[viewLang] || {})[key] || autoTranslation(text, viewLang);
  };

  // On-page ordering the user can drag-reorder. Lives only here — the Add
  // questions dialog always works from the library order, never this one.
  const [layout, setLayout] = useState(() => groups.map(g => ({ key: g.key, label: g.label, items: g.items })));
  const sig = selectedIds.join(",") + "|" + pool.map(p => p.id + ":" + (p.topic || "") + ":" + (p.text || "") + ":" + (p.required ? "1" : "0")).join(",")
    + "|" + customTopics.join(",") + "|" + Object.entries(qMeta).map(([id, m]) => id + ">" + (m.topic || "")).join(",");
  useEffect(() => { setLayout(prev => reconcileLayout(prev, groups)); }, [sig]); // eslint-disable-line

  // Drag & drop via static drop targets — nothing reorders while dragging; the
  // change is committed once, on drop. Questions get an insertion line between
  // the rows of their own topic; sections get explicit drop zones in the gaps
  // between cards. Static targets can't oscillate the way live reordering did.
  const [drag, setDrag] = useState(null);         // { kind:'q', id, secKey, index, custom } | { kind:'sec', key, index }
  const [qHint, setQHint] = useState(null);       // { secKey, index } — insertion slot for a question
  const [zoneHint, setZoneHint] = useState(null); // hovered section drop-zone index
  const [dropTarget, setDropTarget] = useState(null); // topic a custom question would move to
  // After an HTML5 drag the drag button keeps a stuck :hover/focus, so its
  // tooltip lingers over the reordered item. Suppress tooltips from drag start
  // until the pointer next moves (which clears the stuck hover state).
  const [tipsOff, setTipsOff] = useState(false);
  const clearDrag = () => {
    setDrag(null); setQHint(null); setZoneHint(null); setDropTarget(null);
    const wake = () => { setTipsOff(false); window.removeEventListener("pointermove", wake); };
    window.addEventListener("pointermove", wake);
  };

  // Questions/topics just added via "Apply selection" ease in softly so the
  // change is legible, not abrupt. Refs seed on the first render so the initial
  // builder load doesn't animate everything at once.
  const [enteringIds, setEnteringIds] = useState(() => new Set());
  const [enteringSecs, setEnteringSecs] = useState(() => new Set());
  // Rows that keep pulsing after they arrived, so a question added to a topic
  // that already had some is still findable. Hovering one ends its pulse —
  // you have clearly seen it by then.
  const [pulseIds, setPulseIds] = useState(() => new Set());
  const stopPulse = (id) => setPulseIds(prev => {
    if (!prev.has(id)) return prev;
    const n = new Set(prev); n.delete(id); return n;
  });
  const prevIds = useRef(null);
  const prevSecs = useRef(null);
  const enterTimers = useRef([]);
  useEffect(() => () => enterTimers.current.forEach(clearTimeout), []);

  // Reorder a question to `idx` within its own topic (idx is in the topic's
  // order excluding the dragged item). No-ops if nothing changes.
  const reorderQuestion = (secKey, id, idx) => {
    setLayout(prev => {
      const si = prev.findIndex(s => s.key === secKey); if (si < 0) return prev;
      const items = prev[si].items;
      const dragged = items.find(x => x.id === id); if (!dragged) return prev;
      const without = items.filter(x => x.id !== id);
      const clamped = Math.max(0, Math.min(idx, without.length));
      without.splice(clamped, 0, dragged);
      if (without.length === items.length && without.every((x, k) => x.id === items[k].id)) return prev;
      const nextArr = prev.slice(); nextArr[si] = { ...prev[si], items: without }; return nextArr;
    });
  };
  // Reorder a whole section before/after another. No-ops if nothing changes.
  const reorderSection = (dragKey, overKey, after) => {
    if (dragKey === overKey) return;
    setLayout(prev => {
      const moved = prev.find(s => s.key === dragKey); if (!moved) return prev;
      const without = prev.filter(s => s.key !== dragKey);
      let to = without.findIndex(s => s.key === overKey); if (to < 0) return prev;
      if (after) to += 1;
      without.splice(to, 0, moved);
      if (without.every((s, k) => s.key === prev[k].key)) return prev;
      return without;
    });
  };

  // Only the drag handle is draggable; the whole row/card is used as drag image.
  const startQuestion = (secKey, id, index, custom) => (e) => {
    setDrag({ kind: "q", id, secKey, index, custom }); setTipsOff(true);
    e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "q"); } catch (_) {}
    const row = e.currentTarget.closest(".qrow");
    if (row) { try { e.dataTransfer.setDragImage(row, 24, row.offsetHeight / 2); } catch (_) {} }
  };
  const startSection = (key, index) => (e) => {
    setDrag({ kind: "sec", key, index }); setTipsOff(true);
    e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "sec"); } catch (_) {}
    const card = e.currentTarget.closest(".qsec");
    if (card) { try { e.dataTransfer.setDragImage(card, 24, 30); } catch (_) {} }
  };

  // Question hover: within its OWN topic we LIVE-PREVIEW the new order (the rows
  // reorder to show where it lands), so `qHint.index` is the insertion slot in
  // the topic's order excluding the dragged row. Counting only the non-dragged
  // rows' midpoints keeps it stable — previewing can't shift the calculation.
  // A CUSTOM question over another topic marks that topic as a move target; a
  // STANDARD question over another topic does nothing (the card shows locked).
  const questionBodyDragOver = (secKey) => (e) => {
    const d = drag; if (!d || d.kind !== "q") return;
    if (d.secKey === secKey) {
      e.preventDefault(); e.dataTransfer.dropEffect = "move";
      const rows = [...e.currentTarget.querySelectorAll(".qrow")];
      let idx = 0;
      for (const rEl of rows) {
        if (rEl.getAttribute("data-qid") === String(d.id)) continue; // skip the dragged row
        const r = rEl.getBoundingClientRect();
        if (e.clientY > r.top + r.height / 2) idx++;
      }
      setQHint(prev => (prev && prev.secKey === secKey && prev.index === idx) ? prev : { secKey, index: idx });
    } else {
      e.preventDefault(); e.dataTransfer.dropEffect = "move";
      if (dropTarget !== secKey) setDropTarget(secKey);
    }
  };
  const questionBodyDrop = (secKey) => (e) => {
    const d = drag; if (!d || d.kind !== "q") return;
    e.preventDefault();
    if (d.secKey === secKey && qHint && qHint.secKey === secKey) {
      reorderQuestion(secKey, d.id, qHint.index); // qHint.index is already in without-dragged coords
    } else if (d.secKey !== secKey && onMoveTopic) {
      onMoveTopic(d.id, secKey);
    }
    clearDrag();
  };
  // The dragged topic's rows shown in their previewed order (dragged row moved
  // to the hovered slot). Used only while dragging a question within its topic.
  const previewItems = (s) => {
    if (!(drag && drag.kind === "q" && drag.secKey === s.key && qHint && qHint.secKey === s.key)) return s.items;
    const dragged = s.items.find(x => x.id === drag.id); if (!dragged) return s.items;
    const without = s.items.filter(x => x.id !== drag.id);
    without.splice(Math.max(0, Math.min(qHint.index, without.length)), 0, dragged);
    return without;
  };

  // Section drop zones sit in the gaps between cards (plus above the first and
  // below the last). Zone k = "insert at position k"; the two zones directly
  // around the dragged card are no-ops and stay hidden.
  const zoneIsNoop = (k) => !!drag && drag.kind === "sec" && (k === drag.index || k === drag.index + 1);
  const zoneDragOver = (k) => (e) => {
    if (!drag || drag.kind !== "sec" || zoneIsNoop(k)) return;
    e.preventDefault(); e.dataTransfer.dropEffect = "move";
    if (zoneHint !== k) setZoneHint(k);
  };
  const zoneDragLeave = (k) => () => setZoneHint(h => (h === k ? null : h));
  const zoneDrop = (k) => (e) => {
    const d = drag; if (!d || d.kind !== "sec" || zoneIsNoop(k)) return;
    e.preventDefault();
    const insertAt = k > d.index ? k - 1 : k;
    setLayout(prev => {
      const moved = prev.find(s => s.key === d.key); if (!moved) return prev;
      const without = prev.filter(s => s.key !== d.key);
      without.splice(Math.max(0, Math.min(insertAt, without.length)), 0, moved);
      return without;
    });
    clearDrag();
  };

  // Visible sections, in order — used for up/down bounds & neighbours. Custom
  // topics stay visible while empty (so they can be filled); library topics
  // disappear when their last question goes.
  const visibleSections = layout.filter(s => s.items.length || customTopicSet.has(s.key));

  // Flag questions/sections that appeared since the last render (i.e. an Apply)
  // so they can animate in; clear the flag once the animation has run.
  useEffect(() => {
    const cur = new Set(chosen.map(c => c.id));
    if (prevIds.current === null) { prevIds.current = cur; return; }
    const fresh = [...cur].filter(id => !prevIds.current.has(id));
    prevIds.current = cur;
    if (!fresh.length) return;
    setEnteringIds(prev => { const n = new Set(prev); fresh.forEach(id => n.add(id)); return n; });
    enterTimers.current.push(setTimeout(() =>
      setEnteringIds(prev => { const n = new Set(prev); fresh.forEach(id => n.delete(id)); return n; }), 480));
    // The pulse starts a second in (the reveal animation owns that moment) and
    // runs for five, so it reads as "here they are", not as a warning.
    setPulseIds(prev => { const n = new Set(prev); fresh.forEach(id => n.add(id)); return n; });
    enterTimers.current.push(setTimeout(() =>
      setPulseIds(prev => { const n = new Set(prev); fresh.forEach(id => n.delete(id)); return n; }), 6200));
    // Scroll to the FIRST topic that got something, not the last: several
    // topics can change at once, and reading order beats recency. Measured
    // from the DOM so it follows the order actually on screen.
    enterTimers.current.push(setTimeout(() => {
      const secs = [...document.querySelectorAll(".qsec")];
      const target = secs.find(sec => fresh.some(id => sec.querySelector(`[data-qid="${id}"]`)));
      const sc = target && target.closest(".scroll-y");
      if (target && sc) scrollContainerTo(sc,
        sc.scrollTop + target.getBoundingClientRect().top - sc.getBoundingClientRect().top - 100);
    }, 80));
  }, [sig]); // eslint-disable-line
  // Keyed on the SECTIONS, not on `sig`: a custom topic changes topicMeta and
  // customTopics but no question, so a question-derived signature misses it.
  const secSig = visibleSections.map(s => s.key).join("|");
  useEffect(() => {
    const cur = new Set(visibleSections.map(s => s.key));
    if (prevSecs.current === null) { prevSecs.current = cur; return; }
    const fresh = [...cur].filter(k => !prevSecs.current.has(k));
    prevSecs.current = cur;
    if (!fresh.length) return;
    setEnteringSecs(prev => { const n = new Set(prev); fresh.forEach(k => n.add(k)); return n; });
    enterTimers.current.push(setTimeout(() =>
      setEnteringSecs(prev => { const n = new Set(prev); fresh.forEach(k => n.delete(k)); return n; }), 560));
    // A fresh EMPTY section is a just-created custom topic, far down a long
    // page — go to it, or creating one looks like nothing happened. Sections
    // that arrive WITH questions are covered by the questions' own scroll.
    enterTimers.current.push(setTimeout(() => {
      const k = fresh.find(key => {
        const sec = visibleSections.find(x => x.key === key);
        return sec && sec.items.length === 0;
      });
      if (!k) return;
      const el = document.querySelector(`.qsec[data-key="${CSS.escape(k)}"]`);
      const sc = el && el.closest(".scroll-y");
      // Explicit container math: scrollIntoView gets dropped while the card's
      // reveal animation is transforming it.
      if (el && sc) scrollContainerTo(sc,
        sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 100);
    }, 80));
  }, [secSig]); // eslint-disable-line
  const skipTopicWarn = () => { try { return localStorage.getItem("cyos.skipTopicRemoveWarn") === "1"; } catch (_) { return false; } };
  const doRemoveTopic = (s) => { if (onRemoveTopic) onRemoveTopic(s.items.map(q => q.id), s.key); };
  const requestRemoveTopic = (s) => {
    if (s.items.length === 0 || skipTopicWarn()) { doRemoveTopic(s); return; }
    setTopicWarn(s);
  };

  // One background for the page, reused as the solid underlay of the sticky
  // context bar — its wash is translucent, and scrolled content must never
  // shine through while the bar is stuck.
  const pageBg = design
    ? designWash(design)
    : "var(--bg-secondary)";
  const barWash = design ? "rgba(255,255,255,.30)" : "rgba(25,39,67,.05)";
  return (
    <div className={"col" + (tipsOff ? " tips-off" : "")} style={{ background: pageBg }}>
      <div className="scroll-y" style={{ flex: 1, padding: "0 0 110px" }}>
      <TopNav name={name} onRename={() => setRename({ kind: "survey", value: name })} compact={compact} mobile={mobile} />
      {/* The step's context bar. It replaces the page title: the active tab
          already names the step, so an H1 would only repeat the nav — and this
          page's whole job is a long list. Grammar, left to right:
          STATUS (read-only) -> DISPLAY (what I see) -> ADD CONTENT (what's in
          the survey). Only the last one writes. It sits outside the scrolling
          list, so the status stays in view — it is the orientation now. */}
      <div className="ctxbar" style={{ background: `linear-gradient(${barWash}, ${barWash}), ${pageBg}` }}>
        <div className="ctxbar-inner">
          <div className="ctxbar-status">
            {chosen.length === 0 ? (
              <>
                <span className="ctxbar-count">Start adding your questions</span>
                <span className="ctxbar-meta">A short summary of your selection will show here</span>
              </>
            ) : (
              <>
                <span className="ctxbar-count">{chosen.length} {chosen.length === 1 ? "question" : "questions"} selected</span>
                <span className="ctxbar-meta">
                  {activeThemes > 0 && <>{activeThemes} active {activeThemes === 1 ? "theme" : "themes"}<span className="ov-dot" aria-hidden="true" /></>}
                  {estMinutes} {estMinutes === 1 ? "minute" : "minutes"}
                </span>
              </>
            )}
          </div>

          <div className="spacer" />

          {/* Display and Design are SETTINGS menus: picking an option keeps
              them open (compare languages or designs in quick succession);
              they close on outside click or the button itself. The Add menu
              stays an action menu — its items navigate, so it closes. */}
          <div className="ctxbar-menu-wrap">
            <button className={"btn btn-secondary" + (barMenu === "display" ? " is-pressed" : "")}
              title={compact ? "View" : undefined} aria-label="View"
              aria-haspopup="menu" aria-expanded={barMenu === "display"}
              onClick={() => setBarMenu(m => m === "display" ? null : "display")}>
              <Icon name="layout" size={16} /><span className="ctxbar-btn-lbl">View</span>
            </button>
            {barMenu === "display" && (
              <>
                <div className="cq-menu-scrim" onMouseDown={() => setBarMenu(null)} />
                <div className="menu ctxbar-menu" role="menu">
                  {/* This menu is the one place in the step that changes
                      NOTHING about the survey, so it says so before the
                      options — and each group names what it switches. */}
                  <div className="menu-header">Your view</div>
                  <p className="ctxbar-menu-note">Only changes how you preview the questionnaire. Participants always get the survey as it is set up</p>
                  <div className="menu-divider" />
                  <div className="menu-group-lbl">Preview in language</div>
                  {LANGUAGES.map(l => (
                    <div key={l.code} className={"menu-item" + (viewLang === l.code ? " is-selected" : "")} role="menuitemradio"
                      aria-checked={viewLang === l.code} onClick={() => setViewLang(l.code)}>
                      <span className="lang-flag menu-item-icon"><img src={flagSrc(l.flag)} alt="" /></span>
                      <span className="menu-item-body">
                        <span className="menu-item-title">{l.label}</span>
                        {l.code !== PRIMARY_LANGUAGE.code && <span className="menu-item-sub">Translation</span>}
                      </span>
                      {viewLang === l.code && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
                    </div>
                  ))}
                  <div className="menu-divider" />
                  <div className="menu-group-lbl">Show in this list</div>
                  <div className="menu-item" role="menuitemcheckbox" aria-checked={showDesc}
                    onClick={() => setShowDesc(v => !v)}>
                    <span className="menu-item-body">
                      <span className="menu-item-title">Descriptions</span>
                      <span className="menu-item-sub">The extra context under a question</span>
                    </span>
                    {showDesc && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
                  </div>
                  {(viewLang !== PRIMARY_LANGUAGE.code || showDesc) && (
                    <>
                      <div className="menu-divider" />
                      <div className="menu-item" role="menuitem"
                        onClick={() => { setViewLang(PRIMARY_LANGUAGE.code); setShowDesc(false); }}>
                        <span className="menu-item-icon"><Icon name="refresh" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title">Reset view</span></span>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="ctxbar-menu-wrap">
            <button className={"btn btn-secondary" + (barMenu === "design" ? " is-pressed" : "")}
              title={compact ? "Design" : undefined} aria-label="Design"
              aria-haspopup="menu" aria-expanded={barMenu === "design"}
              onClick={() => setBarMenu(m => m === "design" ? null : "design")}>
              <Icon name="palette" size={16} /><span className="ctxbar-btn-lbl">Design</span>
            </button>
            {barMenu === "design" && (
              <>
                <div className="cq-menu-scrim" onMouseDown={() => setBarMenu(null)} />
                {/* The org's available designs (Figma 6293:27553): mini previews
                    of the participant screen in each design. Click to apply;
                    click the applied one again to go back to the neutral page. */}
                <div className="menu dsg-menu is-right" role="menu" aria-label="Survey design">
                  {DESIGNS.map(d => {
                    const active = designId === d.id;
                    return (
                      <button key={d.id} className="dsg-tile-wrap" role="menuitemradio" aria-checked={active}
                        aria-label={d.name} title={d.name}
                        onClick={() => onSetDesign && onSetDesign(active ? undefined : d.id)}>
                        {/* The tile shows the design the way the rest of the
                            prototype does: the lightened wash, not the raw
                            colour, so picking one predicts what you'll see. */}
                        <span className="dsg-tile" style={{ background: designWash(d) }}>
                          <span className="dsg-chrome">
                            <span className="dsg-mark" style={{ background: d.markBg, color: d.markColor || "#fff" }}>{d.mark}</span>
                          </span>
                          <span className="dsg-card">
                            <span className="dsg-card-title" />
                            <span className="dsg-dots" aria-hidden="true">
                              <i /><i /><i /><i /><i />
                            </span>
                          </span>
                          <span className="dsg-btn" style={{ background: d.button }} />
                          {active && (
                            <span className="dsg-selected"><Icon name="check" size={28} /></span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="ctxbar-menu-wrap">
            <button className={"btn btn-primary" + (barMenu === "add" ? " is-pressed" : "")}
              aria-haspopup="menu" aria-expanded={barMenu === "add"}
              onClick={() => setBarMenu(m => m === "add" ? null : "add")}>
              <Icon name="plus" size={16} /><span className="ctxbar-btn-lbl">Add</span><Icon name="chevron-down" size={16} />
            </button>
            {barMenu === "add" && (
              <>
                <div className="cq-menu-scrim" onMouseDown={() => setBarMenu(null)} />
                <div className="menu ctxbar-menu is-right" role="menu">
                  <div className="menu-item" role="menuitem" data-piwik="builder.add-questions" onClick={() => { setBarMenu(null); onEditQuestions(); }}>
                    <span className="menu-item-icon"><Icon name="list-unordered" size={16} /></span>
                    <span className="menu-item-body"><span className="menu-item-title">Add questions</span></span>
                  </div>
                  <div className="menu-item" role="menuitem" onClick={() => { setBarMenu(null); setTopicDialog({ creating: true }); }}>
                    <span className="menu-item-icon"><Icon name="folder" size={16} /></span>
                    <span className="menu-item-body"><span className="menu-item-title">Add custom topic</span></span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

        <div className="qpage">
          {/* The first thing participants see, so the page reads as the real
              sequence: intro screen, then the topics in order (Figma 6293:26527).
              No label — the title-sized text says what it is. Same interaction
              as a question row: click anywhere, edit in the dialog. */}
          <div className="intro-card" role="button" tabIndex={0}
            aria-label="Edit the intro screen participants see"
            onClick={e => { if (e.target.closest("button")) return; setIntroOpen(true); }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIntroOpen(true); } }}>
            <div className="intro-card-body">
              <div className="intro-card-title" data-t="2">{tr("intro:name", introTitle)}</div>
              <div className="intro-card-desc" data-t="3">{tr("intro:desc", introDesc)}</div>
            </div>
            <Tooltip label="Edit intro screen" pos="is-left">
              <button className="ib ib-36 ib-tertiary" aria-label="Edit intro screen" onClick={() => setIntroOpen(true)}><Icon name="edit" size={16} /></button>
            </Tooltip>
          </div>

          <div className="qsec-list">
          {visibleSections.map((s, vi) => {
            const secUp = vi > 0, secDown = vi < visibleSections.length - 1;
            const draggingElsewhere = !!drag && drag.kind === "q" && drag.secKey !== s.key;
            // Any question dragged over another topic marks that topic as a
            // move target (moves are survey-scoped and never touch benchmarks).
            const locked = false;
            const isDropTarget = draggingElsewhere && dropTarget === s.key;
            const secDragging = !!drag && drag.kind === "sec" && drag.key === s.key;
            const zoneArmed = (k) => !!drag && drag.kind === "sec" && !zoneIsNoop(k);
            const zone = (k) => (
              <div key={"z" + k}
                className={"qsec-dropzone" + (zoneArmed(k) ? " is-armed" : "") + (zoneHint === k ? " is-over" : "")}
                onDragOver={zoneDragOver(k)} onDragLeave={zoneDragLeave(k)} onDrop={zoneDrop(k)}>
                <div className="qsec-dropzone-strip" />
              </div>
            );
            return (
            <Fragment key={s.key}>
            {zone(vi)}
            <section data-key={s.key}
              className={"qsec" + (locked ? " is-locked" : "") + (isDropTarget ? " is-drop-target" : "") + (secDragging ? " is-dragging" : "") + (enteringSecs.has(s.key) ? " is-entering" : "")}>
              {/* The whole topic row opens its settings, like a question row.
                  A topic carries no "edited" chip: once its questions are in the
                  questionnaire the topic is just structure — the library is only
                  a way to organise questions, not something you stay linked to. */}
              <div className="qsec-head is-clickable" role="button" tabIndex={0}
                aria-label={"Topic settings: " + topicName(s.key)}
                onClick={e => { if (e.target.closest("button, .menu, [role='menu']")) return; setTopicDialog({ key: s.key }); }}
                onKeyDown={e => {
                  if (e.target !== e.currentTarget) return; // let buttons inside handle their own keys
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTopicDialog({ key: s.key }); }
                }}>
                <Tooltip label="Drag to reorder" pos="is-left">
                  <button className="ib ib-36 ib-tertiary drag-ib" aria-label="Drag to reorder" draggable
                    onDragStart={startSection(s.key, vi)} onDragEnd={clearDrag} onClick={e => e.preventDefault()}>
                    <Icon name="drag-drop" size={16} /></button>
                </Tooltip>
                <h2 className="qsec-title" data-t={"topic-" + s.key}>{tr(`topic:${s.key}:name`, topicName(s.key))}</h2>
                <div className="spacer" />
                <span className="qsec-count">{s.items.length} {s.items.length === 1 ? "question" : "questions"}</span>
                <div className="qsec-menu-wrap">
                  <Tooltip label="Topic actions" pos="is-right"><button className="ib ib-36 ib-tertiary" aria-label="Topic actions" aria-haspopup="menu" aria-expanded={menuKey === s.key}
                    draggable={false} onDragStart={e => e.preventDefault()}
                    onClick={() => setMenuKey(k => k === s.key ? null : s.key)}><Icon name="more-vertical" size={16} /></button></Tooltip>
                  {menuKey === s.key && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onMouseDown={() => setMenuKey(null)} />
                      <div className="menu" role="menu" style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, width: 280, zIndex: 2 }}>
                        <div className="menu-item" role="menuitem" data-piwik="builder.add-questions-topic"
                          onClick={() => { setMenuKey(null); onEditQuestions && onEditQuestions("questions", { key: s.key, label: topicName(s.key) }); }}>
                          <span className="menu-item-icon"><Icon name="plus" size={16} /></span>
                          <span className="menu-item-body"><span className="menu-item-title">Add questions to this topic</span></span>
                        </div>
                        <div className="menu-item" role="menuitem" onClick={() => { setMenuKey(null); setTopicDialog({ key: s.key }); }}>
                          <span className="menu-item-icon"><Icon name="edit" size={16} /></span>
                          <span className="menu-item-body"><span className="menu-item-title">Edit topic</span><span className="menu-item-sub">Name and description — this survey only</span></span>
                        </div>
                        {!customTopicSet.has(s.key) && topicMeta[s.key] && topicMeta[s.key].name && (
                          <div className="menu-item" role="menuitem" onClick={() => { setMenuKey(null); onUpdateTopicMeta && onUpdateTopicMeta(s.key, { name: undefined }); }}>
                            <span className="menu-item-icon"><Icon name="refresh" size={16} /></span>
                            <span className="menu-item-body"><span className="menu-item-title">Reset to original name</span><span className="menu-item-sub">{s.key}</span></span>
                          </div>
                        )}
                        <div className="menu-divider" />
                        {secUp && (
                          <div className="menu-item" role="menuitem" onClick={() => { setMenuKey(null); reorderSection(s.key, visibleSections[vi - 1].key, false); }}>
                            <span className="menu-item-icon"><Icon name="arrow-up" size={16} /></span>
                            <span className="menu-item-body"><span className="menu-item-title">Move up</span></span>
                          </div>
                        )}
                        {secDown && (
                          <div className="menu-item" role="menuitem" onClick={() => { setMenuKey(null); reorderSection(s.key, visibleSections[vi + 1].key, true); }}>
                            <span className="menu-item-icon"><Icon name="arrow-down" size={16} /></span>
                            <span className="menu-item-body"><span className="menu-item-title">Move down</span></span>
                          </div>
                        )}
                        {(secUp || secDown) && <div className="menu-divider" />}
                        <div className="menu-item" role="menuitem" onClick={() => { setMenuKey(null); requestRemoveTopic(s); }}>
                          <span className="menu-item-icon" style={{ color: "var(--content-negative-secondary)" }}><Icon name="trash" size={16} /></span>
                          <span className="menu-item-body"><span className="menu-item-title" style={{ color: "var(--content-negative-secondary)" }}>Remove topic from questionnaire</span></span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="qsec-body" onDragOver={questionBodyDragOver(s.key)} onDrop={questionBodyDrop(s.key)}>
                {/* An empty topic's one need IS the action, so the row is the
                    button. Dragging into the section still works — the drop
                    handlers live on the body around it. */}
                {s.items.length === 0 && (
                  <button className="qsec-empty is-action" data-piwik="builder.add-questions-topic" onClick={() => onEditQuestions && onEditQuestions("questions", { key: s.key, label: topicName(s.key) })}>
                    <Icon name="plus" size={16} />Add questions to this topic
                  </button>
                )}
                {previewItems(s).map((qq) => {
                  const i = s.items.findIndex(x => x.id === qq.id);
                  return <BuilderRow key={qq.id} q={qq} meta={qMeta[qq.id]} tr={tr} showDesc={showDesc}
                    onRemove={onRemoveQuestion} onEdit={onEditCustom} dragging={!!drag && drag.kind === "q" && drag.id === qq.id}
                    onSettings={(qq2) => qq2.custom ? (onEditCustom && onEditCustom(qq2)) : setSettingsQId(qq2.id)}
                    onResetDesc={() => onUpdateQMeta && onUpdateQMeta(qq.id, { desc: undefined, descHidden: undefined, variant: undefined })}
                    canUp={i > 0} canDown={i < s.items.length - 1}
                    onMoveUp={() => reorderQuestion(s.key, qq.id, i - 1)}
                    onMoveDown={() => reorderQuestion(s.key, qq.id, i + 1)}
                    topics={visibleSections.map(x => ({ key: x.key, label: topicName(x.key) }))} onMoveTopic={(t) => onMoveTopic && onMoveTopic(qq.id, t)}
                    entering={enteringIds.has(qq.id) && !enteringSecs.has(s.key)}
                    pulsing={pulseIds.has(qq.id)} onSeen={() => stopPulse(qq.id)} themeInfo={themeMap[qq.theme]}
                    onOpenTheme={setThemeDetail}
                    onDragStart={startQuestion(s.key, qq.id, i, qq.custom)} onDragEnd={clearDrag} />;
                })}
              </div>
            </section>
            {vi === visibleSections.length - 1 && zone(visibleSections.length)}
          </Fragment>
          ); })}
          </div>

          {chosen.length === 0 && (
            <div className="qb-empty">
              <div className="qb-empty-title">Added questions will show here</div>
              <div className="qb-empty-sub">After adding questions you can easily change the order to fit your needs.</div>
              <div className="qb-empty-rows" aria-hidden="true">
                {[105, 164, 134].map((w, i) => (
                  <div key={i} className="qb-empty-row">
                    <Icon name="drag-drop" size={12} />
                    <span className="qb-empty-bar" style={{ width: w }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* On a phone the footer keeps only the three things you can act on;
          the save note and the out-of-scope "Plan survey" would push them off
          the screen. */}
      <div className="qfoot">
        <button className="btn btn-secondary" onClick={onExit}>
          <Icon name="chevron-left" size={16} />{mobile ? "Back" : "Previous step"}</button>
        <div className="spacer" />
        {!mobile && <span className="text-medium text-subdued">Last saved: just now</span>}
        <button className="btn btn-secondary" data-piwik="builder.save-close" onClick={onSaveClose}>{mobile ? "Save" : <>Save &amp; close</>}</button>
        <button className={"btn btn-primary" + (chosen.length === 0 ? " is-disabled" : "")} disabled={chosen.length === 0}
          data-piwik="builder.next" onClick={() => {}}>{mobile ? "Next" : "Next step"}<Icon name="arrow-right" size={16} /></button>
        {!mobile && <button className="btn btn-secondary is-disabled" disabled><Icon name="send" size={16} />Plan survey</button>}
      </div>

      {rename && rename.kind === "survey" && <RenameDialog title="Rename survey" label="Survey name" tid="1"
        value={rename.value} onCancel={() => setRename(null)}
        onSave={(v) => { onRename && onRename(v); setRename(null); }} />}
      {topicDialog && (() => {
        if (topicDialog.creating) {
          return <TopicDialog creating isCustom questionCount={0} design={design}
            onCancel={() => setTopicDialog(null)}
            onAdd={undefined}
            onSave={(t) => { onAddTopic && onAddTopic(t); setTopicDialog(null); }} />;
        }
        const key = topicDialog.key;
        const sec = layout.find(x => x.key === key);
        const isCustom = customTopicSet.has(key);
        return <TopicDialog design={design} name={topicName(key)} desc={(topicMeta[key] || {}).desc} tidName={"topic-" + key}
          originalName={key} isCustom={isCustom} questionCount={sec ? sec.items.length : 0}
          i18nEdits={i18nEdits} stringKeyBase={"topic:" + key}
          onCancel={() => setTopicDialog(null)}
          onSave={({ name: nm, desc: ds, translations }) => {
            const patch = {};
            if (nm !== topicName(key)) patch.name = nm;
            if ((ds || undefined) !== ((topicMeta[key] || {}).desc || undefined)) patch.desc = ds;
            if (Object.keys(patch).length) onUpdateTopicMeta && onUpdateTopicMeta(key, patch);
            // Reviewed translations are saved after the source text, so a changed
            // source can't wipe the translation the user just typed.
            (translations || []).forEach(({ code, part, text }) =>
              onSaveTranslation && onSaveTranslation(code, `topic:${key}:${part}`, text));
            setTopicDialog(null);
          }} />;
      })()}
      {settingsQId && (() => {
        const q = pool.find(p => p.id === settingsQId);
        return q ? (
          <BenchmarkQuestionDialog q={q} meta={qMeta[q.id]} topicKey={effTopic(q)} themeInfo={themeMap[q.theme]} design={design}
            allVariants={edges.altWordings}
            topicOptions={visibleSections.map(x => ({ value: x.key, label: topicName(x.key) }))}
            onCancel={() => setSettingsQId(null)}
            onDetach={({ text, topic }) => { setSettingsQId(null); onDetachQuestion && onDetachQuestion(q, text, topic); }}
            onSave={({ qMeta: patch, topic }) => {
              onUpdateQMeta && onUpdateQMeta(q.id, patch);
              if (topic) onMoveTopic && onMoveTopic(q.id, topic);
              setSettingsQId(null);
            }} />
        ) : null;
      })()}
      {translationsOpen && <TranslationsDialog pool={pool} selectedIds={selectedIds}
        topicMeta={topicMeta} customTopics={customTopics} qMeta={qMeta} i18nEdits={i18nEdits}
        onSave={onSaveTranslation} onClose={() => setTranslationsOpen(false)} />}
      {topicWarn && <TopicRemoveWarning label={topicName(topicWarn.key)} count={topicWarn.items.length}
        onCancel={() => setTopicWarn(null)}
        onConfirm={(dontShow) => { if (dontShow) { try { localStorage.setItem("cyos.skipTopicRemoveWarn", "1"); } catch (_) {} } doRemoveTopic(topicWarn); setTopicWarn(null); }} />}
      {introOpen && <TopicDialog variant="intro" tidName="2" tidDesc="3" design={design}
        questionCount={chosen.length} minutes={estMinutes} name={introTitle} desc={introDesc}
        originalName={introTitle} isCustom i18nEdits={i18nEdits} stringKeyBase="intro"
        onCancel={() => setIntroOpen(false)}
        onSave={({ name: nm, desc: ds, translations }) => {
          onUpdateIntro && onUpdateIntro({ title: nm, desc: ds || undefined });
          (translations || []).forEach(({ code, part, text }) =>
            onSaveTranslation && onSaveTranslation(code, `intro:${part}`, text));
          setIntroOpen(false);
        }} />}
      {detailTheme && <ThemeDetailsDialog theme={detailTheme} sel={sel}
        onToggle={(id) => onToggleQuestion && onToggleQuestion(id)}
        onToggleAll={(on) => onSetManyQuestions && onSetManyQuestions(detailTheme.questions.map(x => x.id), on)}
        onClose={() => setThemeDetail(null)} />}
    </div>
  );
}
