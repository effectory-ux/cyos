// Builder.jsx — Questionnaire step, full-width (Engage DS)
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Icon } from "./Icon.jsx";
import { themeStatus, groupQuestions, rowSubtext, QTypeIcon, Tag, Tooltip } from "./shared.jsx";
import { QTYPES, TEMPLATES, BADGE_COLORS } from "../data/data.js";

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

function BuilderRow({ q, sub, onRemove, onEdit, hintClass, dragging, onDragStart, onDragEnd }) {
  const m = QTYPES[q.type];
  const [menu, setMenu] = useState(false);
  return (
    <div className={"qrow" + (hintClass || "") + (dragging ? " is-dragging" : "")} draggable
      data-flip-id={"q:" + q.id} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <span className="qrow-grip" aria-hidden="true"><Icon name="drag-drop" size={18} /></span>
      <div className="qrow-main">
        <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{q.text}</div>
        {sub && <div className="text-small" style={{ color: "var(--content-secondary)", marginTop: 2 }}>{sub}</div>}
      </div>
      <div className="qrow-meta">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--content-secondary)", minWidth: 132 }}>
          <QTypeIcon type={q.type} size={24} />{m.label}
        </span>
        {q.custom ? <Tag kind="custom">Custom</Tag> : (q.bench && <Tag kind="benchmark">Benchmark</Tag>)}
        {q.custom ? (
          <div className="qrow-menu-wrap">
            <Tooltip label="Question actions" pos="is-left"><button className="ib ib-36 ib-tertiary" aria-label="Question actions" aria-haspopup="menu" aria-expanded={menu}
              onClick={() => setMenu(o => !o)} draggable={false} onDragStart={e => e.preventDefault()}><Icon name="more-vertical" size={16} /></button></Tooltip>
            {menu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onMouseDown={() => setMenu(false)} />
                <div className="menu" role="menu" style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, width: 200, zIndex: 2 }}>
                  <div className="menu-item" role="menuitem" onClick={() => { setMenu(false); onEdit && onEdit(q); }}>
                    <span className="menu-item-icon"><Icon name="edit" size={16} /></span>
                    <span className="menu-item-body"><span className="menu-item-title">Edit question</span></span>
                  </div>
                  <div className="menu-item" role="menuitem" onClick={() => { setMenu(false); onRemove && onRemove(q); }}>
                    <span className="menu-item-icon" style={{ color: "var(--content-negative-secondary)" }}><Icon name="trash" size={16} /></span>
                    <span className="menu-item-body"><span className="menu-item-title" style={{ color: "var(--content-negative-secondary)" }}>Delete question</span></span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <Tooltip label="Remove from questionnaire" pos="is-left"><button className="ib ib-36 ib-tertiary" aria-label="Remove from questionnaire"
            onClick={() => onRemove && onRemove(q)} draggable={false} onDragStart={e => e.preventDefault()}><Icon name="cross" size={16} /></button></Tooltip>
        )}
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

