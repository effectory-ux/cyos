// PrototypeBar.jsx — a prototype's own toolbar, in the spirit of the Figma /
// Claude Design prototype chrome.
//
// This folder (src/proto/) is deliberately self-contained so it can be lifted
// into another project or a skill as-is: the component, its stylesheet and its
// inlined icons live here, and everything project-specific (which use cases,
// edge cases and start points exist) comes in as props. See README.md.
//
// This is TOOLING, not product UI: it avoids the host app's design system
// (dark, compact) and it is a real full-width row ABOVE the prototype rather
// than an overlay, so it never covers a screen. Collapse it with the button on
// its right or Ctrl+` (a combination no browser claims); reveal it again from
// the vertical tab on the middle of the right screen edge, or the same
// shortcut. On narrow viewports the buttons drop their labels and rely on
// their tooltips.
import { useState, useEffect } from "react";
import { Ic } from "./icons.jsx";
import { initCopyEdits, enableEdit, disableEdit, discardEdits, editCount } from "./copyEdit.js";
import "./prototype-bar.css";

// Per-project localStorage keys, so two prototypes on one origin don't share
// their toolbar state. The host passes the same prefix it uses at boot.
const startKey = (prefix) => prefix + ".startAt";
const hideKey = (prefix) => prefix + ".barHidden";
export const getStartAt = (prefix, fallback) => {
  try { return localStorage.getItem(startKey(prefix)) || fallback; } catch (_) { return fallback; }
};
const setStartAt = (prefix, v) => { try { localStorage.setItem(startKey(prefix), v); } catch (_) {} };
const getHidden = (prefix) => { try { return localStorage.getItem(hideKey(prefix)) === "1"; } catch (_) { return false; } };
const saveHidden = (prefix, v) => { try { localStorage.setItem(hideKey(prefix), v ? "1" : "0"); } catch (_) {} };

