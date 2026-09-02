// Builder.jsx — Questionnaire step, full-width (Engage DS)
import { useState, useEffect, useRef, Fragment } from "react";
import { Icon } from "./Icon.jsx";
import { groupQuestions, QTypeIcon, ThemeTag, CustomTag, Tooltip, RequiredMarker, themesOf } from "./shared.jsx";
import { ThemeDetailsDialog } from "./EditQuestionsDialog.jsx";
import { TEMPLATES, BADGE_COLORS, THEMES } from "../data/data.js";
import { templatePoolQuestions } from "../data/qlib.js";

// Small rename dialog — used for the survey name and for a topic's
// questionnaire-specific label.
function RenameDialog({ title, label, value, onCancel, onSave }) {
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
            questionnaire. You can add them back later from <b>Add questions</b>.
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

function TopNav({ name, onRename }) {
  const steps = [
    { n: 1, icon: "clipboard-note", label: "Questionnaire", active: true },
    { n: 2, icon: "users", label: "Participants" },
    { n: 3, icon: "calendar", label: "Schedule" },
    { n: 4, icon: "send", label: "Layout & e-mails", done: true },
  ];
  return (
    <div style={{ height: 64, borderBottom: "1px solid var(--border-base)", background: "var(--bg-base)", display: "flex",
      alignItems: "center", padding: "0 var(--spacing-loose)", gap: "var(--spacing-base)", flex: "none" }}>
      <span className="tag tag-draft">Draft</span>
      <span style={{ fontWeight: 600, fontSize: 16 }}>{name}</span>
      <button className="btn btn-link" style={{ padding: "4px 6px" }} onClick={onRename}><Icon name="edit" size={14} />Edit name</button>
      <div className="spacer" />
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {steps.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px",
            borderRadius: "var(--radius-md)", background: s.active ? "var(--bg-base-hover)" : "transparent" }}>
            {s.done
              ? <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--bg-positive-base)", color: "var(--content-on-brand-base)", display: "grid", placeItems: "center", flex: "none" }}><Icon name="check" size={12} /></span>
              : <span style={{ width: 20, height: 20, borderRadius: "50%", fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center", flex: "none",
                  background: s.active ? "var(--bg-brand-base)" : "var(--bg-tertiary)", color: s.active ? "var(--content-on-brand-base)" : "var(--content-secondary)" }}>{s.n}</span>}
            <Icon name={s.icon} size={16} style={{ color: s.active ? "var(--content-brand-base)" : "var(--content-secondary)" }} />
            <span style={{ fontSize: 14, fontWeight: s.active ? 600 : 500, color: s.active ? "var(--content-base)" : "var(--content-secondary)" }}>{s.label}</span>
          </div>
        ))}
        <Tooltip label="More options" pos="is-below"><button className="ib ib-36 ib-tertiary" aria-label="More options" style={{ marginLeft: 2 }}><Icon name="more-vertical" size={16} /></button></Tooltip>
      </div>
    </div>
  );
}

