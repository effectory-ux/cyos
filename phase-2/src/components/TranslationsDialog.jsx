// TranslationsDialog.jsx — survey-level translations of USER-AUTHORED text.
// Standard library content ships pre-translated by Effectory and never shows
// here; what does show is exactly what the user changed or created in THIS
// survey: renamed topics, added descriptions, custom questions and their
// answer options. Every string starts as an automatic (machine) translation;
// editing a target marks it reviewed. When a base text changes later, its
// reviewed translation is dropped and the string reverts to automatic.
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";
import { LANGUAGES, autoTranslation } from "../data/i18n.js";

// Flatten the survey's user-authored strings into translation rows.
function collectStrings({ pool, selectedIds, topicMeta, customTopics, qMeta }) {
  const sel = new Set(selectedIds);
  const custSet = new Set(customTopics);
  const items = [];
  const topicKeys = [...new Set([...Object.keys(topicMeta), ...customTopics])];
  topicKeys.forEach(k => {
    const m = topicMeta[k] || {};
    if (m.name) items.push({ key: `topic:${k}:name`, group: m.name, label: custSet.has(k) ? "Topic name" : "Topic name (renamed)", source: m.name });
    if (m.desc) items.push({ key: `topic:${k}:desc`, group: m.name || k, label: "Topic description", source: m.desc, multiline: true });
  });
  pool.forEach(q => {
    if (!sel.has(q.id)) return;
    if (q.custom) {
      items.push({ key: `q:${q.id}:text`, group: q.text, label: "Custom question", source: q.text, multiline: true });
      if (q.desc) items.push({ key: `q:${q.id}:desc`, group: q.text, label: "Description", source: q.desc, multiline: true });
      (q.options || []).forEach((o, i) =>
        items.push({ key: `q:${q.id}:opt:${i}`, group: q.text, label: `Answer option ${i + 1}`, source: o }));
    } else if (qMeta[q.id] && qMeta[q.id].desc) {
      items.push({ key: `q:${q.id}:desc`, group: q.text, label: "Description (added)", source: qMeta[q.id].desc, multiline: true });
    }
  });
  return items;
}

export function TranslationsDialog({ pool, selectedIds, topicMeta = {}, customTopics = [], qMeta = {}, i18nEdits = {}, onSave, onClose }) {
  const targets = LANGUAGES.filter(l => !l.primary);
  const [lang, setLang] = useState(targets[0].code);
  // Local drafts (lang+key) so typing doesn't write survey state on every key.
  const [drafts, setDrafts] = useState({});
  const items = collectStrings({ pool, selectedIds, topicMeta, customTopics, qMeta });
  const edited = (key) => (i18nEdits[lang] || {})[key];
  const valueOf = (it) => {
    const dk = lang + "|" + it.key;
    if (dk in drafts) return drafts[dk];
    return edited(it.key) || autoTranslation(it.source, lang);
  };
  const commit = (it) => {
    const dk = lang + "|" + it.key;
    if (!(dk in drafts)) return;
    const v = drafts[dk].trim();
    const auto = autoTranslation(it.source, lang);
    // Saving the automatic text (or nothing) keeps the string automatic.
    onSave && onSave(lang, it.key, v && v !== auto ? v : "");
    setDrafts(d => { const n = { ...d }; delete n[dk]; return n; });
  };

  // Rows grouped under the item they belong to, in collection order.
  const groups = [];
  items.forEach(it => {
    const g = groups.find(x => x.name === it.group);
    if (g) g.items.push(it); else groups.push({ name: it.group, items: [it] });
  });

  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 65 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog dialog-worksurface" role="dialog" aria-modal="true" aria-labelledby="trd-title"
        style={{ display: "flex", flexDirection: "column", width: 860, maxWidth: "94vw" }}>
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onClose}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h2 className="dialog-title" id="trd-title">Translations</h2>
          <p className="dialog-subtitle">
            English is this survey's default language. We translate your own text automatically — review and adjust it here.
            Standard questions already come with Effectory translations.
          </p>
        </div>

        {items.length > 0 && (
          <div className="trd-tabs" role="tablist">
            {targets.map(l => (
              <button key={l.code} role="tab" aria-selected={lang === l.code}
                className={"trd-tab" + (lang === l.code ? " is-active" : "")}
                onClick={() => setLang(l.code)}>{l.label}</button>
            ))}
          </div>
        )}

        <div className="dialog-body scroll-y" style={{ minHeight: 200, maxHeight: "56vh" }}>
          {items.length === 0 ? (
            <div className="trd-empty">
              <div className="trd-empty-title">Nothing to translate yet</div>
              <div>Topics you rename, descriptions you add, and custom questions will show here.
                Standard questions already come with Effectory translations.</div>
            </div>
          ) : (
            groups.map(g => (
              <div key={g.name}>
                <div className="trd-group">{g.name}</div>
                {g.items.map(it => {
                  const isReviewed = !!edited(it.key);
                  const Input = it.multiline ? "textarea" : "input";
                  return (
                    <div key={it.key} className="trd-row">
                      <div className="trd-src">
                        <span className="trd-src-lbl">{it.label} · English</span>
                        {it.source}
                      </div>
                      <div className="trd-tgt">
                        <span className="trd-src-lbl">{targets.find(l => l.code === lang).label}</span>
                        <Input rows={it.multiline ? 2 : undefined} value={valueOf(it)}
                          aria-label={`${it.label} in ${targets.find(l => l.code === lang).label}`}
                          onChange={e => setDrafts(d => ({ ...d, [lang + "|" + it.key]: e.target.value }))}
                          onBlur={() => commit(it)} />
                        <span className={"trd-status " + (isReviewed ? "is-reviewed" : "is-auto")}>
                          {isReviewed ? <><Icon name="check" size={11} />Reviewed</> : "Machine translated"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
