// BenchmarkQuestionDialog.jsx — "Benchmarked question" (Figma 6271:7232).
// The one dialog for standard questions, using the custom-question-dialog
// format: selects on top, a respondent-style preview card in the middle, and a
// language list on the right. Locked things LOOK locked (Answer type is a
// disabled select); constrained edits LOOK like choices — the question text and
// description in the preview are selects whose dropdowns list the
// Effectory-approved alternatives (Figma 6271:9052). Everything is staged and
// committed with Save; all changes are survey-scoped.
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { QTypeIcon, Tooltip } from "./shared.jsx";
import { QTYPES, SCALE_LABELS } from "../data/data.js";
import { LANGUAGES, flagSrc, autoTranslation } from "../data/i18n.js";
import { variantsOf, descVariantsOf } from "../data/variants.js";

const SCALE_DOTS = [
  "var(--bg-distribution-strongly-disagree)",
  "var(--bg-distribution-disagree)",
  "var(--bg-distribution-neither)",
  "var(--bg-distribution-agree)",
  "var(--bg-distribution-strongly-agree)",
];

// A select rendered inside the preview card: looks like the content it holds,
// plus a chevron that reveals the approved alternatives. `explain` renders the
// dropdown's explanation header; option `value` of undefined = "no selection"
// (used for removing the description).
function PreviewSelect({ value, display, options, explain, big, placeholder, disabled, footer, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"bmq-sel-wrap" + (big ? " is-big" : "")}>
      <button type="button" className={"bmq-sel" + (open ? " is-open" : "") + (disabled ? " is-disabled" : "")}
        aria-haspopup="listbox" aria-expanded={open} disabled={disabled}
        onClick={() => setOpen(o => !o)}>
        <span className={"bmq-sel-text" + (display ? "" : " is-placeholder")}>{display || placeholder}</span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <>
          <div className="cq-menu-scrim" onMouseDown={() => setOpen(false)} />
          <div className="bmq-dropdown" role="listbox">
            {explain && (
              <div className="bmq-dd-explain">
                <div className="bmq-dd-explain-title">{explain.title}</div>
                <div>{explain.body}</div>
              </div>
            )}
            {options.map((opt, i) => {
              const on = (opt.value ?? undefined) === (value ?? undefined);
              return (
                <div key={i} role="option" aria-selected={on}
                  className={"bmq-dd-opt" + (on ? " is-selected" : "") + (opt.muted ? " is-muted" : "")}
                  onClick={() => { onChange(opt.value); setOpen(false); }}>
                  <span className="bmq-dd-opt-text">{opt.label}</span>
                  {on && <Icon name="check" size={16} />}
                </div>
              );
            })}
            {footer && <div className="bmq-dd-foot">{footer}</div>}
          </div>
        </>
      )}
    </div>
  );
}

// Leaving the approved wordings behind is a real consequence: the question
// stops being the benchmarked standard one and becomes your own custom
// question. Say so once, plainly, and let people opt out of the reminder.
const SKIP_KEY = "cyos.skipDetachWarn";
const skipDetachWarn = () => { try { return localStorage.getItem(SKIP_KEY) === "1"; } catch (_) { return false; } };

function DetachWarning({ onCancel, onConfirm }) {
  const [dontShow, setDontShow] = useState(false);
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 82 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="dw-title">
        <div className="dialog-header is-sm">
          <div className="dialog-header-top">
            <Icon name="alert-triangle" size={20} className="dialog-header-icon is-warning" />
            <h3 className="dialog-title" id="dw-title">Write your own wording?</h3>
          </div>
          <p className="dialog-subtitle">
            This question becomes <b>your own custom question</b>. You can word it however you like, but it
            <b> loses its benchmark</b> — results can no longer be compared with other organizations, and it
            leaves the standard question set.
          </p>
        </div>
        <label className="cb-label-wrap" style={{ display: "flex", alignItems: "center", gap: "var(--spacing-tight)", cursor: "pointer" }}>
          <span className="cb-wrap"><input type="checkbox" className="cb" checked={dontShow} onChange={e => setDontShow(e.target.checked)} /></span>
          <span className="text-medium">Don't show this again</span>
        </label>
        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(dontShow)}>Write my own wording</button>
        </div>
      </div>
    </div>
  );
}