function BuilderRow({ q, onRemove, onEdit, onMoveUp, onMoveDown, canUp, canDown, topics, onMoveTopic, dragging, entering, themeInfo, onOpenTheme, onDragStart, onDragEnd }) {
  const [menu, setMenu] = useState(false);
  const [view, setView] = useState("main"); // "main" | "move" (topic picker for custom questions)
  const close = () => { setMenu(false); setView("main"); };
  const hasMove = canUp || canDown;
  const otherTopics = (topics || []).filter(t => t !== q.topic);
  return (
    <div className={"qrow" + (dragging ? " is-dragging" : "") + (entering ? " is-entering" : "")} data-qid={q.id}>
      <Tooltip label="Drag to reorder" pos="is-left">
        <button className="ib ib-36 ib-tertiary drag-ib" aria-label="Drag to reorder" draggable
          onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={e => e.preventDefault()}>
          <Icon name="drag-drop" size={16} /></button>
      </Tooltip>
      <div className="qrow-main">
        <div style={{ fontSize: 14, fontWeight: 500, lineHeight: "22.4px" }}>{q.text}</div>
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
                {view === "move" ? (
                  <>
                    <div className="menu-item" role="menuitem" onClick={() => setView("main")}>
                      <span className="menu-item-icon"><Icon name="chevron-left" size={16} /></span>
                      <span className="menu-item-body"><span className="menu-item-title">Move to topic</span></span>
                    </div>
                    <div className="menu-divider" />
                    {otherTopics.map(t => (
                      <div key={t} className="menu-item" role="menuitem" onClick={() => { close(); onMoveTopic && onMoveTopic(t); }}>
                        <span className="menu-item-body"><span className="menu-item-title">{t}</span></span>
                      </div>
                    ))}
                    {otherTopics.length === 0 && <div className="menu-item is-disabled"><span className="menu-item-body"><span className="menu-item-title">No other topics</span></span></div>}
                  </>
                ) : (
                  <>
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
                    {q.custom ? (
                      <>
                        {hasMove && <div className="menu-divider" />}
                        <div className="menu-group-lbl">For custom questions only</div>
                        <div className="menu-item" role="menuitem" onClick={() => { close(); onEdit && onEdit(q); }}>
                          <span className="menu-item-icon"><Icon name="edit" size={16} /></span>
                          <span className="menu-item-body"><span className="menu-item-title">Edit question</span></span>
                        </div>
                        <div className="menu-item" role="menuitem" onClick={() => setView("move")}>
                          <span className="menu-item-icon"><Icon name="import-export" size={16} /></span>
                          <span className="menu-item-body"><span className="menu-item-title">Move to topic</span></span>
                          <span className="menu-chevron"><Icon name="chevron-right" size={16} /></span>
                        </div>
                        <div className="menu-divider" />
                        <div className="menu-item" role="menuitem" onClick={() => { close(); onRemove && onRemove(q); }}>
                          <span className="menu-item-icon" style={{ color: "var(--content-negative-secondary)" }}><Icon name="trash" size={16} /></span>
                          <span className="menu-item-body"><span className="menu-item-title" style={{ color: "var(--content-negative-secondary)" }}>Delete question</span></span>
                        </div>
                      </>
                    ) : q.required ? (
                      <>
                        {hasMove && <div className="menu-divider" />}
                        <div className="menu-item is-disabled" role="menuitem" aria-disabled="true">
                          <span className="menu-item-icon"><Icon name="asterisk" size={16} /></span>
                          <span className="menu-item-body"><span className="menu-item-title">Remove from questionnaire</span><span className="menu-item-sub">This question is required</span></span>
                        </div>
                      </>
                    ) : (
                      <>
                        {hasMove && <div className="menu-divider" />}
                        <div className="menu-item" role="menuitem" onClick={() => { close(); onRemove && onRemove(q); }}>
                          <span className="menu-item-icon" style={{ color: "var(--content-negative-secondary)" }}><Icon name="cross" size={16} /></span>
                          <span className="menu-item-body"><span className="menu-item-title" style={{ color: "var(--content-negative-secondary)" }}>Remove from questionnaire</span></span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
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
  return next;
}

export function Builder({ survey, onEditQuestions, onExit, onSaveClose, onRemoveQuestion, onEditCustom, onRename, onRemoveTopic, onMoveTopic, onToggleQuestion, onSetManyQuestions, onOpenTemplates }) {
  const { name, isTemplate, selectedIds, pool } = survey;
  const [menuKey, setMenuKey] = useState(null);
  const [rename, setRename] = useState(null);
  const [topicWarn, setTopicWarn] = useState(null); // section pending removal confirmation
  const [themeDetail, setThemeDetail] = useState(null); // theme name whose details dialog is open (from a tag)
  const sel = new Set(selectedIds);
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
  const groups = groupQuestions(chosen, "library");
  // Header meta: a theme is "active" when every one of its questions is selected
  // (a scored theme); a template is "active" when its whole question set is in.
  const activeThemes = themeGroups.filter(t => t.total > 0 && t.kept >= t.total).length;
  const activeTemplates = TEMPLATES.filter(t => {
    const qs = templatePoolQuestions(t.id);
    return qs.length > 0 && qs.every(qq => sel.has(qq.id));
  });

  // On-page ordering the user can drag-reorder. Lives only here — the Add
  // questions dialog always works from the library order, never this one.
  const [layout, setLayout] = useState(() => groups.map(g => ({ key: g.key, label: g.label, items: g.items })));
  // The reconcile signature must cover everything a row RENDERS from the pool
  // (topic, text, required) or a change there won't reach the layout snapshot —
  // the required flag is flipped live by the toolbar's edge-case switch.
  const sig = selectedIds.join(",") + "|" + pool.map(p => p.id + ":" + (p.topic || "") + ":" + (p.text || "") + ":" + (p.required ? "1" : "0")).join(",");
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
    } else if (d.custom) {
      e.preventDefault(); e.dataTransfer.dropEffect = "move";
      if (dropTarget !== secKey) setDropTarget(secKey);
    }
  };
  const questionBodyDrop = (secKey) => (e) => {
    const d = drag; if (!d || d.kind !== "q") return;
    e.preventDefault();
    if (d.secKey === secKey && qHint && qHint.secKey === secKey) {
      reorderQuestion(secKey, d.id, qHint.index); // qHint.index is already in without-dragged coords
    } else if (d.custom && d.secKey !== secKey && onMoveTopic) {
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

  // Visible (non-empty) sections, in order — used for up/down bounds & neighbours.
  const visibleSections = layout.filter(s => s.items.length);

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
  }, [sig]); // eslint-disable-line
  useEffect(() => {
    const cur = new Set(visibleSections.map(s => s.key));
    if (prevSecs.current === null) { prevSecs.current = cur; return; }
    const fresh = [...cur].filter(k => !prevSecs.current.has(k));
    prevSecs.current = cur;
    if (!fresh.length) return;
    setEnteringSecs(prev => { const n = new Set(prev); fresh.forEach(k => n.add(k)); return n; });
    enterTimers.current.push(setTimeout(() =>
      setEnteringSecs(prev => { const n = new Set(prev); fresh.forEach(k => n.delete(k)); return n; }), 560));
  }, [sig]); // eslint-disable-line
  const skipTopicWarn = () => { try { return localStorage.getItem("cyos.skipTopicRemoveWarn") === "1"; } catch (_) { return false; } };
  const doRemoveTopic = (s) => { if (onRemoveTopic) onRemoveTopic(s.items.map(q => q.id)); };
  const requestRemoveTopic = (s) => {
    if (s.items.length === 0 || skipTopicWarn()) { doRemoveTopic(s); return; }
    setTopicWarn(s);
  };

  return (
    <div className={"col" + (tipsOff ? " tips-off" : "")}>
      <TopNav name={name} onRename={() => setRename({ kind: "survey", value: name })} />
      <div className="scroll-y" style={{ flex: 1, padding: "var(--spacing-super-loose) 0 110px", background: "var(--bg-base)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 var(--spacing-super-loose)" }}>
          <h1 className="text-l2" style={{ margin: "0 0 4px" }}>Questions</h1>
          <p style={{ margin: "0 0 var(--spacing-loose)", fontSize: 14, lineHeight: 1.6, color: "var(--content-secondary)" }}>Select the question sets and single questions that you want to include in this survey.</p>

          <div className="card ov-card">
            <div className="ov-top">
              <div className="ov-content">
                {chosen.length === 0 ? (
                  <>
                    <span className="ov-count">Start adding your questions</span>
                    <div className="ov-meta"><span>A short summary of your selection will show here</span></div>
                  </>
                ) : (
                  <>
                    <div className="ov-count-row">
                      <span className="ov-count">{chosen.length} {chosen.length === 1 ? "question" : "questions"} selected</span>
                    </div>
                    <div className="ov-meta">
                      {activeThemes > 0 && <>
                        <span>{activeThemes} active {activeThemes === 1 ? "theme" : "themes"}</span>
                        <span className="ov-dot" aria-hidden="true" />
                      </>}
                      <span>{estMinutes} {estMinutes === 1 ? "minute" : "minutes"} completion time</span>
                    </div>
                  </>
                )}
              </div>
              <button className="btn btn-primary" style={{ flex: "none" }} onClick={onEditQuestions}><Icon name="plus" size={16} />Add questions</button>
            </div>
            {chosen.length > 0 && activeTemplates.length > 0 && (
              <div className="ov-tags">
                {activeTemplates.map(t => {
                  const b = BADGE_COLORS[t.badge] || {};
                  return (
                    <Tooltip key={t.id} label="View in Templates" pos="is-below">
                      <button className="ov-tmpl-tag" style={{ background: b.bg }} onClick={onOpenTemplates}>
                        <Icon name={b.icon} size={16} style={{ color: b.fg }} />
                        {t.name}
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </div>

          <div className="qsec-list">
          {visibleSections.map((s, vi) => {
            const secUp = vi > 0, secDown = vi < visibleSections.length - 1;
            const draggingElsewhere = !!drag && drag.kind === "q" && drag.secKey !== s.key;
            // A standard question over another topic locks it; a custom question
            // can move there, so that topic becomes a drop target instead.
            const locked = draggingElsewhere && !drag.custom;
            const isDropTarget = draggingElsewhere && drag.custom && dropTarget === s.key;
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
              <div className="qsec-head">
                <Tooltip label="Drag to reorder" pos="is-left">
                  <button className="ib ib-36 ib-tertiary drag-ib" aria-label="Drag to reorder" draggable
                    onDragStart={startSection(s.key, vi)} onDragEnd={clearDrag} onClick={e => e.preventDefault()}>
                    <Icon name="drag-drop" size={16} /></button>
                </Tooltip>
                <h2 className="qsec-title">{s.label}</h2>
                <div className="spacer" />
                <span className="qsec-count">{s.items.length} questions</span>
                <div className="qsec-menu-wrap">
                  <Tooltip label="Topic actions" pos="is-right"><button className="ib ib-36 ib-tertiary" aria-label="Topic actions" aria-haspopup="menu" aria-expanded={menuKey === s.key}
                    draggable={false} onDragStart={e => e.preventDefault()}
                    onClick={() => setMenuKey(k => k === s.key ? null : s.key)}><Icon name="more-vertical" size={16} /></button></Tooltip>
                  {menuKey === s.key && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onMouseDown={() => setMenuKey(null)} />
                      <div className="menu" role="menu" style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, width: 280, zIndex: 2 }}>
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
              {locked && <div className="qsec-lock-msg"><span><Icon name="lock" size={16} />You can reorder standard questions within their topic only</span></div>}
              <div className="qsec-body" onDragOver={questionBodyDragOver(s.key)} onDrop={questionBodyDrop(s.key)}>
                {previewItems(s).map((qq) => {
                  const i = s.items.findIndex(x => x.id === qq.id);
                  return <BuilderRow key={qq.id} q={qq}
                    onRemove={onRemoveQuestion} onEdit={onEditCustom} dragging={!!drag && drag.kind === "q" && drag.id === qq.id}
                    canUp={i > 0} canDown={i < s.items.length - 1}
                    onMoveUp={() => reorderQuestion(s.key, qq.id, i - 1)}
                    onMoveDown={() => reorderQuestion(s.key, qq.id, i + 1)}
                    topics={visibleSections.map(x => x.key)} onMoveTopic={(t) => onMoveTopic && onMoveTopic(qq.id, t)}
                    entering={enteringIds.has(qq.id) && !enteringSecs.has(s.key)} themeInfo={themeMap[qq.theme]}
                    onOpenTheme={setThemeDetail}
                    onDragStart={startQuestion(s.key, qq.id, i, qq.custom)} onDragEnd={clearDrag} />;
                })}
              </div>
            </section>
            {vi === visibleSections.length - 1 && zone(visibleSections.length)}
          </Fragment>
          ); })}
          </div>

          {chosen.length > 0 && (
            <div style={{ marginTop: "var(--spacing-extra-loose)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "var(--spacing-loose)", textAlign: "center" }}>
              <div className="text-l5" style={{ color: "var(--content-secondary)" }}>Want to add or remove questions?</div>
              <div className="text-medium text-subdued">Open the question editor to select questions or write your own.</div>
              <button className="btn btn-secondary" onClick={onEditQuestions}><Icon name="plus" size={16} />Add questions</button>
            </div>
          )}

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

      <div style={{ height: 72, borderTop: "1px solid var(--border-base)", background: "var(--bg-base)", display: "flex",
        alignItems: "center", padding: "0 var(--spacing-loose)", gap: "var(--spacing-base-tight)", flex: "none", boxShadow: "var(--sh-footer)" }}>
        <button className="btn btn-secondary" onClick={onExit}><Icon name="chevron-left" size={16} />Previous step</button>
        <div className="spacer" />
        <span className="text-medium text-subdued">Last saved: just now</span>
        <button className="btn btn-secondary" onClick={onSaveClose}>Save &amp; close</button>
        <button className={"btn btn-primary" + (chosen.length === 0 ? " is-disabled" : "")} disabled={chosen.length === 0}>Next step<Icon name="arrow-right" size={16} /></button>
        <button className="btn btn-secondary is-disabled" disabled><Icon name="send" size={16} />Plan survey</button>
      </div>

      {rename && <RenameDialog title="Rename survey" label="Survey name"
        value={rename.value} onCancel={() => setRename(null)}
        onSave={(v) => { onRename && onRename(v); setRename(null); }} />}
      {topicWarn && <TopicRemoveWarning label={topicWarn.label} count={topicWarn.items.length}
        onCancel={() => setTopicWarn(null)}
        onConfirm={(dontShow) => { if (dontShow) { try { localStorage.setItem("cyos.skipTopicRemoveWarn", "1"); } catch (_) {} } doRemoveTopic(topicWarn); setTopicWarn(null); }} />}
      {detailTheme && <ThemeDetailsDialog theme={detailTheme} sel={sel}
        onToggle={(id) => onToggleQuestion && onToggleQuestion(id)}
        onToggleAll={(on) => onSetManyQuestions && onSetManyQuestions(detailTheme.questions.map(x => x.id), on)}
        onClose={() => setThemeDetail(null)} />}
    </div>
  );
}
