// ChangeQuestionDialog.jsx — "Change benchmarked question" (Figma 6208:24348).
// Standard questions can only be swapped for an Effectory-approved alternative
// wording, so the benchmark stays valid. The original wording is offered as the
// first option, which is also how a variant is reverted.
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";

export function ChangeQuestionDialog({ original, current, variants, onCancel, onConfirm }) {
  const [choice, setChoice] = useState(current);
  const options = [original, ...variants.filter(v => v !== original)];
  const dirty = choice !== current;
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 80 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="cbq-title" style={{ width: 600 }}>
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onCancel}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h3 className="dialog-title" id="cbq-title">Change benchmarked question</h3>
          <p className="dialog-subtitle">Standard questions can only be replaced with one of the listed alternatives, so results stay comparable to the benchmark.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-tight)" }}>
          <span className="cbq-lbl">Current question</span>
          <div className="cbq-current">{current}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-tight)" }}>
          <span className="cbq-lbl">Choose an alternative question</span>
          {options.map(opt => {
            const on = choice === opt;
            return (
              <label key={opt} className={"radio-card" + (on ? " is-selected" : "")}>
                <input type="radio" name="cbq" className="radio-card-input" checked={on} onChange={() => setChoice(opt)} />
                <span className="radio-card-circle" aria-hidden="true" />
                <span className="radio-card-text">
                  {opt}
                  {opt === original && <span className="radio-card-hint">Original wording</span>}
                </span>
              </label>
            );
          })}
        </div>
        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={"btn btn-primary" + (dirty ? "" : " is-disabled")} disabled={!dirty}
            onClick={() => onConfirm(choice === original ? undefined : choice)}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
