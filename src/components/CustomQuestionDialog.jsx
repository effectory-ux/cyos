// CustomQuestionDialog.jsx — "Create a custom question" dialog (Engage DS)
// Layout: Answer type + Add to topic selects on top; an editable preview card
// (question text · description · answer area) that mirrors what respondents see.
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { QTypeIcon, Tooltip } from "./shared.jsx";
import { QTYPES, TOPICS } from "../data/data.js";

// ---- compact DS select (sel-btn trigger + .menu popover) ----------------
function MiniSelect({ value, placeholder, items, onChange, ariaLabel, block }) {
  const [open, setOpen] = useState(false);
  const sel = items.find(it => it.value === value);
  return (
    <div className={"cq-menu-wrap" + (block ? " is-block" : "")}>
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

export function CustomQuestionDialog({ question, topics, onCancel, onAdd, onSubmit, onDelete }) {
  const editing = !!question;
  const submitFn = onSubmit || onAdd;
  // Only offer topics that actually exist in this survey; fall back to the
  // library topics if none were passed.
  const topicList = (topics && topics.length) ? topics : TOPICS;
  const [text, setText] = useState(question ? question.text : "");
  const [desc, setDesc] = useState(question && question.desc ? question.desc : "");
  const [type, setType] = useState(question ? question.type : "scale5");
  // A custom question always belongs to an existing topic — default to the first.
  const [topic, setTopic] = useState(question && question.topic ? question.topic : topicList[0]);
  const [attempted, setAttempted] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(true);

  const textErr = text.trim().length <= 2;
  const showTextErr = attempted && textErr;

  const submit = () => {
    setAttempted(true);
    if (textErr) return;
    submitFn({
      ...(question || {}),
      id: question ? question.id : "c" + Date.now(),
      topic, theme: question ? question.theme : null, bench: false, type, custom: true,
      text: text.trim(), desc: desc.trim() || undefined,
    });
  };

  // Multiple choice is no longer offered for custom questions.
  const typeItems = Object.entries(QTYPES).filter(([k, m]) => m.creatable && k !== "multiple").map(([k, m]) => ({
    value: k, label: m.label, lead: <QTypeIcon type={k} size={24} />,
  }));
  const topicItems = topicList.map(t => ({ value: t, label: t }));

  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 60 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-worksurface cq-dialog" role="dialog" aria-modal="true" aria-labelledby="cq-title"
        style={{ display: "flex", flexDirection: "column" }}>
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onCancel}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h2 className="dialog-title" id="cq-title">{editing ? "Edit custom question" : "Custom question"}</h2>
          <p className="dialog-subtitle">Write your own question and choose how people answer it. Use this for specific questions that are only valid for your context.</p>
        </div>

        <div className="dialog-body scroll-y" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-loose)" }}>
          {tipsOpen && (
            <div className="cq-gtk">
              <div className="cq-gtk-title">Good to know</div>
              <div className="cq-gtk-row">
                <span className="cq-gtk-ic"><Icon name="lightbulb" size={16} /></span>
                <span className="cq-gtk-txt">Avoid phrasing your questions negatively. Learn more about <a className="cq-tip-link" href="#" onClick={e => e.preventDefault()}>how to form a question<Icon name="external-link" size={14} /></a></span>
              </div>
              <div className="cq-gtk-row">
                <span className="cq-gtk-ic"><Icon name="language" size={16} /></span>
                <span className="cq-gtk-txt">Translations will be done automatically and can be reviewed later</span>
              </div>
              <div className="cq-gtk-row">
                <span className="cq-gtk-ic"><Icon name="barchart-2" size={16} /></span>
                <span className="cq-gtk-txt">No benchmark comparisons available for custom questions</span>
              </div>
              <button className="cq-gtk-close" aria-label="Dismiss" onClick={() => setTipsOpen(false)}><Icon name="cross" size={16} /></button>
            </div>
          )}

          <div className="cq-selects">
            <div className="cq-field">
              <span className="cq-lbl">Add to topic
                <span className="cq-info" title="Topics organise questions in your questionnaire. They don't affect benchmarks.">
                  <Icon name="info" size={16} /></span>
              </span>
              <MiniSelect ariaLabel="Add to topic" value={topic} items={topicItems} onChange={setTopic} block />
            </div>
            <div className="cq-field">
              <span className="cq-lbl">Answer type</span>
              <MiniSelect ariaLabel="Answer type" value={type} items={typeItems} onChange={setType} block />
            </div>
          </div>

          <div className="cq-panel">
            <textarea className={"cq-qfield" + (showTextErr ? " is-error" : "")} rows={1} autoFocus value={text}
              onChange={e => setText(e.target.value)} placeholder="Type question text" />
            {showTextErr && <div className="tf-err"><Icon name="alert-circle" size={14} />Write a question of at least a few words.</div>}
            <textarea className="cq-descfield" rows={1} value={desc}
              onChange={e => setDesc(e.target.value)} placeholder="Add description" />
            <div className="cq-answercard">
              {type === "text"
                ? <textarea className="ta" rows={4} disabled placeholder="Share your thoughts…"
                    style={{ background: "var(--bg-secondary)", resize: "none", minHeight: 96 }} />
                : <ScalePreview />}
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          {editing && onDelete && (
            <button className="btn btn-danger-tertiary" onClick={() => onDelete(question)}>
              <Icon name="trash" size={16} />Delete question</button>
          )}
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>
            {editing ? "Save changes" : "Create"}</button>
        </div>
      </div>
    </div>
  );
}
