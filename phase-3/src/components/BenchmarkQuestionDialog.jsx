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

// One question's rule, as an editing pane: subject line, the all/any lead,
// the condition cards, the add buttons. Shared by both logic surfaces — the
// standalone Question logic dialog (with its question rail) and the in-place
// takeover variant that stays scoped to one question.
function LogicRulePane({ selected, logic, earlier, showErrors, onChange }) {
  const conditions = (logic && logic.conditions) || [];
  const setCondition = (i, next) => onChange({ ...logic, conditions: conditions.map((c, j) => (j === i ? next : c)) });
  const removeCondition = (i) => {
    const rest = conditions.filter((_, j) => j !== i);
    onChange(rest.length ? { ...logic, conditions: rest } : null);
  };
  const add = (c) => onChange({ match: "all", ...(logic || {}), conditions: [...conditions, c] });
  // The nearest earlier question is the likely trigger, so it is preselected;
  // attributes start on the first one. Only the answers/values stay open.
  const addAnswer = () => add({ type: "answer", trigger: (earlier[earlier.length - 1] || {}).id, answers: [] });
  const addAttribute = () => add({ type: "attribute", attribute: CHARACTERISTICS[0].key, values: [] });
  if (selected.required) {
    return (
      <div className="lgc-locked">
        <b>Everyone gets this question.</b> It's required by the organization, so logic can't hide it.
      </div>
    );
  }
  return (
    <>
      <div className="lgc-subject">{selected.text}</div>
      <div className="lgc-lead">
        <span>Shown when</span>
        <MiniSelect ariaLabel="How the conditions combine" value={(logic && logic.match) || "all"}
          items={[{ value: "all", label: "all" }, { value: "any", label: "any" }]}
          onChange={(m) => onChange({ ...(logic || { conditions: [] }), match: m })} />
        <span>of these match. Everyone else skips it.</span>
      </div>
      {conditions.map((c, i) => (
        <LogicCondition key={i} c={c} earlier={earlier} showErrors={showErrors}
          onChange={(next) => setCondition(i, next)} onRemove={() => removeCondition(i)} />
      ))}
      {/* Arriving with nothing set, the field promised options — so the add
          choices lead, no empty-state prose in between. */}
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
    </>
  );
}

// Variant surface (toolbar: "Question logic inside the question dialog"):
// the question dialog flips in place to ONE question's rule — the back link
// shares the close button's line, and the subject line says whose logic this
// is. No rail: hopping questions belongs to the standalone dialog.
function LogicEditor({ q, logic, onChange, earlier, onClose }) {
  const [showErrors, setShowErrors] = useState(false);
  const conditions = (logic && logic.conditions) || [];
  const done = () => {
    if (!conditions.length) { if (logic) onChange(null); onClose(); return; }
    if (conditions.every(c => conditionOK(c, earlier))) { setShowErrors(false); onClose(); } else setShowErrors(true);
  };
  return (
    <>
      <div className="lgc-top">
        <button type="button" className="lgc-back" onClick={done}><Icon name="arrow-left" size={16} />Back to question</button>
      </div>
      <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
        <h2 className="dialog-title">Question logic</h2>
        <p className="dialog-subtitle">Decide who gets this question. Changes are saved with the question.</p>
      </div>
      <div className="lgc-main scroll-y">
        <LogicRulePane selected={q} logic={logic} earlier={earlier} showErrors={showErrors} onChange={onChange} />
      </div>
      <div className="dialog-footer">
        {conditions.length > 0 && !q.required &&
          <button className="btn btn-secondary" onClick={() => onChange(null)}>Remove logic</button>}
        <div className="spacer" />
        <button className="btn btn-primary" onClick={done}>Done</button>
      </div>
    </>
  );
}

