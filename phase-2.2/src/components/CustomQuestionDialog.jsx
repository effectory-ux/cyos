// CustomQuestionDialog.jsx — "Custom question" dialog (Engage DS, Figma 6248:26489)
// Layout: Answer type + Add to topic selects on top; below them a framed body
// with a live respondent-eye preview of the question on the LEFT and the
// survey's languages on the RIGHT. Under ~1160px the language list collapses
// into a "Languages" dropdown above the preview (Figma 6246:26163).
//
// Ported from phase 1, wired to THIS phase's own language model (data/i18n.js)
// so the dialog and the survey-level TranslationsDialog share one list and one
// translator. Phase-2 extras kept: survey-scoped topics ({value,label}) and
// custom multiple-choice answer options.
//
// Translation model: the primary language is the source of truth. Leaving a
// primary field re-translates every other language automatically. Every
// translation stays editable, always.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";
import { QTypeIcon, Tooltip, useMediaQuery, MiniSelect } from "./shared.jsx";
import { useAnchorMenu, AnchorConfirm, CONFIRM_GAP } from "./AnchorMenu.jsx";
import { QTYPES, TOPICS } from "../data/data.js";
import { similarQuestions } from "../data/similar.js";
import { semanticSimilar, warmUpSemantic } from "../data/semantic.js";
import { checkQuestion, isNegative, GUIDE_URL } from "../data/questionCheck.js";
import {
  LANGUAGES, PRIMARY_LANGUAGE, OTHER_LANGUAGES, flagSrc, autoTranslation, scaleFor,
} from "../data/i18n.js";

// Below this the dialog can't hold a 240px side list next to the preview.
const COMPACT_QUERY = "(max-width: 1160px)";

// ---- 5-point scale preview (DS distribution colors) ---------------------
const SCALE_DOTS = [
  "var(--bg-distribution-strongly-disagree)",
  "var(--bg-distribution-disagree)",
  "var(--bg-distribution-neither)",
  "var(--bg-distribution-agree)",
  "var(--bg-distribution-strongly-agree)",
];
// The scale respondents see, in the language being previewed. Each point names
// itself on hover — the two ends are labelled, the middle three otherwise aren't.
function ScalePreview({ lang }) {
  const scale = scaleFor(lang);
  return (
    <div className="cq-scale">
      <div className="cq-scale-row">
        <span className="cq-scale-end">{scale.points[0]}</span>
        <div className="cq-dots">
          {SCALE_DOTS.map((c, i) => (
            <Tooltip key={i} label={scale.points[i]}>
              <span className="cq-dot" style={{ "--dot": c }} tabIndex={0} role="img"
                aria-label={scale.points[i]} />
            </Tooltip>
          ))}
        </div>
        <span className="cq-scale-end">{scale.points[4]}</span>
      </div>
      <span className="cq-idk">{scale.dontKnow}</span>
    </div>
  );
}

// Grows with its content instead of scrolling — the preview should always show
// the whole statement, and translations often run longer than the source.
function AutoTextarea({ value, ...rest }) {
  const ref = useRef(null);
  const lastWidth = useRef(0);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };
  useLayoutEffect(fit, [value]);
  // A width change (crossing the compact breakpoint, resizing the window)
  // re-wraps the text, so the height must be measured again — otherwise it
  // keeps whatever it was when the value last changed. Guarded on width so
  // setting the height in here can't feed back into the observer.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w === lastWidth.current) return;
      lastWidth.current = w;
      fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <textarea ref={ref} rows={1} value={value} {...rest} />;
}

const Flag = ({ lang }) => (
  <span className="cq-flag"><img src={flagSrc(lang.flag)} alt="" /></span>
);

const MANUAL_LABEL = "Manually translated";
const STALE_NOTE = "Manually translated — check if it’s still correct";
const joinNames = (langs) => {
  const names = langs.map(l => `${l.label} (${l.country})`);
  return names.length < 2 ? names[0] : names.slice(0, -1).join(", ") + " and " + names.at(-1);
};