// Props:
//   useCases    [{key, label, desc}]   — states to jump to (onUseCase(key))
//   edgeCases   [{key, label, desc, on}] — toggles (edges map + onToggleEdge(key))
//   startPoints [{key, label}]         — where the prototype opens next time
//   storagePrefix                      — localStorage namespace, e.g. "cyos"
export function PrototypeBar({ useCases = [], edgeCases = [], startPoints = [],
  edges = {}, onUseCase = () => {}, onToggleEdge = () => {}, storagePrefix = "proto" }) {
  const [hidden, setHide] = useState(() => getHidden(storagePrefix));
  const [menu, setMenu] = useState(null); // "cases" | "start" | "edges" | null
  const [start, setStart] = useState(() => getStartAt(storagePrefix, startPoints[0] && startPoints[0].key));
  const [copied, setCopied] = useState(false);
  // Inline copy editing (copyEdit.js): available only while the dev server
  // runs — the deployed prototype still APPLIES saved edits, read-only.
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveState, setSaveState] = useState("clean"); // clean | saving | saved | error
  useEffect(() => { initCopyEdits(setSaveState).then(setCanEdit); }, []);
  const toggleEdit = () => {
    if (editing) { disableEdit(); setEditing(false); }
    else { enableEdit(); setEditing(true); }
  };
  const discard = () => {
    if (window.confirm("Discard all copy edits and restore the original wording?")) discardEdits();
  };

  // Ctrl+` toggles the bar — no browser binds it, and it can't collide with
  // typing because we ignore the shortcut while a field has focus.
  useEffect(() => {
    const h = (e) => {
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing) return;
      if (e.ctrlKey && (e.key === "`" || e.code === "Backquote")) {
        e.preventDefault();
        setHide(v => { saveHidden(storagePrefix, !v); return !v; });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [storagePrefix]);

  const url = window.location.hash || "#/";
  const copy = () => {
    try { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch (_) {}
  };
  const pick = (key) => { setMenu(null); onUseCase(key); };
  const pickStart = (key) => { setStart(key); setStartAt(storagePrefix, key); setMenu(null); };
  const offCount = edgeCases.filter(e => edges[e.key] !== e.on).length;

  if (hidden) {
    return (
      <button className="pbar-peek" onClick={() => { setHide(false); saveHidden(storagePrefix, false); }}
        title="Show prototype toolbar (Ctrl+`)">
        <Ic name="sliders" size={12} />
        <span className="pbar-peek-lbl">Prototype</span>
      </button>
    );
  }

  return (
    <div className="pbar">
      <span className="pbar-badge">Prototype</span>

      {useCases.length > 0 && (
        <div className="pbar-menu-wrap">
          <button className={"pbar-btn" + (menu === "cases" ? " is-open" : "")} data-tip="Use cases"
            onClick={() => setMenu(m => (m === "cases" ? null : "cases"))}>
            <Ic name="shapes" size={14} /><span className="pbar-lbl">Use cases</span><span className="pbar-chev"><Ic name="chevron-down" size={14} /></span>
          </button>
          {menu === "cases" && (
            <>
              <div className="pbar-scrim" onMouseDown={() => setMenu(null)} />
              <div className="pbar-menu">
                <div className="pbar-menu-head">Jump to a state</div>
                {useCases.map(c => (
                  <button key={c.key} className="pbar-item" onClick={() => pick(c.key)}>
                    <span className="pbar-item-label">{c.label}</span>
                    <span className="pbar-item-desc">{c.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {edgeCases.length > 0 && (
        <div className="pbar-menu-wrap">
          <button className={"pbar-btn" + (menu === "edges" ? " is-open" : "")} data-tip="Edge cases"
            onClick={() => setMenu(m => (m === "edges" ? null : "edges"))}>
            <Ic name="randomize" size={14} /><span className="pbar-lbl">Edge cases</span>
            {offCount > 0 && <span className="pbar-count">{offCount}</span>}
            <span className="pbar-chev"><Ic name="chevron-down" size={14} /></span>
          </button>
          {menu === "edges" && (
            <>
              <div className="pbar-scrim" onMouseDown={() => setMenu(null)} />
              <div className="pbar-menu">
                <div className="pbar-menu-head">Not every account is the same</div>
                <div className="pbar-menu-note">Flip these to show a use case both ways. They apply to the survey you have open.</div>
                {edgeCases.map(c => (
                  <button key={c.key} className={"pbar-item" + (edges[c.key] ? " is-on" : "")}
                    role="switch" aria-checked={!!edges[c.key]} onClick={() => onToggleEdge(c.key)}>
                    <span className="pbar-item-label">{c.label}</span>
                    <span className="pbar-switch" aria-hidden="true" />
                    <span className="pbar-item-desc">{c.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {startPoints.length > 0 && (
        <div className="pbar-menu-wrap">
          <button className={"pbar-btn" + (menu === "start" ? " is-open" : "")} data-tip="Start at"
            onClick={() => setMenu(m => (m === "start" ? null : "start"))}>
            <Ic name="home" size={14} /><span className="pbar-lbl">Start at</span><span className="pbar-chev"><Ic name="chevron-down" size={14} /></span>
          </button>
          {menu === "start" && (
            <>
              <div className="pbar-scrim" onMouseDown={() => setMenu(null)} />
              <div className="pbar-menu">
                <div className="pbar-menu-head">Where the prototype opens</div>
                {startPoints.map(s => (
                  <button key={s.key} className={"pbar-item" + (start === s.key ? " is-on" : "")} onClick={() => pickStart(s.key)}>
                    <span className="pbar-item-label">{s.label}</span>
                    {start === s.key && <Ic name="check" size={14} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {canEdit && (
        <>
          <button className={"pbar-btn" + (editing ? " is-editing" : "")} data-tip={editing ? "Save and stop editing" : "Edit texts inline"}
            onClick={toggleEdit}>
            <Ic name={editing ? "check" : "edit"} size={14} />
            <span className="pbar-lbl">{editing ? "Save" : "Edit"}</span>
          </button>
          {editing && (
            <span className={"pbar-save is-" + saveState}>
              {saveState === "saving" ? "Saving…" : saveState === "error" ? "Not saved" : editCount() > 0 ? "Saved" : "Click any text"}
            </span>
          )}
          {editing && editCount() > 0 && (
            <button className="pbar-icon pbar-tt" onClick={discard} data-tip="Discard all edits" aria-label="Discard all edits">
              <Ic name="undo" size={14} />
            </button>
          )}
        </>
      )}

      <span className="pbar-sep" aria-hidden="true" />
      <code className="pbar-url" title={url}>{url}</code>
      <button className="pbar-icon pbar-tt is-right" onClick={copy}
        data-tip={copied ? "Copied" : "Copy link to this step"} aria-label="Copy link to this step">
        <Ic name={copied ? "check" : "copy"} size={14} />
      </button>
      <span className="pbar-hint">Ctrl+`</span>
      <button className="pbar-icon pbar-tt is-right"
        onClick={() => { if (editing) { disableEdit(); setEditing(false); } setHide(true); saveHidden(storagePrefix, true); }}
        data-tip="Collapse toolbar (Ctrl+`)" aria-label="Collapse toolbar">
        <Ic name="collapse-left" size={14} />
      </button>
    </div>
  );
}
