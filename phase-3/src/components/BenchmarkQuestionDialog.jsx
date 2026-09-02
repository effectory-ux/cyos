// BenchmarkQuestionDialog.jsx — "Benchmarked question" (Figma 6271:7232).
// The one dialog for standard questions, using the custom-question-dialog
// format: selects on top, a respondent-style preview card in the middle, and a
// language list on the right. Locked things LOOK locked (Answer type is a
// disabled select); constrained edits LOOK like choices — the question text and
// description in the preview are selects whose dropdowns list the
// Effectory-approved alternatives (Figma 6271:9052). Everything is staged and
// committed with Save; all changes are survey-scoped.
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";
import { QTypeIcon, Tooltip, ThemeTag, useMediaQuery, MiniSelect } from "./shared.jsx";
import { QTYPES, SCALE_LABELS, answerOptionsOf } from "../data/data.js";
import { LANGUAGES, flagSrc, autoTranslation } from "../data/i18n.js";
import { variantsOf } from "../data/variants.js";
import { designWash } from "../data/designs.js";

const SCALE_DOTS = [
  "var(--bg-distribution-strongly-disagree)",
  "var(--bg-distribution-disagree)",
  "var(--bg-distribution-neither)",
  "var(--bg-distribution-agree)",
  "var(--bg-distribution-strongly-agree)",
];

// A select rendered inside the preview card: looks like the content it holds,
// plus a chevron that reveals the approved alternatives. An option `value` of
// undefined means "no selection" (used for removing the description).
function PreviewSelect({ value, display, options, big, placeholder, disabled, footer, onChange }) {
  const [open, setOpen] = useState(false);
  // The dropdown is PORTALLED to a fixed layer: its ancestors (the preview
  // scroller, the stage, the dialog) all clip overflow, so an in-place
  // absolute menu gets cut off. `at` holds the trigger's measured position.
  const [at, setAt] = useState(null);
  const btnRef = useRef(null);
  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = btnRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const maxH = Math.min(320, Math.max(below, r.top) - 16);
    setAt(below >= Math.min(320, maxH) + 8 || below >= r.top
      ? { left: r.left, top: r.bottom + 4, width: r.width, maxHeight: maxH }
      : { left: r.left, bottom: window.innerHeight - r.top + 4, width: r.width, maxHeight: maxH });
    setOpen(true);
  };
  return (
    <div className={"bmq-sel-wrap" + (big ? " is-big" : "")}>
      <button type="button" ref={btnRef} className={"bmq-sel" + (open ? " is-open" : "") + (disabled ? " is-disabled" : "")}
        aria-haspopup="listbox" aria-expanded={open} disabled={disabled}
        onClick={toggle}>
        <span className={"bmq-sel-text" + (display ? "" : " is-placeholder")}>{display || placeholder}</span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && createPortal(
        <>
          <div className="cq-menu-scrim" style={{ zIndex: 1200 }} onMouseDown={() => setOpen(false)} />
          <div className={"bmq-dropdown is-portal" + (big ? " is-big" : "")} role="listbox" style={at}>
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
        </>, document.body)}
    </div>
  );
}

// Leaving the approved wordings behind is a real consequence: the question
// stops being the benchmarked standard one and becomes your own custom
// question. Say so once, plainly, and let people opt out of the reminder.
const SKIP_KEY = "cyos.skipDetachWarn";
const skipDetachWarn = () => { try { return localStorage.getItem(SKIP_KEY) === "1"; } catch (_) { return false; } };

