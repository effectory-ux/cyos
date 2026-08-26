// CustomQuestionDialog.jsx — "Custom question" dialog (Engage DS, Figma 6248:26489)
// Layout: Add to topic + Answer type selects on top; below them a framed body
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
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon.jsx";
import { QTypeIcon, Tooltip } from "./shared.jsx";
import { QTYPES, TOPICS } from "../data/data.js";
import { similarQuestions } from "../data/similar.js";
import {
  LANGUAGES, PRIMARY_LANGUAGE, OTHER_LANGUAGES, flagSrc, autoTranslation, scaleFor,
} from "../data/i18n.js";

// Below this the dialog can't hold a 240px side list next to the preview.
const COMPACT_QUERY = "(max-width: 1160px)";

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    // `change` alone is enough in a real browser, but neither it nor `resize`
    // fires reliably when the viewport is resized by devtools/emulation — and
    // resizing mid-demo is exactly how this breakpoint gets shown. Observing
    // the root element catches what the events miss.
    mq.addEventListener("change", on);
    window.addEventListener("resize", on);
    const ro = new ResizeObserver(on);
    ro.observe(document.documentElement);
    return () => {
      mq.removeEventListener("change", on);
      window.removeEventListener("resize", on);
      ro.disconnect();
    };
  }, [query]);
  return matches;
}