export function BenchmarkQuestionDialog({ q, meta = {}, topicKey, topicOptions = [], onCancel, onSave, onDetach }) {
  // Staged edits — committed on Save only.
  const [variant, setVariant] = useState(meta.variant);
  const [desc, setDesc] = useState(meta.desc);
  const [topic, setTopic] = useState(topicKey || q.topic);
  const [lang, setLang] = useState("en");
  const [topicOpen, setTopicOpen] = useState(false);
  const [detachAsk, setDetachAsk] = useState(false);
  const detach = () => { if (skipDetachWarn()) doDetach(false); else setDetachAsk(true); };
  const doDetach = (remember) => {
    if (remember) { try { localStorage.setItem(SKIP_KEY, "1"); } catch (_) {} }
    setDetachAsk(false);
    onDetach && onDetach({ text: wording, topic });
  };

  const wording = variant || q.text;
  const variants = variantsOf(q.text);
  const descOptions = descVariantsOf(q.text);
  const primary = lang === "en";
  const t = (text) => (primary || !text ? text : autoTranslation(text, lang));

  const dirty = (variant || undefined) !== (meta.variant || undefined)
    || (desc || undefined) !== (meta.desc || undefined)
    || topic !== (topicKey || q.topic);

  const save = () => {
    if (!dirty) { onCancel(); return; }
    onSave({
      qMeta: { variant: variant || undefined, desc: desc || undefined },
      topic: topic !== (topicKey || q.topic) ? topic : undefined,
    });
  };

  const topicLabel = (topicOptions.find(o => o.value === topic) || {}).label || topic;

  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 70 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-worksurface bmq-dialog" role="dialog" aria-modal="true" aria-labelledby="bmq-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onCancel}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h2 className="dialog-title" id="bmq-title">Benchmarked question</h2>
          <p className="dialog-subtitle">Questions that are defined by our professionals and are compared to relevant benchmarks.</p>
        </div>

        <div className="bmq-selects">
          <div className="bmq-field">
            <span className="bmq-lbl">Add to topic
              <Tooltip label="Topics organize questions in this survey. They don't affect benchmarks.">
                <span className="cq-info"><Icon name="info" size={16} /></span>
              </Tooltip>
            </span>
            <div style={{ position: "relative" }}>
              <button type="button" className={"sel-btn bmq-top-sel" + (topicOpen ? " is-pressed" : "")}
                aria-haspopup="listbox" aria-expanded={topicOpen} onClick={() => setTopicOpen(o => !o)}>
                <span className="sel-btn-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topicLabel}</span>
                <span className="spacer" />
                <Icon name="chevron-down" size={16} />
              </button>
              {topicOpen && (
                <>
                  <div className="cq-menu-scrim" onMouseDown={() => setTopicOpen(false)} />
                  <div className="menu" role="listbox" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 3, maxHeight: 260, overflowY: "auto" }}>
                    {topicOptions.map(o => (
                      <div key={o.value} role="option" aria-selected={o.value === topic}
                        className={"menu-item" + (o.value === topic ? " is-selected" : "")}
                        onClick={() => { setTopic(o.value); setTopicOpen(false); }}>
                        <span className="menu-item-body"><span className="menu-item-title">{o.label}</span></span>
                        {o.value === topic && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="bmq-field">
            <span className="bmq-lbl">Answer type</span>
            <div className="bmq-type-disabled" aria-disabled="true" title="The answer type of a benchmarked question is fixed">
              <QTypeIcon type={q.type} size={20} />
              <span>{QTYPES[q.type].label}</span>
              <span className="spacer" />
              <Icon name="chevron-down" size={16} />
            </div>
          </div>
        </div>

        <div className="bmq-stage">
          <div className="bmq-preview">
            <div className="bmq-card">
              <PreviewSelect big value={variant} display={t(wording)} disabled={!primary}
                placeholder="Question text"
                explain={{ title: "Change benchmarked question", body: "Standard questions can only be replaced with one of the listed alternatives to ensure it fits with the benchmark." }}
                options={[
                  { value: undefined, label: q.text },
                  ...variants.map(v => ({ value: v, label: v })),
                ]}
                footer={
                  <button className="bmq-dd-detach" onClick={detach}>
                    <Icon name="edit" size={14} />
                    <span>
                      <b>Write your own wording</b>
                      <span>None of these fit? Word it yourself — it becomes a custom question and loses its benchmark.</span>
                    </span>
                  </button>
                }
                onChange={setVariant} />
              <PreviewSelect value={desc} display={t(desc)} disabled={!primary}
                placeholder="Add a description"
                explain={{ title: "Change description", body: "Descriptions clarify the question for participants. Choose one of the approved descriptions — they don't affect the benchmark." }}
                options={[
                  ...descOptions.map(d => ({ value: d, label: d })),
                  { value: undefined, label: "No description", muted: true },
                ]}
                onChange={setDesc} />
              <div className="bmq-scale">
                <div className="bmq-scale-row">
                  <span className="bmq-scale-end">{t(SCALE_LABELS[0])}</span>
                  {SCALE_DOTS.map((c, i) => <span key={i} className="bmq-dot" style={{ "--dot": c }} />)}
                  <span className="bmq-scale-end">{t(SCALE_LABELS[4])}</span>
                </div>
                <span className="bmq-idk">{t("I don't know")}</span>
              </div>
            </div>
          </div>
          <div className="bmq-langs">
            <div className="bmq-langs-head">Primary language</div>
            {LANGUAGES.filter(l => l.primary).map(l => (
              <button key={l.code} className={"bmq-lang" + (lang === l.code ? " is-selected" : "")} onClick={() => setLang(l.code)}>
                <span className="lang-flag"><img src={flagSrc(l.flag)} alt="" /></span>
                <span className="bmq-lang-text"><b>{l.label}</b><span>{l.country}</span></span>
              </button>
            ))}
            <div className="bmq-langs-head" style={{ paddingTop: 16 }}>Translations ({LANGUAGES.length - 1})</div>
            {LANGUAGES.filter(l => !l.primary).map(l => (
              <button key={l.code} className={"bmq-lang" + (lang === l.code ? " is-selected" : "")} onClick={() => setLang(l.code)}>
                <span className="lang-flag"><img src={flagSrc(l.flag)} alt="" /></span>
                <span className="bmq-lang-text"><b>{l.label}</b><span>{l.country}</span></span>
              </button>
            ))}
            {!primary && <div className="bmq-lang-note">Translations of benchmarked questions are provided by Effectory. Change the wording in the primary language.</div>}
          </div>
        </div>

        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={"btn btn-primary" + (dirty ? "" : " is-disabled")} disabled={!dirty} onClick={save}>Save</button>
        </div>
      </div>
      {detachAsk && <DetachWarning onCancel={() => setDetachAsk(false)} onConfirm={doDetach} />}
    </div>
  );
}
