// NameSurveyDialog.jsx — "Let's get started", the last step before the builder.
// Follows the design-system reference prototype `create-survey-dialog` (dialog 3)
// exactly: a 600px .dialog-s with a small header, the DS Text Field for the name
// (3–35 characters) and the DS Select for the project.
//
// The project field is CONDITIONAL, which is the important rule: started from
// All surveys the survey has no home yet, so it must be assigned to a project;
// started from inside a project that answer is already known and the field is
// left out entirely. "Create survey" stays disabled until the name is valid and
// — in the All surveys context — a project is picked. The name only turns red on
// blur, never while typing.
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";
import { PROJECTS } from "../data/data.js";

const MIN = 3, MAX = 35;

export function NameSurveyDialog({ suggested, isTemplate, templateName, changing, needsProject = true, project, onBack, onConfirm }) {
  const [name, setName] = useState(suggested || "");
  const [proj, setProj] = useState(project || "");
  const [touched, setTouched] = useState(false); // name blurred at least once
  const [open, setOpen] = useState(false);       // project menu
  // .dialog has overflow:hidden for its rounded corners, so the select's menu
  // is rendered in a FIXED layer placed under the trigger (the DS rule for any
  // popover inside a dialog/scroll container — see the reference's gotchas).
  const [menuAt, setMenuAt] = useState(null);
  const ref = useRef(null);
  const sltRef = useRef(null);
  const openMenu = () => {
    const el = sltRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuAt({ left: r.left, top: r.bottom + 4, width: r.width });
    setOpen(true);
  };
  const toggleMenu = () => (open ? setOpen(false) : openMenu());
  useEffect(() => {
    if (!open) return;
    const reposition = () => { const el = sltRef.current; if (!el) return; const r = el.getBoundingClientRect();
      setMenuAt({ left: r.left, top: r.bottom + 4, width: r.width }); };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => { window.removeEventListener("scroll", reposition, true); window.removeEventListener("resize", reposition); };
  }, [open]);

  // Focus the field and pre-select the suggested name so it can be typed over.
  useEffect(() => { const el = ref.current; if (el) { el.focus(); el.select(); } }, []);

  const trimmed = name.trim();
  const nameOk = trimmed.length >= MIN && trimmed.length <= MAX;
  const projOk = !needsProject || !!proj;
  const valid = nameOk && projOk;
  const showErr = touched && !nameOk;

  const confirm = () => { if (valid) onConfirm(trimmed, needsProject ? proj : project); };

  const subtitle = isTemplate
    ? <>Based on the <b>{templateName}</b> template. You can rename it later.</>
    : <>Start with a blank questionnaire. You can rename it later.</>;

  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onBack(); }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="ns-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onBack}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm has-close">
          <h3 className="dialog-title" id="ns-title">Let's get started</h3>
          <p className="dialog-subtitle">{subtitle}</p>
        </div>
        <div className="dialog-body ns-body">
          {changing && (
            <div className="inline-notif is-warn">
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
                value={name} placeholder="Enter a survey name" maxLength={MAX}
                aria-describedby="ns-help"
                onChange={e => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                onKeyDown={e => { if (e.key === "Enter") confirm(); }} />
            </div>
            {showErr
              ? <span className="tf-err"><Icon name="alert-circle" size={14} />Use at least {MIN} characters.</span>
              : <span className="tf-help" id="ns-help">At least {MIN} and at most {MAX} characters</span>}
          </div>

          {needsProject && (
            <div className="slt-wrap">
              <label className="slt-lbl" htmlFor="ns-proj">What project does it belong to? <span className="tf-required">*</span></label>
              <div ref={sltRef} id="ns-proj" className={"slt" + (open ? " is-focus" : "")} tabIndex={0}
                role="combobox" aria-expanded={open} aria-haspopup="listbox" aria-controls="ns-proj-menu"
                onClick={toggleMenu}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleMenu(); } }}>
                <span className="slt-left">
                  {proj ? <span className="slt-val">{proj}</span> : <span className="slt-ph">Select a project</span>}
                </span>
                <Icon name="chevron-down" size={16} />
              </div>
              {open && menuAt && createPortal(
                <>
                  <div className="ns-menu-scrim" onMouseDown={() => setOpen(false)} />
                  <div className="menu ns-proj-menu" id="ns-proj-menu" role="listbox"
                    style={{ left: menuAt.left, top: menuAt.top, width: menuAt.width }}>
                    {PROJECTS.map(pr => (
                      <div key={pr} role="option" aria-selected={pr === proj}
                        className={"menu-item" + (pr === proj ? " is-selected" : "")}
                        onClick={() => { setProj(pr); setOpen(false); }}>
                        <span className="menu-item-body"><span className="menu-item-title">{pr}</span></span>
                        {pr === proj && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
                      </div>
                    ))}
                  </div>
                </>, document.body)}
              <span className="tf-help">Your new survey will be added to this project and use its settings</span>
            </div>
          )}
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onBack}><Icon name="arrow-left" size={16} />Go back</button>
          <div className="spacer" />
          <button className={"btn btn-primary" + (valid ? "" : " is-disabled")} disabled={!valid} onClick={confirm}>
            {changing ? "Confirm" : "Create survey"}<Icon name="arrow-right" size={16} /></button>
        </div>
      </div>
    </div>
  );
}