// One dialog, graded impact: converting to custom always breaks the benchmark
// (the tag flips from Benchmarked to Custom); when the question belongs to a
// theme the loss is bigger — the theme connection goes too, and if it was the
// last question holding the theme complete, the composite score breaks.
function DetachWarning({ theme, completes, themeCount, onCancel, onConfirm }) {
  const [dontShow, setDontShow] = useState(false);
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 82 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="dw-title">
        <div className="dialog-header is-sm">
          <div className="dialog-header-top">
            <Icon name="alert-triangle" size={20} className="dialog-header-icon is-warning" />
            <h3 className="dialog-title" id="dw-title">
              {completes ? `Keep the “${theme}” theme complete?` : "Write your own wording?"}
            </h3>
          </div>
          <p className="dialog-subtitle">You can word it however you like. This is what changes:</p>
        </div>
        {/* the tag flip, shown with the same tags the dialogs carry */}
        <div className="dw-flip" aria-hidden="true">
          <span className="infotag is-standard"><Icon name="barchart-2" size={12} />Benchmarked</span>
          <Icon name="arrow-right" size={16} style={{ color: "var(--content-subtle)" }} />
          <span className="infotag is-custom"><Icon name="edit-inline" size={12} />Custom</span>
        </div>
        <ul className="dw-impact">
          <li><b>Loses the benchmark.</b> Its results can no longer be compared with other organizations.</li>
          {theme && (
            <li><b>Leaves the “{theme}” theme.</b>{completes
              ? ` It was the last question holding the theme complete, so the composite score breaks. The theme needs all ${themeCount} questions.`
              : " It no longer counts toward the theme."}</li>
          )}
        </ul>
        <label className="cb-label-wrap" style={{ display: "flex", alignItems: "center", gap: "var(--spacing-tight)", cursor: "pointer" }}>
          <span className="cb-wrap"><input type="checkbox" className="cb" checked={dontShow} onChange={e => setDontShow(e.target.checked)} /></span>
          <span className="text-medium">Don't show this again</span>
        </label>
        <div className="dialog-footer">
          <div className="spacer" />
          {completes ? (
            <>
              <button className="btn btn-secondary" onClick={() => onConfirm(dontShow)}>Write my own anyway</button>
              <button className="btn btn-primary" onClick={onCancel}>Keep question</button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
              <button className="btn btn-primary" onClick={() => onConfirm(dontShow)}>Write my own wording</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function BenchmarkQuestionDialog({ q, meta = {}, topicKey, topicOptions = [], themeInfo, design, allVariants = false, logicCandidates = [], onCancel, onSave, onDetach }) {
  // Staged edits — committed on Save only.
  const [variant, setVariant] = useState(meta.variant);
  const [desc, setDesc] = useState(meta.desc);
  const [topic, setTopic] = useState(topicKey || q.topic);
  // Question logic (masking): show this question only when the participant
  // gave one of the chosen answers to an EARLIER question. One rule per
  // question; several chosen answers count as OR. `logicCandidates` is the
  // ordered list of earlier questions with fixed answers — logic only looks
  // backwards, so a question that comes later can never trigger this one.
  const savedLogic = meta.logic && logicCandidates.some(c => c.id === meta.logic.trigger) ? meta.logic : null;
  const [logicOn, setLogicOn] = useState(!!savedLogic);
  const [trigger, setTrigger] = useState(savedLogic ? savedLogic.trigger : undefined);
  const [logicAnswers, setLogicAnswers] = useState(savedLogic ? savedLogic.answers : []);
  const [triggerOpen, setTriggerOpen] = useState(false);
  // A required question always shows — it can't be masked.
  const canLogic = logicCandidates.length > 0 && !q.required;
  const triggerQ = logicCandidates.find(c => c.id === trigger) || null;
  const triggerOpts = answerOptionsOf(triggerQ);
  const toggleLogicAnswer = (i) => setLogicAnswers(a => (a.includes(i) ? a.filter(x => x !== i) : [...a, i].sort((x, y) => x - y)));
  const pickTrigger = (id) => { setTrigger(id); setLogicAnswers([]); setTriggerOpen(false); };
  // The staged rule this dialog would save: null while incomplete.
  const stagedLogic = logicOn && triggerQ && logicAnswers.length > 0 ? { trigger, answers: logicAnswers } : null;
  const logicOk = !logicOn || !!stagedLogic;
  const [lang, setLang] = useState("en");
  // Same breakpoint as the custom-question dialog: below it the language list
  // can't sit next to the preview, so it becomes a select above it.
  const compact = useMediaQuery("(max-width: 1160px)");
  const [topicOpen, setTopicOpen] = useState(false);
  const [detachAsk, setDetachAsk] = useState(false);
  // A description is ALWAYS the coordinator's own text: it clarifies the
  // question for this survey and never carries the benchmark, so there is no
  // approved list to pick from — just write it (or leave it empty).
  const detach = () => { if (skipDetachWarn() && !completesTheme) doDetach(false); else setDetachAsk(true); };
  const doDetach = (remember) => {
    if (remember) { try { localStorage.setItem(SKIP_KEY, "1"); } catch (_) {} }
    setDetachAsk(false);
    onDetach && onDetach({ text: wording, topic });
  };

  const wording = variant || q.text;
  const variants = variantsOf(q.text, allVariants, q.type);
  const primary = lang === "en";
  // Mirrors the side list, so the compact menu reads the same way.
  const langItems = [
    { header: true, label: "Primary language" },
    ...LANGUAGES.filter(l => l.primary).map(l => ({ value: l.code, label: l.label, sub: l.country,
      lead: <span className="cq-flag"><img src={flagSrc(l.flag)} alt="" /></span> })),
    { header: true, label: `Translations (${LANGUAGES.length - 1})` },
    ...LANGUAGES.filter(l => !l.primary).map(l => ({ value: l.code, label: l.label, sub: l.country,
      lead: <span className="cq-flag"><img src={flagSrc(l.flag)} alt="" /></span> })),
  ];
  const t = (text) => (primary || !text ? text : autoTranslation(text, lang));

  const dirty = (variant || undefined) !== (meta.variant || undefined)
    || (desc || undefined) !== (meta.desc || undefined)
    || topic !== (topicKey || q.topic)
    || JSON.stringify(stagedLogic) !== JSON.stringify(savedLogic);

  const save = () => {
    if (!dirty) { onCancel(); return; }
    onSave({
      qMeta: { variant: variant || undefined, desc: desc || undefined, logic: stagedLogic || undefined },
      topic: topic !== (topicKey || q.topic) ? topic : undefined,
    });
  };

  // Detaching pulls the question out of its theme too. If it is the last one
  // holding that theme complete, the warning leads with the theme instead.
  const completesTheme = !!(q.theme && themeInfo && themeInfo.total > 0 && themeInfo.kept >= themeInfo.total);
  const topicLabel = (topicOptions.find(o => o.value === topic) || {}).label || topic;
  // The dialog is titled by the thing itself: the wording actually in use, so
  // picking an alternative retitles it.
  const title = wording;

  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 70 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-worksurface bmq-dialog has-corner-tags" role="dialog" aria-modal="true" aria-labelledby="bmq-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onCancel}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <div className="bmq-kind">
            <span className="infotag is-standard"><Icon name="barchart-2" size={12} />Benchmarked</span>
            {variant && <span className="infotag is-alt">Alternative wording</span>}
            {q.theme && <ThemeTag theme={q.theme} kept={themeInfo ? themeInfo.kept : 0} total={themeInfo ? themeInfo.total : 0} pos="is-below" />}
            {q.required && <span className="infotag is-alt"><Icon name="asterisk" size={12} />Required</span>}
            {stagedLogic && <span className="infotag is-logic"><Icon name="eye" size={12} />Conditional</span>}
          </div>
          <h2 className="dialog-title" id="bmq-title" data-t={"q-" + q.id}>{title}</h2>
          <p className="dialog-subtitle">Defined by our professionals and compared to relevant benchmarks.</p>
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

        {/* Logic sits with the other settings (topic, answer type), not in the
            preview: it decides WHO gets the question, not what it looks like. */}
        <div className="bmq-logic">
          <div className="bmq-logic-head">
            <span className="bmq-logic-ic"><Icon name="eye" size={16} /></span>
            <span className="bmq-logic-text">
              <span className="bmq-logic-title">Show this question conditionally</span>
              <span className="bmq-logic-sub">
                {canLogic
                  ? "Only participants who gave a chosen answer to an earlier question get this question."
                  : q.required
                    ? "This question is required, so everyone gets it — logic can't hide it."
                    : "Logic needs an earlier question with fixed answers. Move this question later, or add questions before it."}
              </span>
            </span>
            <button type="button" role="switch" aria-checked={logicOn} aria-label="Show this question conditionally"
              className={"bmq-switch" + (logicOn ? " is-on" : "") + (canLogic ? "" : " is-off-limits")}
              disabled={!canLogic} onClick={() => setLogicOn(v => !v)} />
          </div>
          {logicOn && canLogic && (
            <div className="bmq-logic-body">
              <div className="bmq-field">
                <span className="bmq-lbl">Earlier question</span>
                <div style={{ position: "relative" }}>
                  <button type="button" className={"sel-btn bmq-top-sel" + (triggerOpen ? " is-pressed" : "")}
                    aria-haspopup="listbox" aria-expanded={triggerOpen} onClick={() => setTriggerOpen(o => !o)}>
                    <span className={"sel-btn-name" + (triggerQ ? "" : " is-placeholder")}
                      style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {triggerQ ? triggerQ.text : "Choose a question"}
                    </span>
                    <span className="spacer" />
                    <Icon name="chevron-down" size={16} />
                  </button>
                  {triggerOpen && (
                    <>
                      <div className="cq-menu-scrim" onMouseDown={() => setTriggerOpen(false)} />
                      <div className="menu" role="listbox" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 3, maxHeight: 260, overflowY: "auto" }}>
                        {logicCandidates.map(c => (
                          <div key={c.id} role="option" aria-selected={c.id === trigger}
                            className={"menu-item" + (c.id === trigger ? " is-selected" : "")}
                            onClick={() => pickTrigger(c.id)}>
                            <span className="menu-item-body"><span className="menu-item-title">{c.text}</span></span>
                            {c.id === trigger && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {triggerQ && (
                <div className="bmq-field">
                  <span className="bmq-lbl">Show when the answer is
                    <Tooltip label="Any chosen answer counts — one match is enough.">
                      <span className="cq-info"><Icon name="info" size={16} /></span>
                    </Tooltip>
                  </span>
                  <div className="bmq-logic-answers" role="group" aria-label="Answers that show this question">
                    {triggerOpts.map((o, i) => (
                      <label key={i} className={"bmq-logic-answer" + (logicAnswers.includes(i) ? " is-on" : "")}>
                        <span className="cb-wrap">
                          <input type="checkbox" className="cb" checked={logicAnswers.includes(i)} onChange={() => toggleLogicAnswer(i)} />
                        </span>
                        <span>{o}</span>
                      </label>
                    ))}
                  </div>
                  {logicAnswers.length === 0 && <span className="bmq-logic-hint">Choose at least one answer</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Above the stage, not inside it: the preview scrolls, and a language
            control that scrolls out of view is a control you can't find. */}
        <div className="bmq-stage">
          <div className="bmq-preview" style={design ? { background: designWash(design) } : undefined}>
            {/* The language control lives WITH the preview it switches, same
                as the custom-question dialog. */}
            {compact && (
              <div className="cq-field cq-langsel">
                <span className="cq-lbl">Languages</span>
                <MiniSelect ariaLabel="Languages" value={lang} items={langItems} onChange={setLang} block />
                {!primary && <div className="bmq-lang-note is-inline">Translations of benchmarked questions are provided by Effectory. Change the wording in the primary language.</div>}
              </div>
            )}
            {/* margin:auto centers the group when there is room and degrades
                to a normal scroll when there isn't — no fixed spacers, so the
                container never scrolls unless the content truly overflows. */}
            <div className="bmq-inner">
              <div className="bmq-card">
              {/* A translation is derived from the primary language, so it is
                  shown as text: offering a select there would imply the
                  alternatives exist per language, which they don't. */}
              {primary ? (
                <PreviewSelect big value={variant} display={wording} placeholder="Question text"
                  options={[
                    { value: undefined, label: q.text },
                    ...variants.map(v => ({ value: v, label: v })),
                  ]}
                  footer={onDetach ? (
                    <button className="bmq-dd-detach" onClick={detach}>
                      <Icon name="edit" size={14} />
                      <span>
                        <b>Write your own wording</b>
                        <span>Becomes a custom question. Loses the benchmark.</span>
                      </span>
                    </button>
                  ) : null}
                  onChange={setVariant} />
              ) : (
                <div className="bmq-locked is-big">{t(wording)}</div>
              )}

              {primary ? (
                <textarea className="bmq-descfield" rows={2} value={desc || ""}
                  placeholder="Add a description (optional)" aria-label="Description"
                  onChange={e => setDesc(e.target.value)} />
              ) : ((desc || "").trim() ? <div className="bmq-locked">{t(desc)}</div> : null)}

              {/* The real answer type, with every point named — answer
                  categories are participant-facing text, so they translate too. */}
              {q.type === "multiple" ? (
                <div className="bmq-opts">
                  {(q.options || []).map((o, i) => (
                    <div key={i} className="bmq-opt"><span className="bmq-opt-radio" aria-hidden="true" />{t(o)}</div>
                  ))}
                </div>
              ) : q.type === "text" ? (
                <div className="bmq-textbox">{t("Share your thoughts")}</div>
              ) : (
                <div className="bmq-scale">
                  <div className="bmq-scale-row">
                    <span className="bmq-scale-end">{t(SCALE_LABELS[0])}</span>
                    {SCALE_DOTS.map((c, i) => (
                      <Tooltip key={i} label={t(SCALE_LABELS[i])}>
                        <span className="bmq-dot" style={{ "--dot": c }} tabIndex={0}
                          role="img" aria-label={t(SCALE_LABELS[i])} />
                      </Tooltip>
                    ))}
                    <span className="bmq-scale-end">{t(SCALE_LABELS[4])}</span>
                  </div>
                  <span className="bmq-idk">{t("I don't know")}</span>
                </div>
              )}
              </div>
            </div>
          </div>
          {!compact && <div className="bmq-langs">
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
          </div>}
        </div>

        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={"btn btn-primary" + (dirty && logicOk ? "" : " is-disabled")} disabled={!dirty || !logicOk} onClick={save}>Save</button>
        </div>
      </div>
      {detachAsk && <DetachWarning onCancel={() => setDetachAsk(false)} onConfirm={doDetach}
        theme={q.theme || undefined} completes={completesTheme} themeCount={themeInfo && themeInfo.total} />}
    </div>
  );
}
