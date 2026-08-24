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
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";
import { LANGUAGES, flagSrc, autoTranslation } from "../data/i18n.js";

// The same surface serves the survey's intro screen: participants meet it the
// same way (a themed screen with a title, a description and a next arrow), so
// it is edited the same way. `variant="intro"` only changes the framing copy.
export function TopicDialog({ creating, name: initialName, desc: initialDesc, originalName, isCustom, questionCount = 0, i18nEdits = {}, stringKeyBase, variant, onCancel, onSave }) {
  const isIntro = variant === "intro";
  const [name, setName] = useState(initialName || "");
  const [desc, setDesc] = useState(initialDesc || "");
  const [lang, setLang] = useState("en");
  // Hand-written translations, staged per language until Save.
  const [tr, setTr] = useState({});
  const primary = lang === "en";
  const valid = name.trim().length > 0;
  const dirty = (creating ? valid
    : name.trim() !== (initialName || "") || desc.trim() !== (initialDesc || ""))
    || Object.keys(tr).length > 0;

  // Preview text per language: reviewed translation if the user made one,
  // otherwise an automatic translation of the (possibly unsaved) draft.
  const reviewed = (code, part) => {
    const staged = tr[code + ":" + part];
    if (staged !== undefined) return staged;
    return stringKeyBase ? (i18nEdits[code] || {})[`${stringKeyBase}:${part}`] : undefined;
  };
  const tName = primary ? name : (reviewed(lang, "name") ?? autoTranslation(name, lang));
  const tDesc = primary ? desc : (desc.trim() ? (reviewed(lang, "desc") ?? autoTranslation(desc, lang)) : "");
  const setTrPart = (part, value) => setTr(prev => ({ ...prev, [lang + ":" + part]: value }));
  // A user-authored string without a reviewed translation is machine translated.
  const needsReview = (code) => !!(
    (name.trim() && (isCustom || name.trim() !== originalName) && !reviewed(code, "name"))
    || (desc.trim() && !reviewed(code, "desc"))
  );

  const save = () => {
    if (!valid || !dirty) return;
    const translations = Object.entries(tr).map(([k, v]) => {
      const [code, part] = k.split(":");
      return { code, part, text: (v || "").trim() };
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
            {isIntro ? (initialName || "Intro screen") : creating ? "Add topic" : (initialName || "Topic")}</h2>
          <p className="dialog-subtitle">
            {isIntro
              ? "The first screen participants see. Give the survey a title in their words and, if it helps, a short welcome."
              : "Topics organize the questions in this survey and introduce them to participants. They don't affect themes or benchmarks."}
          </p>
        </div>

        <div className="bmq-stage">
          <div className="bmq-preview is-participant">
            <div className="tpd-screen">
              <input className="tpd-title-input" value={primary ? name : tName}
                placeholder={isIntro ? "Survey title for the participants" : "Topic name"} autoFocus={creating}
                aria-label={(isIntro ? "Survey title" : "Topic name") + (primary ? "" : " in " + lang.toUpperCase())} maxLength={60}
                onChange={e => (primary ? setName(e.target.value) : setTrPart("name", e.target.value))} />
              {!isIntro && <div className="tpd-count">{questionCount} {questionCount === 1 ? "question" : "questions"}</div>}
              {/* The description field shows in every language, so a translation
                  can be written by hand right where it appears. */}
              <textarea className="tpd-desc-input" rows={2} value={primary ? desc : tDesc} maxLength={200}
                placeholder={primary ? "Add a description (optional)" : "Add a description"}
                aria-label={(isIntro ? "Intro description" : "Topic description") + (primary ? "" : " in " + lang.toUpperCase())}
                disabled={!primary && !desc.trim()}
                onChange={e => (primary ? setDesc(e.target.value) : setTrPart("desc", e.target.value))} />
              <span className="tpd-next" aria-hidden="true"><Icon name="arrow-down" size={18} /></span>
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
                {needsReview(l.code) && (
                  <Tooltip label="Machine translated — review in Translations">
                    <span className="bmq-lang-alert"><Icon name="alert-circle" size={16} /></span>
                  </Tooltip>
                )}
              </button>
            ))}
            {!primary && <div className="bmq-lang-note">Translated automatically. Edit it here to make it your own.</div>}
          </div>
        </div>

        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={"btn btn-primary" + (valid && dirty ? "" : " is-disabled")} disabled={!valid || !dirty} onClick={save}>
            {creating ? "Add topic" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
