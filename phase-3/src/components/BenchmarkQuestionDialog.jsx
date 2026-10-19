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
import { LANG_STATUS, LangPanel, AutoTextarea } from "./CustomQuestionDialog.jsx";
import { QTYPES, SCALE_LABELS, answerOptionsOf } from "../data/data.js";
import { CHARACTERISTICS, characteristicOf } from "../data/characteristics.js";
import { conditionOK, logicSummary } from "../data/logic.js";
import { LANGUAGES, flagSrc, autoTranslation, scaleFor } from "../data/i18n.js";
import { variantsOf } from "../data/variants.js";
import { designWash } from "../data/designs.js";
import { BenchmarkInfo } from "./BenchmarkInfo.jsx";

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

// ---- Question logic (conditional visibility) -------------------------------
// The dialog carries only a one-line SUMMARY of a question's logic; editing
// happens in a full takeover of the dialog (like the template detail view),
// so several stacked conditions get real room. Two condition kinds: the
// answer given to an EARLIER question, and an employee-data attribute. See
// data/logic.js for the model.

function LogicCondition({ c, earlier, showErrors, onChange, onRemove }) {
  const answerKind = c.type === "answer";
  const trigger = answerKind ? earlier.find(x => x.id === c.trigger) : null;
  const attr = answerKind ? null : characteristicOf(c.attribute);
  const opts = answerKind ? answerOptionsOf(trigger) : (attr ? attr.values : []);
  const picked = answerKind ? (c.answers || []) : (c.values || []);
  const togglePick = (i) => {
    const next = picked.includes(i) ? picked.filter(x => x !== i) : [...picked, i].sort((a, b) => a - b);
    onChange(answerKind ? { ...c, answers: next } : { ...c, values: next });
  };
  const err = showErrors && !conditionOK(c, earlier)
    ? (answerKind && !trigger ? "Choose an earlier question"
      : `Choose at least one ${answerKind ? "answer" : "value"}`)
    : null;
  return (
    <div className={"lgc-card" + (err ? " is-invalid" : "")}>
      <div className="lgc-card-head">
        <span className="lgc-kind">
          <Icon name={answerKind ? "point-scale" : "user"} size={14} />
          {answerKind ? "Answer to an earlier question" : "Employee data"}
        </span>
        <Tooltip label="Remove condition" pos="is-left">
          <button type="button" className="ib ib-36 ib-tertiary" aria-label="Remove condition" onClick={onRemove}>
            <Icon name="trash" size={16} />
          </button>
        </Tooltip>
      </div>
      {answerKind ? (
        <MiniSelect ariaLabel="Earlier question" value={c.trigger} placeholder="Choose a question"
          items={earlier.map(x => ({ value: x.id, label: x.text }))}
          onChange={(id) => onChange({ ...c, trigger: id, answers: [] })} block />
      ) : (
        <MiniSelect ariaLabel="Employee data attribute" value={c.attribute}
          items={CHARACTERISTICS.map(a => ({ value: a.key, label: a.label }))}
          onChange={(key) => onChange({ ...c, attribute: key, values: [] })} block />
      )}
      {opts.length > 0 && (
        <>
          <span className="lgc-lbl">{answerKind ? "Show when the answer is" : "Show when it is"}</span>
          <div className="lgc-opts" role="group" aria-label={answerKind ? "Answers that show the question" : "Values that see the question"}>
            {opts.map((o, i) => (
              <label key={i} className={"lgc-opt" + (picked.includes(i) ? " is-on" : "")}>
                <span className="cb-wrap">
                  <input type="checkbox" className="cb" checked={picked.includes(i)} onChange={() => togglePick(i)} />
                </span>
                <span>{o}</span>
              </label>
            ))}
          </div>
        </>
      )}
      {err ? <span className="lgc-err">{err}</span>
        : opts.length > 0 && <span className="lgc-hint">{`Any chosen ${answerKind ? "answer" : "value"} counts.`}</span>}
    </div>
  );
}

