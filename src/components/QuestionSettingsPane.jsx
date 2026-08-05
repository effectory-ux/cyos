// QuestionSettingsPane.jsx — right sidepane with everything about one question.
// The canonical place to SEE a question's make-up and to make the few
// survey-scoped edits a standard question allows (custom description). Standard
// wording and answer options are read-only by design: standard is standard from
// A to Z, which is what keeps benchmark comparisons valid. (A future "Change
// wording" variant picker slots into this pane without redesign.)
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { QTypeIcon, ThemeTag, CustomTag, Tooltip } from "./shared.jsx";
import { QTYPES, SCALE_LABELS } from "../data/data.js";

const SCALE_DOTS = [
  "var(--bg-distribution-strongly-disagree)",
  "var(--bg-distribution-disagree)",
  "var(--bg-distribution-neither-agree-disagree)",
  "var(--bg-distribution-agree)",
  "var(--bg-distribution-strongly-agree)",
];

export function QuestionSettingsPane({ q, meta = {}, themeInfo, onUpdate, onEditCustom, onOpenTranslations, onClose }) {
  // Draft so typing doesn't spam survey state; committed on blur.
  const [descDraft, setDescDraft] = useState(q.custom ? (q.desc || "") : (meta.desc || ""));
  const commitDesc = () => {
    if (q.custom) return; // custom questions edit their description in the edit dialog
    const t = descDraft.trim();
    if (t !== (meta.desc || "")) onUpdate({ desc: t || undefined, ...(t ? {} : { descHidden: undefined }) });
  };
  const hasDesc = q.custom ? !!q.desc : !!(meta.desc || "").trim();
  const hasOwnText = q.custom || !!meta.desc;

  return (
    <>
      <div className="qsp-scrim" onMouseDown={onClose} />
      <div className="qsp" role="dialog" aria-modal="true" aria-labelledby="qsp-title">
        <div className="qsp-head">
          <h2 className="qsp-title" id="qsp-title">Question settings</h2>
          <div className="spacer" />
          <Tooltip label="Close">
            <button className="ib ib-36 ib-tertiary" aria-label="Close" onClick={onClose}><Icon name="cross" size={16} /></button>
          </Tooltip>
        </div>
        <div className="qsp-body">
          <div className="qsp-sec">
            <span className="qsp-lbl">Question</span>
            <div className="qsp-card">{q.text}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <QTypeIcon type={q.type} size={24} />
              <span style={{ fontSize: 13.5, color: "var(--content-secondary)" }}>{QTYPES[q.type].label}</span>
              {q.theme && <ThemeTag theme={q.theme} kept={themeInfo ? themeInfo.kept : 0} total={themeInfo ? themeInfo.total : 0} />}
              {q.custom && <CustomTag />}
            </div>
            {q.custom ? (
              <>
                <div className="qsp-note"><Icon name="barchart-2" size={14} />Custom questions have no benchmark comparison in results.</div>
                <button className="btn btn-secondary" style={{ alignSelf: "flex-start" }} onClick={onEditCustom}>
                  <Icon name="edit" size={16} />Edit question</button>
              </>
            ) : (
              <div className="qsp-note"><Icon name="lock" size={14} />
                Standard question — the wording and answer options are set by Effectory so your results stay comparable to benchmarks.</div>
            )}
          </div>

          <div className="qsp-sec">
            <span className="qsp-lbl">Description</span>
            {q.custom ? (
              <>
                {q.desc
                  ? <div className="qsp-card">{q.desc}</div>
                  : <div className="qsp-note"><Icon name="info" size={14} />No description yet — edit the question to add one.</div>}
              </>
            ) : (
              <>
                <textarea className="qsp-desc-ta" rows={2} value={descDraft}
                  placeholder="Add extra context under the question, e.g. what you mean by a term"
                  onChange={e => setDescDraft(e.target.value)} onBlur={commitDesc} />
                {!!meta.desc && <div className="qsp-note"><Icon name="info" size={14} />Applies to this survey only</div>}
              </>
            )}
            {hasDesc && !q.custom && (
              <label className="tgl-label-wrap">
                <span className="tgl-wrap">
                  <input type="checkbox" className="tgl" checked={!meta.descHidden}
                    onChange={e => onUpdate({ descHidden: e.target.checked ? undefined : true })} />
                  <span className="tgl-track"><span className="tgl-thumb" /></span>
                </span>
                Show to respondents
              </label>
            )}
          </div>

          <div className="qsp-sec">
            <span className="qsp-lbl">Answer options</span>
            {q.type === "text" ? (
              <div className="qsp-note"><Icon name="text-entry" size={14} />Open answer — respondents write their own text.</div>
            ) : q.type === "multiple" ? (
              <div className="qsp-scale">
                {(q.options || []).map((o, i) => (
                  <div key={i} className="qsp-scale-row"><Icon name="check-square" size={14} style={{ color: "var(--content-subtle)" }} />{o}</div>
                ))}
              </div>
            ) : (
              <div className="qsp-scale">
                {SCALE_LABELS.map((lbl, i) => (
                  <div key={lbl} className="qsp-scale-row">
                    <span className="qsp-scale-dot" style={{ "--dot": SCALE_DOTS[i], background: SCALE_DOTS[i] }} />{lbl}
                  </div>
                ))}
                <div className="qsp-note" style={{ marginTop: 2 }}><Icon name="info" size={14} />Respondents can also answer "I don't know"</div>
              </div>
            )}
          </div>

          <div className="qsp-sec">
            <span className="qsp-lbl">Translations</span>
            {hasOwnText ? (
              <>
                <div className="qsp-i18n-row"><Icon name="language" size={16} />
                  Your own text on this question is translated automatically.</div>
                <button className="btn btn-secondary" style={{ alignSelf: "flex-start" }} onClick={onOpenTranslations}>
                  <Icon name="language" size={16} />Review translations</button>
              </>
            ) : (
              <div className="qsp-i18n-row"><Icon name="language" size={16} />
                Standard questions come with Effectory translations.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
