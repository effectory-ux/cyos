// BenchmarkQuestionDialog.jsx — "Benchmarked question" (Figma 6271:7232).
// The one dialog for standard questions, using the custom-question-dialog
// format: selects on top, a respondent-style preview card in the middle, and a
// language list on the right. Locked things LOOK locked (Answer type is a
// disabled select); constrained edits LOOK like choices — the question text and
// description in the preview are selects whose dropdowns list the
// Effectory-approved alternatives (Figma 6271:9052). Everything is staged and
// committed with Save; all changes are survey-scoped.
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { QTypeIcon, Tooltip, ThemeTag } from "./shared.jsx";
import { QTYPES, SCALE_LABELS } from "../data/data.js";
import { LANGUAGES, flagSrc, autoTranslation } from "../data/i18n.js";
import { variantsOf, descVariantsOf } from "../data/variants.js";

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
  return (
    <div className={"bmq-sel-wrap" + (big ? " is-big" : "")}>
      <button type="button" className={"bmq-sel" + (open ? " is-open" : "") + (disabled ? " is-disabled" : "")}
        aria-haspopup="listbox" aria-expanded={open} disabled={disabled}
        onClick={() => setOpen(o => !o)}>
        <span className={"bmq-sel-text" + (display ? "" : " is-placeholder")}>{display || placeholder}</span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <>
          <div className="cq-menu-scrim" onMouseDown={() => setOpen(false)} />
          <div className="bmq-dropdown" role="listbox">
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
        </>
      )}
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
          <p className="dialog-subtitle">You can word it however you like — this is what changes:</p>
        </div>
        {/* the tag flip, shown with the same tags the dialogs carry */}
        <div className="dw-flip" aria-hidden="true">
          <span className="infotag is-standard"><Icon name="barchart-2" size={12} />Benchmarked</span>
          <Icon name="arrow-right" size={16} style={{ color: "var(--content-subtle)" }} />
          <span className="infotag is-custom"><Icon name="edit-inline" size={12} />Custom</span>
        </div>
        <ul className="dw-impact">
          <li><b>Loses the benchmark</b> — its results can no longer be compared with other organizations.</li>
          {theme && (
            <li><b>Leaves the “{theme}” theme</b>{completes
              ? ` — it was the last question holding the theme complete, so the composite score breaks (the theme needs all ${themeCount} questions).`
              : " — it no longer counts toward the theme."}</li>
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

export function BenchmarkQuestionDialog({ q, meta = {}, topicKey, topicOptions = [], themeInfo, design, onCancel, onSave, onDetach }) {
  // Staged edits — committed on Save only.
  const [variant, setVariant] = useState(meta.variant);
  const [desc, setDesc] = useState(meta.desc);
  const [topic, setTopic] = useState(topicKey || q.topic);
  const [lang, setLang] = useState("en");
  // Language panel hidden by default (Figma 6304:27970); hiding returns the
  // preview to the primary language.
  const [showTr, setShowTr] = useState(false);
  const toggleTr = () => { if (showTr) setLang("en"); setShowTr(v => !v); };
  const [topicOpen, setTopicOpen] = useState(false);
  const [detachAsk, setDetachAsk] = useState(false);
  // A description can be one of the approved ones OR free text (it clarifies the
  // question, it doesn't carry the benchmark), so it gets the same escape hatch
  // as the wording — minus the consequence.
  const [descFree, setDescFree] = useState(() => !!meta.desc && !descVariantsOf(q.text).includes(meta.desc));
  const detach = () => { if (skipDetachWarn() && !completesTheme) doDetach(false); else setDetachAsk(true); };
  const doDetach = (remember) => {
    if (remember) { try { localStorage.setItem(SKIP_KEY, "1"); } catch (_) {} }
    setDetachAsk(false);
    onDetach && onDetach({ text: wording, topic });
  };

  const wording = variant || q.text;
  const variants = variantsOf(q.text);
  const descOptions = descVariantsOf(q.text);
  const primary = lang === "en";
  const t = (text) => (primary || !text ? text : autoTranslation(text, lang));

  const dirty = (variant || undefined) !== (meta.variant || undefined)
    || (desc || undefined) !== (meta.desc || undefined)
    || topic !== (topicKey || q.topic);

  const save = () => {
    if (!dirty) { onCancel(); return; }
    onSave({
      qMeta: { variant: variant || undefined, desc: desc || undefined },
      topic: topic !== (topicKey || q.topic) ? topic : undefined,
    });
  };

  // Detaching pulls the question out of its theme too. If it is the last one
  // holding that theme complete, the warning leads with the theme instead.
  const completesTheme = !!(q.theme && themeInfo && themeInfo.total > 0 && themeInfo.kept >= themeInfo.total);
  const topicLabel = (topicOptions.find(o => o.value === topic) || {}).label || topic;
  // The dialog is titled by the thing itself: the wording actually in use, so
  // picking an alternative retitles it.
  const title = wording;

  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 70 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog dialog-worksurface bmq-dialog" role="dialog" aria-modal="true" aria-labelledby="bmq-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onCancel}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h2 className="dialog-title" id="bmq-title" data-t={"q-" + q.id}>{title}</h2>
          <p className="dialog-subtitle">Defined by our professionals and compared to relevant benchmarks.</p>
        </div>

        <div className="bmq-selects">
          <div className="bmq-field">
            <span className="bmq-lbl">Add to topic
              <Tooltip label="Topics organize questions in this survey. They don't affect benchmarks.">
                <span className="cq-info"><Icon name="info" size={16} /></span>
              </Tooltip>
            </span>
            <div style={{ position: "relative" }}>
              <button type="button" className={"sel-btn bmq-top-sel" + (topicOpen ? " is-pressed" : "")}
                aria-haspopup="listbox" aria-expanded={topicOpen} onClick={() => setTopicOpen(o => !o)}>
                <span className="sel-btn-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topicLabel}</span>
                <span className="spacer" />
                <Icon name="chevron-down" size={16} />
              </button>
              {topicOpen && (
                <>
                  <div className="cq-menu-scrim" onMouseDown={() => setTopicOpen(false)} />
                  <div className="menu" role="listbox" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 3, maxHeight: 260, overflowY: "auto" }}>
                    {topicOptions.map(o => (
                      <div key={o.value} role="option" aria-selected={o.value === topic}
                        className={"menu-item" + (o.value === topic ? " is-selected" : "")}
                        onClick={() => { setTopic(o.value); setTopicOpen(false); }}>
                        <span className="menu-item-body"><span className="menu-item-title">{o.label}</span></span>
                        {o.value === topic && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
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
          <button className="btn btn-secondary cq-tr-toggle" aria-expanded={showTr} onClick={toggleTr}>
            <Icon name="language" size={16} />
            {showTr ? "Hide translations" : `Show translations (${LANGUAGES.length - 1})`}
          </button>
        </div>

        <div className="bmq-stage">
          <div className="bmq-preview" style={design ? { background: `linear-gradient(rgba(18,18,18,.30), rgba(18,18,18,.30)), ${design.photo || design.color}` } : undefined}>
            {/* What kind of question this is, floating over the preview: it
                describes the thing being previewed, so it lives with it. The
                answer type is not repeated here — the Answer type select above
                already says it. */}
            <div className="bmq-float">
              <div className="bmq-kind">
                <span className="infotag is-standard"><Icon name="barchart-2" size={12} />Benchmarked</span>
                {variant && <span className="infotag is-alt">Alternative wording</span>}
                {q.theme && <ThemeTag theme={q.theme} kept={themeInfo ? themeInfo.kept : 0} total={themeInfo ? themeInfo.total : 0} pos="is-below" />}
                {q.required && <span className="infotag is-alt"><Icon name="asterisk" size={12} />Required</span>}
              </div>
            </div>
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
                  footer={
                    <button className="bmq-dd-detach" onClick={detach}>
                      <Icon name="edit" size={14} />
                      <span>
                        <b>Write your own wording</b>
                        <span>Becomes a custom question. Loses the benchmark.</span>
                      </span>
                    </button>
                  }
                  onChange={setVariant} />
              ) : (
                <div className="bmq-locked is-big">{t(wording)}</div>
              )}

              {primary ? (descFree ? (
                <div className="bmq-descfree">
                  <textarea className="bmq-descfield" rows={2} value={desc || ""} autoFocus
                    placeholder="Write a description for participants" aria-label="Description"
                    onChange={e => setDesc(e.target.value)} />
                  <button className="bmq-descfree-back" onClick={() => { setDescFree(false); setDesc(undefined); }}>
                    Use an approved description
                  </button>
                </div>
              ) : (
                <PreviewSelect value={desc} display={desc} placeholder="Add a description"
                  options={[
                    ...descOptions.map(d => ({ value: d, label: d })),
                    { value: undefined, label: "No description", muted: true },
                  ]}
                  footer={
                    <button className="bmq-dd-detach" onClick={() => { setDescFree(true); setDesc(""); }}>
                      <Icon name="edit" size={14} />
                      <span>
                        <b>Write your own description</b>
                        <span>Free text. The benchmark is not affected.</span>
                      </span>
                    </button>
                  }
                  onChange={setDesc} />
              )) : ((desc || "").trim() ? <div className="bmq-locked">{t(desc)}</div> : null)}

              {/* The real answer type, with every point named — answer
                  categories are participant-facing text, so they translate too. */}
              {q.type === "multiple" ? (
                <div className="bmq-opts">
                  {(q.options || []).map((o, i) => (
                    <div key={i} className="bmq-opt"><span className="bmq-opt-radio" aria-hidden="true" />{t(o)}</div>
                  ))}
                </div>
              ) : q.type === "text" ? (
                <div className="bmq-textbox">{t("Share your thoughts")}</div>
              ) : (
                <div className="bmq-scale">
                  <div className="bmq-scale-row">
                    <span className="bmq-scale-end">{t(SCALE_LABELS[0])}</span>
                    {SCALE_DOTS.map((c, i) => (
                      <Tooltip key={i} label={t(SCALE_LABELS[i])}>
                        <span className="bmq-dot" style={{ "--dot": c }} tabIndex={0}
                          role="img" aria-label={t(SCALE_LABELS[i])} />
                      </Tooltip>
                    ))}
                    <span className="bmq-scale-end">{t(SCALE_LABELS[4])}</span>
                  </div>
                  <span className="bmq-idk">{t("I don't know")}</span>
                </div>
              )}
            </div>
            <div className="bmq-float" aria-hidden="true" />
          </div>
          {showTr && <div className="bmq-langs">
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
              </button>
            ))}
            {!primary && <div className="bmq-lang-note">Translations of benchmarked questions are provided by Effectory. Change the wording in the primary language.</div>}
          </div>}
        </div>

        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={"btn btn-primary" + (dirty ? "" : " is-disabled")} disabled={!dirty} onClick={save}>Save</button>
        </div>
      </div>
      {detachAsk && <DetachWarning onCancel={() => setDetachAsk(false)} onConfirm={doDetach}
        theme={q.theme || undefined} completes={completesTheme} themeCount={themeInfo && themeInfo.total} />}
    </div>
  );
}
