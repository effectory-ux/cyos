// BenchmarkQuestionDialog.jsx — "Benchmarked question" (Figma 6271:7232).
// The one dialog for standard questions, using the custom-question-dialog
// format: selects on top, a respondent-style preview card in the middle, and a
// language list on the right. Locked things LOOK locked (Answer type is a
// disabled select); constrained edits LOOK like choices — the question text and
// description in the preview are selects whose dropdowns list the
// Effectory-approved alternatives (Figma 6271:9052). Everything is staged and
// committed with Save; all changes are survey-scoped.
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";
import { QTypeIcon, Tooltip, ThemeTag, themesOf, byCompleteFirst, useMediaQuery, MiniSelect, AddQuestionsMenu, RequiredMarker, FollowUpNote, useFlipUp } from "./shared.jsx";
import { LANG_STATUS, LangPanel, AutoTextarea } from "./CustomQuestionDialog.jsx";
import { QTYPES, SCALE_LABELS, answerOptionsOf } from "../data/data.js";
import { CHARACTERISTICS, characteristicOf } from "../data/characteristics.js";
import { conditionOK, conditionOfType, conditionBroken, logicBroken, logicSummary, activeConditions, followUpOf, coveredAnswers, takenAnswers } from "../data/logic.js";
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

// ---- Conditional logic (Figma 6316:27977) ----------------------------------
// Jamal's structure: conditions are compact select-rows inside grey cards —
// subject on top, then "Is / Is not" + the chosen answers in a dropdown. Two
// fixed cards per question (an earlier answer, the audience), each with a
// neutral "no condition" first option, so there are no add/remove buttons at
// all. Nothing more, nothing less.

