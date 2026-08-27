// SuggestionsPanel.jsx — guidance that helps an infrequent user get the results
// they actually want, without ever blocking them.
//
// It reports, it doesn't validate: every row states the finding, why it matters
// and the one action that fixes it. Acting on a row opens the surface that
// already exists for it (the theme dialog, Select questions), and when you come
// back the row is gone — which teaches the mechanic without any explaining.
//
// Built on the DS Side panel (.sidepanel.sidepanel-sm + .sp-* anatomy); only the
// row layout is app-specific. The same list appears as a pre-flight on "Next
// step", so it lives in its own component.
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";

const ICONS = { theme: "themes", custom: "edit-inline", length: "Clock" };

export function SuggestionsList({ items, onAct }) {
  return (
    <div className="sgp-list">
      {items.map(s => (
        <div key={s.id} className="sgp-item">
          <span className={"sgp-item-mark is-" + s.kind}><Icon name={ICONS[s.kind] || "info"} size={16} /></span>
          <div className="sgp-item-body">
            <div className="sgp-item-title">{s.title}</div>
            <div className="sgp-item-why">{s.why}</div>
            {s.action && onAct && (
              <button className="btn btn-secondary sgp-item-btn" onClick={() => onAct(s)}>{s.action}</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SuggestionsPanel({ items, onAct, onClose }) {
  return (
    <div className="overlay is-right" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sidepanel sidepanel-sm is-sm-header" role="dialog" aria-modal="true" aria-labelledby="sgp-title">
        <div className="sp-header is-compact">
          <div className="sp-heading is-sm">
            <h2 className="sp-title" id="sgp-title">Suggestions</h2>
            <p className="sp-subtitle">Worth checking before you send. Nothing here blocks you.</p>
          </div>
          <div className="sp-toolbar">
            <div className="sp-actions">
              <Tooltip label="Close">
                <button className="ib ib-36 ib-tertiary" aria-label="Close" onClick={onClose}><Icon name="cross" size={16} /></button>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="sp-body">
          {items.length === 0 ? (
            <div className="sgp-empty">
              <span className="sgp-empty-mark"><Icon name="check" size={20} /></span>
              <div className="sgp-empty-title">Nothing to flag</div>
              <div className="sgp-empty-sub">Your themes are complete and the length looks good</div>
            </div>
          ) : <SuggestionsList items={items} onAct={onAct} />}
        </div>

        <div className="sp-footer">
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// Shown when the user leaves the questionnaire step with suggestions open.
// It informs and lets them pass — the step is never gated on it.
export function SuggestionsPreflight({ items, onReview, onContinue }) {
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 76 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onContinue(); }}>
      <div className="dialog dialog-m" role="dialog" aria-modal="true" aria-labelledby="sgpf-title">
        <div className="dialog-header is-sm">
          <div className="dialog-header-top">
            <Icon name="lightbulb" size={20} className="dialog-header-icon" />
            <h3 className="dialog-title" id="sgpf-title">
              {items.length === 1 ? "One thing worth checking" : `${items.length} things worth checking`}
            </h3>
          </div>
          <p className="dialog-subtitle">You can come back to these any time before the survey is sent</p>
        </div>
        <SuggestionsList items={items} />
        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onReview}>Review in questionnaire</button>
          <button className="btn btn-primary" onClick={onContinue}>Continue<Icon name="arrow-right" size={16} /></button>
        </div>
      </div>
    </div>
  );
}
