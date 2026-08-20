// TopicDialog.jsx — topic settings in the same format as the benchmarked-
// question dialog: a participant-style preview you edit in place, plus the
// language list on the right. In the real questionnaire a topic is not a white
// card but a full-bleed themed intro screen — title, question count,
// description, and a round "next" arrow — so the preview mirrors that. Name and
// description are free text (survey-scoped), edited directly in the preview.
// Used both to edit an existing topic and to create a new one (`creating`).
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";
import { LANGUAGES, flagSrc, autoTranslation } from "../data/i18n.js";

export function TopicDialog({ creating, name: initialName, desc: initialDesc, originalName, isCustom, questionCount = 0, i18nEdits = {}, stringKeyBase, onCancel, onSave }) {
  const [name, setName] = useState(initialName || "");
  const [desc, setDesc] = useState(initialDesc || "");
  const [lang, setLang] = useState("en");
  const primary = lang === "en";
  const valid = name.trim().length > 0;
  const dirty = creating ? valid
    : name.trim() !== (initialName || "") || desc.trim() !== (initialDesc || "");

  // Preview text per language: reviewed translation if the user made one,
  // otherwise an automatic translation of the (possibly unsaved) draft.
  const reviewed = (code, part) => stringKeyBase ? (i18nEdits[code] || {})[`${stringKeyBase}:${part}`] : undefined;
  const tName = primary ? name : (reviewed(lang, "name") || autoTranslation(name, lang));
  const tDesc = primary ? desc : (desc.trim() ? (reviewed(lang, "desc") || autoTranslation(desc, lang)) : "");
  // A user-authored string without a reviewed translation is machine translated.
  const needsReview = (code) => !!(
    (name.trim() && (isCustom || name.trim() !== originalName) && !reviewed(code, "name"))
    || (desc.trim() && !reviewed(code, "desc"))
  );

  const save = () => { if (valid && dirty) onSave({ name: name.trim(), desc: desc.trim() || undefined }); };

  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 70 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-worksurface bmq-dialog" role="dialog" aria-modal="true" aria-labelledby="tpd-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onCancel}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h2 className="dialog-title" id="tpd-title">{creating ? "Add topic" : "Topic"}</h2>
          <p className="dialog-subtitle">
            Topics organize the questions in this survey and introduce them to participants. They don't affect themes or benchmarks.
            {!creating && !isCustom && " Renaming applies to this survey only."}
          </p>
        </div>

        <div className="bmq-stage">
          <div className="bmq-preview is-participant">
            <div className="tpd-screen">
              {primary ? (
                <input className="tpd-title-input" value={name} placeholder="Topic name" autoFocus={creating}
                  aria-label="Topic name" maxLength={60}
                  onChange={e => setName(e.target.value)} />
              ) : (
                <div className="tpd-title-input is-static">{tName || "Topic name"}</div>
              )}
              <div className="tpd-count">{questionCount} {questionCount === 1 ? "question" : "questions"}</div>
              {primary ? (
                <textarea className="tpd-desc-input" rows={2} value={desc} maxLength={200}
                  placeholder="Add a description (optional)" aria-label="Topic description"
                  onChange={e => setDesc(e.target.value)} />
              ) : (
                tDesc ? <div className="tpd-desc-input is-static">{tDesc}</div> : null
              )}
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
            {!primary && <div className="bmq-lang-note">Your own text is translated automatically. Review it via Translations in the top bar.</div>}
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
