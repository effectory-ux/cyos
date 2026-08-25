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
// than an overlay, so it never covers a screen. Hide it with the close button
// or Ctrl+` (a combination no browser claims); reveal it again from the tab in
// the very top-left corner, or the same shortcut.
import { useState, useEffect } from "react";
import { Ic } from "./icons.jsx";
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
        <Ic name="sliders" size={12} />Prototype
      </button>
    );
  }

  return (
    <div className="pbar">
      <span className="pbar-badge">Prototype</span>

      {useCases.length > 0 && (
        <div className="pbar-menu-wrap">
          <button className={"pbar-btn" + (menu === "cases" ? " is-open" : "")}
            onClick={() => setMenu(m => (m === "cases" ? null : "cases"))}>
            <Ic name="shapes" size={14} />Use cases<Ic name="chevron-down" size={14} />
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
          <button className={"pbar-btn" + (menu === "edges" ? " is-open" : "")}
            onClick={() => setMenu(m => (m === "edges" ? null : "edges"))}>
            <Ic name="randomize" size={14} />Edge cases
            {offCount > 0 && <span className="pbar-count">{offCount}</span>}
            <Ic name="chevron-down" size={14} />
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
          <button className={"pbar-btn" + (menu === "start" ? " is-open" : "")}
            onClick={() => setMenu(m => (m === "start" ? null : "start"))}>
            <Ic name="home" size={14} />Start at<Ic name="chevron-down" size={14} />
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

      <span className="pbar-sep" aria-hidden="true" />
      <code className="pbar-url" title={url}>{url}</code>
      <button className="pbar-icon" onClick={copy} title="Copy link to this step" aria-label="Copy link to this step">
        <Ic name={copied ? "check" : "copy"} size={14} />
      </button>
      <span className="pbar-hint">Ctrl+`</span>
      <button className="pbar-icon" onClick={() => { setHide(true); saveHidden(storagePrefix, true); }}
        title="Hide toolbar (Ctrl+`)" aria-label="Hide toolbar">
        <Ic name="cross" size={14} />
      </button>
    </div>
  );
}
