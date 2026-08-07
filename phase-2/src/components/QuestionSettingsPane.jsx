// QuestionSettingsPane.jsx — "View standard question" dialog (Figma 6208:24121;
// rendered as a centered dialog rather than a slide-in for now).
// The canonical place to see a question's make-up and make the few edits a
// standard question allows: an Effectory-approved alternative wording (Change
// question) and a clarifying description (Add description). Edits are STAGED in
// the pane and only committed with Save — Cancel or closing discards them.
// Standard wording itself stays locked A to Z so benchmarks remain valid.
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { QTypeIcon, Tooltip } from "./shared.jsx";
import { ChangeQuestionDialog } from "./ChangeQuestionDialog.jsx";
import { AddDescriptionDialog } from "./AddDescriptionDialog.jsx";
import { QTYPES, TEMPLATES } from "../data/data.js";
import { templatePoolQuestions } from "../data/qlib.js";
import { LANGUAGES, autoTranslation } from "../data/i18n.js";
import { variantsOf } from "../data/variants.js";

// Which question sets (templates) include this question in the library.
function questionSetsOf(q) {
  if (q.custom) return [];
  return TEMPLATES.filter(t => templatePoolQuestions(t.id).some(x => x.text === q.text)).map(t => t.name);
}

export function QuestionSettingsPane({ q, meta = {}, topicLabel, i18nEdits = {}, onUpdate, onSaveTranslation, onEditCustom, onClose }) {
  // Staged edits — nothing touches survey state until Save.
  const [variant, setVariant] = useState(meta.variant);
  const [desc, setDesc] = useState(() => ({
    en: q.custom ? (q.desc || "") : (meta.desc || ""),
    nl: (i18nEdits.nl || {})[`q:${q.id}:desc`] || "",
    de: (i18nEdits.de || {})[`q:${q.id}:desc`] || "",
    touched: { nl: !!(i18nEdits.nl || {})[`q:${q.id}:desc`], de: !!(i18nEdits.de || {})[`q:${q.id}:desc`] },
  }));
  const [menu, setMenu] = useState(false);
  const [changing, setChanging] = useState(false);
  const [descOpen, setDescOpen] = useState(false);

  const wording = variant || q.text;
  const variants = q.custom ? [] : variantsOf(q.text);
  const sets = questionSetsOf(q);
  const dirty = !q.custom && (
    (variant || undefined) !== (meta.variant || undefined)
    || desc.en.trim() !== (meta.desc || "")
    || (desc.touched.nl && desc.nl.trim() !== ((i18nEdits.nl || {})[`q:${q.id}:desc`] || ""))
    || (desc.touched.de && desc.de.trim() !== ((i18nEdits.de || {})[`q:${q.id}:desc`] || ""))
  );

  // Question text per language: custom questions use reviewed translations
  // when present; standard questions (and variants) ship with Effectory
  // translations — simulated here.
  const textIn = (code) => {
    if (code === "en") return wording;
    if (q.custom) return (i18nEdits[code] || {})[`q:${q.id}:text`] || autoTranslation(q.text, code);
    return autoTranslation(wording, code);
  };
  const descIn = (code) => {
    if (!desc.en.trim()) return "";
    if (code === "en") return desc.en.trim();
    return (desc[code] || "").trim() || autoTranslation(desc.en.trim(), code);
  };

  const save = () => {
    if (!dirty) return;
    onUpdate({
      variant: variant || undefined,
      desc: desc.en.trim() || undefined,
      ...(desc.en.trim() ? {} : { descHidden: undefined }),
    });
    // Reviewed description translations ride along (onUpdate cleared stale ones).
    if (desc.en.trim()) {
      ["nl", "de"].forEach(code => {
        if (desc.touched[code] && desc[code].trim()) onSaveTranslation(code, `q:${q.id}:desc`, desc[code].trim());
      });
    }
    onClose();
  };

  const typeMeta = QTYPES[q.type];

  return (
    <>
      <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 70 }}
        onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog qsp2-dialog" role="dialog" aria-modal="true" aria-label="Question settings">
        <div className="qsp2-head">
          <div className="qsp2-tags">
            <span className="infotag"><QTypeIcon type={q.type} size={16} />{typeMeta.label}</span>
            {q.custom
              ? <span className="infotag is-custom">Custom</span>
              : <span className="infotag is-standard">Standard</span>}
          </div>
          <div className="spacer" />
          {!q.custom && (
            <div className="qrow-menu-wrap">
              <Tooltip label="More options">
                <button className="ib ib-36 ib-tertiary" aria-label="More options" aria-haspopup="menu" aria-expanded={menu}
                  onClick={() => setMenu(o => !o)}><Icon name="more-vertical" size={16} /></button>
              </Tooltip>
              {menu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onMouseDown={() => setMenu(false)} />
                  <div className="menu" role="menu" style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, width: 260, zIndex: 2 }}>
                    <div className={"menu-item" + (variant ? "" : " is-disabled")} role="menuitem"
                      onClick={() => { if (variant) { setVariant(undefined); setMenu(false); } }}>
                      <span className="menu-item-icon"><Icon name="refresh" size={16} /></span>
                      <span className="menu-item-body"><span className="menu-item-title">Use original wording</span></span>
                    </div>
                    <div className={"menu-item" + (desc.en.trim() ? "" : " is-disabled")} role="menuitem"
                      onClick={() => { if (desc.en.trim()) { setDesc({ en: "", nl: "", de: "", touched: { nl: false, de: false } }); setMenu(false); } }}>
                      <span className="menu-item-icon" style={{ color: "var(--content-negative-secondary)" }}><Icon name="trash" size={16} /></span>
                      <span className="menu-item-body"><span className="menu-item-title" style={{ color: "var(--content-negative-secondary)" }}>Remove description</span></span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <span className="qsp2-vdiv" aria-hidden="true" />
          <Tooltip label="Close">
            <button className="ib ib-36 ib-tertiary" aria-label="Close" onClick={onClose}><Icon name="cross" size={16} /></button>
          </Tooltip>
        </div>

        <div className="qsp-body qsp2-body">
          <h2 className="qsp2-question">{wording}</h2>

          <div className="qsp2-meta">
            <div className="qsp2-meta-row">
              <span className="qsp2-meta-lbl"><Icon name="file" size={16} />Topic</span>
              <span className="qsp2-meta-val">{topicLabel || q.topic || "—"}</span>
            </div>
            <div className="qsp2-meta-row">
              <span className="qsp2-meta-lbl"><Icon name="folder" size={16} />Question sets</span>
              <span className="qsp2-meta-val">{sets.length ? sets.join(", ") : "—"}</span>
            </div>
            {q.theme && (
              <div className="qsp2-meta-row">
                <span className="qsp2-meta-lbl"><Icon name="themes" size={16} />Theme</span>
                <span className="qsp2-meta-val">{q.theme}</span>
              </div>
            )}
          </div>

          <div className="qsp2-divider" />

          <div className="qsp2-section-head">
            <h3 className="qsp2-section-title">Question languages</h3>
            <div className="spacer" />
            {q.custom ? (
              <button className="btn btn-secondary" onClick={onEditCustom}><Icon name="edit" size={16} />Edit question</button>
            ) : (
              <>
                {variants.length > 0 && (
                  <button className="btn btn-secondary" onClick={() => setChanging(true)}>
                    <Icon name="edit" size={16} />Change question</button>
                )}
                <button className="btn btn-secondary" onClick={() => setDescOpen(true)}>
                  <Icon name="message" size={16} />{desc.en.trim() ? "Edit description" : "Add description"}</button>
              </>
            )}
          </div>

          <div className="qsp2-langcard">
            <span className="qsp2-lang-lbl">English (primary language)</span>
            <span className="qsp2-lang-text">{textIn("en")}</span>
            {descIn("en") && <span className="qsp2-lang-desc"><Icon name="message" size={14} />{descIn("en")}</span>}
            {variant && <span className="qsp2-lang-note">Alternative wording — original: “{q.text}”</span>}
          </div>
          <div className="qsp2-langstack">
            {LANGUAGES.filter(l => !l.primary).map(l => (
              <div key={l.code} className="qsp2-langcard is-joined">
                <span className="qsp2-lang-lbl">{l.label}</span>
                <span className="qsp2-lang-text">{textIn(l.code)}</span>
                {descIn(l.code) && <span className="qsp2-lang-desc"><Icon name="message" size={14} />{descIn(l.code)}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="qsp2-footer">
          <span className="qsp2-footer-note">Changes apply to this survey only — your library and running surveys stay unchanged.</span>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={"btn btn-primary" + (dirty ? "" : " is-disabled")} disabled={!dirty} onClick={save}>Save</button>
        </div>
      </div>
      </div>

      {changing && (
        <ChangeQuestionDialog original={q.text} current={wording} variants={variants}
          onCancel={() => setChanging(false)}
          onConfirm={(v) => { setVariant(v); setChanging(false); }} />
      )}
      {descOpen && (
        <AddDescriptionDialog questionText={wording} editing={!!desc.en.trim()}
          initial={{ en: desc.en, nl: desc.nl, de: desc.de }}
          onCancel={() => setDescOpen(false)}
          onSave={({ en, nl, de, touched }) => { setDesc({ en, nl, de, touched }); setDescOpen(false); }} />
      )}
    </>
  );
}