// ---- compact DS select (sel-btn trigger + .menu popover) ----------------
// An item with `header: true` renders as a DS group label instead of an option,
// so a grouped list (primary vs translations) keeps its structure in the menu.
function MiniSelect({ value, placeholder, items, onChange, ariaLabel, block, invalid }) {
  const [open, setOpen] = useState(false);
  const sel = items.find(it => !it.header && it.value === value);
  return (
    <div className={"cq-menu-wrap" + (block ? " is-block" : "")}>
      <button type="button" className={"sel-btn cq-sel" + (open ? " is-pressed" : "") + (invalid ? " is-error" : "")}
        aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {sel && sel.lead}
          <span className={sel ? "sel-btn-name" : "cq-sel-placeholder"}
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sel ? sel.label : placeholder}
          </span>
          {sel && sel.trail}
        </span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <>
          <div className="cq-menu-scrim" onMouseDown={() => setOpen(false)} />
          <div className="menu cq-menu-pop" role="listbox">
            {items.map((it, i) => (it.header ? (
              <div key={"h" + i} className="menu-group-lbl" role="presentation">{it.label}</div>
            ) : (
              <div key={String(it.value)} role="option" aria-selected={it.value === value}
                className={"menu-item" + (it.value === value ? " is-selected" : "") + (it.working ? " is-working" : "")}
                onClick={() => { onChange(it.value); setOpen(false); }}>
                {it.lead}
                <span className="menu-item-body">
                  <span className="menu-item-title">{it.label}</span>
                  {it.sub && <span className="menu-item-sub">{it.sub}</span>}
                </span>
                {it.trail}
                {it.value === value && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
              </div>
            )))}
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

// The marker a language row / menu item carries on its right: a hand-edited
// translation, flagged permanently. There is deliberately NO warning variant —
// the keep-or-overwrite dialog already asks about anything that needs a look,
// so a second alarm in the list would just be noise.
function LangMark({ edited }) {
  if (!edited) return null;
  return <span className="cq-lang-manual"><Icon name="language" size={16} title={MANUAL_LABEL} /></span>;
}

// ---- one row in the language list --------------------------------------
function LangRow({ lang, isActive, working, edited, onSelect }) {
  return (
    <button type="button" onClick={onSelect} aria-current={isActive ? "true" : undefined}
      aria-busy={working || undefined}
      className={"cq-lang" + (isActive ? " is-active" : "") + (working ? " is-working" : "")}>
      <Flag lang={lang} />
      <span className="cq-lang-txt">
        <span className="cq-lang-name">{lang.label}</span>
        <span className="cq-lang-country">{lang.country}</span>
      </span>
      <LangMark edited={edited} />
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

export function CustomQuestionDialog({ question, topics, design, pool = [], selectedIds = [], onUseSuggestion, onAddAndTranslate, onCancel, onAdd, onSubmit, onDelete }) {
  const editing = !!question;
  const submitFn = onSubmit || onAdd;
  // Only offer topics that actually exist in this survey (as {value,label} —
  // value is the stable key, label the survey-scoped display name); fall back
  // to the library topics if none were passed.
  const topicList = (topics && topics.length) ? topics : TOPICS.map(t => ({ value: t, label: t }));
  const [text, setText] = useState(question ? question.text : "");
  const [desc, setDesc] = useState(question && question.desc ? question.desc : "");
  const [type, setType] = useState(question ? question.type : "scale5");
  const [topic, setTopic] = useState(question && question.topic ? question.topic : "");
  // Custom answer options (multiple choice only) — custom questions are the ONE
  // place answers are editable; standard questions stay standard from A to Z.
  const [opts, setOpts] = useState(question && question.options && question.options.length ? question.options : ["", ""]);
  const [attempted, setAttempted] = useState(false);
  // The primary language is always the one selected when the dialog opens.
  const [active, setActive] = useState(PRIMARY_LANGUAGE.code);
  // { [code]: { status: "pending" | "done", text, desc, opts, edited, stale } }
  const [tr, setTr] = useState({});
  // The language being typed into right now. "Manually translated" is a label
  // you meet on your way BACK to a translation, not while you're writing it.
  const [editingNow, setEditingNow] = useState(null);
  // Hand-edited languages awaiting a keep-or-overwrite decision.
  const [conflict, setConflict] = useState(null);

  const compact = useMediaQuery(COMPACT_QUERY);
  // EDITING: the language panel is always there — translating an existing
  // question is core work. CREATING: no translations yet (they come once the
  // question exists — "Create & translate" continues straight into them);
  // the right rail is used for the similar-question check instead, so a
  // benchmarked or already-written duplicate is caught before it is born.
  const [simText, setSimText] = useState("");
  useEffect(() => {
    if (editing) return;
    const t = setTimeout(() => setSimText(text), 350);
    return () => clearTimeout(t);
  }, [text, editing]);
  const matches = useMemo(
    () => (editing ? [] : similarQuestions(simText, pool)),
    [simText, pool, editing]);
  const timers = useRef([]);
  const lastSource = useRef("");
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const isPrimary = active === PRIMARY_LANGUAGE.code;
  const activeLang = LANGUAGES.find(l => l.code === active) || PRIMARY_LANGUAGE;
  const hasSource = text.trim().length > 0;
  const isWorking = code => (tr[code] || {}).status === "pending";
  const isStale = code => !!(tr[code] || {}).stale;
  const isEdited = code => !!(tr[code] || {}).edited;

  const textErr = text.trim().length <= 2;
  const showTextErr = attempted && textErr;
  const topicErr = !topic;
  const cleanOpts = opts.map(o => o.trim()).filter(Boolean);
  const optsErr = type === "multiple" && cleanOpts.length < 2;
  const showOptsErr = attempted && optsErr;

  // Typing in a translation marks it hand-edited, which protects it from the
  // next automatic run — and is what later makes it go stale.
  const editTranslation = (field, value) => {
    setEditingNow(active);
    setTr(p => ({ ...p, [active]: { ...p[active], [field]: value, edited: true, stale: false } }));
  };

  // Leaving a language ends the current edit session, and counts as having
  // checked it — so a "re-check me" warning clears once you've actually been.
  const selectLanguage = (code) => {
    if (code === active) return;
    if (isStale(active)) setTr(p => ({ ...p, [active]: { ...p[active], stale: false } }));
    setEditingNow(null);
    setActive(code);
  };

  // Replace `langs` with fresh automatic translations, clearing any edited/stale
  // marks on them (the whole entry is replaced).
  function runAuto(langs, srcText, srcDesc, srcOpts) {
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
      }, 700 + i * 180);
      timers.current.push(t);
    });
  }

  // Re-translate everything. Fires when a primary field loses focus and its
  // content actually changed — so tabbing through without editing is free.
  const retranslate = () => {
    const srcText = text.trim();
    const srcDesc = desc.trim();
    const srcOpts = type === "multiple" ? opts : [];
    if (!srcText) return;
    const key = srcText + " " + srcDesc + " " + srcOpts.join("|");
    if (key === lastSource.current) return;
    lastSource.current = key;
    // Untouched languages just re-translate. Hand-edited ones are left alone
    // until the user decides — overwriting them silently discards real work.
    const handEdited = OTHER_LANGUAGES.filter(l => isEdited(l.code));
    runAuto(OTHER_LANGUAGES.filter(l => !isEdited(l.code)), srcText, srcDesc, srcOpts);
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
  const retranslateOne = (lang) =>
    runAuto([lang], text.trim(), desc.trim(), type === "multiple" ? opts : []);

  const submit = (andTranslate) => {
    setAttempted(true);
    if (textErr || topicErr || optsErr) return;
    const nq = {
      ...(question || {}),
      id: question ? question.id : "c" + Date.now(),
      topic, theme: question ? question.theme : null, bench: false, type, custom: true,
      text: text.trim(), desc: desc.trim() || undefined,
      options: type === "multiple" ? cleanOpts : undefined,
    };
    if (andTranslate && onAddAndTranslate) onAddAndTranslate(nq); else submitFn(nq);
  };

  const typeItems = Object.entries(QTYPES).filter(([, m]) => m.creatable).map(([k, m]) => ({
    value: k, label: m.label, lead: <QTypeIcon type={k} size={24} />,
  }));
  const topicItems = topicList;
  const langOption = l => ({
    value: l.code, label: l.label, sub: l.country, lead: <Flag lang={l} />,
    working: isWorking(l.code),
    trail: <LangMark edited={isEdited(l.code)} />,
  });
  // Mirrors the side list's structure so the compact menu reads the same way.
  const langItems = [
    { header: "Primary language" },
    langOption(PRIMARY_LANGUAGE),
    { header: `Translations (${OTHER_LANGUAGES.length})` },
    ...OTHER_LANGUAGES.map(langOption),
  ].map(it => (it.header ? { header: true, label: it.header } : it));

  const state = tr[active] || {};
  const working = !isPrimary && state.status === "pending";
  const stale = !isPrimary && !!state.stale;
  // Shown on returning to a hand-edited translation — not while translating,
  // and not while you're still the one typing in it.
  const showManual = !isPrimary && !working && !stale && !!state.edited && editingNow !== active;
  // Option LABELS are translated; the option list itself belongs to the primary
  // language, so translations can't add or remove answers.
  const shownOpts = isPrimary ? opts : (state.opts || opts.map(() => ""));
  const setOptAt = (i, v) => (isPrimary
    ? setOpts(prev => prev.map((x, k) => (k === i ? v : x)))
    : editTranslation("opts", shownOpts.map((x, k) => (k === i ? v : x))));

  const benchNote = (
    <span className="cq-bench-note">
      <Icon name="info" size={16} />Custom questions do not have a benchmark comparison in the results
    </span>
  );

  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 60 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-worksurface cq-dialog" role="dialog" aria-modal="true" aria-labelledby="cq-title"
        style={{ display: "flex", flexDirection: "column" }}>
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onCancel}><Icon name="cross" /></button>
        </Tooltip>
        {/* Titled by the thing itself, like the benchmarked-question and topic
            dialogs: the question's own text once there is any, with a tag row
            saying what kind of question it is (the title can't carry that). */}
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h2 className="dialog-title" id="cq-title" data-t={question ? "q-" + question.id : undefined}>{text.trim() || (editing ? "Custom question" : "New custom question")}</h2>
          <p className="dialog-subtitle">Write your own question and choose how people answer it. Use this for specific questions that are only valid for your context.</p>
        </div>

        <div className="dialog-body cq-body">
          <div className="cq-selects">
            <div className="cq-field">
              <span className="cq-lbl">Add to topic
                <span className="cq-info" title="Topics organise questions in your questionnaire. They don't affect benchmarks.">
                  <Icon name="info" size={16} /></span>
              </span>
              <MiniSelect ariaLabel="Add to topic" value={topic} placeholder="Topic name"
                items={topicItems} onChange={setTopic} block invalid={attempted && topicErr} />
              {attempted && topicErr && <div className="tf-err"><Icon name="alert-circle" size={14} />Choose a topic for this question</div>}
            </div>
            <div className="cq-field">
              <span className="cq-lbl">Answer type</span>
              <MiniSelect ariaLabel="Answer type" value={type} items={typeItems} onChange={setType} block />
            </div>
          </div>

          <div className={"cq-frame" + (compact ? " is-compact" : "")}>
            {/* ---- preview (left on wide, whole frame on compact) ---- */}
            <div className="cq-preview" style={design ? { background: `linear-gradient(rgba(18,18,18,.30), rgba(18,18,18,.30)), ${design.photo || design.color}` } : undefined}>
              {compact && editing && (
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
                  {/* Kind tags sit attached to the previewed card — they
                      describe what is being previewed. The answer type is not
                      repeated: the Answer type select above already says it. */}
                  <div className="bmq-kind">
                    <span className="infotag is-custom"><Icon name="edit-inline" size={12} />Custom</span>
                    <span className="infotag is-alt">No benchmark</span>
                  </div>
                  <div className={"cq-card" + (working ? " is-working" : "")} aria-busy={working || undefined}>
                    {showManual && (
                      <div className="cq-card-note">
                        <Icon name="language" size={14} />{MANUAL_LABEL}
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
                    <AutoTextarea
                      className={"cq-qfield" + (isPrimary && showTextErr ? " is-error" : "")}
                      data-t={question && isPrimary ? "q-" + question.id : undefined}
                      autoFocus={isPrimary}
                      value={isPrimary ? text : (state.text || "")}
                      placeholder={working ? "" : "Write a positive statement here"}
                      onChange={e => (isPrimary
                        ? setText(e.target.value)
                        : editTranslation("text", e.target.value))}
                      onBlur={isPrimary ? retranslate : undefined} />
                    {isPrimary && showTextErr && (
                      <div className="tf-err"><Icon name="alert-circle" size={14} />Write a question of at least a few words</div>
                    )}
                    <AutoTextarea
                      className="cq-descfield"
                      value={isPrimary ? desc : (state.desc || "")}
                      placeholder={working ? "" : "Elaborate the context of your question here (optional)"}
                      onChange={e => (isPrimary
                        ? setDesc(e.target.value)
                        : editTranslation("desc", e.target.value))}
                      onBlur={isPrimary ? retranslate : undefined} />
                    <div className="cq-answer">
                      {type === "text" ? (
                        <textarea className="ta" rows={4} disabled placeholder={scaleFor(active).open}
                          style={{ background: "var(--bg-secondary)", resize: "none", minHeight: 96 }} />
                      ) : type === "multiple" ? (
                        <div className="cq-opts">
                          {shownOpts.map((o, i) => (
                            <div key={i} className="cq-opt">
                              <Icon name="single-answer" size={18} style={{ color: "var(--content-subtle)", flex: "none" }} />
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
                  {/* The check, right where the typing happens: Type question >
                      Check question > (once created) Translate. No panel when
                      there is nothing to say. */}
                  {!editing && matches.length > 0 && (
                    <div className="cq-suggest is-inline">
                      <div className="cq-suggest-head"><Icon name="lightbulb" size={14} />Similar questions already exist</div>
                      {matches.map(m => {
                        const inSurvey = selectedIds.includes(m.id);
                        return (
                          <div key={m.id} className="cq-suggest-item">
                            <div className="cq-suggest-text">{m.text}</div>
                            <div className="cq-suggest-tags">
                              {m.bench
                                ? <span className="infotag is-standard"><Icon name="barchart-2" size={12} />Benchmarked</span>
                                : <span className="infotag is-custom"><Icon name="edit-inline" size={12} />Custom</span>}
                              {m.theme && <span className="infotag is-alt">{m.theme}</span>}
                            </div>
                            {inSurvey
                              ? <span className="cq-suggest-in"><Icon name="check" size={14} />Already in this survey</span>
                              : onUseSuggestion && (
                                <button className="btn btn-secondary cq-suggest-use" onClick={() => onUseSuggestion(m)}>
                                  Use this question</button>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ---- languages (right, wide only): editing only — while
                 CREATING there is no side panel at all; translations follow
                 once the question exists ("Create & translate"). ---- */}
            {!compact && editing && (
              <div className="cq-langs">
                <div className="cq-langs-head">Primary language</div>
                <LangRow lang={PRIMARY_LANGUAGE} isActive={isPrimary}
                  onSelect={() => selectLanguage(PRIMARY_LANGUAGE.code)} />
                <div className="cq-langs-head is-count">
                  <span className="cq-langs-title">Translations ({OTHER_LANGUAGES.length})</span>
                </div>
                <div className="cq-langs-scroll scroll-y">
                  {OTHER_LANGUAGES.map(l => (
                    <LangRow key={l.code} lang={l} isActive={active === l.code}
                      working={isWorking(l.code)} edited={isEdited(l.code)}
                      onSelect={() => selectLanguage(l.code)} />
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
          {!editing && onAddAndTranslate && (
            <button className="btn btn-secondary" onClick={() => submit(true)}>
              <Icon name="language" size={16} />Create &amp; translate</button>
          )}
          <button className="btn btn-primary" onClick={() => submit(false)}>
            {editing ? "Save changes" : "Create"}</button>
        </div>
      </div>

      {conflict && (
        <ManualConflictDialog langs={conflict.langs} onKeep={keepManual} onOverwrite={overwriteManual} />
      )}
    </div>
  );
}