// The DEFAULT logic surface: its own dialog, Typeform-style — every question
// of the questionnaire on a rail (hop freely), the selected one's rule on the
// right. It owns its commit: Save applies every touched question's rule
// immediately, Cancel discards them all — independent of the question
// dialog's own staging, so there is never a nested-save puzzle.
export function QuestionLogicDialog({ questions, initialId, logicByQuestion = {}, onApply, onClose, zIndex }) {
  const [selectedId, setSelectedId] = useState(initialId || (questions[0] || {}).id);
  const [logicMap, setLogicMap] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const normLogic = (l) => (l && (l.conditions || []).length ? l : null);
  const baseOf = (id) => normLogic(logicByQuestion[id] || null);
  const logicOf = (id) => (Object.prototype.hasOwnProperty.call(logicMap, id) ? logicMap[id] : baseOf(id));
  const orderIndex = {}; questions.forEach((x, i) => { orderIndex[x.id] = i; });
  const earlierFor = (id) => questions.slice(0, orderIndex[id] ?? 0).filter(x => answerOptionsOf(x).length > 0);
  const selected = questions.find(x => x.id === selectedId) || questions[0];
  const logic = logicOf(selected.id);
  const conditions = (logic && logic.conditions) || [];
  const update = (next) => setLogicMap(m => ({ ...m, [selected.id]: next }));
  // Leaving the selected question — a rail hop, Save or the close paths —
  // holds one bar: no half-finished condition may be left behind anywhere.
  const canLeave = () => {
    if (!conditions.length) { if (logic) update(null); return true; }
    if (conditions.every(c => conditionOK(c, earlierFor(selected.id)))) { setShowErrors(false); return true; }
    setShowErrors(true); return false;
  };
  const hop = (id) => { if (id !== selected.id && canLeave()) { setShowErrors(false); setSelectedId(id); } };
  const save = () => {
    if (!canLeave()) return;
    const patches = {};
    Object.keys(logicMap).forEach(id => {
      if (JSON.stringify(normLogic(logicMap[id])) !== JSON.stringify(baseOf(id))) patches[id] = normLogic(logicMap[id]);
    });
    if (Object.keys(patches).length) onApply(patches);
    onClose();
  };
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: zIndex || 70 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog dialog-worksurface bmq-dialog" role="dialog" aria-modal="true" aria-labelledby="lgc-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onClose}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h2 className="dialog-title" id="lgc-title">Question logic</h2>
          <p className="dialog-subtitle">Decide who gets a question. Rules are set per question — pick one on the left.</p>
        </div>
        <div className="lgc-layout">
          <div className="lgc-rail scroll-y" role="listbox" aria-label="Questions in this survey">
            {questions.map((x, i) => {
              const lg = logicOf(x.id);
              const n = lg && lg.conditions ? lg.conditions.length : 0;
              return (
                <button key={x.id} type="button" role="option" aria-selected={x.id === selected.id}
                  className={"lgc-q" + (x.id === selected.id ? " is-selected" : "")} onClick={() => hop(x.id)}>
                  <span className="lgc-q-n">{i + 1}</span>
                  <span className="lgc-q-text">{x.text}</span>
                  {x.required
                    ? <span className="lgc-q-mark"><Icon name="asterisk" size={12} /></span>
                    : n > 0 ? <span className="lgc-q-mark is-some"><Icon name="eye" size={12} />{n}</span> : null}
                </button>
              );
            })}
          </div>
          <div className="lgc-main scroll-y">
            <LogicRulePane selected={selected} logic={logic} earlier={earlierFor(selected.id)}
              showErrors={showErrors} onChange={update} />
          </div>
        </div>
        <div className="dialog-footer">
          {conditions.length > 0 && !selected.required &&
            <button className="btn btn-secondary" onClick={() => update(null)}>Remove logic</button>}
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

