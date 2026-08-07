// AddDescriptionDialog.jsx — "Add description" worksurface dialog (Figma
// 6208:24616). Left: the description per language (English is the survey's
// primary language; Dutch and German unlock once English has text and start as
// automatic translations the user can adjust). Right: a live preview of what
// respondents will see, switchable per language.
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";
import { SCALE_LABELS } from "../data/data.js";
import { LANGUAGES, autoTranslation } from "../data/i18n.js";

const MAX = 100;

const SCALE_DOTS = [
  "var(--bg-distribution-strongly-disagree)",
  "var(--bg-distribution-disagree)",
  "var(--bg-distribution-neither-agree-disagree)",
  "var(--bg-distribution-agree)",
  "var(--bg-distribution-strongly-agree)",
];

// `initial` = { en, nl, de } (empty strings when absent). onSave receives the
// same shape with trimmed values; empty en removes the description.
export function AddDescriptionDialog({ questionText, initial, editing, onCancel, onSave }) {
  const [vals, setVals] = useState({ en: initial.en || "", nl: initial.nl || "", de: initial.de || "" });
  // Track which targets the user touched, so auto-translation doesn't
  // overwrite their edits when the English text changes.
  const [touched, setTouched] = useState({ nl: !!initial.nl, de: !!initial.de });
  const [previewLang, setPreviewLang] = useState("en");
  const [langOpen, setLangOpen] = useState(false);
  const enEmpty = !vals.en.trim();

  const setLang = (code, v) => {
    setVals(prev => ({ ...prev, [code]: v.slice(0, MAX) }));
    if (code !== "en") setTouched(prev => ({ ...prev, [code]: true }));
  };
  // Leaving the English field refreshes untouched targets with a fresh
  // automatic translation.
  const syncAuto = () => {
    setVals(prev => {
      const next = { ...prev };
      ["nl", "de"].forEach(code => {
        if (!touched[code]) next[code] = prev.en.trim() ? autoTranslation(prev.en.trim(), code).slice(0, MAX) : "";
      });
      return next;
    });
  };

  const previewDesc = (vals[previewLang] || "").trim();
  const previewQ = previewLang === "en" ? questionText : autoTranslation(questionText, previewLang);
  const langLabel = (code) => {
    const l = LANGUAGES.find(x => x.code === code);
    return l.primary ? `${l.label} (primary language)` : l.label;
  };

  const save = () => {
    onSave({ en: vals.en.trim(), nl: vals.nl.trim(), de: vals.de.trim(), touched });
  };

  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 80 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-worksurface adq-dialog" role="dialog" aria-modal="true" aria-labelledby="adq-title">
        <div className="adq-cols">
          <div className="adq-form scroll-y">
            <div className="dialog-header is-sm" style={{ padding: 0 }}>
              <h2 className="dialog-title" id="adq-title">{editing ? "Edit description" : "Add description"}</h2>
              <p className="dialog-subtitle">Add a clarification to help participants better understand the question.</p>
            </div>
            <div className="adq-divider" />
            {LANGUAGES.map(l => {
              const disabled = !l.primary && enEmpty;
              const field = (
                <div key={l.code} className={"adq-field" + (disabled ? " is-disabled" : "")}>
                  <div className="adq-field-head">
                    <span className="adq-field-lbl">{langLabel(l.code)}</span>
                    <span className="adq-count">{(vals[l.code] || "").length}/{MAX}</span>
                  </div>
                  <textarea className="adq-ta" rows={3} maxLength={MAX} value={vals[l.code] || ""}
                    placeholder="Enter description" disabled={disabled}
                    aria-label={`Description in ${l.label}`}
                    onChange={e => setLang(l.code, e.target.value)}
                    onBlur={l.primary ? syncAuto : undefined} />
                  {!l.primary && !disabled && !touched[l.code] && (vals[l.code] || "").trim() && (
                    <span className="adq-auto"><Icon name="language" size={12} />Translated automatically — adjust if needed</span>
                  )}
                </div>
              );
              return disabled
                ? <Tooltip key={l.code} label="Enter primary language text first to enable translation">{field}</Tooltip>
                : field;
            })}
          </div>
          <div className="adq-preview">
            <div className="adq-preview-lang">
              <span className="adq-field-lbl">Preview language</span>
              <div style={{ position: "relative" }}>
                <button className={"sel-btn adq-lang-btn" + (langOpen ? " is-pressed" : "")}
                  aria-haspopup="listbox" aria-expanded={langOpen} onClick={() => setLangOpen(o => !o)}>
                  <Icon name="globe" size={16} style={{ color: "var(--content-secondary)" }} />
                  <span className="sel-btn-name">{langLabel(previewLang)}</span>
                  <span className="spacer" />
                  <Icon name="chevron-down" size={16} style={{ color: "var(--content-secondary)" }} />
                </button>
                {langOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onMouseDown={() => setLangOpen(false)} />
                    <div className="menu" role="listbox" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 2 }}>
                      {LANGUAGES.map(l => (
                        <div key={l.code} role="option" aria-selected={l.code === previewLang}
                          className={"menu-item" + (l.code === previewLang ? " is-selected" : "")}
                          onClick={() => { setPreviewLang(l.code); setLangOpen(false); }}>
                          <span className="menu-item-body"><span className="menu-item-title">{langLabel(l.code)}</span></span>
                          {l.code === previewLang && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="adq-preview-center">
              <div className="adq-preview-hint">{previewDesc ? "This is what participants will see" : "The description will appear here"}</div>
              <div className="adq-example">
                <div className="adq-example-q">{previewQ}</div>
                {previewDesc && <div className="adq-example-desc">{previewDesc}</div>}
                <div className="cq-scale" style={{ width: "100%" }}>
                  <div className="cq-scale-row">
                    <span className="cq-scale-end">{SCALE_LABELS[0]}</span>
                    <div className="cq-dots">
                      {SCALE_DOTS.map((c, i) => <span key={i} className="cq-dot" style={{ "--dot": c }} />)}
                    </div>
                    <span className="cq-scale-end">{SCALE_LABELS[4]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="dialog-footer adq-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>
            {editing ? "Save description" : "Add description"}</button>
        </div>
      </div>
    </div>
  );
}
