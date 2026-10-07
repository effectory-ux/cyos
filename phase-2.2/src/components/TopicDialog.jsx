// TopicDialog.jsx — topic settings in the same format as the benchmarked-
// question dialog: a participant-style preview you edit in place, plus the
// language list on the right. In the real questionnaire a topic is not a white
// card but a full-bleed themed intro screen — title, question count,
// description, and a round "next" arrow — so the preview mirrors that. Name and
// description are free text (survey-scoped), edited directly in the preview —
// and because the text is the user's own, it can be translated by hand too: in
// a translation language the same fields stay editable, prefilled with the
// machine translation until someone reviews them.
// Used both to edit an existing topic and to create a new one (`creating`).
import { useState, useRef, useEffect } from "react";
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";
import { LangStatus } from "./CustomQuestionDialog.jsx";
import { LANGUAGES, flagSrc, autoTranslation } from "../data/i18n.js";
import { designWash } from "../data/designs.js";

// The same surface serves the survey's intro screen: participants meet it the
// same way (a themed screen with a title, a description and a next arrow), so
// it is edited the same way. `variant="intro"` only changes the framing copy.
export function TopicDialog({ creating, name: initialName, desc: initialDesc, originalName, isCustom, questionCount = 0, minutes = 0, i18nEdits = {}, stringKeyBase, variant, tidName, tidDesc, design, onCancel, onSave }) {
  const isIntro = variant === "intro";
  // The welcome screen wears the survey's design (it's the themed screen
  // participants see first); a topic is edited on the neutral backdrop,
  // whatever the design — its look doesn't change with the theme.
  const screenStyle = design && isIntro ? {
    background: designWash(design),
  } : undefined;
  const [name, setName] = useState(initialName || "");
  const [desc, setDesc] = useState(initialDesc || "");
  const [lang, setLang] = useState("en");
  // Hand-written translations, staged per language until Save. A null value
  // is "back to automatic": it hides a saved edit and clears it on Save.
  const [tr, setTr] = useState({});
  // The translation flow the custom question dialog has: the languages say
  // "Auto-translated" once you've left the field you wrote in (after a short
  // load), a language is translated when you open it (a spinner, then the
  // text), and a hand-edited one can go back to the automatic translation.
  const hasText = !!(initialName || "").trim();
  const [labelled, setLabelled] = useState(hasText);
  const [labelling, setLabelling] = useState(false);
  const [done, setDone] = useState(() => new Set(hasText ? LANGUAGES.filter(l => !l.primary).map(l => l.code) : []));
  const [loading, setLoading] = useState(null);
  const lastSource = useRef(`${(initialName || "").trim()}|${(initialDesc || "").trim()}`);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const primary = lang === "en";
  const valid = name.trim().length > 0;
  // As in the custom question dialog, the primary button is always there to
  // press: pressing it with the name still empty says so under the field.
  const [attempted, setAttempted] = useState(false);
  const nameRef = useRef(null);
  const showNameErr = attempted && !valid;
  const dirty = (creating ? valid
    : name.trim() !== (initialName || "") || desc.trim() !== (initialDesc || ""))
    || Object.keys(tr).length > 0;

  // Preview text per language: reviewed translation if the user made one,
  // otherwise an automatic translation of the (possibly unsaved) draft.
  const reviewed = (code, part) => {
    const k = code + ":" + part;
    if (k in tr) return tr[k] === null ? undefined : tr[k];
    return stringKeyBase ? (i18nEdits[code] || {})[`${stringKeyBase}:${part}`] : undefined;
  };
  const tName = primary ? name : (reviewed(lang, "name") ?? autoTranslation(name, lang));
  // Descriptions are per language: a translation keeps its own, even where
  // English has none.
  const tDesc = primary ? desc : (reviewed(lang, "desc") ?? (desc.trim() ? autoTranslation(desc, lang) : ""));

  const setTrPart = (part, value) => setTr(prev => ({ ...prev, [lang + ":" + part]: value }));
  // Automatic translation is the normal state and needs no marker — every
  // language is translated the moment the source is written. What is worth
  // pointing at is the exception: a language somebody has edited by hand.
  const handEdited = (code) => !!(reviewed(code, "name") || reviewed(code, "desc"));
  const statusOf = (code) => {
    if (handEdited(code)) return "edited";
    if (!name.trim() || !labelled) return "pending";
    return labelling ? "loading" : "auto";
  };
  // Leaving a primary field: if the text really changed, the automatic
  // translations are redone — the labels load a moment, and each language is
  // translated again when you next open it.
  const sourceLeft = () => {
    const key = `${name.trim()}|${desc.trim()}`;
    setLabelled(!!name.trim());
    if (!name.trim() || key === lastSource.current) return;
    lastSource.current = key;
    setDone(new Set());
    setLabelling(true);
    later(() => setLabelling(false), 1400);
  };
  const openLang = (code) => {
    setLang(code);
    if (code === "en" || done.has(code) || handEdited(code) || !name.trim()) return;
    setLoading(code);
    later(() => { setDone(d => new Set(d).add(code)); setLoading(l => (l === code ? null : l)); }, 900);
  };
  const retranslate = () => {
    setTr(prev => ({ ...prev, [lang + ":name"]: null, [lang + ":desc"]: null }));
    setDone(d => { const n = new Set(d); n.delete(lang); return n; });
    setLoading(lang);
    later(() => { setDone(d => new Set(d).add(lang)); setLoading(l => (l === lang ? null : l)); }, 900);
  };
  const loadingHere = !primary && loading === lang;
  const save = () => {
    if (!valid) {
      // The name is written in the primary language, so that's where it asks.
      setAttempted(true); setLang("en");
      requestAnimationFrame(() => nameRef.current && nameRef.current.focus());
      return;
    }
    if (!dirty) { onCancel(); return; }
    const translations = Object.entries(tr).map(([k, v]) => {
      const [code, part] = k.split(":");
      return { code, part, text: (v || "").trim() }; // null/"" = automatic again
    });
    onSave({ name: name.trim(), desc: desc.trim() || undefined, translations });
  };

  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 70 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-worksurface bmq-dialog" role="dialog" aria-modal="true" aria-labelledby="tpd-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onCancel}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h2 className="dialog-title" id="tpd-title">
            {isIntro ? (initialName || "Intro screen") : creating ? "New custom topic" : (initialName || "Topic")}</h2>
          <p className="dialog-subtitle">
            {isIntro
              ? "The first screen participants see. Use their words for the title, and add a short welcome if it helps."
              : "Topics organize the questions in this survey and introduce them to participants. They don't affect themes or benchmarks."}
          </p>
        </div>

        <div className="bmq-stage">
          <div className="bmq-preview is-participant">
            <div className={"tpd-screen" + (loadingHere ? " is-loading" : "")} style={screenStyle} aria-busy={loadingHere || undefined}>
              {loadingHere && <div className="tpd-loading" role="status" aria-label="Loading translation"><span className="spinner" /></div>}
              {!primary && !loadingHere && name.trim() && (handEdited(lang) ? (
                <div className="cq-card-note tpd-tr-note">
                  <Icon name="language" size={14} />Manually translated
                  <span aria-hidden="true">·</span>
                  <button type="button" className="cq-note-action is-ai" onClick={retranslate}>
                    <Icon name="featured" size={14} />Auto-translate again
                  </button>
                </div>
              ) : (
                <div className="cq-card-note is-ai tpd-tr-note"><Icon name="featured" size={14} />Auto-translated</div>
              ))}
              <input ref={nameRef} className={"tpd-title-input" + (primary && showNameErr ? " is-error" : "")} value={primary ? name : tName}
                aria-invalid={primary && showNameErr ? true : undefined} aria-describedby={primary && showNameErr ? "tpd-name-err" : undefined}
                placeholder={isIntro ? "Survey title for the participants" : "Topic name"} autoFocus={creating}
                aria-label={(isIntro ? "Survey title" : "Topic name") + (primary ? "" : " in " + lang.toUpperCase())} maxLength={60}
                onChange={e => (primary ? setName(e.target.value) : setTrPart("name", e.target.value))}
                onBlur={primary ? sourceLeft : undefined} />
              {primary && showNameErr && (
                <div className="tf-err tpd-err" id="tpd-name-err"><Icon name="alert-circle" size={14} />
                  {isIntro ? "Give the survey a title" : "Give the topic a name"}</div>
              )}
              {!isIntro && <div className="tpd-count">{questionCount} {questionCount === 1 ? "question" : "questions"}</div>}
              {/* The description field shows in every language, so a translation
                  can be written by hand right where it appears. */}
                <textarea className="tpd-desc-input" rows={2} value={primary ? desc : tDesc} maxLength={200}
                  placeholder="Add a description (optional)"
                  aria-label={(isIntro ? "Intro description" : "Topic description") + (primary ? "" : " in " + lang.toUpperCase())}
                  onChange={e => (primary ? setDesc(e.target.value) : setTrPart("desc", e.target.value))}
                  onBlur={primary ? sourceLeft : undefined} />
              {isIntro ? (
                <>
                  {/* The three reassurances every intro screen carries (fixed
                      product strings; counts come from this questionnaire). */}
                  <div className="tpd-meta" aria-hidden="true">
                    <div className="tpd-meta-item">
                      <span className="tpd-meta-ic"><Icon name="Clock" size={22} /></span>
                      <span className="tpd-meta-txt">{questionCount} questions<br />approx. {minutes} {minutes === 1 ? "minute" : "minutes"}</span>
                    </div>
                    <div className="tpd-meta-item">
                      <span className="tpd-meta-ic"><Icon name="desktop" size={22} /></span>
                      <span className="tpd-meta-txt">Saves the answers<br />automatically</span>
                    </div>
                    <div className="tpd-meta-item">
                      <span className="tpd-meta-ic"><Icon name="privacy" size={22} /></span>
                      <span className="tpd-meta-txt">Confidentiality guaranteed<br />
                        <span className="tpd-meta-link"><Icon name="info" size={12} /> Privacy Statement</span></span>
                    </div>
                  </div>
                  {/* Only shows where the start button goes — it isn't a
                      button here, so it looks disabled. */}
                  <span className="tpd-cta is-preview" aria-hidden="true">
                    Get started!<Icon name="play" size={14} /></span>
                </>
              ) : (
                <span className="tpd-next" aria-hidden="true"><Icon name="arrow-down" size={18} /></span>
              )}
            </div>
          </div>
          <div className="bmq-langs">
            {LANGUAGES.filter(l => l.primary).map(l => (
              <button key={l.code} className={"bmq-lang" + (lang === l.code ? " is-selected" : "")} onClick={() => setLang(l.code)}>
                <span className="lang-flag"><img src={flagSrc(l.flag)} alt="" /></span>
                <span className="bmq-lang-text"><b>{l.label} ({l.country})</b><LangStatus status="source" /></span>
              </button>
            ))}
            <div className="cq-langs-sep" role="separator" />
            {LANGUAGES.filter(l => !l.primary).map(l => (
              <button key={l.code} className={"bmq-lang" + (lang === l.code ? " is-selected" : "")} onClick={() => openLang(l.code)}>
                <span className="lang-flag"><img src={flagSrc(l.flag)} alt="" /></span>
                <span className="bmq-lang-text"><b>{l.label} ({l.country})</b>
                  {statusOf(l.code) && <LangStatus status={statusOf(l.code)} />}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>
            {creating ? "Create topic" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