// Multi-select for a condition's answers/values: a select-shaped button whose
// menu holds checkboxes; it stays open while picking, the scrim closes it.
function LgcValues({ options, picked, onToggle, placeholder, invalid, taken }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const up = useFlipUp(open, wrapRef);
  const label = picked.map(i => options[i]).filter(Boolean).join(" or ");
  return (
    <div ref={wrapRef} className="cq-menu-wrap is-block">
      <button type="button" className={"sel-btn" + (open ? " is-pressed" : "") + (invalid ? " is-error" : "")}
        aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Icon name="filter" size={16} className="lgc-filter-ic" />
        <span className={label ? "sel-btn-name" : "cq-sel-placeholder"}
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label || placeholder}
        </span>
        <span className="spacer" />
        <Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <>
          <div className="cq-menu-scrim" onMouseDown={() => setOpen(false)} />
          <div className={"menu cq-menu-pop" + (up ? " is-up" : "")} role="listbox" aria-multiselectable="true"
            style={{ zIndex: 3, maxHeight: 260, overflowY: "auto" }}>
            {options.map((o, i) => {
              // An answer another follow-up already covers can't be picked.
              const off = !!(taken && taken.has(i)) && !picked.includes(i);
              return (
              <div key={i} role="option" aria-selected={picked.includes(i)} aria-disabled={off || undefined}
                className={"menu-item" + (picked.includes(i) ? " is-selected" : "") + (off ? " is-disabled" : "")}
                onClick={() => { if (!off) onToggle(i); }}>
                <span className="cb-wrap" style={{ pointerEvents: "none" }}>
                  <input type="checkbox" className="cb" checked={picked.includes(i)} readOnly tabIndex={-1} />
                </span>
                <span className="menu-item-body"><span className="menu-item-title">{o}</span>
                  {off && <span className="menu-item-sub">Already triggers a follow-up question</span>}</span>
              </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const OP_ITEMS = [{ value: "is", label: "Is" }, { value: "not", label: "Is not" }];

// One subject's rule: the two condition cards. The subject is a question or —
// since topics became selectable in the rail — a whole topic (`noun` keeps the
// copy honest). `onChange` gets the whole normalized logic (or null when both
// cards sit on their neutral option).
function LogicRulePane({ selected, logic, earlier, showErrors, noun = "question", inherited, locked, about, followUps, canFollowUp, followUpBlocked, onStartFollowUp, onOpenFollowUp, startDraft = false, fuTaken, siblingTaken, onChange }) {
  // The FORWARD flow (Jamal's tester feedback): from this question, add a
  // direct follow-up. It is added the way every question is — the Add
  // questions menu: the question library, or a custom question with its
  // guidelines and similar-question check — and arrives right after this
  // question, linked to it; the Logic dialog then opens on it to choose the
  // answers that trigger it.
  // Conditions come first: "Add follow-up question" opens a draft condition
  // card (the same card as the conditions above, with its own remove), and
  // only with answers chosen does Add question open the usual menu.
  const [draft, setDraft] = useState(startDraft ? { op: "is", answers: [] } : null);
  const [draftErr, setDraftErr] = useState(null);
  const [fuMenu, setFuMenu] = useState(false);
  const fuWrapRef = useRef(null);
  const fuUp = useFlipUp(fuMenu, fuWrapRef);
  const myOpts = answerOptionsOf(selected);
  const discardDraft = () => { setDraft(null); setDraftErr(null); setFuMenu(false); };
  const openFuMenu = () => {
    if (!draft.answers.length) { setDraftErr("Choose at least one answer"); return; }
    if (fuTaken && coveredAnswers(draft, myOpts.length).some(i => fuTaken.has(i))) {
      setDraftErr("Some of these answers already trigger a follow-up question"); return;
    }
    setFuMenu(o => !o);
  };
  const startFu = (source) => { const fu = draft; discardDraft(); onStartFollowUp(fu, source); };
  const followUpBlock = onStartFollowUp ? (
    <div className="lgc-fu">
      <div className="lgc-sec-head">
        <div className="lgc-sec-title">Trigger follow-up questions</div>
        <p className="lgc-sec-desc">Follow-up questions are linked to this question and come right after it.</p>
      </div>
      {(followUps || []).length > 0 && (
        <div className="lgc-fu-list">
          {followUps.map(f => (
            <button key={f.id} type="button" className="lgc-fu-row" onClick={() => onOpenFollowUp && onOpenFollowUp(f.id)}>
              <span className="lgc-fu-body">
                <span className="lgc-fu-text">{f.text}</span>
                <span className="lgc-fu-sub">{f.line}</span>
              </span>
              <QTypeIcon type={f.type} size={24} />
              <Icon name="chevron-right" size={16} />
            </button>
          ))}
        </div>
      )}
      {!canFollowUp ? (
        <span className="lgc-hint">{followUpBlocked}</span>
      ) : draft ? (
        <div className={"lgc-card" + (draftErr ? " is-invalid" : "")}>
          <div className="lgc-card-head">
            <div className="lgc-card-lbl">Answers that trigger the follow-up question</div>
            <Tooltip label="Remove condition" pos="is-left">
              <button type="button" className="ib ib-24 ib-tertiary" aria-label="Remove condition" onClick={discardDraft}>
                <Icon name="trash" size={16} />
              </button>
            </Tooltip>
          </div>
          <div className="lgc-row">
            <MiniSelect ariaLabel="Is or is not" value={draft.op} items={OP_ITEMS} onChange={(op) => setDraft(d => ({ ...d, op }))} />
            <LgcValues options={myOpts} picked={draft.answers} placeholder="Choose answers" invalid={!!draftErr}
              taken={draft.op === "is" ? fuTaken : null}
              onToggle={(i) => { setDraftErr(null); setDraft(d => ({ ...d, answers: d.answers.includes(i) ? d.answers.filter(x => x !== i) : [...d.answers, i].sort((x, y) => x - y) })); }} />
          </div>
          {draftErr && <span className="lgc-err">{draftErr}</span>}
          <div className="lgc-fu-add-wrap" ref={fuWrapRef}>
            <button type="button" className={"btn btn-secondary" + (fuMenu ? " is-pressed" : "")}
              aria-haspopup="menu" aria-expanded={fuMenu} onClick={openFuMenu}>
              <Icon name="plus" size={16} />Add question
            </button>
            {fuMenu && (
              <>
                <div className="cq-menu-scrim" onMouseDown={() => setFuMenu(false)} />
                <AddQuestionsMenu className={"lgc-fu-menu" + (fuUp ? " is-up" : "")} onPick={() => setFuMenu(false)}
                  onLibrary={() => startFu("library")} onCustom={() => startFu("custom")} />
              </>
            )}
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-tertiary lgc-fu-start" onClick={() => setDraft({ op: "is", answers: [] })}>
          <Icon name="plus" size={16} />Add follow-up question
        </button>
      )}
    </div>
  ) : null;
  // The heading: a topic carries its question count as a tag (how much the
  // rule touches); the description, when there is one, sits under the title.
  // Questions get no metadata here — the title and description identify them.
  const head = (
    <div className="lgc-head">
      <div className="lgc-head-row">
        <h3 className="lgc-subject">{selected.text}</h3>
        {about && about.kind === "topic" && (
          <span className="infotag is-alt lgc-count">{about.count} {about.count === 1 ? "question" : "questions"}</span>
        )}
      </div>
      {about && about.desc && <p className="lgc-desc">{about.desc}</p>}
    </div>
  );
  const answer = conditionOfType(logic, "answer");
  const audience = conditionOfType(logic, "attribute");
  const emit = (a, b) => {
    const conditions = [a, b].filter(Boolean);
    onChange(conditions.length ? { conditions } : null);
  };
  const setAnswer = (next) => emit(next, audience);
  const setAudience = (next) => emit(answer, next);
  // The topic's rule reaches every question under it — say so on the question
  // itself (a DS inline notification), with where it comes from and a way to
  // the topic's own pane.
  const inheritNote = inherited && (
    <div className="inline-notif is-info is-one-liner">
      <img className="inline-notif-icon" alt="" width="24" height="24" src="assets/icons/notification-information.svg" />
      <div className="inline-notif-content">
        <div className="inline-notif-text">
          From the topic <b>“{inherited.name}”</b>: {inherited.line.charAt(0).toLowerCase() + inherited.line.slice(1)}.
        </div>
        {inherited.onEdit && (
          <div className="inline-notif-actions">
            <button type="button" className="btn btn-secondary" onClick={inherited.onEdit}>Edit</button>
          </div>
        )}
      </div>
    </div>
  );
  // Locked subjects (a required question, a topic of only required questions)
  // get the why as an inline notification instead of empty condition cards.
  if (locked) {
    return (
      <>
        {head}
        {inheritNote}
        <div className="inline-notif is-info">
          <img className="inline-notif-icon" alt="" width="24" height="24" src="assets/icons/notification-information.svg" />
          <div className="inline-notif-content">
            <div className="inline-notif-text">
              <span className="inline-notif-title">{locked.title}</span>
              <span className="inline-notif-msg">{locked.msg}</span>
            </div>
          </div>
        </div>
        {/* A required question is everyone's — which makes it the safest
            trigger there is, so follow-ups stay available. */}
        {followUpBlock}
      </>
    );
  }
  const trigger = answer ? earlier.find(x => x.id === answer.trigger) : null;
  const triggerOpts = answerOptionsOf(trigger);
  const attr = audience ? characteristicOf(audience.attribute) : null;
  // A broken condition (its question left or moved below) warns right away —
  // no showErrors needed: the creator should see it the moment the pane opens.
  const answerBroken = conditionBroken(answer, earlier);
  // A follow-up's answers can't overlap what its siblings already cover —
  // shown right away, like a broken condition.
  const overlaps = !!(answer && answer.followUp && trigger && siblingTaken
    && coveredAnswers(answer, triggerOpts.length).some(i => siblingTaken.has(i)));
  const answerErr = answerBroken
    ? "This points to a question that was removed or now comes later. Choose another question, or reset the logic."
    : overlaps ? "Some of these answers already trigger another follow-up question"
    : showErrors && answer && (!trigger ? "Choose an earlier question" : !(answer.answers || []).length ? "Choose at least one answer" : null);
  const audienceErr = showErrors && audience && !(audience.values || []).length ? "Choose at least one value" : null;
  // Typeform-style grouping: the earlier questions carry their topic as a
  // menu header, so a long list stays scannable.
  const earlierItems = [{ value: "", label: "No earlier answer — always asked" }];
  let lastGroup = null;
  earlier.forEach(x => {
    if (x._group && x._group !== lastGroup) { earlierItems.push({ header: true, label: x._group }); lastGroup = x._group; }
    earlierItems.push({ value: x.id, label: x.text, lead: <QTypeIcon type={x.type} size={16} />,
      disabled: !!x._cond, sub: x._cond ? "Shown conditionally — remove its logic first" : undefined });
  });
  // A follow-up's answer condition speaks the follow-up language (the same
  // fact as the trigger's list): its question is fixed — it IS the link —
  // only the answers can change. Reset logic unlinks it.
  const isFollowUp = !!(answer && answer.followUp && trigger && !answerBroken);
  // Each condition can go on its own; on a follow-up that unlinks it — the
  // question stays, now asked to everyone in its place.
  const removeBtn = (onRemove) => (
    <Tooltip label="Remove condition" pos="is-left">
      <button type="button" className="ib ib-24 ib-tertiary" aria-label="Remove condition" onClick={onRemove}>
        <Icon name="trash" size={16} />
      </button>
    </Tooltip>
  );
  return (
    <>
      {head}
      {inheritNote}
      <div className="lgc-sec">
      <div className="lgc-sec-title">Conditions to show this {noun}</div>
      <div className={"lgc-card" + (answerErr ? " is-invalid" : "")}>
        <div className="lgc-card-head">
          {isFollowUp
            ? <div className="lgc-card-lbl is-followup"><Icon name="split" size={14} />Follow-up to “{trigger.text}”</div>
            : <div className="lgc-card-lbl">Answer to an earlier question</div>}
          {answer && removeBtn(() => setAnswer(null))}
        </div>
        {!isFollowUp && (
          <>
            <MiniSelect ariaLabel="Earlier question" value={answer ? answer.trigger : ""} block
              placeholder={answerBroken ? "Question no longer available" : undefined}
              items={earlierItems}
              onChange={(id) => setAnswer(id ? { type: "answer", trigger: id, op: (answer && answer.op) || "is", answers: [] } : null)} />
          </>
        )}
        {answer && trigger && (
          <div className="lgc-row">
            <MiniSelect ariaLabel="Is or is not" value={answer.op || "is"} items={OP_ITEMS}
              onChange={(op) => setAnswer({ ...answer, op })} />
            <LgcValues options={triggerOpts} picked={answer.answers || []} placeholder="Choose answers"
              invalid={!!answerErr} taken={answer.followUp && (answer.op || "is") === "is" ? siblingTaken : null} onToggle={(i) => {
                const cur = answer.answers || [];
                setAnswer({ ...answer, answers: cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i].sort((a, b) => a - b) });
              }} />
          </div>
        )}
        {isFollowUp && <span className="lgc-hint">{(answer.answers || []).length
          ? "Comes right after the linked question when the answer matches"
          : "Choose the answers that trigger this follow-up question"}</span>}
        {earlier.length === 0 && !answer && (
          <span className="lgc-hint">Nothing comes before this {noun} yet, so there is no earlier answer to use</span>
        )}
        {answerErr && <span className="lgc-err">{answerErr}</span>}
      </div>
      <div className={"lgc-card" + (audienceErr ? " is-invalid" : "")}>
        <div className="lgc-card-head">
          <div className="lgc-card-lbl">Employee data</div>
          {audience && removeBtn(() => setAudience(null))}
        </div>
        <MiniSelect ariaLabel="Who gets this question" value={audience ? audience.attribute : ""} block
          items={[{ value: "", label: "Shown to everyone" },
            ...CHARACTERISTICS.map(a => ({ value: a.key, label: a.label, lead: <Icon name="user" size={16} /> }))]}
          onChange={(key) => setAudience(key ? { type: "attribute", attribute: key, op: (audience && audience.op) || "is", values: [] } : null)} />
        {audience && attr && (
          <div className="lgc-row">
            <MiniSelect ariaLabel="Is or is not" value={audience.op || "is"} items={OP_ITEMS}
              onChange={(op) => setAudience({ ...audience, op })} />
            <LgcValues options={attr.values} picked={audience.values || []} placeholder="Choose values"
              invalid={!!audienceErr} onToggle={(i) => {
                const cur = audience.values || [];
                setAudience({ ...audience, values: cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i].sort((a, b) => a - b) });
              }} />
          </div>
        )}
        {audienceErr && <span className="lgc-err">{audienceErr}</span>}
      </div>
      </div>
      {answer && audience && <span className="lgc-hint">Both must match for the {noun} to show</span>}
      {followUpBlock}
    </>
  );
}

// Variant surface (toolbar: "Question logic inside the question dialog"):
// the question dialog flips in place to ONE question's rule — the back link
// shares the close button's line, and the subject line says whose logic this
// is. No rail: hopping questions belongs to the standalone dialog.
function LogicEditor({ q, logic, onChange, earlier, inherited, about, onClose }) {
  const [showErrors, setShowErrors] = useState(false);
  const incomplete = ((logic && logic.conditions) || []).some(c => !conditionOK(c, earlier));
  const done = () => {
    if (incomplete) { setShowErrors(true); return; }
    setShowErrors(false); onClose();
  };
  return (
    <>
      <div className="lgc-top">
        <button type="button" className="lgc-back" onClick={done}><Icon name="arrow-left" size={16} />Back to question</button>
      </div>
      <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
        <h2 className="dialog-title">Logic</h2>
        <p className="dialog-subtitle">Decide who gets this question. Changes are saved with the question.</p>
      </div>
      <div className="lgc-main scroll-y">
        <LogicRulePane selected={q} logic={logic} earlier={earlier} inherited={inherited} about={about} showErrors={showErrors}
          locked={q.required ? { title: "Everyone gets this question", msg: "It's required by the organization, so logic can't hide it." } : null}
          onChange={onChange} />
      </div>
      <div className="dialog-footer">
        <div className="spacer" />
        <button className="btn btn-primary" onClick={done}>Done</button>
      </div>
    </>
  );
}

// The DEFAULT logic surface (Figma 6316:27977): its own dialog — the
// questionnaire's questions on a rail, grouped by topic, the selected one's
// rule on the right. It owns its commit: Save applies every touched
// question's rule immediately, Cancel discards them all — independent of the
// question dialog's staging, so there is never a nested-save puzzle.
export function QuestionLogicDialog({ sections = [], initialId, initialDraft = false, focused = false, logicByQuestion = {}, logicByTopic = {}, onApply, onStartFollowUp, onClose, zIndex }) {
  // Opened from a row's "Add follow-up question": that question's pane starts
  // with the draft follow-up card open — once.
  const [draftFor, setDraftFor] = useState(initialDraft ? initialId : null);
  // `_group` rides along for the earlier-question menu's topic headers.
  const questions = sections.flatMap(s => s.items.map(x => ({ ...x, _group: s.label })));
  // The rail selects questions AND topics (a topic's rule gates its whole
  // group). One key space: question ids as-is, topics as "t:<key>".
  const tKey = (k) => "t:" + k;
  const isTopic = (key) => typeof key === "string" && key.startsWith("t:");
  const [selectedKey, setSelectedKey] = useState(initialId || (questions[0] || {}).id);
  const [logicMap, setLogicMap] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const normLogic = (l) => (l && (l.conditions || []).length ? l : null);
  const baseOf = (key) => normLogic((isTopic(key) ? logicByTopic[key.slice(2)] : logicByQuestion[key]) || null);
  const logicOf = (key) => (Object.prototype.hasOwnProperty.call(logicMap, key) ? logicMap[key] : baseOf(key));
  const orderIndex = {}; questions.forEach((x, i) => { orderIndex[x.id] = i; });
  // Earlier answers a rule may use: everything before the question — or, for
  // a topic, before its first question (empty topics can use the whole list
  // that precedes their spot, which is everything until they get questions).
  const earlierFor = (key) => {
    let cut;
    if (isTopic(key)) {
      const s = sections.find(x => tKey(x.key) === key);
      const first = s && s.items[0];
      cut = first ? orderIndex[first.id] : questions.length;
    } else cut = orderIndex[key] ?? 0;
    return questions.slice(0, cut).filter(x => answerOptionsOf(x).length > 0)
      .map(x => ({ ...x, _cond: condShown(x) }));
  };
  // A question whose own visibility is conditional (its rule, or its topic's)
  // can't be a TRIGGER: participants might never see it. Removing that logic
  // frees it again. Raw presence counts — half-made logic blocks too.
  const condShown = (q2) => {
    const own = logicOf(q2.id);
    if (own && (own.conditions || []).length) return true;
    const s2 = sections.find(s3 => s3.items.some(i => i.id === q2.id));
    const tl = s2 && logicOf(tKey(s2.key));
    return !!(tl && (tl.conditions || []).length);
  };
  const section = isTopic(selectedKey) ? sections.find(x => tKey(x.key) === selectedKey) : null;
  const selected = section
    ? { text: section.label }
    : questions.find(x => x.id === selectedKey) || questions[0];
  const selKey = section ? selectedKey : selected.id;
  const logic = logicOf(selKey);
  const update = (next) => setLogicMap(m => ({ ...m, [selKey]: next }));
  // Leaving the selected question or topic — a rail hop, Save or the close
  // paths — holds one bar: no half-finished condition may be left anywhere.
  // Exception: a rule the user didn't touch may be left as it was found, so
  // logic that BROKE while the dialog was closed never traps anyone here.
  const canLeave = () => {
    const untouched = JSON.stringify(normLogic(logicOf(selKey))) === JSON.stringify(baseOf(selKey));
    const conditions = (logic && logic.conditions) || [];
    const fa = conditionOfType(logic, "answer");
    const overlap = !!(fa && fa.followUp && !untouched && (() => {
      const t = questions.find(x => x.id === fa.trigger); if (!t) return false;
      const taken = takenFor(fa.trigger, selKey);
      return coveredAnswers(fa, answerOptionsOf(t).length).some(i => taken.has(i));
    })());
    if (!overlap && (untouched || conditions.every(c => conditionOK(c, earlierFor(selKey))))) { setShowErrors(false); return true; }
    setShowErrors(true); return false;
  };
  const hop = (key) => { if (key !== selKey && canLeave()) { setShowErrors(false); setDraftFor(null); setSelectedKey(key); } };
  const commit = () => {
    const qPatches = {}, tPatches = {};
    Object.keys(logicMap).forEach(key => {
      if (JSON.stringify(normLogic(logicMap[key])) === JSON.stringify(baseOf(key))) return;
      if (isTopic(key)) tPatches[key.slice(2)] = normLogic(logicMap[key]);
      else qPatches[key] = normLogic(logicMap[key]);
    });
    if (Object.keys(qPatches).length + Object.keys(tPatches).length) onApply({ questions: qPatches, topics: tPatches });
  };
  const save = () => {
    if (!canLeave()) return;
    commit();
    onClose();
  };
  // A follow-up's question comes from the library or the custom question
  // dialog, opened on top of this one — which stays open, edits and all.
  const launchFollowUp = (fu, source) => onStartFollowUp(selected, fu, source);
  // hasAny sees every condition (the Remove-all sweep must catch half-made
  // and broken ones too); hasRule is what earns a BADGE — at least one
  // COMPLETE condition (subject and value both chosen), or a broken one that
  // needs the red flag. A half-picked condition is editing, not a rule.
  const hasAny = (key) => { const l = logicOf(key); return !!(l && (l.conditions || []).length); };
  const isBroken = (key) => logicBroken(logicOf(key), earlierFor(key));
  // What a trigger's follow-ups already cover (one follow-up per answer).
  const takenFor = (triggerId, exceptId) => {
    const t = questions.find(x => x.id === triggerId);
    return takenAnswers(triggerId, exceptId, questions, logicOf, t ? answerOptionsOf(t).length : 0);
  };
  const hasFollowUps = (id) => questions.some(x => {
    const a = conditionOfType(logicOf(x.id), "answer");
    return a && a.followUp && a.trigger === id;
  });
  // A follow-up's depth in its chain — the rail indents it under its question.
  const fuDepthOf = (id, n = 0) => {
    const a = conditionOfType(logicOf(id), "answer");
    if (!a || !a.followUp || !questions.some(x => x.id === a.trigger) || n > 6) return n;
    return fuDepthOf(a.trigger, n + 1);
  };
  const hasRule = (key) => activeConditions(logicOf(key), earlierFor(key)).length > 0 || isBroken(key)
    || !!(conditionOfType(logicOf(key), "answer") || {}).followUp;
  // Locked subjects: a required question, or a topic holding only required
  // questions — logic can't hide any of it, and the pane says why.
  const lockedFor = () => {
    if (section) {
      return section.items.length > 0 && section.items.every(x => x.required)
        ? { title: "Everyone gets this topic", msg: "All its questions are required by the organization, so logic can't hide them." }
        : null;
    }
    return selected.required
      ? { title: "Everyone gets this question", msg: "It's required by the organization, so logic can't hide it." }
      : null;
  };
  // The selected question's follow-ups: the questions LINKED to it (made as
  // its follow-ups) — the forward view of their rules, hop-able. A question
  // that merely looks back at this one's answer, further on, is a condition
  // of its own, not a follow-up.
  const followUpsFor = () => {
    if (section) return null;
    const opts = answerOptionsOf(selected);
    const list = new Intl.ListFormat("en", { type: "disjunction" });
    return questions.filter(x => {
      const a = conditionOfType(logicOf(x.id), "answer");
      return a && a.followUp && a.trigger === selKey;
    }).map(x => {
      const a = conditionOfType(logicOf(x.id), "answer");
      const answers = list.format((a.answers || []).map(i => opts[i]).filter(Boolean));
      // Whole sentences per case, the answers as the one inserted value.
      return { id: x.id, text: x.text, type: x.type,
        line: !answers ? "No answers chosen yet"
          : a.op === "not" ? `When the answer isn't ${answers}` : `When the answer is ${answers}` };
    });
  };
  // Any question with fixed answer options can trigger follow-ups — also one
  // that is shown conditionally itself: its follow-ups simply show only to
  // the people who got it and answered that way.
  const followUpBlockedWhy = () => {
    if (section) return null;
    if (!answerOptionsOf(selected).length) return "Text answers can't trigger follow-up questions";
    // One follow-up per ANSWER: once every answer triggers one, that's it.
    const opts = answerOptionsOf(selected).length;
    if (takenAnswers(selKey, null, questions, logicOf, opts).size >= opts) return "Every answer already triggers a follow-up question";
    return null;
  };
  // Remove all logic: stage a null for every rule, questions and topics both.
  // Save commits it; Cancel still walks away from the whole sweep.
  const anyRule = questions.some(x => hasAny(x.id)) || sections.some(s => hasAny(tKey(s.key)));
  const removeAll = () => {
    const sweep = {};
    questions.forEach(x => { if (hasAny(x.id)) sweep[x.id] = null; });
    sections.forEach(s => { if (hasAny(tKey(s.key))) sweep[tKey(s.key)] = null; });
    setLogicMap(m => ({ ...m, ...sweep }));
    setShowErrors(false);
  };
  // What the selected question inherits from its topic's rule, if any —
  // shown on the question's pane with a hop to the topic.
  const inheritedFor = () => {
    if (section) return null;
    const s = sections.find(x => x.items.some(i => i.id === selKey));
    if (!s) return null;
    const rule = logicOf(tKey(s.key));
    const live = activeConditions(rule, earlierFor(tKey(s.key)));
    if (!live.length) return null;
    return { name: s.label, line: logicSummary({ conditions: live }, earlierFor(tKey(s.key))), onEdit: () => hop(tKey(s.key)) };
  };
  // The rail must show WHOSE logic is open: keep the selected row in
  // view (centered on open, nudged on hops). Positioned via layout offsets —
  // scrollIntoView would drag every ancestor, and rects lie during the
  // dialog's rise animation — and re-run once after it, because scroll
  // anchoring can pin a freshly rendered rail to its bottom.
  const selRef = useRef(null);
  const railRef = useRef(null);
  const firstScroll = useRef(true);
  useEffect(() => {
    const rail = railRef.current;
    const place = () => {
      const sel = selRef.current;
      if (!rail || !sel) return;
      // The sticky title floats over the top rows: anything scrolled under it
      // is invisible, so "in view" starts below it.
      const headH = (rail.querySelector(".lgc-title") || {}).offsetHeight || 0;
      if (firstScroll.current) {
        rail.scrollTop = Math.max(0, sel.offsetTop - headH - (rail.clientHeight - headH - sel.offsetHeight) / 2);
        return;
      }
      const top = sel.offsetTop - rail.scrollTop;
      if (top < headH + 8) rail.scrollTop = sel.offsetTop - headH - 8;
      else if (top + sel.offsetHeight > rail.clientHeight - 8) rail.scrollTop = sel.offsetTop + sel.offsetHeight - rail.clientHeight + 8;
    };
    // Guard the position for as long as the dialog lives: the host page's
    // deferred smooth-scrolls (queued while the pane is hidden, resumed when
    // it shows) can throw the rail, so any scroll that was not the user's and
    // loses the selected row gets corrected on the next frame.
    let touched = false;
    const mark = () => { touched = true; };
    const onScroll = () => {
      if (touched) return;
      const sel = selRef.current;
      if (!rail || !sel) return;
      const headH = (rail.querySelector(".lgc-title") || {}).offsetHeight || 0;
      const top = sel.offsetTop - rail.scrollTop;
      if (top + sel.offsetHeight < headH || top > rail.clientHeight) requestAnimationFrame(place);
    };
    rail && rail.addEventListener("wheel", mark, { passive: true });
    rail && rail.addEventListener("pointerdown", mark);
    rail && rail.addEventListener("scroll", onScroll, { passive: true });
    place();
    const t = setTimeout(() => { place(); firstScroll.current = false; }, 320);
    return () => {
      clearTimeout(t);
      rail && rail.removeEventListener("wheel", mark);
      rail && rail.removeEventListener("pointerdown", mark);
      rail && rail.removeEventListener("scroll", onScroll);
    };
  }, [selKey]);
  const pane = (
    <LogicRulePane key={selKey} selected={selected} logic={logic} earlier={earlierFor(selKey)} startDraft={draftFor === selKey}
      fuTaken={section ? null : takenFor(selKey, null)}
      siblingTaken={(() => { const fa = conditionOfType(logic, "answer"); return fa && fa.followUp ? takenFor(fa.trigger, selKey) : null; })()}
      noun={section ? "topic" : "question"} inherited={inheritedFor()} locked={lockedFor()}
      about={section
        ? { kind: "topic", count: section.items.length, desc: section.desc }
        : { kind: "question", desc: selected._desc }}
      followUps={followUpsFor()} canFollowUp={!followUpBlockedWhy()} followUpBlocked={followUpBlockedWhy()}
      onStartFollowUp={!section && onStartFollowUp ? launchFollowUp : undefined}
      onOpenFollowUp={hop}
      showErrors={showErrors} onChange={update} />
  );
  // Opened FROM a question (its dialog, its row, a follow-up's note): a
  // simplified view of just that question's logic — no rail. The bar's
  // Logic button opens the full dialog with every question on the rail.
  if (focused) {
    return (
      <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: zIndex || 70 }}
        onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="dialog lgc-focus" role="dialog" aria-modal="true" aria-labelledby="lgc-title">
          <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
            <button className="dialog-close" aria-label="Close" onClick={onClose}><Icon name="cross" /></button>
          </Tooltip>
          <div className="dialog-header is-sm"><h2 className="dialog-title" id="lgc-title">Logic</h2></div>
          <div className="lgc-main scroll-y">
            {pane}
          </div>
          <div className="dialog-footer">
            <div className="spacer" />
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: zIndex || 70 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog dialog-worksurface bmq-dialog lgc-dialog" role="dialog" aria-modal="true" aria-labelledby="lgc-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onClose}><Icon name="cross" /></button>
        </Tooltip>
        <div className="lgc-layout">
          <div className="lgc-rail scroll-y" ref={railRef}>
            <h2 className="lgc-title" id="lgc-title">Logic</h2>
            {sections.map(s => {
              const topicRuled = hasRule(tKey(s.key));
              const topicBroken = topicRuled && isBroken(tKey(s.key));
              return (
                <div key={s.key} className="lgc-group" role="listbox" aria-label={s.label}>
                  <button type="button" role="option" aria-selected={tKey(s.key) === selKey}
                    ref={tKey(s.key) === selKey ? selRef : undefined}
                    className={"lgc-q is-topic" + (tKey(s.key) === selKey ? " is-selected" : "")} onClick={() => hop(tKey(s.key))}>
                    <span className="lgc-q-text">{s.label}</span>
                    {topicRuled && <span className={"lgc-q-mark " + (topicBroken ? "is-broken" : "is-topic-rule")}><Icon name="split" size={14} /></span>}
                  </button>
                  {s.items.map(x => (
                    <button key={x.id} type="button" role="option" aria-selected={x.id === selKey}
                      ref={x.id === selKey ? selRef : undefined}
                      className={"lgc-q" + (x.id === selKey ? " is-selected" : "") + (fuDepthOf(x.id) ? " is-followup" : "")}
                      style={fuDepthOf(x.id) ? { "--fu-depth": fuDepthOf(x.id) } : undefined} onClick={() => hop(x.id)}>
                      {/* The builder's follow-up icon, so a follow-up reads the same in both. */}
                      {fuDepthOf(x.id) > 0 && (
                        <Tooltip label="Follow-up question" pos="is-right">
                          <span className="lgc-q-fu-ic" aria-label="Follow-up question"><Icon name="follow-up" size={16} /></span>
                        </Tooltip>
                      )}
                      <span className="lgc-q-text">{x.text}</span>
                      {/* A ruled topic's badge is NOT repeated on its
                          questions (Jamal) — the pane's inherited note
                          carries the origin when one is selected. */}
                      {x.required
                        ? <RequiredMarker size={20} />
                        : isBroken(x.id) ? <span className="lgc-q-mark is-broken"><Icon name="split" size={14} /></span>
                        // A follow-up's indent and connector already say it;
                        // a question WITH follow-ups gets the badge.
                        : (hasRule(x.id) && !fuDepthOf(x.id)) || hasFollowUps(x.id) ? <span className="lgc-q-mark is-own"><Icon name="split" size={14} /></span> : null}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="lgc-main scroll-y">
            {pane}
          </div>
        </div>
        <div className="dialog-footer">
          {anyRule && (
            <button className="btn btn-link-delete" onClick={removeAll}>
              <Icon name="trash" size={16} />Remove all logic
            </button>
          )}
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

export function BenchmarkQuestionDialog({ q, meta = {}, topicKey, topicOptions = [], themeInfo, themeInfoFor, design, allVariants = false, allQuestions = [], logicByQuestion = {}, logicInPlace = false, topicLogic = null, onOpenLogic, onCancel, onSave, onDetach, onOpenTheme }) {
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
  // Same trigger bar as the standalone dialog: a conditionally shown question
  // (own staged rule, or `_condTopic` from the builder) can't be a trigger.
  const earlierFor = (id) => allQuestions.slice(0, orderIndex[id] ?? 0)
    .filter(x => answerOptionsOf(x).length > 0)
    .map(x => { const l = logicOf(x.id); return { ...x, _cond: !!(l && (l.conditions || []).length) || !!x._condTopic }; });
  const changedLogicIds = Object.keys(logicMap)
    .filter(id => JSON.stringify(normLogic(logicMap[id])) !== JSON.stringify(baseLogicOf(id)));
  // The field and the header chip only count COMPLETE conditions — subject
  // and value both chosen. A half-picked condition is editing, not a rule.
  const ownLogic = normLogic(logicOf(q.id));
  const liveOwn = activeConditions(ownLogic, earlierFor(q.id));
  const hasLogic = liveOwn.length > 0;
  // A follow-up says so on its own dialog — also before its answers are
  // chosen (then the link is all it has).
  const followUp = followUpOf(ownLogic, allQuestions);
  const logicLine = hasLogic ? logicSummary({ conditions: liveOwn }, earlierFor(q.id)) : "";
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
          <LogicEditor q={q} logic={logicOf(q.id)} earlier={earlierFor(q.id)} inherited={topicLogic}
            about={{ kind: "question", desc: desc || undefined }}
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
            {/* Every theme the question counts for: the dialog has the room the
                row doesn't. */}
            {byCompleteFirst(themesOf(q), themeInfoFor || ((n) => (n === q.theme ? themeInfo : null))).map(n => {
              const i = themeInfoFor ? themeInfoFor(n) : (n === q.theme ? themeInfo : null);
              return <ThemeTag key={n} theme={n} kept={i ? i.kept : 0} total={i ? i.total : 0} pos="is-below"
                onOpen={onOpenTheme ? () => onOpenTheme(n) : undefined} />;
            })}
            {q.required && <span className="infotag is-alt"><Icon name="asterisk" size={12} />Required</span>}
            {(hasLogic || followUp) && <span className="infotag is-logic"><Icon name="split" size={12} />Logic</span>}
          </div>
          <h2 className="dialog-title" id="bmq-title">{title}</h2>
        </div>

        {followUp && <FollowUpNote info={followUp} onEdit={() => (logicInPlace ? setLogicFor(q.id) : onOpenLogic && onOpenLogic(q.id))} />}
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
            <span className="bmq-lbl">Logic</span>
            {q.required ? (
              <div className="bmq-type-disabled" aria-disabled="true" title="It's required, so everyone gets this question">
                <Icon name="asterisk" size={14} />
                <span>Everyone</span>
                <span className="spacer" />
                <Icon name="chevron-right" size={16} />
              </div>
            ) : (
              <Tooltip label={hasLogic ? logicLine : followUp ? "Choose the answers that trigger this question" : "Show this question only after a chosen answer, or only to some employees"} wrapClass="bmq-who-tt">
                <button type="button" className={"sel-btn bmq-who" + (hasLogic ? " is-some" : "")} aria-haspopup="dialog"
                  onClick={() => (logicInPlace ? setLogicFor(q.id) : onOpenLogic && onOpenLogic(q.id))}>
                  <span className="bmq-who-ic"><Icon name="split" size={16} /></span>
                  <span className="sel-btn-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {followUp ? "Follow-up question" : hasLogic ? `Some · ${liveOwn.length} ${liveOwn.length === 1 ? "condition" : "conditions"}` : "Everyone"}
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
