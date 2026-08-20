// PrototypeBar.jsx — the prototype's own toolbar, in the spirit of the Figma /
// Claude Design prototype chrome: a floating bar for jumping to a use case,
// setting the starting point, and reading the current URL.
//
// This is TOOLING, not product UI. It deliberately does not use the Engage DS —
// it's dark, compact and floats above the app so nobody mistakes it for a
// screen. Collapse it (or press ⌥/Alt+P) to review the prototype clean.
import { useState, useEffect } from "react";
import { Icon } from "./Icon.jsx";

const START_KEY = "cyos.startAt";
export const getStartAt = () => { try { return localStorage.getItem(START_KEY) || "surveys"; } catch (_) { return "surveys"; } };
const setStartAt = (v) => { try { localStorage.setItem(START_KEY, v); } catch (_) {} };

const HIDE_KEY = "cyos.barHidden";
const getHidden = () => { try { return localStorage.getItem(HIDE_KEY) === "1"; } catch (_) { return false; } };
const setHidden = (v) => { try { localStorage.setItem(HIDE_KEY, v ? "1" : "0"); } catch (_) {} };

// Where the prototype can open. Keys are stable so they can be stored.
export const START_POINTS = [
  { key: "surveys", label: "Surveys list" },
  { key: "template-dialog", label: "Choose a template" },
  { key: "builder", label: "Questionnaire (draft survey)" },
  { key: "builder-scratch", label: "Questionnaire (empty)" },
];

// Use cases worth being able to reach in one click — the states that are
// otherwise fiddly to reproduce by hand when showing the prototype.
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

export function PrototypeBar({ route, onUseCase }) {
  const [hidden, setHide] = useState(getHidden);
  const [menu, setMenu] = useState(null); // "cases" | "start" | null
  const [start, setStart] = useState(getStartAt);
  const [copied, setCopied] = useState(false);

  // ⌥/Alt+P toggles the bar, so a screenshot can be taken without it.
  useEffect(() => {
    const h = (e) => {
      if ((e.altKey || e.metaKey) && (e.key === "p" || e.key === "π")) {
        e.preventDefault(); setHide(v => { setHidden(!v); return !v; });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const url = window.location.hash || "#/";
  const copy = () => {
    const full = window.location.href;
    try { navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch (_) {}
  };
  const pick = (key) => { setMenu(null); onUseCase(key); };
  const pickStart = (key) => { setStart(key); setStartAt(key); setMenu(null); };

  if (hidden) {
    return (
      <button className="pbar-peek" onClick={() => { setHide(false); setHidden(false); }} title="Show prototype toolbar (⌥P)">
        <Icon name="sliders" size={14} />
      </button>
    );
  }

  return (
    <div className="pbar" onMouseDown={e => e.stopPropagation()}>
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
      <button className="pbar-icon" onClick={() => { setHide(true); setHidden(true); }}
        title="Hide toolbar (⌥P)" aria-label="Hide toolbar">
        <Icon name="cross" size={14} />
      </button>
    </div>
  );
}
