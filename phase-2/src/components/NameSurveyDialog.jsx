// NameSurveyDialog.jsx — naming step shown after a template is chosen (or
// "Start from scratch"), before the builder opens. Engage DS dialog + text field.
import { useState, useRef, useEffect } from "react";
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";

export function NameSurveyDialog({ suggested, isTemplate, templateName, changing, onBack, onConfirm }) {
  const [name, setName] = useState(suggested || "");
  const [attempted, setAttempted] = useState(false);
  const ref = useRef(null);

  // Focus the field and pre-select the suggested name so it can be typed over.
  useEffect(() => { const el = ref.current; if (el) { el.focus(); el.select(); } }, []);

  const empty = name.trim().length === 0;
  const showErr = attempted && empty;

  const confirm = () => {
    setAttempted(true);
    if (empty) { ref.current && ref.current.focus(); return; }
    onConfirm(name.trim());
  };

  const subtitle = isTemplate
    ? <>Based on the <b>{templateName}</b> template. You can rename it later.</>
    : <>Start with a blank questionnaire. You can rename it later.</>;

  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onBack(); }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="ns-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onBack}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h3 className="dialog-title" id="ns-title">Name your survey</h3>
          <p className="dialog-subtitle">{subtitle}</p>
        </div>
        <div className="dialog-body">
          {changing && (
            <div className="inline-notif is-warn" style={{ marginBottom: "var(--spacing-base)" }}>
              <img className="inline-notif-icon" alt="" width="24" height="24" src="assets/icons/notification-warning.svg" />
              <div className="inline-notif-content">
                <div className="inline-notif-text">
                  <span className="inline-notif-title">This resets your questionnaire</span>
                  <span className="inline-notif-msg">Confirming replaces the questions you've added so far.</span>
                </div>
              </div>
            </div>
          )}
          <div className="tf-wrap">
            <label className="tf-lbl" htmlFor="ns-input">Survey name <span className="tf-required">*</span></label>
            <div className="tf-field">
              <input id="ns-input" ref={ref} type="text" className={"tf" + (showErr ? " is-error" : "")}
                value={name} placeholder="e.g. Employee Engagement 2026"
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirm(); }} />
            </div>
            {showErr && <span className="tf-err"><Icon name="alert-circle" size={14} />Enter a name for your survey.</span>}
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onBack}><Icon name="arrow-left" size={16} />Back</button>
          <div className="spacer" />
          <button className="btn btn-primary" onClick={confirm}>{changing ? "Confirm" : "Create survey"}<Icon name="arrow-right" size={16} /></button>
        </div>
      </div>
    </div>
  );
}
