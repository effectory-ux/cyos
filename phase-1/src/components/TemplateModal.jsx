// TemplateModal.jsx — "Choose a survey template" dialog + in-place template preview (Engage DS)
import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { QTypeIcon, Tag, Tooltip } from "./shared.jsx";
import { TEMPLATES, BADGE_COLORS } from "../data/data.js";
import { TEMPLATE_PREVIEWS, TEMPLATE_META } from "../data/qlib.js";

function tmplCount(t) { return (TEMPLATE_META[t.id] || {}).count ?? t.count; }
function tmplMinutes(t) { return (TEMPLATE_META[t.id] || {}).minutes ?? Math.max(3, Math.round(t.count * 0.5)); }

function TemplateCard({ t, onUse, onPreview }) {
  const b = BADGE_COLORS[t.badge];
  return (
    <div className="card" style={{ boxShadow: "var(--sh-card)", padding: "var(--spacing-loose)", display: "flex",
      flexDirection: "column", gap: "var(--spacing-base)", position: "relative" }}>
      {t.recommended && (
        <span className="tag" style={{ position: "absolute", top: 16, right: 16, background: "var(--bg-brand-base)", color: "var(--content-on-brand-base)" }}>Recommended</span>
      )}
      <span style={{ width: 52, height: 52, borderRadius: "var(--radius-full)", background: b.bg, color: b.fg, display: "grid", placeItems: "center" }}>
        <Icon name={b.icon} size={26} />
      </span>
      <div>
        <div className="text-l5">{t.name}</div>
        <div className="text-small" style={{ marginTop: 2, color: "var(--content-secondary)" }}>{t.scope} · {tmplCount(t)} questions</div>
      </div>
      <p className="text-medium" style={{ margin: 0, color: "var(--content-secondary)", flex: 1,
        display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.desc}</p>
      <div style={{ display: "flex", gap: 8 }}>
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
      <div className="dialog-header" style={{ paddingRight: 48 }}>
        <div className="tpv-topbar">
          <button className="btn btn-secondary" onClick={onBack}><Icon name="arrow-left" size={16} />Back to templates</button>
        </div>
      </div>

      <div className="dialog-body scroll-y" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-loose)" }}>
        <div className="tpv-hero">
          <span className="tpv-illus" style={{ background: b.bg, color: b.fg }}><Icon name={b.icon} size={46} /></span>
          <div style={{ minWidth: 0 }}>
            <h2 className="dialog-title" id="tpv-title">{t.name}</h2>
            <div className="tpv-meta">Standard template · {tmplCount(t)} questions · {tmplMinutes(t)} minutes</div>
          </div>
        </div>

        <p className="text-medium" style={{ margin: 0, color: "var(--content-secondary)", lineHeight: 1.6 }}>{t.desc}</p>

        {t.why && (
          <div>
            <h3 className="tpv-section-title">Why is it valuable?</h3>
            <p className="text-medium" style={{ margin: 0, color: "var(--content-secondary)", lineHeight: 1.6 }}>
              <span className="tpv-why">{t.why}{more && t.why2 ? " " + t.why2 : ""}</span>
              {!more && t.why2 && <button className="tpv-showmore" onClick={() => setMore(true)}>Show more <Icon name="chevron-down" size={16} /></button>}
            </p>
          </div>
        )}

        <div>
          <h3 className="tpv-section-title" style={{ fontSize: 20, marginBottom: "var(--spacing-base)" }}>Questionnaire</h3>
          <div className="tpv-qbox">
            {groups.map(g => (
              <section key={g.topic}>
                <div className="tpv-seclabel">
                  <h4 className="text-l5">{g.topic}</h4>
                  <span className="tpv-count">{g.questions.length}</span>
                </div>
                <div className="card" style={{ overflow: "hidden" }}>
                  {g.questions.map((qq, i) => (
                    <div key={i} className="qrow tpv-trow" style={{ borderBottom: i === g.questions.length - 1 ? "none" : undefined }}>
                      <div className="qrow-main">
                        <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{qq.text}</span>
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

      <div className="dialog-footer" style={{ justifyContent: "center" }}>
        <button className="btn btn-primary" style={{ minWidth: 280, height: 48, fontSize: 16 }} onClick={() => onUse(t)}>
          Use template<Icon name="arrow-right" size={18} /></button>
      </div>
    </>
  );
}

export function TemplateModal({ onClose, onUse, onScratch }) {
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState(null);
  const list = TEMPLATES.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog dialog-l dialog-worksurface" role="dialog" aria-modal="true"
        aria-labelledby={preview ? "tpv-title" : "tpl-title"}
        style={{ display: "flex", flexDirection: "column", height: "min(880px, calc(100vh - 64px))" }}>
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onClose}><Icon name="cross" /></button>
        </Tooltip>

        {preview ? (
          <TemplatePreviewView t={preview} onBack={() => setPreview(null)} onUse={onUse} />
        ) : (
          <>
            <div className="dialog-header" style={{ paddingRight: 24 }}>
              <h2 className="dialog-title" id="tpl-title">Choose a survey template</h2>
              <p className="dialog-subtitle">Save time with pre-made survey templates crafted by our experts</p>
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-base-tight)", alignItems: "center" }}>
              <div className="search-wrap" style={{ flex: 1 }}>
                <span className="search-icon"><Icon name="search" size={16} /></span>
                <input type="search" className="srch" placeholder="Search templates" value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <button className="btn btn-secondary" style={{ flex: "none" }} onClick={onScratch}><Icon name="plus" size={16} />Start from scratch</button>
            </div>
            <div className="dialog-body scroll-y">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--spacing-loose)" }}>
                {list.map(t => <TemplateCard key={t.id} t={t} onUse={onUse} onPreview={setPreview} />)}
              </div>
              {list.length === 0 && <div className="text-medium text-subdued" style={{ padding: "60px 0", textAlign: "center" }}>No templates match “{q}”.</div>}
            </div>
            <div className="dialog-footer" style={{ justifyContent: "center", gap: 8, color: "var(--content-secondary)", fontSize: 14 }}>
              <Icon name="info" size={16} style={{ color: "var(--content-info-base)" }} />
              Can’t find a template? Look in other projects, or start from scratch and add questions yourself.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
