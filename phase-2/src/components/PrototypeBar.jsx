// PrototypeBar.jsx — the prototype's own toolbar, in the spirit of the Figma /
// Claude Design prototype chrome.
//
// This is TOOLING, not product UI: it deliberately avoids the Engage DS (dark,
// compact) and it is a real full-width row ABOVE the prototype rather than an
// overlay, so it never covers a screen. Hide it with the close button or
// Ctrl+` (a combination no browser claims); reveal it again from the tab in the
// very top-left corner, or the same shortcut.
import { useState, useEffect } from "react";
import { Icon } from "./Icon.jsx";
import { EDGE_CASES } from "../data/edgecases.js";

const START_KEY = "cyos.startAt";
export const getStartAt = () => { try { return localStorage.getItem(START_KEY) || "surveys"; } catch (_) { return "surveys"; } };
const setStartAt = (v) => { try { localStorage.setItem(START_KEY, v); } catch (_) {} };

const HIDE_KEY = "cyos.barHidden";
const getHidden = () => { try { return localStorage.getItem(HIDE_KEY) === "1"; } catch (_) { return false; } };
const saveHidden = (v) => { try { localStorage.setItem(HIDE_KEY, v ? "1" : "0"); } catch (_) {} };

export const START_POINTS = [
  { key: "surveys", label: "Surveys list" },
  { key: "template-dialog", label: "Choose a template" },
  { key: "builder", label: "Questionnaire (draft survey)" },
  { key: "builder-scratch", label: "Questionnaire (empty)" },
];

// States that are otherwise fiddly to reproduce by hand while presenting.
export const USE_CASES = [
  { key: "surveys", label: "Surveys list", desc: "The landing page" },
  { key: "template-dialog", label: "Choose a template", desc: "6 templates, search, start from scratch" },
  { key: "template-empty", label: "Template search: no results", desc: "Empty state with illustration" },
  { key: "name-dialog", label: "Let's get started", desc: "Name + project, from All surveys" },
  { key: "builder", label: "Questionnaire", desc: "A draft built from a template" },
  { key: "builder-scratch", label: "Questionnaire: empty", desc: "Nothing added yet" },
  { key: "select-questions", label: "Select questions", desc: "Library, custom, themes, templates" },
  { key: "question-settings", label: "Benchmarked question", desc: "Alternative wording + description" },
  { key: "question-edited", label: "Question with a variant", desc: "Alternative wording already applied" },
  { key: "topic-dialog", label: "Topic settings", desc: "Participant intro screen" },
  { key: "topic-custom", label: "Custom topic", desc: "A topic added in this survey" },
  { key: "translations", label: "Translations", desc: "Machine-translated strings to review" },
];

export function PrototypeBar({ onUseCase, edges = {}, onToggleEdge = () => {} }) {
  const [hidden, setHide] = useState(getHidden);
  const [menu, setMenu] = useState(null); // "cases" | "start" | "edges" | null
  const [start, setStart] = useState(getStartAt);
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
        setHide(v => { saveHidden(!v); return !v; });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const url = window.location.hash || "#/";
  const copy = () => {
    try { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch (_) {}
  };
  const pick = (key) => { setMenu(null); onUseCase(key); };
  const pickStart = (key) => { setStart(key); setStartAt(key); setMenu(null); };
  const offCount = EDGE_CASES.filter(e => edges[e.key] !== e.on).length;

  if (hidden) {
    return (
      <button className="pbar-peek" onClick={() => { setHide(false); saveHidden(false); }}
        title="Show prototype toolbar (Ctrl+`)">
        <Icon name="sliders" size={12} />Prototype
      </button>
    );
  }

  return (
    <div className="pbar">
      <span className="pbar-badge">Prototype</span>

      <div className="pbar-menu-wrap">
        <button className={"pbar-btn" + (menu === "cases" ? " is-open" : "")}
          onClick={() => setMenu(m => (m === "cases" ? null : "cases"))}>
          <Icon name="shapes" size={14} />Use cases<Icon name="chevron-down" size={14} />
        </button>
        {menu === "cases" && (
          <>
            <div className="pbar-scrim" onMouseDown={() => setMenu(null)} />
            <div className="pbar-menu">
              <div className="pbar-menu-head">Jump to a state</div>
              {USE_CASES.map(c => (
                <button key={c.key} className="pbar-item" onClick={() => pick(c.key)}>
                  <span className="pbar-item-label">{c.label}</span>
                  <span className="pbar-item-desc">{c.desc}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="pbar-menu-wrap">
        <button className={"pbar-btn" + (menu === "edges" ? " is-open" : "")}
          onClick={() => setMenu(m => (m === "edges" ? null : "edges"))}>
          <Icon name="randomize" size={14} />Edge cases
          {offCount > 0 && <span className="pbar-count">{offCount}</span>}
          <Icon name="chevron-down" size={14} />
        </button>
        {menu === "edges" && (
          <>
            <div className="pbar-scrim" onMouseDown={() => setMenu(null)} />
            <div className="pbar-menu">
              <div className="pbar-menu-head">Not every account is the same</div>
              <div className="pbar-menu-note">Flip these to show a use case both ways. They apply to the survey you have open.</div>
              {EDGE_CASES.map(c => (
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

      <div className="pbar-menu-wrap">
        <button className={"pbar-btn" + (menu === "start" ? " is-open" : "")}
          onClick={() => setMenu(m => (m === "start" ? null : "start"))}>
          <Icon name="home" size={14} />Start at<Icon name="chevron-down" size={14} />
        </button>
        {menu === "start" && (
          <>
            <div className="pbar-scrim" onMouseDown={() => setMenu(null)} />
            <div className="pbar-menu">
              <div className="pbar-menu-head">Where the prototype opens</div>
              {START_POINTS.map(s => (
                <button key={s.key} className={"pbar-item" + (start === s.key ? " is-on" : "")} onClick={() => pickStart(s.key)}>
                  <span className="pbar-item-label">{s.label}</span>
                  {start === s.key && <Icon name="check" size={14} />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <span className="pbar-sep" aria-hidden="true" />
      <code className="pbar-url" title={url}>{url}</code>
      <button className="pbar-icon" onClick={copy} title="Copy link to this step" aria-label="Copy link to this step">
        <Icon name={copied ? "check" : "copy"} size={14} />
      </button>
      <span className="pbar-hint">Ctrl+`</span>
      <button className="pbar-icon" onClick={() => { setHide(true); saveHidden(true); }}
        title="Hide toolbar (Ctrl+`)" aria-label="Hide toolbar">
        <Icon name="cross" size={14} />
      </button>
    </div>
  );
}
