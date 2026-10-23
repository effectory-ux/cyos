// QuestionGuidelines.jsx — what custom questions may (not) ask, for privacy
// (GDPR's special categories) and respect. Asked once, before the first custom
// question: one checkbox, recorded; from then on the custom question dialog
// keeps a one-line link to read them again.
//
// The prototype keeps the acknowledgement for this visit only — a reload asks
// again — so every test participant meets it. (The product would store who
// confirmed, when, and which version of the guidelines.)
import { useState, useEffect } from "react";
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";

let acked = false;
const subs = new Set();
export const setGuidelinesAck = (v) => { acked = v; subs.forEach(f => f(v)); };
export function useGuidelinesAck() {
  const [v, setV] = useState(acked);
  useEffect(() => { subs.add(setV); return () => { subs.delete(setV); }; }, []);
  return v;
}

const RULES = [
  "Don't ask about sensitive personal data, such as religion or beliefs, health, sexual orientation, ethnic origin, political opinions, or trade union membership.",
  "Don't ask for anything that identifies a person, like a name or an employee number.",
  "Keep the wording respectful and neutral.",
];

// `confirm`: the first time — a checkbox, and Start writing once it's ticked.
// Without it: the same guidelines to read again, from the dialog's link.
export function QuestionGuidelinesDialog({ confirm = false, onContinue, onClose }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: confirm ? 60 : 82 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog dialog-s bi-dialog" role="dialog" aria-modal="true" aria-labelledby="qg-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onClose}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm">
          <h3 className="dialog-title" id="qg-title">{confirm ? "Before you write a custom question" : "Custom question guidelines"}</h3>
        </div>
        <div className="bi-body">
          <p>Your organization is responsible for the questions it asks. To protect employees' privacy, every custom question must follow these guidelines:</p>
          <ul>{RULES.map(r => <li key={r}>{r}</li>)}</ul>
          <p>Need to cover a sensitive topic, like diversity and inclusion? Talk to your Effectory consultant first.</p>
        </div>
        {confirm && (
          <label className="cb-label-wrap qg-agree">
            <span className="cb-wrap"><input type="checkbox" className="cb" checked={agreed} onChange={e => setAgreed(e.target.checked)} /></span>
            <span className="text-medium">I'll make sure my custom questions follow these guidelines</span>
          </label>
        )}
        <div className="dialog-footer">
          <div className="spacer" />
          {confirm ? (
            <>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className={"btn btn-primary" + (agreed ? "" : " is-disabled")} disabled={!agreed}
                onClick={() => { setGuidelinesAck(true); onContinue && onContinue(); }}>Start writing</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>Got it</button>
          )}
        </div>
      </div>
    </div>
  );
}