// The question check, as a popover under the question while you write it.
// One block from the first click: before there's a question to judge, its
// rules are the tips for writing one (grey dots); as you type each turns green
// with a tick or red with a cross, with a suggested rewrite when one helps. A possible duplicate replaces it all with the match, as an offer: use
// it, or keep yours.
// Wording compared as people read it: case, punctuation and spacing aside.
const wording = (s) => (s || "").toLowerCase().replace(/[.,!?;:'"“”‘’]/g, "").replace(/\s+/g, " ").trim();

function QuestionCheck({ id, check, match, where, target, inTopic, kept, pending, scanning, showLibrary, onUseMatch, onMoveMatch, onKeepMine, onRewrite }) {
  const guide = <a className="link-inline qc-guide" href={GUIDE_URL} target="_blank" rel="noopener noreferrer">How to write a good question</a>;
  // The red rule whose reason is shown: the one you clicked, else the first.
  const [picked, setPicked] = useState(null);
  // The match's menu when it's already in the questionnaire — the question
  // library's own (see below).
  const menu = useAnchorMenu(130, "right", CONFIRM_GAP);
  useEffect(() => menu.close(), [match && match.id]); // eslint-disable-line
  const rows = [...check.rules];
  if (showLibrary) rows.push(!check.ready
    ? { key: "lib", label: "Not already in the library", status: "idle" }
    : pending
    ? { key: "lib", label: "Not already in the library", status: "idle" } // still searching: no spinner, it just waits
    : { key: "lib", label: kept ? "Your own wording, over a similar question" : "Not already in the library", status: "pass" });
  const clear = check.ready && !check.fails && !check.warns && !pending;
  // The heading only says it's at work, or that all is clear — the red dots
  // say what's left, so no count.
  const count = !check.ready ? null : scanning ? "Checking…" : clear ? "All clear" : null;
  const reds = rows.filter(r => r.status === "fail" || r.status === "warn");
  const shownFix = reds.find(r => r.key === picked) || reds[0] || null;
  const bench = match && match.bench;
  // Using the match: not in the questionnaire yet, it goes in. Already in, it
  // can move to the topic chosen here (the library's own menu) — a question
  // is never added twice; already in that topic (or no topic chosen), there's
  // nothing to do, so the button is disabled and says why.
  const canGo = !!where && !!target && !where.keys.includes(target.value) && !!onMoveMatch;
  // A similar question already in the topic chosen here: using it would change
  // nothing, so there's no button for it — only the question whether yours
  // adds something. (The exact same question there is \`inTopic\`, blocked.)
  const nearHere = !inTopic && !!where && !!target && where.keys.includes(target.value);
  const useButton = !where
    ? <button className="btn btn-secondary" onClick={onUseMatch}>Use this suggestion</button>
    : canGo
    ? <button ref={menu.btn} className={"btn btn-secondary" + (menu.at ? " is-pressed" : "")} aria-haspopup="dialog" aria-expanded={!!menu.at}
        onClick={menu.toggle}>Use this suggestion</button>
    : <Tooltip label={target ? `Already in “${target.label}”` : "Already in your questionnaire — choose a topic above to add it to"} pos="is-above" float>
        <button className="btn btn-secondary is-disabled" aria-disabled="true">Use this suggestion</button>
      </Tooltip>;
  // A possible duplicate stands alone: the question it matches, what it is,
  // and the choice — nothing else competing with the wording.
  if (match) return (
    <div id={id} className="qc-dupe">
      <span className="qc-dupe-kind">{inTopic ? "Already in this topic" : nearHere ? "Similar question in this topic" : match.custom && !where ? "This custom question already exists" : "Possible duplicate"}</span>
      <p className="qc-dupe-q">“{match.text}”</p>
      <p className="qc-dupe-meta">{/* Where a custom question was used before isn't the point — only that
          it exists, so you can pick it instead of writing it again. */}
        {[bench ? "Standard question" : match.custom ? "Custom question" : "Library question",
          match.theme, inTopic || nearHere ? null : where ? `already in ${where.label}` : bench ? "comparable to benchmark" : match.custom ? "already exists" : null].filter(Boolean).join(" · ")}</p>
      <div className="qc-dupe-acts">
        {inTopic ? <p className="qc-dupe-here"><Icon name="alert-circle" size={16} /><span>You can't have the same question twice in one topic. Try writing a different one.</span></p> : nearHere ? <>
          <p className="qc-dupe-here"><Icon name="alert-circle" size={16} /><span>This topic already has a question like this. Only keep yours if it asks something different.</span></p>
          <button className="btn btn-tertiary" onClick={onKeepMine}>Keep mine anyway</button>
        </> : <>
          {useButton}
          <button className="btn btn-tertiary" onClick={onKeepMine}>Keep mine anyway</button>
        </>}
      </div>
      {/* The same confirm the question library shows for a question that's in. */}
      {menu.at && <AnchorConfirm at={menu.at} anchor={menu.btn} onClose={menu.close}
        text={`This question is already in your questionnaire, under ${where.label}`} actions={[{ label: `Move to “${target.label}”`, primary: true, onPick: onMoveMatch }]} />}
    </div>
  );
  return (
    <div id={id} className="qc">
      <div className="qc-head">
        {/* Marked as AI, in the product's blue for AI — it shouldn't be buried. */}
        <span className="qc-ai"><Icon name="featured" size={12} className="qc-spark" />AI</span>Checks your question as you write
        {count && <span className={"qc-count" + (clear && !scanning ? " is-clear" : "")} aria-live="polite">{count}</span>}
      </div>
      {/* The rules as tips, side by side and each in its own place: a grey
          dot until there's a question to judge, then a red dot, or a green
          one with a tick in it — nothing else. */}
      <ul className="qc-fine">
        {rows.map(r => {
          const st = r.status === "warn" ? "fail" : r.status;
          const inner = <>
            <span className="qc-mark" aria-hidden="true">{st === "pass" && <Icon name="check" size={8} />}</span>{r.label}
            {st !== "idle" && <span className="eq-sr-only">{st === "pass" ? " — done" : " — to fix"}</span>}
          </>;
          return (
            <li key={r.key} className={"qc-chip is-" + st + (shownFix && shownFix.key === r.key ? " is-shown" : "")}>
              {/* A red rule is a button: it puts its reason in the tip below. */}
              {st === "fail" ? <button type="button" className="qc-chip-btn" aria-pressed={!!shownFix && shownFix.key === r.key}
                onClick={() => setPicked(r.key)}>{inner}</button> : inner}
            </li>
          );
        })}
      </ul>
      {/* One fixed place for the reason, so nothing above it moves: the tip
          before there's a question, the reason for one red rule (with a
          rewrite when there is one), or "looks good". */}
      <div className={"qc-tip" + (clear ? " is-clear" : shownFix ? " is-fix" : "")} aria-live="polite">
        {!check.ready ? <>Keep it to one clear idea{rows[0] && rows[0].key === "statement" ? ", phrased as a statement" : ""}.</>
          : clear ? <>Looks good — this question is ready to add.</>
          : shownFix ? <>
              <span className="qc-tip-why"><b>{shownFix.label}.</b> {shownFix.hint}</span>
              {check.rewrite && (
                <span className="qc-tip-try"><span className="qc-tip-ai"><Icon name="featured" size={12} />AI suggestion</span> “{check.rewrite}”
                  <button type="button" className="qc-tip-use" onClick={() => onRewrite(check.rewrite)}>Use suggestion</button>
                </span>
              )}
            </>
          : null}
      </div>
      {guide}
    </div>
  );
}

// Places the check right under the question field. It renders in a portal at
// fixed coordinates, because the preview it sits in scrolls and clips; it
// follows the field as it grows or the preview scrolls, and turns upward
// when there's no room below.
function CheckPopover({ anchor, popRef, scanning, dupe, onKeyDown, children }) {
  const [at, setAt] = useState(null);
  const place = () => {
    const el = anchor.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 16;
    const up = below < 240 && r.top > below;
    const next = { left: Math.round(r.left), width: Math.round(r.width),
      ...(up ? { bottom: Math.round(window.innerHeight - r.top + 6), maxHeight: Math.round(r.top - 22) }
             : { top: Math.round(r.bottom + 6), maxHeight: Math.round(below) }) };
    setAt(prev => (prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  };
  // Every render (the text changed, a rule flipped), and once the dialog's
  // opening animation has settled — a transform doesn't trigger the observer.
  useLayoutEffect(place);
  useLayoutEffect(() => {
    const ro = new ResizeObserver(place);
    if (anchor.current) ro.observe(anchor.current);
    const settle = setTimeout(place, 400);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => { ro.disconnect(); clearTimeout(settle); window.removeEventListener("scroll", place, true); window.removeEventListener("resize", place); };
  }, [anchor]); // eslint-disable-line
  if (!at) return null;
  return createPortal(
    <div ref={popRef} className={"qc-pop" + (scanning ? " is-scanning" : "") + (dupe ? " is-dupe" : "")} role="region" aria-label="Question check" onKeyDown={onKeyDown}
      // A mouse click in it — text or button — leaves focus in the question
      // field, so the check shows exactly as long as the field has focus
      // (its buttons still click). Only Tab moves focus into it, to reach the
      // buttons by keyboard.
      onMouseDown={e => e.preventDefault()}
      style={{ position: "fixed", zIndex: 1200, ...at }}>
      {children}
    </div>, document.body);
}

// Where a translation stands, said in its row: automatic (blue, like
// everything AI here) or written by you. A language nobody has opened yet
// already counts as automatic — that's what it will be; the translation itself
// only runs when you open it (or when the question is created), and only the
// question card shows it arriving.
export const LANG_STATUS = {
  source:  { label: "Primary language" },
  pending: { label: "Translates automatically" },  // nothing to translate yet
  auto:    { label: "Auto-translated", icon: "featured" },
  edited:  { label: MANUAL_LABEL, icon: "language" },
  effectory: { label: "Translated by Effectory" }, // a benchmarked question's wording
};
export function LangStatus({ status }) {
  // Loading looks like the label it turns into: same blue, same star — the
  // star pulses while it works.
  if (status === "loading") return (
    <span className="cq-lang-status is-auto is-loading" role="status">
      <Icon name="featured" size={12} className="cq-star-pulse" />Translating…
    </span>
  );
  const st = LANG_STATUS[status];
  return (
    <span className={"cq-lang-status is-" + status}>
      {st.icon && <Icon name={st.icon} size={12} />}{st.label}
    </span>
  );
}

// ---- one row in the language list --------------------------------------
// One line per language, its country in brackets; a translation adds its
// status below.
function LangRow({ lang, isActive, status, onSelect }) {
  return (
    <button type="button" onClick={onSelect} aria-current={isActive ? "true" : undefined}
      className={"cq-lang" + (isActive ? " is-active" : "")}>
      <Flag lang={lang} />
      <span className="cq-lang-txt">
        <span className="cq-lang-name">{lang.label} ({lang.country})</span>
        {status && <LangStatus status={status} />}
      </span>
    </button>
  );
}

// Asked when the question changes and some translations were edited by hand —
// overwriting them silently would throw away work the user deliberately did.
function ManualConflictDialog({ langs, onKeep, onOverwrite }) {
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 70 }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="mc-title">
        <div className="dialog-header is-sm">
          <div className="dialog-header-top">
            <span className="dialog-header-icon is-warning"><Icon name="alert-circle" size={20} /></span>
            <h2 className="dialog-title" id="mc-title">Keep your manual translations?</h2>
          </div>
          <p className="dialog-subtitle">
            {langs.length > 1
              ? `You changed the question, so the manual translations for ${joinNames(langs)} no longer match. Keep them and check them yourself, or replace them with new automatic translations.`
              : `You changed the question, so the manual translation for ${joinNames(langs)} no longer matches. Keep it and check it yourself, or replace it with a new automatic translation.`}
          </p>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onOverwrite}>Replace with automatic</button>
          <button className="btn btn-primary" onClick={onKeep}>Keep manual translations</button>
        </div>
      </div>
    </div>
  );
}

// How long the check runs, and how long the confirmation stays before it closes
// itself. The confirmation offers a choice, so it has to outlast reading it.
const CHECK_MS = 1400;
const DONE_MS = 6000;

export function CustomQuestionDialog({ question, topics, design, pool = [], selectedIds = [], alwaysSimilar = false, checkBlocks = true, qMeta = {}, translations = {}, defaultTopic, focusTitle = false, onUseSuggestion, onMoveSuggestion, onCancel, onAdd, onAddAnother, onOpenCreated, onSubmit, onDelete }) {
  const editing = !!question;
  const submitFn = onSubmit || onAdd;
  // Only offer topics that actually exist in this survey (as {value,label} —
  // value is the stable key, label the survey-scoped display name); fall back
  // to the library topics if none were passed.
  const topicList = (topics && topics.length) ? topics : TOPICS.map(t => ({ value: t, label: t }));
  const topicLabel = (v) => ((topicList.find(o => o.value === v) || {}).label || v);
  const [text, setText] = useState(question ? question.text : "");
  const [desc, setDesc] = useState(question && question.desc ? question.desc : "");
  const [type, setType] = useState(question ? question.type : "scale5");
  const [topic, setTopic] = useState(question && question.topic ? question.topic : (defaultTopic || ""));
  // Custom answer options (multiple choice only) — custom questions are the ONE
  // place answers are editable; standard questions stay standard from A to Z.
  const [opts, setOpts] = useState(question && question.options && question.options.length ? question.options : ["", ""]);
  const [attempted, setAttempted] = useState(false);
  // Preview-only selection on the answer options: clicking the marks shows how
  // the question will behave (checkboxes toggle independently, radios are
  // one-of) without changing anything real. Resets when the type changes.
  const [previewPick, setPreviewPick] = useState(() => new Set());
  useEffect(() => { setPreviewPick(new Set()); }, [type]);
  const togglePreview = (i) => setPreviewPick(prev => {
    if (type === "single") return new Set(prev.has(i) ? [] : [i]);
    const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n;
  });
  // The primary language is always the one selected when the dialog opens.
  const [active, setActive] = useState(PRIMARY_LANGUAGE.code);
  // { [code]: { status: "pending" | "done", text, desc, opts, edited, stale } }
  // An existing question opens with the translations saved for it: the ones
  // edited by hand (and still flagged, if they were), the rest automatic.
  const [tr, setTr] = useState(() => {
    const init = {};
    Object.entries(translations || {}).forEach(([code, t]) => {
      if (!t) return;
      const src = question || {};
      init[code] = { status: "done", edited: true, stale: !!t.stale,
        text: t.text || autoTranslation(src.text || "", code),
        desc: t.desc || (src.desc ? autoTranslation(src.desc, code) : ""),
        opts: (src.options || []).map((o, i) => (t.opts && t.opts[i]) || autoTranslation(o, code)) };
    });
    // An existing question was translated when it was created: the languages
    // nobody edited open as the automatic translations they already are.
    if (question) OTHER_LANGUAGES.forEach(l => {
      if (init[l.code]) return;
      init[l.code] = { status: "done", text: autoTranslation(question.text || "", l.code),
        desc: question.desc ? autoTranslation(question.desc, l.code) : "",
        opts: (question.options || []).map(o => autoTranslation(o, l.code)) };
    });
    return init;
  });
  // The translation labels follow the question once you've left its field
  // (not while you're still typing it). An existing question has them already.
  const [labelled, setLabelled] = useState(!!question);
  // Just after the question changed: the labels load a moment before they say
  // the translations are automatic, so it reads as work being done.
  const [labelling, setLabelling] = useState(false);
  // Hand-edited languages awaiting a keep-or-overwrite decision.
  const [conflict, setConflict] = useState(null);

  const compact = useMediaQuery(COMPACT_QUERY);
  // Opened by "Write your own wording": rewriting IS the task, so the title
  // arrives focused with the old wording selected — typing replaces it.
  useEffect(() => {
    if (!focusTitle) return;
    const t = setTimeout(() => {
      const el = document.querySelector(".cq-dialog .cq-qfield");
      if (el) { el.focus(); el.select(); }
    }, 60);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line
  // CREATING runs a check before anything is born: the primary button first
  // looks for similar existing questions and, if it finds any, shows them in
  // this dialog — pick one, or confirm creating the new question. `checked`
  // null = still writing; an array = the check step with its matches. Any
  // change to the draft drops back to writing (the next Create re-checks).
  const [checked, setChecked] = useState(null);   // matches, in the picking step
  const [phase, setPhase] = useState(null);      // "loading" | "picking" | "success"
  const [pick, setPick] = useState("mine");      // which question gets added
  // What the confirmation is about: the question that went in, its topic read
  // off before the form is cleared, and whether it was reused instead of made.
  const [done, setDone] = useState(null);
  const checkTimer = useRef(null);
  useEffect(() => () => clearTimeout(checkTimer.current), []);
  useEffect(() => { setChecked(null); setPhase(null); setPick("mine"); }, [text, desc, type, topic]);
  const timers = useRef([]);
  // What the translations were last made from: an existing question's own
  // text, so leaving its field without a change doesn't ask anything.
  const lastSource = useRef(question ? `${(question.text || "").trim()} ${(question.desc || "").trim()} ${(question.options || []).join("|")}` : "");
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Similar existing questions, found while you write (creating only): the check
  // that used to be its own step now runs on the draft, a beat after typing
  // stops, and sits under the form — reuse one, or just carry on writing yours.
  const [similar, setSimilar] = useState([]);
  // The model starts loading as soon as a new question is being written.
  useEffect(() => { if (!editing) warmUpSemantic().catch(() => {}); }, []); // eslint-disable-line
  // One routine for both: the quiet background check while writing (which
  // also warms the model's cache) and the final one when you add.
  const findSimilar = async (draft) => {
    if (draft.trim().length <= 8) return [];
    const seen = new Set();
    const lexical = similarQuestions(draft, pool, { always: alwaysSimilar, limit: 12 })
      .filter(m => { const k = m.text.trim().toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    try { return await semanticSimilar(draft, pool, { always: alwaysSimilar, draftType: type, boost: lexical }); }
    // Model unavailable (offline): words only — and never across a positive /
    // negative wording, same as the model's matches.
    catch (_) { return lexical.filter(m => isNegative(m.text) === isNegative(draft)).slice(0, 3); }
  };
  const [simPending, setSimPending] = useState(false);
  useEffect(() => {
    if (editing) return;
    let live = true;
    setSimPending(true);
    const t = setTimeout(async () => { const m = await findSimilar(text); if (live) { setSimilar(m); setSimPending(false); } }, 450);
    return () => { live = false; clearTimeout(t); };
  }, [text, type]); // eslint-disable-line
  // The existing question goes in instead of yours — in the topic chosen here.
  const useExisting = (m) => { onUseSuggestion && onUseSuggestion(m, topic || undefined); onCancel(); };
  // The question check, live while you write: the writing rules, and whether
  // the question already exists (the closest match you haven't kept yours
  // over). It guides first — every rule stays idle until there is a question
  // to judge — and Add waits until nothing is left to fix (checkBlocks; off,
  // the check only warns).
  const check = checkQuestion(text, type);
  const [keptMine, setKeptMine] = useState(() => new Set());
  // Where a question already sits in the questionnaire (its own topic and any
  // copy's), by the names this survey uses — null when it isn't in.
  const whereOf = (m) => {
    const eff = (x) => ((qMeta[x.id] || {}).topic) || x.topic;
    const keys = [...new Set(pool.filter(x => selectedIds.includes(x.id) && (x.id === m.id || x.dupOf === m.id)).map(eff))];
    return keys.length ? { keys, label: keys.map(k => `“${topicLabel(k)}”`).join(" and ") } : null;
  };
  const target = topic ? { value: topic, label: topicLabel(topic) } : null;
  const isInTopic = (m) => { const w = whereOf(m); return !!w && !!target && w.keys.includes(target.value); };
  // Only the SAME wording is the same question. A similar one in this topic
  // still lets you keep yours: it may ask something the other doesn't.
  const sameText = (m) => wording(m.text) === wording(text);
  const isTwice = (m) => isInTopic(m) && sameText(m);
  // A match you kept yours over steps aside — unless it's this very question
  // in this very topic.
  const match = editing || !check.ready ? null
    : similar.find(m => !keptMine.has(m.id) || isTwice(m)) || null;
  const matchWhere = match ? whereOf(match) : null;
  // The same question already sits in the topic chosen here: a topic never
  // asks one question twice, so yours can't go in there.
  const inTopic = !!match && isTwice(match);
  const toFix = check.fails + (match ? 1 : 0);
  // (inTopic keeps Add disabled whatever else is fixed — see the tooltip.)
  const blocked = !editing && (inTopic || (checkBlocks && toFix > 0));
  const [adding, setAdding] = useState(false);
  const addQuestion = async () => {
    setAttempted(true);
    if (textErr || topicErr || optsErr || adding || blocked) return;
    if (editing) { submit(); return; }
    // Typed and added within the debounce: look once more before it goes in.
    if (checkBlocks && simPending) {
      setAdding(true);
      const m = await findSimilar(text);
      setAdding(false); setSimilar(m); setSimPending(false);
      if (m.some(x => !keptMine.has(x.id))) return;
    }
    submit();
  };
  // The check opens under the question as soon as it has focus (or focus is in
  // the check itself) — before typing, it says what it will check. Escape or
  // leaving closes it; clicking the field opens it again.
  const [checkOpen, setCheckOpen] = useState(false);
  // "Scanning": for a beat after each keystroke, and while the library is
  // still being searched — so the check reads as working along with you.
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef(null);
  useEffect(() => () => clearTimeout(typingTimer.current), []);
  const scanning = typing || (!editing && simPending && check.ready);
  const anchorRef = useRef(null);
  const popRef = useRef(null);
  const field = () => anchorRef.current && anchorRef.current.querySelector("textarea");
  const inCheck = (el) => !!el && ((anchorRef.current && anchorRef.current.contains(el)) || (popRef.current && popRef.current.contains(el)));
  const popFocusables = () => (popRef.current ? [...popRef.current.querySelectorAll("button, a[href]")] : []);
  const fieldKeys = (e) => {
    if (e.key === "Escape" && checkOpen) { e.stopPropagation(); setCheckOpen(false); }
    // Tab goes into the check first, so its buttons are reachable by keyboard.
    if (e.key === "Tab" && !e.shiftKey && checkOpen && popFocusables().length) { e.preventDefault(); popFocusables()[0].focus(); }
  };
  const popKeys = (e) => {
    const f = popFocusables();
    if (e.key === "Escape") { e.stopPropagation(); setCheckOpen(false); field() && field().focus(); }
    else if (e.key === "Tab" && e.shiftKey && e.target === f[0]) { e.preventDefault(); field() && field().focus(); }
    else if (e.key === "Tab" && !e.shiftKey && e.target === f[f.length - 1]) {
      e.preventDefault(); setCheckOpen(false);
      const next = document.querySelector(".cq-dialog .cq-descfield"); next && next.focus();
    }
  };
  const useRewrite = (r) => { setText(r); setAttempted(false); field() && field().focus(); };

  const isPrimary = active === PRIMARY_LANGUAGE.code;
  const activeLang = LANGUAGES.find(l => l.code === active) || PRIMARY_LANGUAGE;
  const hasSource = text.trim().length > 0;
  const isStale = code => !!(tr[code] || {}).stale;
  const isEdited = code => !!(tr[code] || {}).edited;
  // No question yet, nothing to translate: the row just shows its country.
  const statusOf = code => {
    const t = tr[code];
    if (t && t.edited) return "edited";
    if (!hasSource || !labelled) return "pending";
    return labelling ? "loading" : "auto";
  };

  const textErr = text.trim().length <= 2;
  const showTextErr = attempted && textErr;
  const topicErr = !topic;
  const cleanOpts = opts.map(o => o.trim()).filter(Boolean);
  // Multiple and single choice share the whole options setup; only the marks
  // in front of the options differ (checkboxes vs radio buttons).
  const hasOpts = type === "multiple" || type === "single";
  const optsErr = hasOpts && cleanOpts.length < 2;
  const showOptsErr = attempted && optsErr;

  // Typing in a translation marks it hand-edited, which protects it from the
  // next automatic run — and is what later makes it go stale.
  const editTranslation = (field, value) => {
    setTr(p => ({ ...p, [active]: { ...p[active], [field]: value, edited: true, stale: false } }));
  };

  // Leaving a language ends the current edit session, and counts as having
  // checked it — so a "re-check me" warning clears once you've actually been.
  const selectLanguage = (code) => {
    if (code === active) return;
    if (isStale(active)) setTr(p => ({ ...p, [active]: { ...p[active], stale: false } }));
    setActive(code);
    // Nothing is translated until you go and look: the first visit to a
    // language translates it there and then, on screen. (Creating the question
    // translates the rest in the background.)
    const lang = OTHER_LANGUAGES.find(l => l.code === code);
    if (lang && !tr[code] && text.trim()) {
      runAuto([lang], text.trim(), desc.trim(), hasOpts ? opts : [], { live: true });
    }
  };

  // Replace `langs` with fresh automatic translations, clearing any edited/stale
  // marks on them (the whole entry is replaced).
  function runAuto(langs, srcText, srcDesc, srcOpts, { live = false } = {}) {
    if (!langs.length) return;
    setTr(prev => {
      const next = { ...prev };
      langs.forEach(l => { next[l.code] = { status: "pending" }; });
      return next;
    });
    langs.forEach((l, i) => {
      const t = setTimeout(() => {
        // If the user typed into this language while it was in flight, their
        // text wins — the arriving machine translation must not clobber it.
        setTr(prev => (prev[l.code] || {}).edited ? prev : {
          ...prev,
          [l.code]: {
            status: "done",
            text: autoTranslation(srcText, l.code),
            desc: autoTranslation(srcDesc, l.code),
            opts: srcOpts.map(o => autoTranslation(o, l.code)),
          },
        });
      }, (live ? 900 : 700) + i * 180);
      timers.current.push(t);
    });
  }

  // Re-translate everything. Fires when a primary field loses focus and its
  // content actually changed — so tabbing through without editing is free.
  const retranslate = () => {
    const srcText = text.trim();
    const srcDesc = desc.trim();
    const srcOpts = hasOpts ? opts : [];
    setLabelled(!!srcText);
    if (!srcText) return;
    const key = srcText + " " + srcDesc + " " + srcOpts.join("|");
    if (key === lastSource.current) return;
    lastSource.current = key;
    setLabelling(true);
    timers.current.push(setTimeout(() => setLabelling(false), 1400));
    // Automatic translations are dropped — the next visit translates the new
    // wording live, and creating translates the rest. Hand-edited ones are left
    // alone until the user decides — overwriting them silently discards work.
    const handEdited = OTHER_LANGUAGES.filter(l => isEdited(l.code));
    setTr(prev => {
      const next = { ...prev };
      OTHER_LANGUAGES.forEach(l => { if (next[l.code] && !next[l.code].edited) delete next[l.code]; });
      return next;
    });
    if (handEdited.length) setConflict({ langs: handEdited, srcText, srcDesc, srcOpts });
  };

  const keepManual = () => {
    setTr(prev => {
      const next = { ...prev };
      conflict.langs.forEach(l => { next[l.code] = { ...next[l.code], stale: true }; });
      return next;
    });
    setConflict(null);
  };
  const overwriteManual = () => {
    runAuto(conflict.langs, conflict.srcText, conflict.srcDesc, conflict.srcOpts);
    setConflict(null);
  };

  // Discard a hand-edited translation and take the fresh automatic one.
  // It arrives the way a first translation does: written out on screen.
  const retranslateOne = (lang) => {
    runAuto([lang], text.trim(), desc.trim(), hasOpts ? opts : [], { live: true });
  };

  const buildQ = () => ({
    ...(question || {}),
    id: question ? question.id : "c" + Date.now(),
    topic, theme: question ? question.theme : null, bench: false, type, custom: true,
    text: text.trim(), desc: desc.trim() || undefined,
    options: hasOpts ? cleanOpts : undefined,
    // The translations edited by hand ride along to be saved with it; the
    // others stay automatic.
    i18n: Object.fromEntries(OTHER_LANGUAGES.map(l => [l.code, tr[l.code]]).filter(([, t]) => t && t.edited)
      .map(([code, t]) => [code, { text: t.text, desc: t.desc, opts: hasOpts ? (t.opts || []).slice(0, cleanOpts.length) : undefined, stale: !!t.stale }])),
  });

  const submit = () => {
    setAttempted(true);
    if (textErr || topicErr || optsErr) return;
    // A new question's languages that weren't visited are translated in the
    // background once it's created.
    submitFn(buildQ());
  };
  // The primary action while creating: "Check question" runs the similarity
  // check behind a short full-dialog loader. Matches -> the check step (pick
  // one, or keep your own); a clean check creates right away. Once checked,
  // the primary becomes "Keep my question" and submits.
  // Check question -> a full-screen step: it loads, then either offers the
  // choice between your wording and the questions that already exist, or
  // confirms in place that nothing similar was found.
  // The question is IN and the step now only says so: same confirmation whether
  // it was written here or reused from the library, which is where people meet
  // the fact that translations are theirs to review.
  const finish = (q, reused) => {
    setDone({ q, topic: topicLabel(q.topic), reused });
    setPhase("success");
    checkTimer.current = setTimeout(() => onCancel(), DONE_MS);
  };
  const checkThenSubmit = () => {
    setAttempted(true);
    if (textErr || topicErr || optsErr) return;
    if (editing) { submit(); return; }
    setPhase("loading");
    checkTimer.current = setTimeout(() => {
      const m = similarQuestions(text, pool, { always: alwaysSimilar });
      if (m.length) { setChecked(m); setPick("mine"); setPhase("picking"); }
      // A clean check creates the question right away and CONFIRMS it here, so
      // every way out of the confirmation keeps it — including writing the next
      // one. Without a non-closing add, it stays the old add-then-close.
      else if (onAddAnother) { const nq = buildQ(); onAddAnother(nq); finish(nq, false); }
      else {
        setPhase("success");
        checkTimer.current = setTimeout(submit, DONE_MS);
      }
    }, CHECK_MS);
  };
  // Clear the form for the next question, keeping topic and answer type: the
  // reason to write another one is usually that the first one wasn't enough.
  const createAnother = () => {
    clearTimeout(checkTimer.current);
    setPhase(null); setChecked(null); setPick("mine"); setDone(null);
    setText(""); setDesc(""); setOpts(["", ""]); setAttempted(false); setTr({});
  };
  // Add whichever question the step has selected — then confirm it the same way
  // a clean check does.
  const addPicked = () => {
    const m = pick === "mine" ? null : (checked || []).find(x => x.id === pick);
    if (!onAddAnother || (m && !onUseSuggestion)) { m ? onUseSuggestion(m) : submit(); return; }
    if (m) { onUseSuggestion(m); finish(m, true); return; }
    const nq = buildQ();
    onAddAnother(nq);
    finish(nq, false);
  };

  // Standard answer categories ship with the platform; Custom ones are the
  // single place where answer options are the coordinator's own.
  const typeItem = (k) => ({ value: k, label: QTYPES[k].label, lead: <QTypeIcon type={k} size={24} /> });
  const typeItems = [
    { header: true, label: "Standard" },
    ...["scale5", "text"].filter(k => QTYPES[k] && QTYPES[k].creatable).map(typeItem),
    { header: true, label: "Custom" },
    ...["multiple", "single"].filter(k => QTYPES[k] && QTYPES[k].creatable).map(typeItem),
  ];
  const topicItems = topicList;
  const langOption = l => ({
    value: l.code, label: `${l.label} (${l.country})`, sub: l.primary ? LANG_STATUS.source.label : statusOf(l.code) === "loading" ? "Translating…" : LANG_STATUS[statusOf(l.code)].label, lead: <Flag lang={l} />,
  });
  // Mirrors the side list so the compact menu reads the same way: no headings,
  // each language says what it is on its own second line.
  const langItems = [langOption(PRIMARY_LANGUAGE), ...OTHER_LANGUAGES.map(langOption)];

  const state = tr[active] || {};
  const working = !isPrimary && state.status === "pending";
  const stale = !isPrimary && !!state.stale;
  // On a hand-edited translation, from the first keystroke: it says so, and
  // offers the way back to the automatic one.
  const showManual = !isPrimary && !working && !stale && !!state.edited;
  // Done by the machine and not touched: say so, and how to make it yours.
  const showAuto = !isPrimary && !working && state.status === "done" && !state.edited;
  // The translated question as shown: empty while it's on its way, then
  // written out, then whole.
  const trText = isPrimary ? text : working ? "" : (state.text ?? (text.trim() ? autoTranslation(text, active) : ""));
  const shownText = trText;
  const trDesc = isPrimary ? desc : working ? "" : (state.desc ?? (desc.trim() ? autoTranslation(desc, active) : ""));
  const shownDesc = trDesc;
  // Option LABELS are translated; the option list itself belongs to the primary
  // language, so translations can't add or remove answers.
  // A translation derives from the primary the moment it is looked at — the
  // stagger only simulates latency, it must never show empty fields.
  const shownOpts = isPrimary ? opts : working ? opts.map(() => "") : (state.opts || opts.map(o => (o ? autoTranslation(o, active) : "")));
  const setOptAt = (i, v) => (isPrimary
    ? setOpts(prev => prev.map((x, k) => (k === i ? v : x)))
    : editTranslation("opts", shownOpts.map((x, k) => (k === i ? v : x))));

  // Right under the question it judges; the languages keep their own column.
  const qcheck = (
    <QuestionCheck id="cq-check" check={check} match={match} where={matchWhere} target={target} inTopic={inTopic} kept={similar.some(m => keptMine.has(m.id))}
      pending={!editing && simPending && check.ready}
      scanning={scanning} showLibrary={!editing}
      onUseMatch={() => useExisting(match)} onMoveMatch={onMoveSuggestion ? () => { onMoveSuggestion(match, topic); onCancel(); } : undefined}
      onKeepMine={() => setKeptMine(k => new Set(k).add(match.id))}
      onRewrite={useRewrite} />
  );

  const benchNote = (
    <span className="cq-bench-note">
      <Icon name="info" size={16} />Custom questions do not have a benchmark comparison in the results
    </span>
  );

  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 60 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={"dialog dialog-worksurface cq-dialog" + (editing ? " has-corner-tags" : "")} role="dialog" aria-modal="true" aria-labelledby="cq-title"
        style={{ display: "flex", flexDirection: "column" }}>
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onCancel}><Icon name="cross" /></button>
        </Tooltip>
        {phase && (
          <div className="cq-step" role="group" aria-label="Check question">
            {phase === "loading" && (
              <div className="cq-step-center" role="status" aria-live="polite">
                <span className="block-loader"><span className="spinner spinner-lg"></span>Checking for similar questions</span>
              </div>
            )}
            {phase === "success" && (
              <div className="cq-step-center" role="status" aria-live="polite">
                {/* The auto-close runs as a ring around the check itself — one
                    element carrying both "it worked" and "this is going away". */}
                <span className="cq-step-ok is-pop">
                  <Icon name="check" size={32} />
                  {done && (
                    <svg className="cq-step-ring" viewBox="0 0 100 100" aria-hidden="true">
                      <circle className="cq-ring-track" cx="50" cy="50" r="46" />
                      <circle className="cq-ring-run" cx="50" cy="50" r="46"
                        style={{ animationDuration: DONE_MS + "ms" }} />
                    </svg>
                  )}
                </span>
                {done ? (
                  <>
                    <div className="cq-step-title">Question added</div>
                    <div className="cq-step-sub">{
                      done.reused
                        ? (done.q.bench
                            ? `You reused a library question, so its benchmark and translations come with it`
                            : `You reused an existing question, so its translations come with it`)
                        : (done.topic ? `It went in as the last question in “${done.topic}”` : "It went in as the last question in your questionnaire")
                    }</div>
                    <div className="cq-step-btns">
                      <button className="btn btn-tertiary" onClick={createAnother}>Create another question</button>
                      <button className="btn btn-secondary" onClick={() => { clearTimeout(checkTimer.current); onCancel(); }}>Close</button>
                      {/* Custom questions are the ones whose translations are
                          the customer's to review — this is where they find
                          that out. Library questions arrive translated. */}
                      {done.q.custom && onOpenCreated && (
                        <button className="btn btn-primary" onClick={() => { clearTimeout(checkTimer.current); onOpenCreated(done.q); }}>
                          Check translations</button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="cq-step-title">No similar questions found</div>
                    <div className="cq-step-sub">Adding it to your questionnaire</div>
                  </>
                )}
              </div>
            )}
            {phase === "picking" && (
              <>
                <div className="cq-step-head">
                  <h3 className="cq-step-title">We found similar existing questions</h3>
                  <p className="cq-step-sub is-wide">Reusing an existing question keeps your results comparable with the rest of the organisation and with earlier surveys. Keeping your own wording is fine too: it just won't have a benchmark to compare against.</p>
                </div>
                {/* Two named sections, so the choice reads as "mine or one of
                    theirs" instead of one list where your question happens to
                    be first. Rows follow the question rows in the rest of the
                    product (control left, text, tags right) but keep the radio
                    card, because exactly one of them is added. */}
                <div className="cq-step-opts" role="radiogroup" aria-label="Question to add">
                  <div className="cq-opt-sec">
                    <h4 className="cq-opt-sechead">Your new question</h4>
                    <button type="button" className={"cq-opt-card" + (pick === "mine" ? " is-on" : "")}
                      role="radio" aria-checked={pick === "mine"} onClick={() => setPick("mine")}>
                      <span className="cq-opt-mark" aria-hidden="true" />
                      <span className="cq-opt-text">{text.trim()}</span>
                      <span className="cq-opt-tags">
                        <span className="infotag is-custom"><Icon name="edit-inline" size={12} />Your question</span>
                        <span className="infotag is-alt">No benchmark</span>
                      </span>
                      <QTypeIcon type={type} size={24} tip />
                    </button>
                  </div>
                  <div className="cq-opt-sec">
                    <h4 className="cq-opt-sechead">Similar questions
                      <span className="tag tag-count">{(checked || []).length}</span></h4>
                    {(checked || []).map(m => (
                      <button type="button" key={m.id} className={"cq-opt-card" + (pick === m.id ? " is-on" : "")}
                        role="radio" aria-checked={pick === m.id} onClick={() => setPick(m.id)}>
                        <span className="cq-opt-mark" aria-hidden="true" />
                        <span className="cq-opt-text">{m.text}</span>
                        <span className="cq-opt-tags">
                          {m.bench
                            ? <span className="infotag is-standard"><Icon name="barchart-2" size={12} />Benchmarked</span>
                            : <span className="infotag is-custom"><Icon name="edit-inline" size={12} />Custom</span>}
                          {m.theme && <span className="infotag is-alt">{m.theme}</span>}
                          {m.from && <span className="infotag is-alt">Used in “{m.from}”</span>}
                        </span>
                        <QTypeIcon type={m.type} size={24} tip />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cq-step-foot">
                  <button className="btn btn-secondary" onClick={() => { setPhase(null); setChecked(null); }}>
                    <Icon name="arrow-left" size={16} />Back</button>
                  <span className="spacer" />
                  <button className="btn btn-primary" onClick={addPicked}>Confirm &amp; add</button>
                </div>
              </>
            )}
          </div>
        )}
        {/* Titled by the thing itself, like the benchmarked-question and topic
            dialogs: the question's own text once there is any, with a tag row
            saying what kind of question it is (the title can't carry that). */}
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          {/* The kind tags and the text-mirroring title describe a question
              that EXISTS. While one is being written there is nothing to tag
              and nothing to mirror — the header stays a plain label. */}
          {editing && (
            <div className="bmq-kind">
              <span className="infotag is-custom"><Icon name="edit-inline" size={12} />Custom</span>
              <span className="infotag is-alt">No benchmark</span>
            </div>
          )}
          <h2 className="dialog-title" id="cq-title">
            {editing ? (text.trim() || "Custom question") : "New custom question"}</h2>
          <p className="dialog-subtitle">Write your own question and choose how people answer it. Use this for specific questions that are only valid for your context.</p>
        </div>

        <div className="dialog-body cq-body">
          {/* Started from a topic: the same banner as the question library's,
              naming where the question goes — it follows the topic picked below. */}
          {!editing && defaultTopic && topic && (
            <div className="eq-target-note" role="status">
              <Icon name="info" size={16} />
              <span className="eq-target-txt">Your question goes to <b>{topicLabel(topic)}</b></span>
            </div>
          )}
          <div className="cq-selects">
            <div className="cq-field">
              <span className="cq-lbl">Answer type</span>
              <MiniSelect ariaLabel="Answer type" value={type} items={typeItems} onChange={setType} block />
            </div>
            <div className="cq-field">
              <span className="cq-lbl">Add to topic
                <Tooltip label="Topics organise questions in your questionnaire. They don't affect benchmarks." pos="is-above" float>
                  <button type="button" className="cq-info" aria-label="About topics"><Icon name="info" size={16} /></button>
                </Tooltip>
              </span>
              <MiniSelect ariaLabel="Add to topic" value={topic} placeholder="Topic name"
                items={topicItems} onChange={setTopic} block invalid={attempted && topicErr} />
              {attempted && topicErr && <div className="tf-err"><Icon name="alert-circle" size={14} />Choose a topic for this question</div>}
            </div>
          </div>

          <div className={"cq-frame" + (compact ? " is-compact" : "")}>
            {/* ---- preview (left on wide, whole frame on compact) ---- */}
            {/* Always the neutral stage: a custom question is written here, not
                styled — the survey's design doesn't follow into this dialog. */}
            <div className="cq-preview">
              {compact && (
                <div className="cq-field cq-langsel">
                  <span className="cq-lbl">Languages</span>
                  <MiniSelect ariaLabel="Languages" value={active} items={langItems}
                    onChange={selectLanguage} block />
                </div>
              )}

              {!isPrimary && !hasSource ? (
                <div className="cq-empty">
                  <span className="cq-empty-ic"><Icon name="language" size={24} /></span>
                  <div className="cq-empty-title">Nothing to translate yet</div>
                  <p className="cq-empty-body">
                    Write your statement in {PRIMARY_LANGUAGE.label} ({PRIMARY_LANGUAGE.country}) first.
                    Translations appear here automatically.
                  </p>
                  <button className="btn btn-secondary" onClick={() => selectLanguage(PRIMARY_LANGUAGE.code)}>
                    Go to {PRIMARY_LANGUAGE.label} ({PRIMARY_LANGUAGE.country})
                  </button>
                </div>
              ) : (
                <div className="bmq-inner">
                  <div className={"cq-card" + (working ? " is-working" : "")} aria-busy={working || undefined}>
                    {working && (
                      <div className="cq-card-loading" role="status" aria-label={`Loading ${activeLang.label}`}>
                        <span className="spinner" />
                      </div>
                    )}
                    {showAuto && (
                      <div className="cq-card-note is-ai">
                        <Icon name="featured" size={14} />Auto-translated
                      </div>
                    )}
                    {showManual && (
                      <div className="cq-card-note">
                        <Icon name="language" size={14} />{MANUAL_LABEL}
                        <span aria-hidden="true">·</span>
                        <button type="button" className="cq-note-action is-ai" onClick={() => retranslateOne(activeLang)}>
                          <Icon name="featured" size={14} />Auto-translate again
                        </button>
                      </div>
                    )}
                    {stale && (
                      <div className="cq-card-note is-stale" role="status">
                        <Icon name="alert-circle" size={14} />{STALE_NOTE}
                        <button type="button" className="cq-note-action" onClick={() => retranslateOne(activeLang)}>
                          Translate again
                        </button>
                      </div>
                    )}
                    <div className="qc-anchor" ref={anchorRef}
                      onFocus={() => isPrimary && setCheckOpen(true)}
                      onBlur={e => { if (!inCheck(e.relatedTarget)) setCheckOpen(false); }}>
                      <AutoTextarea
                        className={"cq-qfield" + (isPrimary && showTextErr ? " is-error" : "")}
                        value={shownText} readOnly={working}
                        placeholder={working ? "" : "Write a positive statement here"}
                        aria-describedby={isPrimary && checkOpen ? "cq-check" : undefined}
                        onKeyDown={isPrimary ? fieldKeys : undefined}
                        // Clicking a field that already has focus doesn't focus it
                        // again (after Escape, say) — the click opens the check itself.
                        onClick={isPrimary ? () => setCheckOpen(true) : undefined}
                        onChange={e => {
                          if (!isPrimary) return editTranslation("text", e.target.value);
                          setText(e.target.value); setCheckOpen(true); setTyping(true);
                          clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => setTyping(false), 700);
                        }}
                        onBlur={isPrimary ? retranslate : undefined} />
                      {isPrimary && checkOpen && (
                        <CheckPopover anchor={anchorRef} popRef={popRef} scanning={scanning} dupe={!!match} onKeyDown={popKeys}>{qcheck}</CheckPopover>
                      )}
                    </div>
                    {isPrimary && showTextErr && (
                      <div className="tf-err"><Icon name="alert-circle" size={14} />Write a question of at least a few words</div>
                    )}
                    {/* Descriptions are per language: a translation translates
                        the primary one, or — where the primary has none — can
                        hold its own (typing it makes it this language's own). */}
                    <AutoTextarea
                      className="cq-descfield"
                      value={shownDesc} readOnly={working}
                      placeholder={working ? "" : "Elaborate the context of your question here (optional)"}
                      onChange={e => (isPrimary
                        ? setDesc(e.target.value)
                        : editTranslation("desc", e.target.value))}
                      onBlur={isPrimary ? retranslate : undefined} />
                    <div className="cq-answer">
                      {type === "text" ? (
                        <textarea className="ta" rows={4} disabled placeholder={scaleFor(active).open}
                          style={{ background: "var(--bg-secondary)", resize: "none", minHeight: 96 }} />
                      ) : hasOpts ? (
                        <div className="cq-opts">
                          {shownOpts.map((o, i) => (
                            <div key={i} className="cq-opt">
                              <Tooltip label={type === "single" ? "Participants pick one" : "Participants pick any"} pos="is-above" float>
                                <button type="button"
                                  className={"cq-mark " + (type === "single" ? "is-radio" : "is-check") + (previewPick.has(i) ? " is-on" : "")}
                                  role={type === "single" ? "radio" : "checkbox"} aria-checked={previewPick.has(i)}
                                  aria-label={"Preview answer option " + (i + 1)}
                                  onClick={() => togglePreview(i)}>
                                  {type !== "single" && previewPick.has(i) && (
                                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10.5l4 4 8-9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                  )}
                                </button>
                              </Tooltip>
                              <input className={"cq-opt-input" + (isPrimary && showOptsErr && !o.trim() && i < 2 ? " is-error" : "")}
                                value={o} placeholder={`Answer option ${i + 1}`}
                                onChange={e => setOptAt(i, e.target.value)}
                                onBlur={isPrimary ? retranslate : undefined} />
                              {isPrimary && (
                                <Tooltip label="Remove option">
                                  <button className={"ib ib-36 ib-tertiary" + (opts.length <= 2 ? " is-disabled" : "")}
                                    aria-label="Remove option" disabled={opts.length <= 2}
                                    onClick={() => setOpts(prev => prev.filter((_, k) => k !== i))}>
                                    <Icon name="cross" size={16} /></button>
                                </Tooltip>
                              )}
                            </div>
                          ))}
                          {isPrimary && showOptsErr && <div className="tf-err"><Icon name="alert-circle" size={14} />Add at least 2 answer options.</div>}
                          {isPrimary && opts.length < 8 && (
                            <button className="btn btn-tertiary cq-add-opt" onClick={() => setOpts(prev => [...prev, ""])}>
                              <Icon name="plus" size={16} />Add option</button>
                          )}
                        </div>
                      ) : <ScalePreview lang={active} />}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ---- languages (right, wide only): while creating too, so the
                 translations are reviewed in the same step as the question. ---- */}
            {!compact && (
              <div className="cq-langs">
                <LangRow lang={PRIMARY_LANGUAGE} isActive={isPrimary} status="source"
                  onSelect={() => selectLanguage(PRIMARY_LANGUAGE.code)} />
                <div className="cq-langs-sep" role="separator" />
                <div className="cq-langs-scroll scroll-y">
                  {OTHER_LANGUAGES.map(l => (
                    <LangRow key={l.code} lang={l} isActive={active === l.code}
                      status={statusOf(l.code)} onSelect={() => selectLanguage(l.code)} />
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="dialog-footer">
          {editing && onDelete && (
            <button className="btn btn-danger-tertiary" onClick={() => onDelete(question)}>
              <Icon name="trash" size={16} />Delete question</button>
          )}
          <div className="spacer" />
          {benchNote}
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          {/* One step: the similarity check already ran while writing, and the
              translations are right here — so the question just goes in. */}
          {blocked ? (
            <Tooltip label={inTopic ? "This question is already in this topic" : match && !check.fails ? "Choose between yours and the existing question first" : `Fix ${toFix === 1 ? "the point" : `the ${toFix} points`} in the question check first`} pos="is-above">
              <button className="btn btn-primary is-disabled" aria-disabled="true" onClick={addQuestion}>Create question</button>
            </Tooltip>
          ) : (
            <button className={"btn btn-primary" + (adding ? " is-disabled" : "")} onClick={addQuestion} aria-busy={adding || undefined}>
              {editing ? "Save changes" : "Create question"}</button>
          )}
        </div>
      </div>

      {conflict && (
        <ManualConflictDialog langs={conflict.langs} onKeep={keepManual} onOverwrite={overwriteManual} />
      )}
    </div>
  );
}
