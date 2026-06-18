// CustomQuestionDialog.jsx — "Create a custom question" dialog (Engage DS)
// Layout: Answer type + Add to topic selects on top; an editable preview card
// (question text · description · answer area) that mirrors what respondents see.
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { QTypeIcon, Tooltip } from "./shared.jsx";
import { QTYPES, TOPICS, DEFAULT_MC } from "../data/data.js";

// ---- compact DS select (sel-btn trigger + .menu popover) ----------------
function MiniSelect({ value, placeholder, items, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const sel = items.find(it => it.value === value);
  return (
    <div className="cq-menu-wrap">
      <button type="button" className={"sel-btn cq-sel" + (open ? " is-pressed" : "")}
        aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {sel && sel.lead}
          <span className={sel ? "sel-btn-name" : "cq-sel-placeholder"}
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sel ? sel.label : placeholder}
          </span>
        </span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <>
          <div className="cq-menu-scrim" onMouseDown={() => setOpen(false)} />
          <div className="menu cq-menu-pop" role="listbox">
            {items.map(it => (
              <div key={String(it.value)} role="option" aria-selected={it.value === value}
                className={"menu-item" + (it.value === value ? " is-selected" : "")}
                onClick={() => { onChange(it.value); setOpen(false); }}>
                {it.lead}
                <span className="menu-item-body"><span className="menu-item-title">{it.label}</span></span>
                {it.value === value && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---- 5-point scale preview (DS distribution colors) ---------------------
const SCALE_DOTS = [
  "var(--bg-distribution-strongly-disagree)",
  "var(--bg-distribution-disagree)",
  "var(--bg-distribution-neither-agree-disagree)",
  "var(--bg-distribution-agree)",
  "var(--bg-distribution-strongly-agree)",
];
function ScalePreview() {
  return (
    <div className="cq-scale">
      <div className="cq-scale-row">
        <span className="cq-scale-end">Strongly disagree</span>
        <div className="cq-dots">
          {SCALE_DOTS.map((c, i) => <span key={i} className="cq-dot" style={{ "--dot": c }} />)}
        </div>
        <span className="cq-scale-end">Strongly agree</span>
      </div>
      <span className="cq-idk">I don’t know</span>
    </div>
  );
}

// ---- multiple-choice option editor --------------------------------------
function OptionList({ opts, setOpt, addOpt, delOpt, invalid }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {opts.map((o, i) => (
        <div key={i} className="cq-opt-row">
          <span className="cq-drag" aria-hidden="true"><Icon name="drag-drop" size={16} /></span>
          <input className={"tf" + (invalid && !o.trim() ? " is-error" : "")} type="text" value={o} placeholder={"Option " + (i + 1)}
            onChange={e => setOpt(i, e.target.value)} />
          <Tooltip label="Remove option" pos="is-left"><button className={"ib ib-36 ib-tertiary" + (opts.length <= 2 ? " is-disabled" : "")}
            aria-label="Remove option" disabled={opts.length <= 2} onClick={() => delOpt(i)}>
            <Icon name="trash" size={16} /></button></Tooltip>
        </div>
      ))}
      <button className="btn btn-link" style={{ alignSelf: "center", padding: "4px 6px" }} onClick={addOpt}>
        <Icon name="plus" size={16} />Add option</button>
    </div>
  );
}

export function CustomQuestionDialog({ question, onCancel, onAdd, onSubmit, onDelete }) {
  const editing = !!question;
  const submitFn = onSubmit || onAdd;
  const [text, setText] = useState(question ? question.text : "");
  const [desc, setDesc] = useState(question && question.desc ? question.desc : "");
  const [type, setType] = useState(question ? question.type : "scale5");
  // A custom question always belongs to an existing topic — default to the first.
  const [topic, setTopic] = useState(question && question.topic ? question.topic : TOPICS[0]);
  const [opts, setOpts] = useState(question && question.options ? [...question.options] : [...DEFAULT_MC]);
  const [attempted, setAttempted] = useState(false);

  const setOpt = (i, v) => setOpts(o => o.map((x, j) => j === i ? v : x));
  const addOpt = () => setOpts(o => [...o, ""]);
  const delOpt = (i) => setOpts(o => o.filter((_, j) => j !== i));

  const textErr = text.trim().length <= 2;
  const optsErr = type === "multiple" && opts.filter(o => o.trim()).length < 2;
  const showTextErr = attempted && textErr;
  const showOptsErr = attempted && optsErr;

  const submit = () => {
    setAttempted(true);
    if (textErr || optsErr) return;
    submitFn({
      ...(question || {}),
      id: question ? question.id : "c" + Date.now(),
      topic, theme: question ? question.theme : null, bench: false, type, custom: true,
      text: text.trim(), desc: desc.trim() || undefined,
      options: type === "multiple" ? opts.filter(o => o.trim()) : undefined,
    });
  };

  const typeItems = Object.entries(QTYPES).filter(([, m]) => m.creatable).map(([k, m]) => ({
    value: k, label: m.label, lead: <QTypeIcon type={k} size={24} />,
  }));
  const topicItems = TOPICS.map(t => ({ value: t, label: t }));

  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 60 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-worksurface cq-dialog" role="dialog" aria-modal="true" aria-labelledby="cq-title"
        style={{ display: "flex", flexDirection: "column" }}>
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onCancel}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h2 className="dialog-title" id="cq-title">{editing ? "Edit custom question" : "Create a custom question"}</h2>
          <p className="dialog-subtitle">Write your own question and choose how people answer it.</p>
        </div>

        <div className="dialog-body scroll-y" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-loose)" }}>
          <div className="cq-grid">
            <div>
              <span className="cq-lbl">Answer type</span>
              <MiniSelect ariaLabel="Answer type" value={type} items={typeItems} onChange={setType} />
            </div>
            <div>
              <span className="cq-lbl">Add to topic
                <span className="cq-info" title="Topics organise questions in your questionnaire. They don't affect benchmarks.">
                  <Icon name="info" size={16} /></span>
              </span>
              <MiniSelect ariaLabel="Add to topic" value={topic} items={topicItems} onChange={setTopic} />
            </div>
          </div>

          <div className="cq-preview">
            <textarea className={"cq-qfield" + (showTextErr ? " is-error" : "")} rows={1} autoFocus value={text}
              onChange={e => setText(e.target.value)} placeholder="Type question text" />
            {showTextErr && <div className="tf-err"><Icon name="alert-circle" size={14} />Write a question of at least a few words.</div>}
            <textarea className="cq-descfield" rows={1} value={desc}
              onChange={e => setDesc(e.target.value)} placeholder="Add description" />
            <div className="cq-answercard">
              {type === "multiple"
                ? <OptionList opts={opts} setOpt={setOpt} addOpt={addOpt} delOpt={delOpt} invalid={showOptsErr} />
                : type === "text"
                  ? <textarea className="ta" rows={4} disabled placeholder="Share your thoughts…"
                      style={{ background: "var(--bg-secondary)", resize: "none", minHeight: 96 }} />
                  : <ScalePreview />}
            </div>
            {showOptsErr && <div className="tf-err"><Icon name="alert-circle" size={14} />Add at least two answer options.</div>}
          </div>
        </div>

        <div className="dialog-footer">
          {editing && onDelete && (
            <button className="btn btn-danger-tertiary" onClick={() => onDelete(question)}>
              <Icon name="trash" size={16} />Delete question</button>
          )}
          <div className="spacer" />
          <button className="btn btn-tertiary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>
            {editing ? "Save changes" : <><Icon name="plus" size={16} />Create question</>}</button>
        </div>
      </div>
    </div>
  );
}
