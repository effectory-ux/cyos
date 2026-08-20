// TemplateModal.jsx — "Choose a survey template" dialog + in-place template preview (Engage DS)
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { QTypeIcon, Tag, Tooltip } from "./shared.jsx";
import { TEMPLATES, BADGE_COLORS } from "../data/data.js";
import { TEMPLATE_PREVIEWS, TEMPLATE_META } from "../data/qlib.js";

function tmplCount(t) { return (TEMPLATE_META[t.id] || {}).count ?? t.count; }
function tmplMinutes(t) { return (TEMPLATE_META[t.id] || {}).minutes ?? Math.max(3, Math.round(t.count * 0.5)); }

// One template = the DS Card component (v1.17.0 structure): .card-elevated
// surface, .card-body content slot with .card-title / .card-text, and the two
// actions in .card-actions. Deliberately NOT .is-interactive — per the DS rule
// for rows/cards that carry their own buttons, those stay static (you can't
// nest buttons inside a clickable card).
function TemplateCard({ t, onUse, onPreview }) {
  const b = BADGE_COLORS[t.badge];
  return (
    <div className="card card-elevated tpl-card">
      {t.recommended && <span className="tag tag-brand tpl-recommended">Recommended</span>}
      <div className="card-body">
        <span className="tpl-illus" style={{ background: b.bg, color: b.fg }}>
          <Icon name={b.icon} size={26} />
        </span>
        <span className="card-title">{t.name}</span>
        <span className="text-small tpl-meta">{t.scope} · {tmplCount(t)} questions</span>
        <span className="card-text tpl-desc">{t.desc}</span>
      </div>
      <div className="card-actions">
        <button className="btn btn-secondary" onClick={() => onUse(t)}>Use template</button>
        <button className="btn btn-tertiary" onClick={() => onPreview(t)}>Preview</button>
      </div>
    </div>
  );
}

// Full-takeover preview that replaces the template grid inside the same dialog.
function TemplatePreviewView({ t, onBack, onUse }) {
  const b = BADGE_COLORS[t.badge];
  const groups = TEMPLATE_PREVIEWS[t.id] || [];
  const [more, setMore] = useState(false);
  return (
    <>
      <div className="dialog-header has-close">
        <div className="tpv-topbar">
          <button className="btn btn-secondary" onClick={onBack}><Icon name="arrow-left" size={16} />Back to templates</button>
        </div>
      </div>

      <div className="dialog-body scroll-y tpv-body">
        <div className="tpv-hero">
          <span className="tpv-illus" style={{ background: b.bg, color: b.fg }}><Icon name={b.icon} size={46} /></span>
          <div className="tpv-hero-text">
            <h2 className="dialog-title" id="tpv-title">{t.name}</h2>
            <div className="tpv-meta">Standard template · {tmplCount(t)} questions · {tmplMinutes(t)} minutes</div>
          </div>
        </div>

        <p className="text-medium tpv-para">{t.desc}</p>

        {t.why && (
          <div>
            <h3 className="tpv-section-title">Why is it valuable?</h3>
            <p className="text-medium tpv-para">
              <span className="tpv-why">{t.why}{more && t.why2 ? " " + t.why2 : ""}</span>
              {!more && t.why2 && <button className="tpv-showmore" onClick={() => setMore(true)}>Show more <Icon name="chevron-down" size={16} /></button>}
            </p>
          </div>
        )}

        <div>
          <h3 className="tpv-section-title is-lg">Questionnaire</h3>
          <div className="tpv-qbox">
            {groups.map(g => (
              <section key={g.topic}>
                <div className="tpv-seclabel">
                  <h4 className="text-l5">{g.topic}</h4>
                  <span className="tpv-count">{g.questions.length}</span>
                </div>
                <div className="card card-elevated">
                  {g.questions.map((qq, i) => (
                    <div key={i} className="qrow tpv-trow">
                      <div className="qrow-main">
                        <span className="tpv-qtext">{qq.text}</span>
                      </div>
                      <div className="tpv-tcell"><QTypeIcon type={qq.type} size={24} /></div>
                      <div className="tpv-tcell is-tag"><Tag kind="standard">Standard</Tag></div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      <div className="dialog-footer tpv-footer">
        <button className="btn btn-primary tpv-cta" onClick={() => onUse(t)}>
          Use template<Icon name="arrow-right" size={18} /></button>
      </div>
    </>
  );
}

export function TemplateModal({ changing, onClose, onUse, onScratch }) {
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState(null);
  const list = TEMPLATES.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog dialog-l dialog-worksurface tpl-dialog" role="dialog" aria-modal="true"
        aria-labelledby={preview ? "tpv-title" : "tpl-title"}>
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onClose}><Icon name="cross" /></button>
        </Tooltip>

        {preview ? (
          <TemplatePreviewView t={preview} onBack={() => setPreview(null)} onUse={onUse} />
        ) : (
          <>
            <div className="dialog-header has-close">
              <h2 className="dialog-title" id="tpl-title">Choose a survey template</h2>
              <p className="dialog-subtitle">Save time with pre-made survey templates crafted by our experts</p>
            </div>
            {changing && (
              <div className="inline-notif is-warn">
                <img className="inline-notif-icon" alt="" width="24" height="24" src="assets/icons/notification-warning.svg" />
                <div className="inline-notif-content">
                  <div className="inline-notif-text">
                    <span className="inline-notif-title">This resets your questionnaire</span>
                    <span className="inline-notif-msg">Selecting another template or starting from scratch replaces the questions you've added so far.</span>
                  </div>
                </div>
              </div>
            )}
            <div className="tpl-toolbar">
              <div className="search-wrap">
                <span className="search-icon"><Icon name="search" size={16} /></span>
                <input type="search" className="srch" placeholder="Search templates" value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <button className="btn btn-secondary" onClick={onScratch}><Icon name="plus" size={16} />Start from scratch</button>
            </div>
            <div className="dialog-body scroll-y">
              <div className="tpl-grid">
                {list.map(t => <TemplateCard key={t.id} t={t} onUse={onUse} onPreview={setPreview} />)}
              </div>
              {list.length === 0 && <div className="text-medium tpl-empty">No templates match “{q}”.</div>}
            </div>
            <div className="dialog-footer tpl-footnote">
              <Icon name="info" size={16} />
              Can’t find a template? Look in other projects, or start from scratch and add questions yourself.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