export function BenchmarkQuestionDialog({ q, meta = {}, topicKey, topicOptions = [], themeInfo, design, allVariants = false, allQuestions = [], logicByQuestion = {}, logicInPlace = false, onOpenLogic, onCancel, onSave, onDetach, onOpenTheme }) {
  const [infoOpen, setInfoOpen] = useState(false);
  // Staged edits — committed on Save only.
  const [variant, setVariant] = useState(meta.variant);
  const [desc, setDesc] = useState(meta.desc);
  const [topic, setTopic] = useState(topicKey || q.topic);
  // Question logic. Two surfaces, one toolbar variant apart: the DEFAULT is
  // the standalone Question logic dialog (opened via onOpenLogic — it commits
  // itself, so this dialog just shows the live value); the in-place variant
  // (`logicInPlace`) flips this dialog to a one-question editor whose edits
  // stage here (`logicMap`) and ride out with Save as `logicPatches`.
  const [logicMap, setLogicMap] = useState({});
  const [logicFor, setLogicFor] = useState(null);
  const normLogic = (l) => (l && (l.conditions || []).length ? l : null);
  const baseLogicOf = (id) => normLogic(logicByQuestion[id] || (id === q.id ? meta.logic : null));
  const logicOf = (id) => (Object.prototype.hasOwnProperty.call(logicMap, id) ? logicMap[id] : baseLogicOf(id));
  const orderIndex = {}; allQuestions.forEach((x, i) => { orderIndex[x.id] = i; });
  const earlierFor = (id) => allQuestions.slice(0, orderIndex[id] ?? 0).filter(x => answerOptionsOf(x).length > 0);
  const changedLogicIds = Object.keys(logicMap)
    .filter(id => JSON.stringify(normLogic(logicMap[id])) !== JSON.stringify(baseLogicOf(id)));
  const ownLogic = normLogic(logicOf(q.id));
  const hasLogic = !!ownLogic;
  const logicLine = hasLogic ? logicSummary(ownLogic, earlierFor(q.id)) : "";
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

  const dirty = (variant || undefined) !== (meta.variant || undefined)
    || (desc || undefined) !== (meta.desc || undefined)
    || topic !== (topicKey || q.topic)
    || changedLogicIds.length > 0;

  const save = () => {
    if (!dirty) { onCancel(); return; }
    onSave({
      qMeta: { variant: variant || undefined, desc: desc || undefined },
      topic: topic !== (topicKey || q.topic) ? topic : undefined,
      // The logic editor can touch several questions in one visit; each one's
      // rule rides home here (null = rule removed).
      logicPatches: Object.fromEntries(changedLogicIds.map(id => [id, normLogic(logicMap[id])])),
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
        {logicInPlace && logicFor ? (
          <LogicEditor q={q} logic={logicOf(q.id)} earlier={earlierFor(q.id)}
            onChange={(next) => setLogicMap(m => ({ ...m, [q.id]: next }))}
            onClose={() => setLogicFor(null)} />
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
          {/* Logic is a setting with a value, not a feature: "Everyone" for
              most questions, a condition count for the masked ones. The field
              is a DOOR (chevron right) — it opens the logic takeover, never a
              dropdown. Required questions are locked: everyone gets them. */}
          <div className="bmq-field">
            <span className="bmq-lbl">Who gets it</span>
            {q.required ? (
              <div className="bmq-type-disabled" aria-disabled="true" title="It's required, so everyone gets this question">
                <Icon name="asterisk" size={14} />
                <span>Everyone</span>
                <span className="spacer" />
                <Icon name="chevron-right" size={16} />
              </div>
            ) : (
              <Tooltip label={hasLogic ? logicLine : "Show this question only after a chosen answer, or only to some employees"} wrapClass="bmq-who-tt">
                <button type="button" className={"sel-btn bmq-who" + (hasLogic ? " is-some" : "")} aria-haspopup="dialog"
                  onClick={() => (logicInPlace ? setLogicFor(q.id) : onOpenLogic && onOpenLogic(q.id))}>
                  {hasLogic && <span className="bmq-who-ic"><Icon name="eye" size={16} /></span>}
                  <span className="sel-btn-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {hasLogic ? `Some · ${ownLogic.conditions.length} ${ownLogic.conditions.length === 1 ? "condition" : "conditions"}` : "Everyone"}
                  </span>
                  <span className="spacer" />
                  <Icon name="chevron-right" size={16} />
                </button>
              </Tooltip>
            )}
          </div>
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