export function Builder({ survey, onEditQuestions, onExit, onSaveClose, onRemoveQuestion, onEditCustom, onRename, onRemoveTopic }) {
  const { name, templateName, isTemplate, selectedIds, pool } = survey;
  const [menuKey, setMenuKey] = useState(null);
  const [rename, setRename] = useState(null);
  const sel = new Set(selectedIds);
  const chosen = pool.filter(q => sel.has(q.id));
  const status = themeStatus(selectedIds);
  const broken = status.filter(t => t.touched && !t.complete);
  const customized = isTemplate && broken.length > 0;
  const groups = groupQuestions(chosen, "library");
  const badge = isTemplate ? (BADGE_COLORS[(TEMPLATES.find(t => t.name === templateName) || {}).badge || "teal"]) : null;

  // On-page ordering the user can drag-reorder. Lives only here — the Add
  // questions dialog always works from the library order, never this one.
  const [layout, setLayout] = useState(() => groups.map(g => ({ key: g.key, label: g.label, items: g.items })));
  const sig = selectedIds.join(",") + "|" + pool.map(p => p.id + ":" + (p.text || "")).join(",");
  useEffect(() => { setLayout(prev => reconcileLayout(prev, groups)); }, [sig]); // eslint-disable-line

  const dragRef = useRef(null);
  const [hint, setHint] = useState(null);
  const [dragId, setDragId] = useState(null); // "q:<id>" | "sec:<key>" — the lifted item
  const clearDrag = () => { dragRef.current = null; setHint(null); setDragId(null); };

  // FLIP: when the layout order changes (a drop, or questions added/removed),
  // slide every section & row from its previous position to the new one instead
  // of snapping. Keyed on the order signature so it ignores drag-hover hints.
  const rootRef = useRef(null);
  const flipPrev = useRef(new Map());
  const orderSig = layout.map(s => s.key + ":" + s.items.map(i => i.id).join("-")).join("|");
  useLayoutEffect(() => {
    const root = rootRef.current; if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Measure in the scroll container's CONTENT coordinates (add scroll offset),
    // not viewport coordinates — otherwise scrolling between two reorders makes
    // every element look like it moved by the scroll delta, and the whole list
    // animates spuriously.
    const scroller = root.querySelector(".scroll-y") || root;
    const base = scroller.getBoundingClientRect();
    const sx = scroller.scrollLeft, sy = scroller.scrollTop;
    const next = new Map();
    root.querySelectorAll("[data-flip-id]").forEach(node => {
      const id = node.dataset.flipId;
      const r = node.getBoundingClientRect();
      const pos = { left: r.left - base.left + sx, top: r.top - base.top + sy };
      next.set(id, pos);
      const old = flipPrev.current.get(id);
      if (!old || reduce) return;
      const dx = old.left - pos.left, dy = old.top - pos.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      // Invert to the old position, force a synchronous reflow so the browser
      // registers it as the start frame, then play back to the new position.
      // Setting the final transform synchronously (no rAF) means the end state
      // is always correct even if the transition never runs (hidden tab, etc.).
      node.style.transition = "none";
      node.style.transform = `translate(${dx}px, ${dy}px)`;
      void node.offsetWidth; // flush
      node.style.transition = "transform var(--motion-base) var(--ease-standard)";
      node.style.transform = "";
      node.addEventListener("transitionend", function te(ev) {
        if (ev.propertyName !== "transform") return;
        node.style.transition = ""; node.removeEventListener("transitionend", te);
      });
    });
    flipPrev.current = next;
  }, [orderSig]);

  const moveQuestion = (src, destKey, destIndex) => {
    setLayout(prev => {
      let moved = null;
      const removed = prev.map(s => {
        if (s.key !== src.secKey) return s;
        const items = [...s.items]; moved = items.splice(src.index, 1)[0]; return { ...s, items };
      });
      if (!moved) return prev;
      let idx = destIndex;
      if (src.secKey === destKey && src.index < destIndex) idx -= 1;
      return removed.map(s => {
        if (s.key !== destKey) return s;
        const items = [...s.items]; items.splice(idx, 0, moved); return { ...s, items };
      });
    });
  };
  const moveSection = (srcKey, destKey, pos) => {
    if (srcKey === destKey) return;
    setLayout(prev => {
      const arr = [...prev];
      const from = arr.findIndex(s => s.key === srcKey);
      const moved = arr.splice(from, 1)[0];
      let to = arr.findIndex(s => s.key === destKey);
      if (pos === "after") to += 1;
      arr.splice(to, 0, moved); return arr;
    });
  };

  // A drop is a no-op when it would leave the item exactly where it is — the
  // slot at the dragged row's own index, or the one right after it (same for a
  // section dropped after its upper neighbour / before its lower neighbour).
  // We hide the insertion line in those positions so it only shows when the
  // drop would actually move something.
  const qDropIsNoop = (destKey, destIndex) => {
    const d = dragRef.current;
    return d && d.type === "q" && d.secKey === destKey && (destIndex === d.index || destIndex === d.index + 1);
  };
  const secDropIsNoop = (key, pos) => {
    const d = dragRef.current;
    if (!d || d.type !== "sec") return false;
    if (d.key === key) return true;
    const order = layout.map(s => s.key);
    const from = order.indexOf(d.key), target = order.indexOf(key);
    return (pos === "after" && target === from - 1) || (pos === "before" && target === from + 1);
  };

  // One drop zone per section. The section computes everything from pointer
  // position against its real rows, so dropping at the very top (index 0),
  // the bottom (index = count), or onto another section all work reliably.
  const rowHint = (secKey, index, count) => {
    if (!(hint && hint.kind === "q" && hint.secKey === secKey)) return "";
    if (qDropIsNoop(secKey, hint.index)) return "";
    if (hint.index === index) return " is-drop-before";
    if (index === count - 1 && hint.index >= count) return " is-drop-after";
    return "";
  };
  // React flushes the re-render (which dims the source) only after the browser
  // has already captured the drag image, so setting dragId synchronously is safe
  // — the drag snapshot is full-opacity, the on-page source then dims.
  const startQ = (secKey, index, id) => (e) => {
    dragRef.current = { type: "q", secKey, index };
    e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "q"); } catch (_) {}
    setDragId("q:" + id);
  };
  const startSec = (key) => (e) => {
    dragRef.current = { type: "sec", key };
    e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "sec"); } catch (_) {}
    setDragId("sec:" + key);
  };
  // One drop authority for the whole section list, so drops land reliably in
  // the gaps / empty space between sections too — not only on a section card.
  const listDnd = {
    onDragOver: e => {
      const d = dragRef.current; if (!d) return;
      e.preventDefault(); e.dataTransfer.dropEffect = "move";
      const els = [...e.currentTarget.querySelectorAll(".qsec")];
      if (d.type === "sec") {
        let key = null, pos = "after";
        for (const el of els) { const r = el.getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { key = el.dataset.key; pos = "before"; break; } }
        if (!key && els.length) { key = els[els.length - 1].dataset.key; pos = "after"; }
        if (key) setHint({ kind: "sec", key, pos });
      } else {
        let target = els.find(el => { const r = el.getBoundingClientRect(); return e.clientY >= r.top && e.clientY <= r.bottom; });
        if (!target) { let best = Infinity; for (const el of els) { const r = el.getBoundingClientRect(); const dist = e.clientY < r.top ? r.top - e.clientY : e.clientY - r.bottom; if (dist < best) { best = dist; target = el; } } }
        if (!target) return;
        const rows = [...target.querySelectorAll(".qrow")];
        let idx = rows.length;
        for (let i = 0; i < rows.length; i++) { const rr = rows[i].getBoundingClientRect(); if (e.clientY < rr.top + rr.height / 2) { idx = i; break; } }
        setHint({ kind: "q", secKey: target.dataset.key, index: idx });
      }
    },
    onDrop: e => {
      const d = dragRef.current; if (!d) { clearDrag(); return; }
      e.preventDefault();
      if (d.type === "sec") { if (hint && hint.kind === "sec") moveSection(d.key, hint.key, hint.pos); }
      else { if (hint && hint.kind === "q") moveQuestion(d, hint.secKey, hint.index); }
      clearDrag();
    },
  };
  const secHint = (key) => (hint && hint.kind === "sec" && hint.key === key && !secDropIsNoop(key, hint.pos))
    ? (hint.pos === "after" ? " is-drop-after" : " is-drop-before") : "";

  return (
    <div className="col" ref={rootRef}>
      <TopNav name={name} onRename={() => setRename({ kind: "survey", value: name })} />
      <div className="scroll-y" style={{ flex: 1, padding: "var(--spacing-super-loose) 0 110px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 var(--spacing-super-loose)" }}>
          <h1 className="text-l2" style={{ margin: "0 0 var(--spacing-loose)" }}>Questionnaire</h1>

          <div className="card" style={{ padding: "var(--spacing-loose)", display: "flex", alignItems: "center", gap: "var(--spacing-base)", marginBottom: "var(--spacing-extra-loose)" }}>
            <span style={{ width: 52, height: 52, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center",
              background: badge ? badge.bg : "var(--bg-secondary)", color: badge ? badge.fg : "var(--content-secondary)" }}>
              <Icon name={badge ? badge.icon : "edit"} size={26} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="text-l4">{name}</span>
                {customized && <Tag kind="theme-broken">Customized</Tag>}
              </div>
              <div style={{ marginTop: 3, fontSize: 14, color: "var(--content-secondary)" }}>
                {isTemplate ? (customized ? `Based on the ${templateName} template` : "Effectory template") : "Custom survey · built from scratch"} · {chosen.length} questions
              </div>
            </div>
            <button className="btn btn-secondary" onClick={onEditQuestions}><Icon name="edit" size={16} />Add questions</button>
          </div>

          <div className="qsec-list" {...listDnd}>
          {layout.filter(s => s.items.length).map(s => (
            <section key={s.key} data-key={s.key} data-flip-id={"sec:" + s.key}
              className={"qsec" + secHint(s.key) + (dragId === "sec:" + s.key ? " is-dragging" : "")}>
              <div className="qsec-head" draggable onDragStart={startSec(s.key)} onDragEnd={clearDrag}>
                <span className="qsec-grip" aria-hidden="true"><Icon name="drag-drop" size={18} /></span>
                <h2 className="qsec-title">{s.label}</h2>
                <div className="spacer" />
                <span className="qsec-count">{s.items.length} questions</span>
                <div className="qsec-menu-wrap">
                  <Tooltip label="Topic actions" pos="is-left"><button className="ib ib-36 ib-tertiary" aria-label="Topic actions" aria-haspopup="menu" aria-expanded={menuKey === s.key}
                    draggable={false} onDragStart={e => e.preventDefault()}
                    onClick={() => setMenuKey(k => k === s.key ? null : s.key)}><Icon name="more-vertical" size={16} /></button></Tooltip>
                  {menuKey === s.key && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onMouseDown={() => setMenuKey(null)} />
                      <div className="menu" role="menu" style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, width: 264, zIndex: 2 }}>
                        <div className="menu-item" role="menuitem" onClick={() => { setMenuKey(null); setRename({ kind: "topic", key: s.key, value: s.label }); }}>
                          <span className="menu-item-icon"><Icon name="edit" size={16} /></span>
                          <span className="menu-item-body"><span className="menu-item-title">Rename topic</span></span>
                        </div>
                        <div className="menu-item" role="menuitem" onClick={() => { setMenuKey(null); onRemoveTopic && onRemoveTopic(s.items.map(q => q.id)); }}>
                          <span className="menu-item-icon" style={{ color: "var(--content-negative-secondary)" }}><Icon name="trash" size={16} /></span>
                          <span className="menu-item-body"><span className="menu-item-title" style={{ color: "var(--content-negative-secondary)" }}>Remove topic from questionnaire</span></span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="qsec-body">
                {s.items.map((qq, i) => <BuilderRow key={qq.id} q={qq} sub={rowSubtext(qq, "library")}
                  onRemove={onRemoveQuestion} onEdit={onEditCustom} dragging={dragId === "q:" + qq.id}
                  hintClass={rowHint(s.key, i, s.items.length)} onDragStart={startQ(s.key, i, qq.id)} onDragEnd={clearDrag} />)}
              </div>
            </section>
          ))}
          </div>

          {chosen.length > 0 && (
            <div style={{ marginTop: "var(--spacing-extra-loose)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "var(--spacing-loose)", textAlign: "center" }}>
              <div className="text-l5" style={{ color: "var(--content-secondary)" }}>Want to add or remove questions?</div>
              <div className="text-medium text-subdued">Open the question editor to select questions or write your own.</div>
              <button className="btn btn-secondary" onClick={onEditQuestions}><Icon name="edit" size={16} />Add questions</button>
            </div>
          )}

          {chosen.length === 0 && (
            <div className="card" style={{ marginTop: "var(--spacing-loose)", border: "1px dashed var(--border-action)", boxShadow: "none",
              padding: "var(--spacing-super-extra-loose) var(--spacing-super-loose)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-loose)", textAlign: "center" }}>
              <span style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--bg-brand-subtle)", color: "var(--content-brand-base)", display: "grid", placeItems: "center" }}><Icon name="book-open" size={44} /></span>
              <div>
                <h2 className="text-l4" style={{ margin: 0 }}>Your questionnaire is empty</h2>
                <p className="text-large" style={{ margin: "10px auto 0", color: "var(--content-secondary)", maxWidth: 440 }}>
                  Pick from Effectory’s validated question library — grouped by topic — or write your own custom questions.</p>
              </div>
              <button className="btn btn-primary" onClick={onEditQuestions}><Icon name="plus" size={16} />Add questions</button>
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

      {rename && <RenameDialog
        title={rename.kind === "survey" ? "Rename survey" : "Rename topic"}
        label={rename.kind === "survey" ? "Survey name" : "Topic name"}
        value={rename.value} onCancel={() => setRename(null)}
        onSave={(v) => { if (rename.kind === "survey") { onRename && onRename(v); } else { setLayout(prev => prev.map(s => s.key === rename.key ? { ...s, label: v } : s)); } setRename(null); }} />}
    </div>
  );
}
