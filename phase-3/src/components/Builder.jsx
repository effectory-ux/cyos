// Builder.jsx — Questionnaire step, full-width (Engage DS)
import { useState, useEffect, useLayoutEffect, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";
import { groupQuestions, QTypeIcon, ThemeTags, CustomTag, Tooltip, RequiredMarker, themeQuestions, useMediaQuery, AddQuestionsMenu } from "./shared.jsx";
import { ThemeDetailsDialog } from "./EditQuestionsDialog.jsx";
import { BenchmarkQuestionDialog, QuestionLogicDialog } from "./BenchmarkQuestionDialog.jsx";
import { TopicDialog } from "./TopicDialog.jsx";
import { TranslationsDialog } from "./TranslationsDialog.jsx";
import { THEMES, CUSTOM_GROUP, answerOptionsOf } from "../data/data.js";
import { activeConditions, conditionOfType, logicBroken, logicSummary } from "../data/logic.js";
import { DESIGNS, DEFAULT_DESIGN, designById, designWash, introSurface, textLook, boxFill } from "../data/designs.js";
import { autoTranslation } from "../data/i18n.js";

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
          <input className="tf" autoFocus value={v} placeholder={label}
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
            questionnaire. You can add them again later with <b>Add questions</b>.
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
        <h1 style={{ margin: 0, fontWeight: 600, fontSize: 16, lineHeight: "24px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto", minWidth: 64, maxWidth: 340 }}>{name}</h1>
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

function BuilderRow({ order, away, slotH, q, meta, tr, showDesc, onRemove, onEdit, onSettings, onResetDesc, onMoveUp, onMoveDown, canUp, canDown, topics, onMoveTopic, dragging, entering, pulsing, onSeen, themeInfo, themeInfoFor, onOpenTheme, onDragStart, onDragEnd, logic, onOpenLogic, followUpBlocked, onFollowUp, linked = false }) {
  const [menu, setMenu] = useState(false);
  // "Move to topic" and "Add follow-up question" open a nested submenu BESIDE
  // the menu (DS pattern: a trailing .menu-chevron item flying out a second
  // .menu) instead of swapping the menu's contents. Rendered in a fixed layer
  // so no card/scroll ancestor can clip it; `subAt` holds the measured
  // position and which submenu it is.
  const [subAt, setSubAt] = useState(null);
  const moveRef = useRef(null);
  const close = () => { setMenu(false); setSubAt(null); };
  const openSub = (kind = "move") => {
    const el = moveRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const W = 240, gap = 4;
    // Flyout to the left of the menu (it sits at the row's right edge); flip
    // right if there isn't room, and keep it inside the viewport vertically.
    const left = r.left - W - gap >= 8 ? r.left - W - gap : Math.min(r.right + gap, window.innerWidth - W - 8);
    setSubAt({ kind, left, top: Math.min(r.top - 8, window.innerHeight - 260), width: W });
  };
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
    <div className={"qrow" + (dragging ? " is-dragging" : "") + (away ? " is-away" : "") + (entering ? " is-entering" : "") + (pulsing ? " is-fresh" : "")} data-qid={q.id}
      style={entering || order != null || slotH ? { ...(entering ? { "--enter-delay": entering.delay + "ms" } : {}), ...(order != null ? { order } : {}), ...(slotH ? { "--row-h": slotH + "px" } : {}) } : undefined}
      onClick={rowClick} onMouseEnter={pulsing && onSeen ? onSeen : undefined}>
      <Tooltip label="Drag to reorder" pos="is-left">
        <button className="ib ib-36 ib-tertiary drag-ib" aria-label="Drag to reorder" draggable
          onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={e => e.preventDefault()}>
          <Icon name="drag-drop" size={16} /></button>
      </Tooltip>
      <div className="qrow-main">
        <div style={{ fontSize: 14, fontWeight: 500, lineHeight: "22.4px" }}>{text}</div>
        {showDesc && !(meta && meta.descHidden) && tr(`q:${q.id}:desc`, desc || "") && <div className="qrow-desc">{tr(`q:${q.id}:desc`, desc || "")}</div>}
      </div>
      <div className="qrow-meta">
        {q.theme
          ? <ThemeTags q={q} infoFor={themeInfoFor || ((n) => (n === q.theme ? themeInfo : null))} pos="is-left"
              onOpen={onOpenTheme} />
          : q.custom ? <CustomTag pos="is-left" onOpen={() => onEdit && onEdit(q)} /> : null}
        {/* Question logic: an icon tile the size of the question type — the
            rule rides in its tooltip, clicking it opens this question's
            logic. Red when the rule broke. */}
        {logic && (
          <Tooltip pos="is-left" float label={logic.broken ? <>
            <span className="tt-title">Broken logic</span>
            It points to a question that was removed or now comes later. Click to fix it.
          </> : <>
            <span className="tt-title">{logic.followUp ? "Follow-up question" : "Shows conditionally"}</span>
            {logic.line}
          </>}>
            <button type="button" className={"tag-logic-tile" + (logic.broken ? " is-broken" : "")}
              aria-label={"Logic: " + (logic.broken ? "broken" : logic.line)}
              onClick={() => onOpenLogic && onOpenLogic(q)}>
              <Icon name="split" size={16} />
            </button>
          </Tooltip>
        )}
        {q.required && <RequiredMarker size={24} />}
        {/* The question type is metadata like the tags, so it sits in their
            group, right before the actions — as in Select questions. The
            wording leads the row: most questions share one type. */}
        <span className="qrow-type"><QTypeIcon type={q.type} size={24} tip pos="is-above" float /></span>
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
                    {/* A follow-up is linked to its question: it moves with
                        it, never on its own. */}
                    {linked && (
                      <div className="menu-item is-disabled" role="menuitem" aria-disabled="true">
                        <span className="menu-item-icon"><Icon name="import-export" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title">Move</span><span className="menu-item-sub">A follow-up question moves with its question</span></span>
                      </div>
                    )}
                    {!linked && canUp && (
                      <div className="menu-item" role="menuitem" onClick={() => { close(); onMoveUp && onMoveUp(); }}>
                        <span className="menu-item-icon"><Icon name="arrow-up" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title">Move up</span></span>
                      </div>
                    )}
                    {!linked && canDown && (
                      <div className="menu-item" role="menuitem" onClick={() => { close(); onMoveDown && onMoveDown(); }}>
                        <span className="menu-item-icon"><Icon name="arrow-down" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title">Move down</span></span>
                      </div>
                    )}
                    {!linked && <div ref={moveRef} className={"menu-item" + (subAt && subAt.kind === "move" ? " is-hover" : "")} role="menuitem"
                      aria-haspopup="menu" aria-expanded={!!(subAt && subAt.kind === "move")}
                      onMouseEnter={() => openSub("move")} onClick={() => (subAt && subAt.kind === "move" ? setSubAt(null) : openSub("move"))}>
                      <span className="menu-item-icon"><Icon name="import-export" size={16} /></span>
                      <span className="menu-item-body"><span className="menu-item-title">Move to topic</span></span>
                      <span className="menu-chevron"><Icon name="chevron-right" size={16} /></span>
                    </div>}
                    {/* A follow-up question, from the row: the Logic dialog
                        opens on this question with a draft follow-up — its
                        answers first, then the question to ask. */}
                    {onFollowUp && (followUpBlocked ? (
                      <div className="menu-item is-disabled" role="menuitem" aria-disabled="true" onMouseEnter={() => setSubAt(null)}>
                        <span className="menu-item-icon"><Icon name="split" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title">Add follow-up question</span><span className="menu-item-sub">{followUpBlocked}</span></span>
                      </div>
                    ) : (
                      <div className="menu-item" role="menuitem" onMouseEnter={() => setSubAt(null)}
                        onClick={() => { close(); onFollowUp(); }}>
                        <span className="menu-item-icon"><Icon name="split" size={16} /></span>
                        <span className="menu-item-body"><span className="menu-item-title">Add follow-up question</span></span>
                      </div>
                    ))}
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
              {subAt && subAt.kind === "move" && createPortal(
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

// Follow-up questions are LINKED to their trigger: they always come right
// after it, in the order they were made — whatever was dragged or moved. A
// follow-up dragged away snaps back; a trigger dragged takes them along.
function attachFollowUps(sections, qMeta) {
  const fuOf = (id) => {
    const a = conditionOfType((qMeta[id] || {}).logic, "answer");
    return a && a.followUp ? a.trigger : null;
  };
  let changed = false;
  const next = sections.map(sec => {
    const ids = new Set(sec.items.map(i => i.id));
    // Linked: a follow-up whose question is in this topic. Follow-ups can
    // have follow-ups of their own, so each one is placed under its own
    // question, recursively, keeping the order they were made in.
    const isLinked = (i) => { const t = fuOf(i.id); return !!t && t !== i.id && ids.has(t); };
    if (!sec.items.some(isLinked)) return sec;
    const kids = {};
    sec.items.filter(isLinked).forEach(i => { (kids[fuOf(i.id)] = kids[fuOf(i.id)] || []).push(i); });
    const items = [], seen = new Set();
    const place = (i) => {
      if (seen.has(i.id)) return;
      seen.add(i.id); items.push(i);
      (kids[i.id] || []).forEach(place);
    };
    sec.items.filter(i => !isLinked(i)).forEach(place);
    sec.items.forEach(place); // anything a cycle left out keeps its place
    if (items.some((x, k) => x.id !== sec.items[k].id)) { changed = true; return { ...sec, items }; }
    return sec;
  });
  return changed ? next : sections;
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

// A preview's text: at most two sentences, with "…" when there was more.
function twoSentences(text) {
  const parts = (text || "").match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [];
  if (parts.length <= 2) return text;
  return parts.slice(0, 2).join("").trim().replace(/[.!?]+["')\]]*$/, "") + "…";
}

// The two ways to add questions, wherever adding starts (the bar, or a topic).

// A transparent pixel as the browser's own drag image: its semi-transparent
// snapshot is replaced by the lifted card the builder draws itself, so the
// dragged row never shows twice.
const EMPTY_DRAG_IMG = typeof Image !== "undefined"
  ? Object.assign(new Image(), { src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" })
  : null;

// Surveys whose builder has opened before in this session: the page panel and
// the topics only make their entrance the first time.
const entranceSeen = new Set();

export function Builder({ survey, onDetachQuestion, onEditQuestions, onExit, onSaveClose, onRemoveQuestion, onEditCustom, onRename, onRemoveTopic, onMoveTopic, onToggleQuestion, onSetManyQuestions, onAddQuestions, onOpenTemplates, onUpdateTopicMeta, onAddTopic, onUpdateQMeta, onUpdateIntro, onSetDesign, onNewCustom, onSaveTranslation, onConfirmTranslation, edges = {}, openDialog, onDialogChange, addAtBottom = false, pagesRail = false, introTextColor = false, introTextBox = false, whiteTopics = false, logicInPlace = false, onFollowUp, focusQuestion }) {
  const { name, design: designId, selectedIds, pool, topicMeta = {}, customTopics = [], keptTopics = [], qMeta = {}, i18nEdits = {}, i18nStale = {}, intro = {} } = survey;
  // Below this the questionnaire page tightens: step labels go, the page
  // padding and the gaps between cards shrink, "Edit name" becomes an icon.
  const compact = useMediaQuery("(max-width: 1100px)");
  // Narrower still: the step pills don't fit at all and become a menu.
  const mobile = useMediaQuery("(max-width: 760px)");
  // A topic's Add questions: in its header, next to its menu — except on a
  // phone, where the header has no width to spare (the title needs it), so it
  // becomes the topic's last row, inside the card. The addAtBottom variant
  // shows that row at every size.
  const addBottom = addAtBottom || mobile;
  const [menuKey, setMenuKey] = useState(null);
  const [addMenuKey, setAddMenuKey] = useState(null); // topic whose Add questions menu is open
  const [rename, setRename] = useState(null);
  const [topicWarn, setTopicWarn] = useState(null); // section pending removal confirmation
  const [themeDetail, setThemeDetail] = useState(null); // theme name whose details dialog is open (from a tag)
  // { creating: true } or { key } — the topic dialog currently open.
  const [topicDialog, setTopicDialog] = useState(null);
  const [settingsQId, setSettingsQId] = useState(null); // standard question whose dialog is open
  const [logicQId, setLogicQId] = useState(null); // question the standalone logic dialog opened on
  const [logicDraft, setLogicDraft] = useState(false); // opened to add a follow-up
  const [translationsOpen, setTranslationsOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);   // participant intro screen
  // Which survey page is shown: the questionnaire (always where you land) or
  // the welcome page participants open on.
  const [page, setPage] = useState("questionnaire");
  // Without the pages panel there is no welcome page to switch to: the
  // questionnaire carries its preview instead.
  useEffect(() => { if (!pagesRail) setPage("questionnaire"); }, [pagesRail]);
  // First visit: the pages slide in one after the other, then the topics
  // rise into place, so the panel on the left reads as part of the page.
  const [entrance, setEntrance] = useState(() => !entranceSeen.has(survey.id));
  useEffect(() => {
    entranceSeen.add(survey.id);
    if (!entrance) return;
    const t = setTimeout(() => setEntrance(false), 3600); // the questionnaire thumbnail has settled by then
    return () => clearTimeout(t);
  }, []); // eslint-disable-line
  // Context-bar menus (one open at a time) and the two view settings they hold.
  // Both are VIEW state: they change what this page shows, never the survey.
  const [barMenu, setBarMenu] = useState(null);        // "display" | "add" | null
  // The bar's menus close on any press outside them — and that press still
  // does what it was for (start a drag, open a row), unlike a blocking scrim.
  useEffect(() => {
    if (!barMenu) return;
    const h = (e) => { if (!e.target.closest(".ctxbar-menu-wrap")) setBarMenu(null); };
    document.addEventListener("mousedown", h, true);
    return () => document.removeEventListener("mousedown", h, true);
  }, [barMenu]);
  // The questionnaire shows in the primary language. (The Preview language
  // menu that switched this is gone; tr() below still reads translations if
  // it ever comes back.)
  const viewLang = "en";
  // The survey's design (a survey property, picked in the bar). In the builder
  // it tints the page behind the cards — the cards themselves stay white.
  const design = designById(designId) || designById(DEFAULT_DESIGN);
  // Descriptions always show in the list: the toggle for them left the
  // Preview language menu in 2.1.
  const showDesc = true;
  // Every builder dialog has a URL: report which one is open, and restore one
  // asked for by a deep link or the prototype toolbar.
  useEffect(() => {
    if (!onDialogChange) return;
    if (logicQId) onDialogChange({ dialog: "question-logic", arg: logicQId });
    else if (settingsQId) onDialogChange({ dialog: "question-settings", arg: settingsQId });
    else if (topicDialog) onDialogChange(topicDialog.creating ? { dialog: "add-topic" } : { dialog: "topic", arg: topicDialog.key });
    else if (translationsOpen) onDialogChange({ dialog: "translations" });
    else if (themeDetail) onDialogChange({ dialog: "theme", arg: themeDetail });
    else if (introOpen) onDialogChange({ dialog: "intro-screen" });

    else onDialogChange(null);
  }, [logicQId, settingsQId, topicDialog, translationsOpen, themeDetail, introOpen]); // eslint-disable-line
  // A request from outside (the toolbar's Screens, a link) replaces whatever
  // dialog the builder has open — jumping from one to another never stacks.
  const firstOpen = useRef(true);
  useEffect(() => {
    if (!firstOpen.current) { setSettingsQId(null); setLogicQId(null); setTopicDialog(null); setTranslationsOpen(false); setThemeDetail(null); setIntroOpen(false); }
    firstOpen.current = false;
    if (!openDialog) return;
    const { dialog, arg } = openDialog;
    if (dialog === "question-settings" && arg) setSettingsQId(arg);
    // The standalone logic dialog opens over the question's own dialog; the
    // in-place variant has no dialog of its own, so the settings dialog is
    // the honest restore there.
    // Back from a follow-up flow: just the logic dialog, on the trigger.
    else if (dialog === "logic-return" && arg) setLogicQId(arg);
    else if (dialog === "question-logic" && arg) {
      // A topic's logic ("t:<key>") has no question dialog underneath.
      if (arg.startsWith("t:")) setLogicQId(arg);
      else { setSettingsQId(arg); if (!logicInPlace) setLogicQId(arg); }
    }
    else if (dialog === "topic" && arg) setTopicDialog({ key: arg });
    else if (dialog === "add-topic") setTopicDialog({ creating: true });
    // Next step pressed with an empty topic (the toolbar's screen for it).
    else if (dialog === "empty-warn") {
      setEmptyWarn(1); setWarnOpen(1);
      clearTimeout(warnClose.current);
      warnClose.current = setTimeout(() => setWarnOpen(0), EMPTY_WARN_MS);
    }
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
  const ownTopic = (q) => (qMeta[q.id] && qMeta[q.id].topic) || q.topic;
  // A follow-up lives in its trigger's topic: move the trigger, it comes along.
  // (Chains too: a follow-up's follow-up follows the whole chain's topic.)
  const effTopic = (q, depth = 0) => {
    const a = conditionOfType((qMeta[q.id] || {}).logic, "answer");
    if (a && a.followUp && sel.has(a.trigger) && depth < 8) {
      const t = pool.find(p => p.id === a.trigger);
      if (t) return effTopic(t, depth + 1);
    }
    return ownTopic(q);
  };
  const chosen = pool.filter(q => sel.has(q.id));
  // Rough completion-time estimate (~20s per question) for the overview card.
  const estMinutes = Math.max(1, Math.round((chosen.length * 20) / 60));
  // Theme groups from THIS survey's pool (POOL + library): used for the row tags'
  // progress (real fraction added) and the "View details" dialog opened from a tag.
  const themeGroups = (() => {
    // Each wording once (themeQuestions): a theme asks a question once.
    return Object.entries(themeQuestions(pool, sel)).map(([nm, t]) => {
      const meta = THEMES[nm] || {};
      return { name: nm, questions: t.questions, ...meta,
        desc: meta.desc || "A group of related questions that combine into one theme score.",
        about: meta.about || meta.desc || "Add all of this theme's questions to read them together as one benchmarked score in your results.",
        kept: t.kept, total: t.total };
    });
  })();
  const themeMap = {}; themeGroups.forEach(t => { themeMap[t.name] = t; });
  const detailTheme = themeGroups.find(t => t.name === themeDetail) || null;
  // Group by EFFECTIVE topic (survey-scoped moves included); the Add-questions
  // dialog keeps grouping by the canonical library topic. Empty custom topics
  // still render as sections so they can be filled by drag or move-to.
  const groups = groupQuestions(chosen.map(q => effTopic(q) !== q.topic ? { ...q, topic: effTopic(q) } : q), "library");
  // So do library topics left empty (keptTopics): a topic goes when you
  // remove it, not when its last question moves elsewhere or is removed.
  [...customTopics, ...keptTopics].forEach(k => { if (!groups.find(g => g.key === k)) groups.push({ key: k, label: k, kind: "topic", items: [] }); });
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
  // A language's own text wins — also where English has none (a description
  // can exist in one language only).
  const tr = (key, text) => {
    if (viewLang === "en") return text;
    const own = (i18nEdits[viewLang] || {})[key];
    if (own) return own;
    return text ? autoTranslation(text, viewLang) : text;
  };

  // On-page ordering the user can drag-reorder. Lives only here — the Add
  // questions dialog always works from the library order, never this one.
  const [layout, setLayout] = useState(() => groups.map(g => ({ key: g.key, label: g.label, items: g.items })));
  const sig = selectedIds.join(",") + "|" + pool.map(p => p.id + ":" + (p.topic || "") + ":" + (p.text || "") + ":" + (p.required ? "1" : "0")).join(",")
    + "|" + customTopics.join(",") + "|" + keptTopics.join(",") + "|" + Object.entries(qMeta).map(([id, m]) => id + ">" + (m.topic || "")).join(",");
  // A topic added from a gap in the list (a custom one, or a library topic),
  // waiting for its section to exist.
  const placeTopic = useRef(null);
  // A question dropped into another topic, waiting to arrive there so it can
  // go to the slot it was dropped on (it arrives at the end).
  const placeQuestion = useRef(null);
  // Before paint, so a question moved to another topic never shows a frame
  // in the topic it left.
  useLayoutEffect(() => { setLayout(prev => {
    let next = reconcileLayout(prev, groups);
    const pq = placeQuestion.current;
    if (pq) {
      const si = next.findIndex(x => x.key === pq.secKey);
      const item = si >= 0 && next[si].items.find(x => x.id === pq.id);
      if (item) {
        placeQuestion.current = null;
        const items = next[si].items.filter(x => x.id !== pq.id);
        items.splice(Math.max(0, Math.min(pq.index, items.length)), 0, item);
        next = next.slice(); next[si] = { ...next[si], items };
      }
    }
    const p = placeTopic.current;
    if (!p || !next.some(x => x.key === p.key)) return attachFollowUps(next, qMeta);
    placeTopic.current = null;
    const moved = next.find(x => x.key === p.key);
    const rest = next.filter(x => x.key !== p.key);
    let at = p.before ? rest.findIndex(x => x.key === p.before) : rest.findIndex(x => x.key === "__custom");
    if (at < 0) at = rest.length;
    rest.splice(at, 0, moved);
    return attachFollowUps(rest, qMeta);
  }); }, [sig]); // eslint-disable-line

  // Drag & drop via static drop targets — nothing reorders while dragging; the
  // change is committed once, on drop. Questions get an insertion line between
  // the rows of their own topic; sections get explicit drop zones in the gaps
  // between cards. Static targets can't oscillate the way live reordering did.
  const [drag, setDrag] = useState(null);         // { kind:'q', id, secKey, index, custom } | { kind:'sec', key, index }
  const [qHint, setQHint] = useState(null);       // { secKey, index } — insertion slot for a question
  // Dragging a topic: where it would land, in the order without it.
  const [secHint, setSecHint] = useState(null);
  // After an HTML5 drag the drag button keeps a stuck :hover/focus, so its
  // tooltip lingers over the reordered item. Suppress tooltips from drag start
  // until the pointer next moves (which clears the stuck hover state).
  const [tipsOff, setTipsOff] = useState(false);
  // Tooltip bubbles are portalled to <body>, so the switch goes there too.
  useEffect(() => {
    document.body.classList.toggle("tips-off", tipsOff);
    return () => document.body.classList.remove("tips-off");
  }, [tipsOff]);
  const clearDrag = () => {
    const d = dragRef.current;
    // A topic drag that ends without a drop (Escape) glides back to its own
    // place from where the lifted card is.
    if (d && d.kind === "sec" && !sortAnchor.current && liftEl.current)
      sortAnchor.current = { key: d.key, from: liftEl.current.getBoundingClientRect().top + 1 };
    dragLive.current = false; dragRef.current = null; liftSrc.current = null;
    setDrag(null); setQHint(null); setSecHint(null);
    const wake = () => { setTipsOff(false); window.removeEventListener("pointermove", wake); };
    window.addEventListener("pointermove", wake);
  };

  // Questions/topics just added via "Apply selection" ease in softly so the
  // change is legible, not abrupt. Refs seed on the first render so the initial
  // builder load doesn't animate everything at once.
  const [enteringIds, setEnteringIds] = useState(() => new Set());
  // When the page has to scroll to the new questions first, their arrival
  // waits for the scroll (ms), so it plays where you are looking.
  const [enterDelay, setEnterDelay] = useState(0);
  const [enteringSecs, setEnteringSecs] = useState(() => new Set());
  const [leavingSecs, setLeavingSecs] = useState(() => new Set()); // topics playing their way out
  // Rows that keep pulsing after they arrived, so a question added to a topic
  // that already had some is still findable. Hovering one ends its pulse —
  // you have clearly seen it by then.
  const [pulseIds, setPulseIds] = useState(() => new Set());
  // "Go to question" (from the custom question dialog): scroll the question
  // into view and let it glow once, the way a just-added one does.
  useEffect(() => {
    if (!focusQuestion) return;
    const el = document.querySelector(`.qrow[data-qid="${CSS.escape(String(focusQuestion.id))}"]`);
    const sc = el && el.closest(".scroll-y");
    if (!el || !sc) return;
    const r = el.getBoundingClientRect(), v = sc.getBoundingClientRect();
    scrollContainerTo(sc, sc.scrollTop + r.top - v.top - v.height / 2 + r.height / 2);
    const id = focusQuestion.id;
    const on = setTimeout(() => setPulseIds(prev => new Set(prev).add(id)), 350);
    const off = setTimeout(() => setPulseIds(prev => { const n = new Set(prev); n.delete(id); return n; }), 350 + 2200);
    return () => { clearTimeout(on); clearTimeout(off); };
  }, [focusQuestion && focusQuestion.n]); // eslint-disable-line
  const stopPulse = (id) => setPulseIds(prev => {
    if (!prev.has(id)) return prev;
    const n = new Set(prev); n.delete(id); return n;
  });
  const prevIds = useRef(null);
  const prevPlace = useRef(null);   // question id -> topic key, as last rendered
  const draggedMove = useRef(null); // a question just dropped into another topic
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
      const nextArr = attachFollowUps([...prev.slice(0, si), { ...prev[si], items: without }, ...prev.slice(si + 1)], qMeta);
      const after = nextArr[si].items;
      if (after.length === items.length && after.every((x, k) => x.id === items[k].id)) return prev;
      return nextArr;
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

  // The drag state goes in one tick AFTER dragstart, never inside it: it
  // re-renders the list (the gaps' Add topic buttons go, the row dims), and
  // Chrome aborts a drag whose page changes during dragstart itself — that is
  // what made dragging fail. If the drag ended before that tick, nothing is set.
  const dragLive = useRef(false);
  // The drag payload, set in dragstart itself: the drop targets read this,
  // not the \`drag\` state, which only lands a tick later.
  const dragRef = useRef(null);
  // Where the lifted topic card was when its drag ended: { key, from, landed }.
  // The topic's header glides from there into its place; nothing scrolls.
  const sortAnchor = useRef(null);
  // The lifted card: a copy of the row (or topic header) taken at pickup,
  // floating under the pointer while the real one leaves an empty slot.
  // Positioned straight on the element (no re-render per pointer move).
  const liftSrc = useRef(null);
  const liftEl = useRef(null);
  // Rows glide instead of jumping while a question is dragged: each render,
  // a row whose layout position changed (a slot opened, closed or moved) is
  // animated from where it was on screen to where it is now. And a dropped
  // question settles from the lifted card's spot into its place.
  // Where rows and topics are on screen right before a drag event re-renders
  // the list (transforms and running transitions included): the true start of
  // every glide, even mid-animation.
  const flipFirst = useRef(null);
  // What glides: question rows, topic cards, and the gaps between topics (each
  // gap travels with the topic below it, so its Add topic button glides too).
  const GLIDERS = ".qsec-body > .qrow[data-qid], .qsec-list > .qsec[data-key], .qsec-list > .qsec-dropzone[data-zone]";
  const glideKey = (el) => el.dataset.qid ? "q:" + el.dataset.qid : el.dataset.key ? "t:" + el.dataset.key : "z:" + el.dataset.zone;
  const snapFirst = () => {
    const m = new Map();
    document.querySelectorAll(GLIDERS).forEach(el => {
      // Not what's being dragged: it's under the pointer as the lifted card,
      // and lands from there (settle) — never glides in from its old place.
      if (el.classList.contains("is-dragging")) return;
      // The gaps only glide for a menu move; mid-drag they are drop zones
      // that open and close on their own.
      if (el.dataset.zone && dragRef.current) return;
      m.set(glideKey(el), el.getBoundingClientRect().top);
    });
    const list = document.querySelector(".qsec-list"), sc = list && list.closest(".scroll-y");
    // Kept for the whole frame: a drop can take two renders (the move to another
    // topic lands in the second), and both glide from these same positions.
    flipFirst.current = { m, scroll: sc ? sc.scrollTop : 0, t: performance.now() };
  };
  const settle = useRef(null);       // { id, secKey, top, tries } after a drop
  // The iOS sheet curve (as the builder's entrance): a soft start, so a long
  // glide never covers a big step in its first frame.
  const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
  const placeLift = (y) => {
    const src = liftSrc.current, el = liftEl.current;
    if (src && el) el.style.transform = `translate3d(0, ${Math.round(y - src.offsetY)}px, 0)`;
  };
  const lift = (e, el) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const node = el.cloneNode(true);
    node.classList.remove("is-dragging", "is-entering", "is-fresh");
    node.style.removeProperty("order");
    liftSrc.current = { node, left: r.left, width: r.width, height: r.height, offsetY: e.clientY - r.top, y: e.clientY };
    if (EMPTY_DRAG_IMG) { try { e.dataTransfer.setDragImage(EMPTY_DRAG_IMG, 0, 0); } catch (_) {} }
  };
  const beginDrag = (state) => {
    dragLive.current = true; dragRef.current = state;
    setTimeout(() => {
      if (!dragLive.current) return;
      // Chrome's own scroll anchoring would correct for slots opening and
      // topics folding on top of the builder's own correction: off while
      // dragging (back on when the drag's effects clean up).
      const list = document.querySelector(".qsec-list"), sc = list && list.closest(".scroll-y");
      if (sc) sc.style.overflowAnchor = "none";
      setDrag(state); setTipsOff(true);
    }, 0);
  };
  // Only the drag handle is draggable; the whole row/card is used as drag image.
  const startQuestion = (secKey, id, index, custom) => (e) => {
    beginDrag({ kind: "q", id, secKey, index, custom });
    e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "q"); } catch (_) {}
    lift(e, e.currentTarget.closest(".qrow"));
  };
  const startSection = (key, index) => (e) => {
    beginDrag({ kind: "sec", key, index });
    e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "sec"); } catch (_) {}
    // The topic lifts as its header only: a long topic is taller than the screen.
    lift(e, e.currentTarget.closest(".qsec-head"));
  };
  const wasSorting = useRef(false);
  const foldRaf = useRef(0);
  const folded = useRef(null);   // the lifted topic's body while folded: { body, reserve }
  const foldDone = useRef(null); // an unfold still to hand its height back to auto: { body, t }
  useEffect(() => () => cancelAnimationFrame(foldRaf.current), []);
  useLayoutEffect(() => {
    if (sorting === wasSorting.current) return;
    wasSorting.current = sorting;
    const a = sortAnchor.current; sortAnchor.current = null;
    const list = document.querySelector(".qsec-list");
    if (!list) return;
    const sc = list.closest(".scroll-y");
    const still = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    cancelAnimationFrame(foldRaf.current);
    // An unfold that hasn't handed its height back yet (another topic picked
    // up within 300ms of a drop): hand it back now, or it stays fixed.
    if (foldDone.current) { clearTimeout(foldDone.current.t); foldDone.current.body.style.height = ""; foldDone.current = null; }
    list.setAttribute("data-folding", "");
    let body = null, reserve = 0;
    if (sorting) {
      const el = list.querySelector(`:scope > .qsec[data-key="${CSS.escape(drag.key)}"]`);
      body = el && el.querySelector(":scope > .qsec-body");
      if (body) {
        // Only the lifted topic folds, under its own header: nothing above it
        // moves, so nothing is scrolled. Near the end of the page the shorter
        // list would clamp the scroll and push the slot down; the room that
        // would be missing is kept at the end of the list meanwhile.
        const h = body.offsetHeight;
        const below = sc ? sc.scrollHeight - sc.clientHeight - sc.scrollTop : h;
        reserve = Math.max(0, Math.ceil(h - below));
        if (reserve) list.style.paddingBottom = `calc(var(--spacing-base) + ${reserve}px)`;
        body.style.height = `${h}px`; void body.offsetHeight;
        body.style.height = "0px";
        folded.current = { body, reserve };
      }
    } else if (folded.current) {
      ({ body, reserve } = folded.current); folded.current = null;
      const el = body.isConnected ? body.parentElement : null;
      if (el) {
        // Drop or cancel: it opens where its slot is (no scrolling), and its
        // header glides there from the lifted card.
        body.style.height = `${body.offsetHeight}px`; void body.offsetHeight;
        body.style.height = `${body.scrollHeight}px`;
        const b = body;
        foldDone.current = { body: b, t: setTimeout(() => { b.style.height = ""; foldDone.current = null; }, 300) };
        const dy = a && a.from != null ? a.from - el.getBoundingClientRect().top : 0;
        if (!still && Math.abs(dy) >= 1) el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 300, easing: EASE, id: "flip" });
        // Landed: the topic glows once where it came down.
        if (!still && a && a.landed) el.animate([{ boxShadow: "0 14px 32px rgba(25,39,67,.16), 0 0 0 2px var(--border-brand)" }, { boxShadow: "0 0 0 0 rgba(25,39,67,0), 0 0 0 0 var(--border-brand)" }], { duration: 360, easing: EASE });
      } else body = null;
    }
    const end = performance.now() + 320;
    const step = () => {
      // The kept room goes as fast as the topic opens: the page's length never jumps.
      if (!sorting && reserve && body) {
        const rest = Math.max(0, reserve - body.offsetHeight);
        list.style.paddingBottom = rest ? `calc(var(--spacing-base) + ${rest}px)` : "";
      }
      if (performance.now() < end) foldRaf.current = requestAnimationFrame(step);
      else { list.removeAttribute("data-folding"); if (!sorting) list.style.paddingBottom = ""; }
    };
    step();
  });
  // Near the top or bottom edge of the list while dragging (just under the bar,
  // just above the footer), the page scrolls — faster the closer you get.
  useEffect(() => {
    if (!drag) return;
    const sc = document.querySelector(".qsec-list") && document.querySelector(".qsec-list").closest(".scroll-y");
    if (!sc) return;
    let y = null, raf = 0, last = 0, since = 0, acc = 0; // since: when the pointer reached an edge
    const onOver = (e) => { if (e.clientX || e.clientY) y = e.clientY; };
    // Out of the window there's no dragover to say where the pointer is: stop.
    const onLeave = (e) => { if (!e.relatedTarget) y = null; };
    document.addEventListener("dragover", onOver, true);
    document.addEventListener("dragleave", onLeave, true);
    const tick = (t) => {
      const dt = last ? Math.min(48, t - last) : 16; last = t;
      if (y != null) {
        const box = sc.getBoundingClientRect();
        const bar = document.querySelector(".ctxbar"), foot = document.querySelector(".qfoot");
        const top = Math.max(box.top, bar ? bar.getBoundingClientRect().bottom : box.top);
        const bottom = Math.min(box.bottom, foot ? foot.getBoundingClientRect().top : box.bottom);
        // Starts 100px from the edge; never faster than 600px/s (also past the
        // edge, over the bar or the footer); and it builds up over ~0.7s from
        // a quarter speed, so reaching the edge never sends the page flying.
        const EDGE = 100, MAX = 600, RAMP = 700;
        let f = 0;
        if (y < top + EDGE) f = -Math.min(1, (top + EDGE - y) / EDGE);
        else if (y > bottom - EDGE) f = Math.min(1, (y - (bottom - EDGE)) / EDGE);
        if (f) {
          if (!since) since = t;
          const ramp = 0.25 + 0.75 * Math.min(1, (t - since) / RAMP);
          // Eased (gentle near the start). The scroller only takes whole
          // pixels: the rest is carried to the next frame, not dropped.
          acc += Math.sign(f) * f * f * MAX * ramp * dt / 1000;
          const step = Math.trunc(acc);
          if (step) { sc.scrollTop += step; acc -= step; }
        } else { since = 0; acc = 0; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("dragover", onOver, true); document.removeEventListener("dragleave", onLeave, true); sc.style.overflowAnchor = ""; };
  }, [!!drag]); // eslint-disable-line
  useLayoutEffect(() => {
    const still = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Glide from where things were on screen (snapshot taken in the drag
    // event, before this render) to where they are laid out now. Heights that
    // change (slots opening/closing, topics folding) animate themselves, so
    // what's moved by those has ~no jump here and is left alone.
    // A snapshot serves the render(s) its event caused — a drop can take two,
    // a dragover's render can come a frame later — and is dropped after.
    const first = flipFirst.current && performance.now() - flipFirst.current.t < 250 ? flipFirst.current : null;
    if (first) setTimeout(() => { if (flipFirst.current === first) flipFirst.current = null; }, 0);
    if (first && !still) {
      // Scrolling since the snapshot (the topic anchor holds its topic in
      // place by scrolling) moves everything alike on screen: not a jump.
      const list = document.querySelector(".qsec-list"), sc = list && list.closest(".scroll-y");
      const scrolled = sc ? sc.scrollTop - first.scroll : 0;
      document.querySelectorAll(GLIDERS).forEach(el => {
        const k = glideKey(el);
        if (!first.m.has(k)) return;
        const was = first.m.get(k) - scrolled;
        const t = getComputedStyle(el).transform;
        const shown = el.getBoundingClientRect().top;
        const laid = shown - (t && t !== "none" ? new DOMMatrixReadOnly(t).m42 : 0);
        const dy = was - laid;
        if (Math.abs(was - shown) < 1) return; // already shown where it was: nothing jumped
        el.getAnimations().forEach(a => { if (a.id === "flip") a.cancel(); });
        if (Math.abs(dy) >= 1) el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 300, easing: EASE, id: "flip" });
      });
    }
    const st = settle.current;
    if (st && !drag) {
      const el = document.querySelector(`.qsec[data-key="${CSS.escape(st.secKey)}"] .qsec-body > .qrow[data-qid="${CSS.escape(String(st.id))}"]`);
      // A move to another topic arrives a render later; wait for it there.
      if (!el) { if (--st.tries <= 0) settle.current = null; return; }
      settle.current = null;
      if (still) return;
      const dy = st.top - el.getBoundingClientRect().top;
      el.getAnimations().forEach(a => a.cancel());
      el.animate([
        { transform: `translateY(${dy}px)`, boxShadow: "0 14px 32px rgba(25,39,67,.16), 0 0 0 2px var(--border-brand)", zIndex: 3 },
        { transform: "none", boxShadow: "0 0 0 0 rgba(25,39,67,0), 0 0 0 0 var(--border-brand)", zIndex: 3 },
      ], { duration: 360, easing: EASE });
    }
  });
  // Outside the list (over the bar or the footer while it autoscrolls, or the
  // pages rail) no topic gets the dragover: the slot follows the nearest edge
  // of the visible list, so it never scrolls away from the card.
  const trackOutside = (e) => {
    const d = dragRef.current, list = document.querySelector(".qsec-list");
    if (!d || !list || (e.target && e.target.closest && e.target.closest(".qsec-list"))) return;
    const sc = list.closest(".scroll-y"), box = sc.getBoundingClientRect();
    const bar = document.querySelector(".ctxbar"), foot = document.querySelector(".qfoot");
    const top = Math.max(box.top, bar ? bar.getBoundingClientRect().bottom : box.top);
    const bottom = Math.min(box.bottom, foot ? foot.getBoundingClientRect().top : box.bottom);
    const y = Math.min(bottom - 2, Math.max(top + 2, e.clientY));
    if (d.kind === "sec") { const idx = topicSlotAt(list, y, d); setSecHint(h => (h === idx ? h : idx)); return; }
    const lr = list.getBoundingClientRect();
    const hit = document.elementFromPoint(lr.left + lr.width / 2, y);
    const sec = hit && hit.closest(".qsec-list > .qsec[data-key]");
    if (!sec) return; // a gap: the slot stays where it is
    const secKey = sec.dataset.key, idx = questionSlotAt(sec, y, d);
    setQHint(prev => (prev && prev.secKey === secKey && prev.index === idx) ? prev : { secKey, index: idx });
  };
  // While dragging, the lifted card follows the pointer (vertically; it keeps
  // to the list's column). dragover carries the pointer position everywhere.
  useEffect(() => {
    if (!drag) return;
    let raf = 0, y = liftSrc.current ? liftSrc.current.y : 0;
    placeLift(y);
    const onOver = (e) => {
      // Snapshot positions before this event's re-render (glides start there).
      // The slot stays where it last was while the pointer crosses a gap (the
      // topic it enters next moves it, so nothing flips back and forth on the
      // way); outside the list it follows the list's edge (trackOutside).
      snapFirst();
      if (!e.clientX && !e.clientY) return;
      y = e.clientY;
      trackOutside(e);
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; placeLift(y); });
    };
    document.addEventListener("dragover", onOver, true);
    document.addEventListener("dragenter", snapFirst, true);
    document.addEventListener("drop", snapFirst, true);
    document.addEventListener("dragend", snapFirst, true);
    return () => {
      document.removeEventListener("dragover", onOver, true);
      document.removeEventListener("dragenter", snapFirst, true);
      document.removeEventListener("drop", snapFirst, true);
      document.removeEventListener("dragend", snapFirst, true);
      cancelAnimationFrame(raf);
    };
  }, [drag]); // eslint-disable-line

  // Question hover: within its OWN topic we LIVE-PREVIEW the new order (the rows
  // reorder to show where it lands), so `qHint.index` is the insertion slot in
  // the topic's order excluding the dragged row. Counting only the non-dragged
  // rows' midpoints keeps it stable — previewing can't shift the calculation.
  // A CUSTOM question over another topic marks that topic as a move target; a
  // STANDARD question over another topic does nothing (the card shows locked).
  // On the whole topic card (header included — overshooting a row to the top
  // lands it at the top), and on dragenter as well as dragover: Chrome decides
  // a drop by the last update, and the update where the element under the
  // pointer changes is an enter only — left uncancelled, the drop is refused.
  const questionBodyDragOver = (secKey) => (e) => {
    const d = dragRef.current; if (!d || d.kind !== "q") return;
    e.preventDefault(); e.dataTransfer.dropEffect = "move";
    // The slot nearest the lifted card, in this topic's order without the
    // dragged question — the same for its own topic and for another one.
    // Measured from layout (offsetTop in the body), not from the screen: rows
    // that are still sliding into place mustn't move the slot back and forth.
    // The card's top is compared with the other rows as they'd sit with no
    // slot at all (the open slot and the dragged row's room left out), so the
    // slot is never a whole row behind the card.
    const idx = questionSlotAt(e.currentTarget, e.clientY, d);
    setQHint(prev => (prev && prev.secKey === secKey && prev.index === idx) ? prev : { secKey, index: idx });
  };
  const questionSlotAt = (sec, clientY, d) => {
    const body = sec.querySelector(":scope > .qsec-body");
    const bodyTop = body ? body.getBoundingClientRect().top : 0;
    const rows = body ? [...body.querySelectorAll(":scope > .qrow")].filter(r => r.getAttribute("data-qid") !== String(d.id)) : [];
    rows.sort((a, b) => a.offsetTop - b.offsetTop);
    const cardTop = clientY - (liftSrc.current ? liftSrc.current.offsetY : 0) - bodyTop;
    let idx = 0, y = 0;
    for (const rEl of rows) { if (cardTop > y + rEl.offsetHeight / 2) idx++; y += rEl.offsetHeight; }
    return idx;
  };
  const questionBodyDrop = (secKey) => (e) => {
    const d = dragRef.current; if (!d || d.kind !== "q") return;
    e.preventDefault(); commitQuestion(d, secKey);
  };
  const commitQuestion = (d, secKey) => {
    if (liftEl.current) settle.current = { id: d.id, secKey, top: liftEl.current.getBoundingClientRect().top + 2, tries: 4 };
    if (d.secKey === secKey && qHint && qHint.secKey === secKey) {
      reorderQuestion(secKey, d.id, qHint.index); // qHint.index is already in without-dragged coords
    } else if (d.secKey !== secKey && onMoveTopic) {
      draggedMove.current = d.id;
      if (qHint && qHint.secKey === secKey) placeQuestion.current = { id: d.id, secKey, index: qHint.index };
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
  // Dragging a topic: every topic folds to its header (the whole outline then
  // fits on the screen), the lifted one leaves an empty slot that moves to
  // where it would land, and you can let go anywhere over the list.
  // Layout positions (no glide transforms), relative to the list itself — its
  // offsetParent is the scroller, whose offsets ignore how far it's scrolled.
  const topicSlotAt = (list, clientY, d) => {
    const listTop = list.getBoundingClientRect().top;
    const slot = list.querySelector(`:scope > .qsec[data-key="${CSS.escape(d.key)}"]`);
    const others = [...list.querySelectorAll(":scope > .qsec[data-key]")].filter(el => el !== slot).sort((a, b) => a.offsetTop - b.offsetTop);
    // The topics as they'd sit without the slot and its gap.
    const sTop = slot ? slot.offsetTop : Infinity;
    const next = others.find(el => el.offsetTop > sTop);
    const shift = next ? next.offsetTop - sTop : 0;
    const cardTop = clientY - (liftSrc.current ? liftSrc.current.offsetY : 0) - listTop;
    let idx = 0;
    for (const el of others) {
      const top = el.offsetTop - list.offsetTop - (el.offsetTop > sTop ? shift : 0);
      if (cardTop > top + el.offsetHeight / 2) idx++;
    }
    return idx;
  };
  const listDragOver = (e) => {
    const d = dragRef.current; if (!d || d.kind !== "sec") return;
    e.preventDefault(); e.dataTransfer.dropEffect = "move";
    const idx = topicSlotAt(e.currentTarget, e.clientY, d);
    setSecHint(h => (h === idx ? h : idx));
  };
  const listDrop = (e) => {
    const d = dragRef.current; if (!d || d.kind !== "sec") return;
    e.preventDefault(); commitTopic(d);
  };
  // It lands in the slot on screen, wherever it's let go.
  const commitTopic = (d) => {
    const idx = secHint == null ? d.index : secHint;
    const rest = visibleSections.filter(x => x.key !== d.key);
    const beforeKey = idx < rest.length ? rest[idx].key : null;
    // Its header glides from the lifted card into the slot as it opens.
    if (liftEl.current) sortAnchor.current = { key: d.key, from: liftEl.current.getBoundingClientRect().top + 1, landed: true };
    setLayout(prev => {
      const moved = prev.find(x => x.key === d.key); if (!moved) return prev;
      const without = prev.filter(x => x.key !== d.key);
      let at = beforeKey ? without.findIndex(x => x.key === beforeKey) : -1;
      if (at < 0) { const lastVis = rest.length ? without.findIndex(x => x.key === rest[rest.length - 1].key) : -1; at = lastVis + 1; }
      without.splice(at, 0, moved);
      return without.every((x, k) => x.key === prev[k].key) ? prev : without;
    });
    clearDrag();
  };
  // Let go anywhere else (a gap between topics, the bar, the footer) while a
  // slot is shown: it lands in that slot, as the screen says. Escape cancels.
  const anyDragOver = (e) => {
    const d = dragRef.current;
    if (!d || e.nativeEvent.defaultPrevented || (d.kind === "q" && !qHint)) return;
    e.preventDefault(); e.dataTransfer.dropEffect = "move";
  };
  const anyDrop = (e) => {
    const d = dragRef.current; if (!d || e.nativeEvent.defaultPrevented) return;
    e.preventDefault();
    if (d.kind === "sec") commitTopic(d);
    else if (qHint) commitQuestion(d, qHint.secKey);
    else clearDrag();
  };

  // Visible sections, in order — used for up/down bounds & neighbours. Custom
  // topics stay visible while empty (so they can be filled), and so do library
  // topics a move or a removal emptied: a topic goes only when it is removed.
  const keptTopicSet = new Set(keptTopics);
  const visibleSections = layout.filter(s => s.items.length || customTopicSet.has(s.key) || keptTopicSet.has(s.key));

  // The questionnaire's display order — the ground truth for question logic:
  // an answer condition may only look BACKWARDS (its trigger is asked first).
  // `earlierOf(q)` feeds both the dialog's candidate list and the row tag;
  // a condition whose trigger left the survey or moved below its question is
  // dormant and shows nothing.
  const flatOrder = visibleSections.flatMap(s => s.items);
  const orderIndex = {}; flatOrder.forEach((x, i) => { orderIndex[x.id] = i; });
  const earlierOf = (qq) => flatOrder
    .slice(0, orderIndex[qq.id] ?? 0)
    .filter(x => answerOptionsOf(x).length > 0);
  const logicInfoFor = (qq) => {
    const rule = (qMeta[qq.id] || {}).logic;
    if (!rule) return null;
    const earlier = earlierOf(qq);
    const live = activeConditions(rule, earlier);
    // Broken beats dormant-and-silent: a rule whose question was removed or
    // moved below gets a red tag so the creator finds it, instead of nothing.
    const broken = logicBroken(rule, earlier);
    // A follow-up shows its link even before its answers are chosen (made
    // from the row menu, the answers come right after) — it's a follow-up
    // from the moment it exists.
    const a = conditionOfType(rule, "answer");
    if (a && a.followUp && !broken) {
      const trig = flatOrder.find(x => x.id === a.trigger);
      return { count: live.length, broken: false, followUp: true,
        line: live.length ? logicSummary({ ...rule, conditions: live }, earlier)
          : `Follow-up to “${trig ? trig.text : ""}”. Choose the answers that trigger it.` };
    }
    if (!live.length && !broken) return null;
    return { count: live.length, broken, line: live.length ? logicSummary({ ...rule, conditions: live }, earlier) : "" };
  };
  // Can this question trigger follow-ups? Any question with fixed answer
  // options can — also one shown conditionally: its follow-ups then show only
  // to the people who got it and answered that way.
  const followUpBlockFor = (qq) => (answerOptionsOf(qq).length ? null : "Text answers can't trigger follow-up questions");
  // Start a follow-up's flow (the library, or the custom question dialog with
  // its checks); the app runs it and gives the arrivals the link. From the
  // row menu no answers are chosen yet (`pickAnswers`): the Logic dialog
  // opens on the new follow-up afterwards to choose them.
  const startFollowUpFrom = (trigger, fu, source, pickAnswers = false) => {
    const topic = effTopic(trigger);
    const opts = answerOptionsOf(trigger);
    // The answers as one locale-formatted value; the banners carry whole
    // sentences per case around it.
    const answersText = fu.answers.length
      ? new Intl.ListFormat("en", { type: "disjunction" }).format(fu.answers.map(i => opts[i]).filter(Boolean)) : null;
    setLogicQId(null); setLogicDraft(false); setSettingsQId(null);
    onFollowUp && onFollowUp({ trigger: trigger.id, triggerText: trigger.text, topic, topicLabel: topicName(topic),
      op: fu.op, answers: fu.answers, answersText, source, pickAnswers, created: [] });
  };
  // A topic's rule, summarized for its header tile and for the questions
  // that inherit it (the in-place logic editor's origin note).
  const topicLogicInfo = (key) => {
    const rule = (topicMeta[key] || {}).logic;
    if (!rule) return null;
    const sec = visibleSections.find(s => s.key === key);
    const first = sec && sec.items[0];
    const earlier = (first ? flatOrder.slice(0, orderIndex[first.id] ?? 0) : flatOrder)
      .filter(x => answerOptionsOf(x).length > 0);
    const live = activeConditions(rule, earlier);
    const broken = logicBroken(rule, earlier);
    if (!live.length && !broken) return null;
    return { name: topicName(key), broken, count: live.length, line: live.length ? logicSummary({ conditions: live }, earlier) : "" };
  };
  const topicLogicInfoFor = (qq) => {
    const i = topicLogicInfo(effTopic(qq));
    return i && i.line ? { name: i.name, line: i.line } : null;
  };
  // A topic being dragged: the order the topics show in meanwhile (the
  // lifted one at its slot), as flex order on the list.
  const sorting = !!drag && drag.kind === "sec";
  const sortedKeys = (() => {
    if (!sorting) return [];
    const rest = visibleSections.map(x => x.key).filter(k => k !== drag.key);
    rest.splice(Math.max(0, Math.min(secHint == null ? drag.index : secHint, rest.length)), 0, drag.key);
    return rest;
  })();
  // Topics without questions (a new custom topic, an emptied one): pressing
  // Next step while there are any shows a system notification (its timer
  // starts over on every press), scrolls to the first empty topic, and the
  // empty ones are outlined and give a short shake.
  const emptyTopics = visibleSections.filter(s => s.items.length === 0 && s.key !== "__custom");
  const [emptyWarn, setEmptyWarn] = useState(0);     // > 0: outlined (since the first press)
  const [warnOpen, setWarnOpen] = useState(0);       // > 0: the notification is up
  const [warnPulse, setWarnPulse] = useState(false);  // the shake, once per press
  const warnTimer = useRef(null), warnClose = useRef(null);
  const showEmptyWarn = emptyWarn > 0 && emptyTopics.length > 0;
  const EMPTY_WARN_MS = 6000;
  const tryNext = () => {
    if (!emptyTopics.length) return;
    setEmptyWarn(n => n + 1);
    setWarnOpen(n => n + 1);
    clearTimeout(warnClose.current);
    warnClose.current = setTimeout(() => setWarnOpen(0), EMPTY_WARN_MS);
    setWarnPulse(false);
    clearTimeout(warnTimer.current);
    warnTimer.current = setTimeout(() => {
      setWarnPulse(true);
      warnTimer.current = setTimeout(() => setWarnPulse(false), 900);
      // The first empty topic in view, clear of the sticky bar on top.
      const el = document.querySelector(`.qsec[data-key="${CSS.escape(emptyTopics[0].key)}"]`);
      const sc = el && el.closest(".scroll-y");
      if (!el || !sc) return;
      const bar = document.querySelector(".ctxbar");
      const under = bar ? Math.max(0, bar.getBoundingClientRect().bottom - sc.getBoundingClientRect().top) : 0;
      scrollContainerTo(sc, sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - under - 24);
    }, 30);
  };
  useEffect(() => () => { clearTimeout(warnTimer.current); clearTimeout(warnClose.current); }, []);
  // Add topic adds one topic, where you clicked, that you name yourself: a
  // section of this questionnaire, not linked to anything in the library.
  // It arrives empty, with a primary Add questions to fill it.
  const addTopicAt = (at) => setTopicDialog({ creating: true, at });
  // Menus in the list open downward, unless that would put them under the
  // footer bar (or off the screen): then they open upward from their button.
  const [menuUp, setMenuUp] = useState(false);
  const opensUp = (el, height) => {
    const r = el.getBoundingClientRect();
    const foot = document.querySelector(".qfoot");
    const limit = foot ? foot.getBoundingClientRect().top : window.innerHeight;
    return r.bottom + height + 8 > limit && r.top - height - 8 > 0;
  };
  // A topic's own way in: its trigger opens the Add questions menu, and both
  // routes land in that topic — the library dialog targets it, a custom
  // question starts with it as its topic.
  const addQuestionsTo = (s, trigger, inHead = false) => {
    const open = addMenuKey === s.key;
    return (
      <div className={inHead ? "qsec-head-add-wrap" : "qsec-add-wrap" + (enteringSecs.has(s.key) && s.items.length > 0 ? " is-entering" : "") + (leavingSecs.has(s.key) ? " is-leaving" : "")}>
        {trigger(open, (e) => { if (e) setMenuUp(opensUp(e.currentTarget, 170)); setAddMenuKey(k => k === s.key ? null : s.key); })}
        {open && (
          <>
            <div className="cq-menu-scrim" onMouseDown={() => setAddMenuKey(null)} />
            <AddQuestionsMenu className={"qsec-add-menu" + (menuUp ? " is-up" : "")} onPick={() => setAddMenuKey(null)}
              onLibrary={() => onEditQuestions && onEditQuestions("questions", { key: s.key, label: topicName(s.key) })}
              onCustom={() => onNewCustom && onNewCustom(s.key)} />
          </>
        )}
      </div>
    );
  };

  // Flag questions/sections that appeared since the last render (i.e. an Apply)
  // so they can animate in; clear the flag once the animation has run.
  // A layout effect: the flag is on before the first paint, so a new row
  // never flashes in at full height.
  // A question MOVED to another topic arrives there the same way (except one
  // you dragged there yourself — you watched it land).
  useLayoutEffect(() => {
    const cur = new Set(chosen.map(c => c.id));
    const place = new Map(groups.flatMap(g => g.items.map(q => [q.id, g.key])));
    if (prevIds.current === null) { prevIds.current = cur; prevPlace.current = place; return; }
    const moved = [...place].filter(([id, key]) => prevIds.current.has(id) && prevPlace.current.has(id)
      && prevPlace.current.get(id) !== key && id !== draggedMove.current).map(([id]) => id);
    const fresh = [...[...cur].filter(id => !prevIds.current.has(id)), ...moved];
    prevIds.current = cur; prevPlace.current = place; draggedMove.current = null;
    if (!fresh.length) return;
    // Scroll to the FIRST topic that got something, not the last: several
    // topics can change at once, and reading order beats recency. Measured
    // from the DOM so it follows the order actually on screen. Already in
    // view (e.g. a library topic added where you clicked): stay put.
    // The rows aren't on screen yet (the layout follows a render later), so
    // their topics come from the data; the topic cards already are.
    const keys = new Set(groups.filter(g => g.items.some(q => fresh.includes(q.id))).map(g => g.key));
    const findTarget = () => [...document.querySelectorAll(".qsec[data-key]")].find(sec => keys.has(sec.getAttribute("data-key")));
    // Scrolls when the topic isn't in view; says whether it did.
    const goTo = (el) => {
      const sc = el.closest(".scroll-y");
      if (!sc) return false;
      const r = el.getBoundingClientRect(), v = sc.getBoundingClientRect();
      if (r.top >= v.top && r.top < v.bottom - 80) return false;
      scrollContainerTo(sc, sc.scrollTop + r.top - v.top - 100);
      return true;
    };
    let delay = 0;
    const target = findTarget();
    if (target) { if (goTo(target)) delay = 450; }
    else if (keys.size) {
      // Topics that arrive WITH their questions (a template, say) aren't on
      // the page yet: the layout follows a render later. Go to the first one
      // as soon as it is there. New topics join at the end, so out of view:
      // the arrival waits for that scroll.
      delay = 450;
      let tries = 0;
      const seek = () => { const el = findTarget(); if (el) goTo(el); else if (tries++ < 30) requestAnimationFrame(seek); };
      requestAnimationFrame(seek);
    }
    setEnterDelay(delay);
    setEnteringIds(prev => { const n = new Set(prev); fresh.forEach(id => n.add(id)); return n; });
    enterTimers.current.push(setTimeout(() =>
      setEnteringIds(prev => { const n = new Set(prev); fresh.forEach(id => n.delete(id)); return n; }), delay + 900)); // room + show
    // Then the rows glow softly once, so the new question stays
    // findable in a topic that already had some (hovering one ends it).
    enterTimers.current.push(setTimeout(() =>
      setPulseIds(prev => { const n = new Set(prev); fresh.forEach(id => n.add(id)); return n; }), delay + 800));
    enterTimers.current.push(setTimeout(() =>
      setPulseIds(prev => { const n = new Set(prev); fresh.forEach(id => n.delete(id)); return n; }), delay + 800 + 2200));
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
      setEnteringSecs(prev => { const n = new Set(prev); fresh.forEach(k => n.delete(k)); return n; }), 1100)); // room + show
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
      if (!el || !sc) return;
      // Topics are created where you asked, usually right in view: only scroll
      // when the new card isn't fully visible. Explicit container math:
      // scrollIntoView gets dropped while the reveal animation transforms it.
      const r = el.getBoundingClientRect(), v = sc.getBoundingClientRect();
      if (r.top >= v.top && r.bottom <= v.bottom) return;
      scrollContainerTo(sc, sc.scrollTop + r.top - v.top - 100);
    }, 80));
  }, [secSig]); // eslint-disable-line
  const skipTopicWarn = () => { try { return localStorage.getItem("cyos.skipTopicRemoveWarn") === "1"; } catch (_) { return false; } };
  // A removed topic leaves the way a new one arrives, in reverse: it fades
  // out, then its room closes — and only then is it really gone.
  const TOPIC_LEAVE_MS = 780;
  const doRemoveTopic = (s) => {
    if (!onRemoveTopic || leavingSecs.has(s.key) || s.items.some(q => q.required)) return;
    setLeavingSecs(prev => new Set(prev).add(s.key));
    enterTimers.current.push(setTimeout(() => {
      onRemoveTopic(s.items.map(q => q.id), s.key);
      setLeavingSecs(prev => { const n = new Set(prev); n.delete(s.key); return n; });
    }, TOPIC_LEAVE_MS));
  };
  const requestRemoveTopic = (s) => {
    if (s.items.length === 0 || skipTopicWarn()) { doRemoveTopic(s); return; }
    setTopicWarn(s);
  };

  // The welcome page participants open on: the photo filling the card under a
  // dark scrim, with the content on top in white — title, text, the three
  // fixed info items and where the start button goes (a preview, so it's shown
  // disabled). Big on its own page, tiny in the rail.
  // The welcome page's text color (light or dark, with or without a text
  // background) is a toolbar variant for now: off, it reads as the default —
  // light text on the gray panel — whatever the survey has saved.
  const look = textLook(introTextColor ? intro : {}, introTextBox);
  const welcomeScreen = (mini) => (
    <div className={"welcome-screen" + (mini ? " is-mini" : "")} style={{ background: introSurface(design, look) }} aria-hidden={mini || undefined}>
      {/* On the page, the content block opens the editor. Its dashed frame
          and "Edit" label always show (quietly), so it never takes a hover to
          find; hover or focus makes them stronger. */}
      <div className="welcome-content" {...(mini ? {} : {
        role: "button", tabIndex: 0, "aria-label": "Edit welcome page",
        onClick: () => setIntroOpen(true),
        onKeyDown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIntroOpen(true); } },
      })}>
      {!mini && <span className="btn btn-secondary welcome-content-hint" aria-hidden="true"><Icon name="edit" size={16} />Edit</span>}
      <div className="welcome-title">{tr("intro:name", introTitle)}</div>
      <div className="welcome-desc">{tr("intro:desc", introDesc)}</div>
      {!mini && (
        <div className="welcome-meta" aria-hidden="true">
          <span><span className="welcome-meta-ic"><Icon name="Clock" size={20} /></span>{chosen.length} questions<br />approx. {estMinutes} {estMinutes === 1 ? "minute" : "minutes"}</span>
          <span><span className="welcome-meta-ic"><Icon name="desktop" size={20} /></span>Saves the answers<br />automatically</span>
          <span><span className="welcome-meta-ic"><Icon name="privacy" size={20} /></span>Confidentiality<br />guaranteed</span>
        </div>
      )}
      <span className="welcome-cta" aria-hidden="true">Get started!{!mini && <Icon name="play" size={14} />}</span>
      </div>
    </div>
  );

  // One background for the page, reused as the solid underlay of the sticky
  // context bar — its wash is translucent, and scrolled content must never
  // shine through while the bar is stuck.
  const pageBg = design
    ? designWash(design)
    : "var(--bg-secondary)";
  // The bar is a tad lighter than the page: a white wash over the design.
  // Topic headers take the same wash, via --bar-wash (unless the White topic
  // headers variant is on).
  const barWash = "rgba(255,255,255,.50)";
  return (
    <div className={"col" + (tipsOff ? " tips-off" : "") + (whiteTopics ? "" : " has-topic-tint")} style={{ background: pageBg, "--bar-wash": barWash }}
      onDragEnter={anyDragOver} onDragOver={anyDragOver} onDrop={anyDrop}>
      {drag && liftSrc.current && createPortal(
        <div className={"drag-lift" + (drag.kind === "sec" ? " is-topic" : "")} aria-hidden="true"
          style={{ left: liftSrc.current.left - 8, width: liftSrc.current.width + 16 }}
          ref={el => {
            liftEl.current = el;
            if (el && liftSrc.current && el.firstChild !== liftSrc.current.node) { el.replaceChildren(liftSrc.current.node); placeLift(liftSrc.current.y); }
          }} />,
        document.body)}
      <div className="scroll-y" style={{ flex: 1, padding: "0 0 110px" }}>
      <TopNav name={name} onRename={() => setRename({ kind: "survey", value: name })} compact={compact} mobile={mobile} />
      {/* The step's context bar. It replaces the page title: the active tab
          already names the step, so an H1 would only repeat the nav — and this
          page's whole job is a long list. Grammar, left to right:
          STATUS (read-only) -> DISPLAY (what I see) -> ADD CONTENT (what's in
          the survey). Only the last one writes. It sits outside the scrolling
          list, so the status stays in view — it is the orientation now. */}
      <div className={"ctxbar" + (pagesRail ? " has-pages" : "")} style={{ background: `linear-gradient(${barWash}, ${barWash}), ${pageBg}` }}>
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

          {/* Design is a SETTINGS menu: picking an option keeps it open
              (compare designs in quick succession); it closes on outside
              click or the button itself. The Add menu stays an action menu —
              its items navigate, so it closes. */}
          {/* The Logic button, next to Design (the winning variant, now the
              default): opens the logic dialog on the first question. */}
          <button className="btn btn-secondary" title={compact ? "Logic" : undefined} aria-label="Logic"
            aria-haspopup="dialog" onClick={() => flatOrder.length && setLogicQId(flatOrder[0].id)}>
            <Icon name="split" size={16} /><span className="ctxbar-btn-lbl">Logic</span>
          </button>
          <div className="ctxbar-menu-wrap">
            <button className={"btn btn-secondary" + (barMenu === "design" ? " is-pressed" : "")}
              title={compact ? "Design" : undefined} aria-label="Design"
              aria-haspopup="menu" aria-expanded={barMenu === "design"}
              onClick={() => setBarMenu(m => m === "design" ? null : "design")}>
              <Icon name="palette" size={16} /><span className="ctxbar-btn-lbl">Design</span>
            </button>
            {barMenu === "design" && (
              <>
                {/* The org's available designs (Figma 6293:27553): mini previews
                    of the participant screen in each design. Click to apply;
                    click the applied one again to go back to the neutral page. */}
                <div className="menu dsg-menu is-right" role="menu" aria-label="Survey design">
                  {DESIGNS.map(d => {
                    const active = designId === d.id;
                    return (
                      <button key={d.id} className="dsg-tile-wrap" role="menuitemradio" aria-checked={active}
                        aria-label={d.name} title={d.name}
                        onClick={() => onSetDesign && onSetDesign(d.id)}>
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

          {/* Add questions: from the library or written here. Topics are made
              in the questionnaire itself, between the topics or below them. */}
          <div className="ctxbar-menu-wrap">
            <button className={"btn btn-primary" + (barMenu === "add" ? " is-pressed" : "")}
              aria-haspopup="menu" aria-expanded={barMenu === "add"}
              onClick={() => setBarMenu(m => m === "add" ? null : "add")}>
              <Icon name="plus" size={16} /><span className="ctxbar-btn-lbl">Add questions</span>
            </button>
            {barMenu === "add" && (
              <>
                <AddQuestionsMenu className="ctxbar-menu is-right" onPick={() => setBarMenu(null)}
                  onLibrary={() => onEditQuestions()} onCustom={() => onNewCustom && onNewCustom()} />
              </>
            )}
          </div>
        </div>
      </div>

        {/* The survey's pages, as in the participant's order: the welcome page,
            then the questionnaire. You always land on the questionnaire. */}
        <div className={"bld-body" + (pagesRail ? " has-rail" : "") + (page === "welcome" ? " is-welcome" : "")}>
        {pagesRail && (
        <nav className={"bld-pages" + (entrance ? " is-intro" : "")} aria-label="Survey pages">
          <h2 className="bld-pages-title text-l5">Survey pages</h2>
          <button type="button" className={"bld-page" + (page === "welcome" ? " is-active" : "")} aria-current={page === "welcome" ? "page" : undefined}
            onClick={() => setPage("welcome")}>
            <span className="bld-page-thumb"><span className="bld-page-thumb-in">{welcomeScreen(true)}</span></span>
            <span className="bld-page-lbl">Welcome page</span>
          </button>
          <button type="button" className={"bld-page" + (page === "questionnaire" ? " is-active" : "")} aria-current={page === "questionnaire" ? "page" : undefined}
            onClick={() => setPage("questionnaire")}>
            {/* A miniature of the list itself: the first topics with their
                questions, drawn at full size and shrunk, on the page's own
                background — so it reads as a screenshot of the questionnaire. */}
            <span className="bld-page-thumb" aria-hidden="true">
              <span className="bld-page-thumb-in is-questions" style={{ background: pageBg }}>
              <span className="bld-thumb-canvas">
                {visibleSections.slice(0, 5).map(sct => (
                  <span key={sct.key} className="bld-thumb-card">
                    <span className="bld-thumb-head"><b>{topicName(sct.key)}</b><i>{sct.items.length} {sct.items.length === 1 ? "question" : "questions"}</i></span>
                    {sct.items.slice(0, 3).map(q => (
                      <span key={q.id} className="bld-thumb-row"><span className="bld-thumb-ic" />{tr(`q:${q.id}:text`, q.text)}</span>
                    ))}
                  </span>
                ))}
              </span>
              </span>
            </span>
            <span className="bld-page-lbl">Questionnaire</span>
          </button>
        </nav>
        )}
        {page === "welcome" ? (
          // The welcome screen as one big card filling the space next to the
          // rail, as participants get it; its content block is the way in.
          <div className="welcome-page">
            {welcomeScreen(false)}
          </div>
        ) : (
        <div className="qpage">
          {/* No pages panel: the welcome page participants open on is previewed
              above the topics, in the order they meet it; it opens its editor. */}
          {!pagesRail && (
            // Only what identifies the welcome page — title, text (its first two
            // sentences) and background. The fixed info, the start button and
            // the full text show in the editor; the whole card opens it, with
            // no Edit button: like a topic header, it reads as editable by its
            // hover (and its focus ring), not by a label.
            <div className={"intro-card" + (look.color === "dark" ? " is-text-dark" : "") + (boxFill(look.box, look.color) ? " has-text-box" : "")}
              role="button" tabIndex={0} aria-label="Edit welcome page"
              style={{ background: introSurface(design, look) }}
              onClick={() => setIntroOpen(true)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIntroOpen(true); } }}>
              <div className="intro-text" style={boxFill(look.box, look.color) ? { "--box-fill": boxFill(look.box, look.color) } : undefined}>
                <div className="welcome-title">{tr("intro:name", introTitle)}</div>
                <div className="welcome-desc">{twoSentences(tr("intro:desc", introDesc))}</div>
              </div>
            </div>
          )}

          <div className={"qsec-list" + (entrance ? " is-intro" : "") + (sorting ? " is-sorting" : "")}
            onDragEnter={listDragOver} onDragOver={listDragOver} onDrop={listDrop}>
          {visibleSections.map((s, vi) => {
            const secUp = vi > 0, secDown = vi < visibleSections.length - 1;
            const draggingElsewhere = !!drag && drag.kind === "q" && drag.secKey !== s.key;
            // Any question dragged over another topic marks that topic as a
            // move target (moves are survey-scoped and never touch benchmarks).
            const locked = false;
            // A question from another topic hovering here: an open slot where
            // it would land (no outline — the slot already says it).
            const slotAt = draggingElsewhere && !!qHint && qHint.secKey === s.key ? qHint.index : null;
            const secDragging = !!drag && drag.kind === "sec" && drag.key === s.key;
            const secPos = sorting ? sortedKeys.indexOf(s.key) : -1;
            const zone = (k, entering, leaving) => (
              <div key={k === visibleSections.length ? "z-end" : "z"} data-zone={k === visibleSections.length ? "end" : visibleSections[k].key}
                className={"qsec-dropzone" + (k === visibleSections.length ? " is-end" : "") + (entering ? " is-entering" : "") + (leaving ? " is-leaving" : "")}
                style={sorting ? { order: 2 * k } : undefined}>
                <div className="qsec-dropzone-strip" />
                {/* The gap between two topics is also where a new one goes,
                    so every gap carries an Add topic button. */}
                {k < visibleSections.length && (
                  <button className="btn btn-tertiary qsec-insert" aria-haspopup="dialog" onClick={() => addTopicAt(k)}>
                    <Icon name="plus" size={16} />Add topic
                  </button>
                )}
              </div>
            );
            return (
            <Fragment key={s.key}>
            {zone(vi, enteringSecs.has(s.key), leavingSecs.has(s.key))}
            <section data-key={s.key}
              onDragEnter={questionBodyDragOver(s.key)} onDragOver={questionBodyDragOver(s.key)} onDrop={questionBodyDrop(s.key)}
              style={sorting ? { order: 2 * secPos + 1 } : undefined}
              className={"qsec" + (showEmptyWarn && !s.items.length ? " is-empty-warn" + (warnPulse ? " is-warn-pulse" : "") : "") + (locked ? " is-locked" : "") + (secDragging ? " is-dragging" : "") + (enteringSecs.has(s.key) ? " is-entering" : "") + (leavingSecs.has(s.key) ? " is-leaving" : "")}>
              {/* The whole topic row opens its settings, like a question row.
                  A topic carries no "edited" chip: once its questions are in the
                  questionnaire the topic is just structure — the library is only
                  a way to organise questions, not something you stay linked to. */}
              {/* The header is not a button itself: it holds buttons (drag, Add
                  questions, actions), and a control inside a control is lost to
                  screen readers (axe: nested-interactive). The topic NAME is the
                  real button; a click anywhere else on the header does the same
                  for the mouse, as the question rows do. */}
              <div className="qsec-head is-clickable"
                onClick={e => { if (e.target.closest("button, .menu, [role='menu']")) return; setTopicDialog({ key: s.key }); }}>
                <Tooltip label="Drag to reorder" pos="is-left">
                  <button className="ib ib-36 ib-tertiary drag-ib" aria-label="Drag to reorder" draggable
                    onDragStart={startSection(s.key, vi)} onDragEnd={clearDrag} onClick={e => e.preventDefault()}>
                    <Icon name="drag-drop" size={16} /></button>
                </Tooltip>
                {/* The topic's description, when it has one: participants read
                    it on the topic's intro screen, so the overview shows it too. */}
                <div className="qsec-titles">
                  <h2 className="qsec-title">
                    <button type="button" className="qsec-title-btn" aria-label={"Topic settings: " + tr(`topic:${s.key}:name`, topicName(s.key))}
                      onClick={() => setTopicDialog({ key: s.key })}>{tr(`topic:${s.key}:name`, topicName(s.key))}</button>
                  </h2>
                  {tr(`topic:${s.key}:desc`, (topicMeta[s.key] || {}).desc || "") && (
                    <p className="qsec-sub">{tr(`topic:${s.key}:desc`, (topicMeta[s.key] || {}).desc || "")}</p>
                  )}
                </div>
                {/* While the topic is dragged, its count replaces its buttons. */}
                <span className="qsec-drag-count">{s.items.length} {s.items.length === 1 ? "question" : "questions"}</span>
                {/* The topic's own way in, in its header: the same menu as the
                    bottom row (phones, and the addAtBottom variant). An empty
                    topic has nothing else to do, so there it's the primary
                    button, to draw the eye. */}
                {!addBottom && addQuestionsTo(s, (open, toggle) => (
                  <button className={"btn " + (s.items.length ? "btn-tertiary" : "btn-primary") + " qsec-head-add" + (open ? " is-pressed" : "")} aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
                    <Icon name="plus" size={16} /><span className="qsec-head-add-lbl">Add questions</span>
                  </button>
                ), true)}
                {/* The topic's own logic, between Add questions and the topic
                    menu — same tile as the question rows, opens the dialog on
                    this topic. */}
                {(() => {
                  const tl = topicLogicInfo(s.key);
                  return tl && (
                    <span className="qsec-logic-wrap">
                      <Tooltip pos="is-left" float label={tl.broken ? <>
                        <span className="tt-title">Broken logic</span>
                        It points to a question that was removed or now comes later. Click to fix it.
                      </> : <>
                        <span className="tt-title">Shows conditionally</span>
                        {tl.line}
                      </>}>
                        <button type="button" className={"tag-logic-tile" + (tl.broken ? " is-broken" : "")}
                          aria-label={"Topic logic: " + (tl.broken ? "broken" : tl.line)}
                          onClick={() => setLogicQId("t:" + s.key)}>
                          <Icon name="split" size={16} />
                        </button>
                      </Tooltip>
                    </span>
                  );
                })()}
                <div className="qsec-menu-wrap">
                  <Tooltip label="Topic actions" pos="is-right"><button className="ib ib-36 ib-tertiary" aria-label="Topic actions" aria-haspopup="menu" aria-expanded={menuKey === s.key}
                    draggable={false} onDragStart={e => e.preventDefault()}
                    onClick={() => setMenuKey(k => k === s.key ? null : s.key)}><Icon name="more-vertical" size={16} /></button></Tooltip>
                  {menuKey === s.key && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onMouseDown={() => setMenuKey(null)} />
                      <div className="menu" role="menu" style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, width: 280, zIndex: 2 }}>
                        <div className="menu-item" role="menuitem"
                          onClick={() => { setMenuKey(null); onEditQuestions && onEditQuestions("questions", { key: s.key, label: topicName(s.key) }); }}>
                          <span className="menu-item-icon"><Icon name="plus" size={16} /></span>
                          <span className="menu-item-body"><span className="menu-item-title">Add questions to this topic</span></span>
                        </div>
                        <div className="menu-item" role="menuitem" onClick={() => { setMenuKey(null); setTopicDialog({ key: s.key }); }}>
                          <span className="menu-item-icon"><Icon name="edit" size={16} /></span>
                          <span className="menu-item-body"><span className="menu-item-title">Edit topic</span></span>
                        </div>
                        <div className="menu-divider" />
                        {secUp && (
                          <div className="menu-item" role="menuitem" onClick={() => { setMenuKey(null); snapFirst(); reorderSection(s.key, visibleSections[vi - 1].key, false); }}>
                            <span className="menu-item-icon"><Icon name="arrow-up" size={16} /></span>
                            <span className="menu-item-body"><span className="menu-item-title">Move up</span></span>
                          </div>
                        )}
                        {secDown && (
                          <div className="menu-item" role="menuitem" onClick={() => { setMenuKey(null); snapFirst(); reorderSection(s.key, visibleSections[vi + 1].key, true); }}>
                            <span className="menu-item-icon"><Icon name="arrow-down" size={16} /></span>
                            <span className="menu-item-body"><span className="menu-item-title">Move down</span></span>
                          </div>
                        )}
                        {(secUp || secDown) && <div className="menu-divider" />}
                        {/* A required question is always in, so a topic holding one
                            can't go (removing it would take the question out, or
                            just bring the topic straight back). Its reason shows. */}
                        {s.items.some(q => q.required) ? (
                          <div className="menu-item is-disabled" role="menuitem" aria-disabled="true">
                            <span className="menu-item-icon"><Icon name="trash" size={16} /></span>
                            <span className="menu-item-body"><span className="menu-item-title">Remove topic from questionnaire</span>
                              <span className="menu-item-sub">It has a required question</span></span>
                          </div>
                        ) : (
                          <div className="menu-item" role="menuitem" onClick={() => { setMenuKey(null); requestRemoveTopic(s); }}>
                            <span className="menu-item-icon" style={{ color: "var(--content-negative-secondary)" }}><Icon name="trash" size={16} /></span>
                            <span className="menu-item-body"><span className="menu-item-title" style={{ color: "var(--content-negative-secondary)" }}>Remove topic from questionnaire</span></span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="qsec-body">
                {/* The rows stay in the DOM in their real order while you drag;
                    the live preview reorders them with CSS \`order\` only. Moving
                    the dragged row's node mid-drag makes Chrome drop the drag
                    (it did whenever a row was dragged downwards). */}
                {draggingElsewhere && (
                  <div className={"qrow-slot" + (slotAt != null ? " is-open" : "")} aria-hidden="true"
                    style={{ order: slotAt != null ? slotAt : 99999, "--slot-h": (liftSrc.current ? liftSrc.current.height : 61) + "px" }} />
                )}
                {s.items.map((qq) => {
                  const i = s.items.findIndex(x => x.id === qq.id);
                  const shown = previewItems(s);
                  const isDragged = !!drag && drag.kind === "q" && drag.id === qq.id;
                  return <BuilderRow key={qq.id} q={qq} logic={logicInfoFor(qq)} slotH={isDragged && liftSrc.current ? liftSrc.current.height : null}
                    onOpenLogic={(qq2) => (logicInPlace ? setSettingsQId(qq2.id) : setLogicQId(qq2.id))}
                    followUpBlocked={followUpBlockFor(qq)}
                    linked={(() => { const a = conditionOfType((qMeta[qq.id] || {}).logic, "answer"); return !!(a && a.followUp && sel.has(a.trigger)); })()}
                    onFollowUp={() => { setLogicDraft(true); setLogicQId(qq.id); }}
                    order={slotAt != null ? (i >= slotAt ? i + 1 : i) : shown === s.items ? undefined : shown.indexOf(qq)}
                    away={isDragged && !!qHint && qHint.secKey !== s.key} meta={qMeta[qq.id]} tr={tr} showDesc={showDesc}
                    onRemove={onRemoveQuestion} onEdit={onEditCustom} dragging={!!drag && drag.kind === "q" && drag.id === qq.id}
                    onSettings={(qq2) => qq2.custom ? (onEditCustom && onEditCustom(qq2)) : setSettingsQId(qq2.id)}
                    onResetDesc={() => onUpdateQMeta && onUpdateQMeta(qq.id, { desc: undefined, descHidden: undefined, variant: undefined })}
                    canUp={i > 0} canDown={i < s.items.length - 1}
                    onMoveUp={() => { snapFirst(); reorderQuestion(s.key, qq.id, i - 1); }}
                    onMoveDown={() => { snapFirst(); reorderQuestion(s.key, qq.id, i + 1); }}
                    topics={visibleSections.map(x => ({ key: x.key, label: topicName(x.key) }))} onMoveTopic={(t) => onMoveTopic && onMoveTopic(qq.id, t)}
                    entering={enteringIds.has(qq.id) && !enteringSecs.has(s.key) ? { delay: enterDelay } : null}
                    pulsing={pulseIds.has(qq.id)} onSeen={() => stopPulse(qq.id)} themeInfo={themeMap[qq.theme]} themeInfoFor={(n) => themeMap[n]}
                    onOpenTheme={setThemeDetail}
                    onDragStart={startQuestion(s.key, qq.id, i, qq.custom)} onDragEnd={clearDrag} />;
                })}
                {/* Every topic's own way in, as its last row: inside the card, so
                    it plainly belongs to this topic. */}
                {/* The same Add questions row whether the topic is empty or not.
                    Dragging into an empty one still works — the drop handlers
                    live on the whole topic card. */}
                {addBottom && addQuestionsTo(s, (open, toggle) => (s.items.length ? (
                  <button className="qsec-add" aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
                    <Icon name="plus" size={16} />Add questions<Icon name="chevron-down-small" size={16} />
                  </button>
                ) : (
                  // Empty: the primary button, full width, as in the header.
                  <div className="qsec-add-empty">
                    <button className={"btn btn-primary" + (open ? " is-pressed" : "")} aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
                      <Icon name="plus" size={16} />Add questions</button>
                  </div>
                )))}
              </div>
            </section>
            {vi === visibleSections.length - 1 && zone(visibleSections.length)}
          </Fragment>
          ); })}
          {chosen.length > 0 && (
            <div className="add-topic-wrap">
              <button className="btn btn-tertiary add-topic-end" aria-haspopup="dialog" onClick={() => addTopicAt(visibleSections.length)}>
                <Icon name="plus" size={16} />Add topic
              </button>
            </div>
          )}
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
        <button className="btn btn-secondary" onClick={onSaveClose}>{mobile ? "Save" : <>Save &amp; close</>}</button>
        <button className={"btn btn-primary" + (chosen.length === 0 ? " is-disabled" : "")} disabled={chosen.length === 0}
          onClick={tryNext}>{mobile ? "Next" : "Next step"}<Icon name="arrow-right" size={16} /></button>
        {!mobile && <button className="btn btn-secondary is-disabled" disabled><Icon name="send" size={16} />Plan survey</button>}
      </div>

      {rename && rename.kind === "survey" && <RenameDialog title="Rename survey" label="Survey name" tid="1"
        value={rename.value} onCancel={() => setRename(null)}
        onSave={(v) => { onRename && onRename(v); setRename(null); }} />}
      {warnOpen > 0 && emptyTopics.length > 0 && (
        // A DS system notification, top right; every press of Next starts its
        // timer over (EMPTY_WARN_MS).
        <div className="sysnotif-stack">
          <div className="sysnotif is-warning" role="alert">
            <div className="sysnotif-title">{emptyTopics.length === 1 ? "1 topic has no questions yet" : `${emptyTopics.length} topics have no questions yet`}</div>
            <div className="sysnotif-desc">Add questions to {emptyTopics.length === 1 ? "it" : "them"}, or remove {emptyTopics.length === 1 ? "it" : "them"}, before you go to the next step.</div>
            <button className="sysnotif-close" aria-label="Dismiss" onClick={() => { clearTimeout(warnClose.current); setWarnOpen(0); }}><Icon name="cross" size={16} /></button>
          </div>
        </div>
      )}
      {topicDialog && (() => {
        if (topicDialog.creating) {
          return <TopicDialog creating isCustom questionCount={0} design={design}
            onCancel={() => setTopicDialog(null)}
            onAdd={undefined}
            onSave={(t) => {
              const key = onAddTopic && onAddTopic(t);
              // Land the topic where it was asked for: before the topic below
              // that gap, or at the end (above "No topic", which stays last).
              const before = visibleSections[topicDialog.at];
              if (key) placeTopic.current = { key, before: before ? before.key : null };
              setTopicDialog(null);
            }} />;
        }
        const key = topicDialog.key;
        const sec = layout.find(x => x.key === key);
        const isCustom = customTopicSet.has(key);
        return <TopicDialog design={design} name={topicName(key)} desc={(topicMeta[key] || {}).desc} tidName={"topic-" + key}
          originalName={key} isCustom={isCustom} questionCount={sec ? sec.items.length : 0}
          topicLogic={topicLogicInfo(key)} onOpenLogic={() => setLogicQId("t:" + key)}
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
          <BenchmarkQuestionDialog q={q} meta={qMeta[q.id]} topicKey={effTopic(q)} themeInfo={themeMap[q.theme]} themeInfoFor={(n) => themeMap[n]} design={design}
            topicLogic={topicLogicInfoFor(q)}
            allQuestions={flatOrder.map(x => ({ ...x, _condTopic: ((((topicMeta[effTopic(x)] || {}).logic || {}).conditions) || []).length > 0 }))}
            logicByQuestion={Object.fromEntries(flatOrder.map(x => [x.id, (qMeta[x.id] || {}).logic || null]))}
            logicInPlace={logicInPlace} onOpenLogic={setLogicQId}
            onOpenTheme={setThemeDetail}
            allVariants={edges.altWordings}
            topicOptions={visibleSections.map(x => ({ value: x.key, label: topicName(x.key) }))}
            onCancel={() => setSettingsQId(null)}
            onDetach={q.required ? undefined : ({ text, topic }) => { setSettingsQId(null); onDetachQuestion && onDetachQuestion(q, text, topic); }}
            onSave={({ qMeta: patch, topic, logicPatches }) => {
              onUpdateQMeta && onUpdateQMeta(q.id, patch);
              // The logic editor's rail can touch several questions in one
              // visit; each changed rule lands on its own question here.
              Object.entries(logicPatches || {}).forEach(([id, lg]) =>
                onUpdateQMeta && onUpdateQMeta(id, { logic: lg || undefined }));
              if (topic) onMoveTopic && onMoveTopic(q.id, topic);
              setSettingsQId(null);
            }} />
        ) : null;
      })()}
      {/* The standalone logic dialog (the default surface) sits over whatever
          opened it and commits itself — its Save applies, Cancel discards. */}
      {logicQId && (
        <QuestionLogicDialog initialId={logicQId} initialDraft={logicDraft}
          sections={visibleSections.map(x => ({ key: x.key, label: topicName(x.key), desc: (topicMeta[x.key] || {}).desc,
            items: x.items.map(q2 => ({ ...q2, _desc: (qMeta[q2.id] || {}).desc ?? q2.desc })) }))}
          logicByQuestion={Object.fromEntries(flatOrder.map(x => [x.id, (qMeta[x.id] || {}).logic || null]))}
          logicByTopic={Object.fromEntries(visibleSections.map(x => [x.key, (topicMeta[x.key] || {}).logic || null]))}
          zIndex={settingsQId || topicDialog ? 80 : undefined}
          onApply={({ questions = {}, topics = {} }) => {
            Object.entries(questions).forEach(([id, lg]) => onUpdateQMeta && onUpdateQMeta(id, { logic: lg || undefined }));
            Object.entries(topics).forEach(([key, lg]) => onUpdateTopicMeta && onUpdateTopicMeta(key, { logic: lg || undefined }));
          }}
          onStartFollowUp={(trigger, fu, source) => startFollowUpFrom(trigger, fu, source, !fu.answers.length)}
          onClose={() => { setLogicQId(null); setLogicDraft(false); }} />
      )}
      {translationsOpen && <TranslationsDialog pool={pool} selectedIds={selectedIds}
        topicMeta={topicMeta} customTopics={customTopics} qMeta={qMeta} i18nEdits={i18nEdits} i18nStale={i18nStale}
        onSave={onSaveTranslation} onConfirm={onConfirmTranslation} onClose={() => setTranslationsOpen(false)} />}
      {topicWarn && <TopicRemoveWarning label={topicName(topicWarn.key)} count={topicWarn.items.length}
        onCancel={() => setTopicWarn(null)}
        onConfirm={(dontShow) => { if (dontShow) { try { localStorage.setItem("cyos.skipTopicRemoveWarn", "1"); } catch (_) {} } doRemoveTopic(topicWarn); setTopicWarn(null); }} />}
      {introOpen && <TopicDialog variant="intro" tidName="2" tidDesc="3" design={design}
        textColorOption={introTextColor} textBoxOption={introTextBox}
        textColor={introTextColor ? intro.textColor : undefined} boxColor={introTextColor ? intro.boxColor : undefined}
        questionCount={chosen.length} minutes={estMinutes} name={introTitle} desc={introDesc}
        originalName={introTitle} isCustom i18nEdits={i18nEdits} stringKeyBase="intro"
        onCancel={() => setIntroOpen(false)}
        onSave={({ name: nm, desc: ds, textColor, boxColor, translations }) => {
          onUpdateIntro && onUpdateIntro({ title: nm, desc: ds || undefined, ...(introTextColor ? { textColor, ...(introTextBox ? { boxColor } : {}) } : {}) });
          (translations || []).forEach(({ code, part, text }) =>
            onSaveTranslation && onSaveTranslation(code, `intro:${part}`, text));
          setIntroOpen(false);
        }} />}
      {detailTheme && <ThemeDetailsDialog theme={detailTheme} sel={sel} whereOf={(q) => topicName(effTopic(q))} zIndex={settingsQId ? 80 : undefined}
        onToggle={(id) => onToggleQuestion && onToggleQuestion(id)}
        onToggleAll={(on) => onSetManyQuestions && onSetManyQuestions(detailTheme.questions.map(x => x.id), on)}
        onClose={() => setThemeDetail(null)} />}
    </div>
  );
}