function LogicEditor({ logic, onChange, earlier, title, onDone, onRemoveAll }) {
  const [showErrors, setShowErrors] = useState(false);
  const conditions = logic.conditions || [];
  const setCondition = (i, next) => onChange({ ...logic, conditions: conditions.map((c, j) => (j === i ? next : c)) });
  const removeCondition = (i) => onChange({ ...logic, conditions: conditions.filter((_, j) => j !== i) });
  const add = (c) => onChange({ ...logic, conditions: [...conditions, c] });
  // The nearest earlier question is the likely trigger, so it is preselected;
  // attributes start on the first one. Only the answers/values stay open.
  const addAnswer = () => add({ type: "answer", trigger: (earlier[earlier.length - 1] || {}).id, answers: [] });
  const addAttribute = () => add({ type: "attribute", attribute: CHARACTERISTICS[0].key, values: [] });
  const done = () => {
    if (!conditions.length) { onRemoveAll(); return; }
    if (conditions.every(c => conditionOK(c, earlier))) onDone(); else setShowErrors(true);
  };
  return (
    <>
      <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
        <button type="button" className="lgc-back" onClick={done}><Icon name="arrow-left" size={16} />Back to question</button>
        <h2 className="dialog-title">Who gets this question</h2>
        <div className="dialog-subtitle lgc-lead">
          <span>Show “{title}” when</span>
          <MiniSelect ariaLabel="How the conditions combine" value={logic.match}
            items={[{ value: "all", label: "all" }, { value: "any", label: "any" }]}
            onChange={(m) => onChange({ ...logic, match: m })} />
          <span>of these match. Everyone else skips it.</span>
        </div>
      </div>
      <div className="lgc-body scroll-y">
        {conditions.map((c, i) => (
          <LogicCondition key={i} c={c} earlier={earlier} showErrors={showErrors}
            onChange={(next) => setCondition(i, next)} onRemove={() => removeCondition(i)} />
        ))}
        {conditions.length === 0 && (
          <div className="lgc-empty">No conditions yet — everyone still gets this question.</div>
        )}
        <div className="lgc-add">
          <button type="button" className={"btn btn-secondary" + (earlier.length ? "" : " is-disabled")}
            disabled={!earlier.length}
            title={earlier.length ? undefined : "Needs an earlier question with fixed answers before this one"}
            onClick={addAnswer}>
            <Icon name="plus" size={16} />Answer to an earlier question
          </button>
          <button type="button" className="btn btn-secondary" onClick={addAttribute}>
            <Icon name="plus" size={16} />Employee data
          </button>
        </div>
      </div>
      <div className="dialog-footer">
        <button className="btn btn-secondary" onClick={onRemoveAll}>Remove logic</button>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={done}>Done</button>
      </div>
    </>
  );
}

export function BenchmarkQuestionDialog({ q, meta = {}, topicKey, topicOptions = [], themeInfo, design, allVariants = false, logicCandidates = [], onCancel, onSave, onDetach, onOpenTheme }) {
  const [infoOpen, setInfoOpen] = useState(false);
  // Staged edits — committed on Save only.
  const [variant, setVariant] = useState(meta.variant);
  const [desc, setDesc] = useState(meta.desc);
  const [topic, setTopic] = useState(topicKey || q.topic);
  // Question logic, staged like everything else (committed on Save). The
  // dialog shows a one-line summary; `logicOpen` swaps the dialog body for the
  // editor takeover. A required question can't be masked at all.
  const [logic, setLogic] = useState(() => (meta.logic ? JSON.parse(JSON.stringify(meta.logic)) : null));
  const [logicOpen, setLogicOpen] = useState(false);
  const hasLogic = !!(logic && (logic.conditions || []).length);
  const logicLine = hasLogic ? logicSummary(logic, logicCandidates) : "";
  const [lang, setLang] = useState("en");
  // Same breakpoint as the custom-question dialog: below it the language list
  // can't sit next to the preview, so it becomes a select above it.
  const compact = useMediaQuery("(max-width: 1160px)");
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
  // Mirrors the side list, so the compact menu reads the same way. The
  // wording's translations come with the benchmark: Effectory makes them, so
  // every translation says so instead of the automatic/manual status a
  // custom question has.
  const langStatus = (l) => (l.primary ? "source" : "effectory");
  const langItems = LANGUAGES.map(l => ({ value: l.code, label: `${l.label} (${l.country})`,
    sub: LANG_STATUS[langStatus(l)].label,
    lead: <span className="cq-flag"><img src={flagSrc(l.flag)} alt="" /></span> }));
  const t = (text) => (primary || !text ? text : autoTranslation(text, lang));
  // The answer scale has real translations (the same the custom question
  // dialog shows), not the machine's.
  const pt = (i) => (primary ? SCALE_LABELS[i] : scaleFor(lang).points[i]);

  const stagedLogic = hasLogic ? logic : undefined;
  const dirty = (variant || undefined) !== (meta.variant || undefined)
    || (desc || undefined) !== (meta.desc || undefined)
    || topic !== (topicKey || q.topic)
    || JSON.stringify(stagedLogic || null) !== JSON.stringify(meta.logic || null);

  const save = () => {
    if (!dirty) { onCancel(); return; }
    onSave({
      qMeta: { variant: variant || undefined, desc: desc || undefined, logic: stagedLogic },
      topic: topic !== (topicKey || q.topic) ? topic : undefined,
    });
  };

  // Detaching pulls the question out of its theme too. If it is the last one
  // holding that theme complete, the warning leads with the theme instead.
  const completesTheme = !!(q.theme && themeInfo && themeInfo.total > 0 && themeInfo.kept >= themeInfo.total);
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
        {logicOpen && logic ? (
          <LogicEditor logic={logic} onChange={setLogic} earlier={logicCandidates} title={title}
            onDone={() => setLogicOpen(false)}
            onRemoveAll={() => { setLogic(null); setLogicOpen(false); }} />
        ) : (<>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          {/* The tags are ways in: Benchmarked explains itself, the theme
              opens its theme. */}
          <div className="bmq-kind">
            <Tooltip label="This question is benchmarked" pos="is-below">
              <button type="button" className="infotag is-standard is-interactive" onClick={() => setInfoOpen(true)}>
                <Icon name="barchart-2" size={12} />Benchmarked
              </button>
            </Tooltip>
            {q.theme && <ThemeTag theme={q.theme} kept={themeInfo ? themeInfo.kept : 0} total={themeInfo ? themeInfo.total : 0} pos="is-below"
              onOpen={onOpenTheme ? () => onOpenTheme(q.theme) : undefined} />}
            {q.required && <span className="infotag is-alt"><Icon name="asterisk" size={12} />Required</span>}
            {hasLogic && <span className="infotag is-logic"><Icon name="eye" size={12} />Conditional</span>}
          </div>
          <h2 className="dialog-title" id="bmq-title">{title}</h2>
          <p className="dialog-subtitle">Defined by our professionals and compared to relevant benchmarks.</p>
        </div>

        <div className="bmq-selects">
          <div className="bmq-field">
            <span className="bmq-lbl">Add to topic
              <Tooltip label="Topics organize questions in this survey. They don't affect benchmarks.">
                <button type="button" className="cq-info" aria-label="About topics"><Icon name="info" size={16} /></button>
              </Tooltip>
            </span>
            <MiniSelect ariaLabel="Add to topic" value={topic} items={topicOptions} onChange={setTopic} block />
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

        {/* Logic sits with the other settings, as a one-line summary — the
            editing surface is the takeover above, so any number of conditions
            never crowds the preview. */}
        <div className="bmq-logicrow">
          <span className="bmq-logicrow-ic"><Icon name="eye" size={16} /></span>
          {q.required ? (
            <span className="bmq-logicrow-text">
              <span className="bmq-logicrow-title">Everyone gets this question</span>
              <span className="bmq-logicrow-sub">It's required, so logic can't hide it.</span>
            </span>
          ) : hasLogic ? (
            <>
              <span className="bmq-logicrow-text">
                <span className="bmq-logicrow-title">{`Shows conditionally · ${logic.conditions.length} ${logic.conditions.length === 1 ? "condition" : "conditions"}`}</span>
                <span className="bmq-logicrow-sub is-ellip" title={logicLine}>{logicLine}</span>
              </span>
              <button type="button" className="btn btn-secondary" onClick={() => setLogicOpen(true)}>Edit logic</button>
            </>
          ) : (
            <>
              <span className="bmq-logicrow-text">
                <span className="bmq-logicrow-title">Show this question conditionally</span>
                <span className="bmq-logicrow-sub">Everyone gets it now. Show it only after a chosen answer, or only to some employees.</span>
              </span>
              <button type="button" className="btn btn-secondary"
                onClick={() => { setLogic(l => l || { match: "all", conditions: [] }); setLogicOpen(true); }}>
                Add logic
              </button>
            </>
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
                // The custom question dialog's own description field: one line
                // that grows with its text, the same invitation.
                <AutoTextarea className="cq-descfield" value={desc || ""}
                  placeholder="Elaborate the context of your question here (optional)" aria-label="Description"
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
                <div className="bmq-textbox">{primary ? "Share your thoughts" : scaleFor(lang).open}</div>
              ) : (
                <div className="bmq-scale">
                  <div className="bmq-scale-row">
                    <span className="bmq-scale-end">{pt(0)}</span>
                    {SCALE_DOTS.map((c, i) => (
                      <Tooltip key={i} label={pt(i)}>
                        <span className="bmq-dot" style={{ "--dot": c }} tabIndex={0}
                          role="img" aria-label={pt(i)} />
                      </Tooltip>
                    ))}
                    <span className="bmq-scale-end">{pt(4)}</span>
                  </div>
                  <span className="bmq-idk">{primary ? "I don't know" : scaleFor(lang).dontKnow}</span>
                </div>
              )}
              </div>
            </div>
          </div>
          {/* The same language panel as the custom question dialog; a
              standard question's translations are Effectory's own. */}
          {!compact && <LangPanel active={lang} onSelect={setLang}
            source={{ label: "Translated by Effectory" }} />}
        </div>

        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </div>
        </>)}
      </div>
      {infoOpen && <BenchmarkInfo onClose={() => setInfoOpen(false)} />}
      {detachAsk && <DetachWarning onCancel={() => setDetachAsk(false)} onConfirm={doDetach}
        theme={q.theme || undefined} completes={completesTheme} themeCount={themeInfo && themeInfo.total} />}
    </div>
  );
}
