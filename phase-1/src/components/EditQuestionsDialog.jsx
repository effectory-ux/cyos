// EditQuestionsDialog.jsx — Add questions (library-order default + Theme view) — Engage DS
import { useState, useMemo } from "react";
import { Icon } from "./Icon.jsx";
import { themeStatus, groupQuestions, rowSubtext, QTypeIcon, Tag, Checkbox, SortBy, Tooltip } from "./shared.jsx";
import { CustomQuestionDialog } from "./CustomQuestionDialog.jsx";
import { THEMES } from "../data/data.js";

function QRow({ q, sub, on, onToggle }) {
  return (
    <div className={"qrow qrow-pick" + (on ? " is-picked" : "")} onClick={onToggle} style={{ cursor: "pointer" }}>
      <Checkbox on={on} onClick={(e) => { e.stopPropagation(); onToggle(); }} />
      <div className="qrow-main">
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--content-base)", lineHeight: 1.5 }}>{q.text}</div>
        {sub && <div className="text-small" style={{ color: "var(--content-secondary)", marginTop: 2 }}>{sub}</div>}
      </div>
      <div className="qrow-meta">
        <QTypeIcon type={q.type} size={24} tip />
        {q.custom ? <Tag kind="custom">Custom</Tag> : (q.bench && <Tag kind="benchmark">Benchmark</Tag>)}
      </div>
    </div>
  );
}

export function ThemeConfirm({ q, onKeep, onRemove }) {
  const th = THEMES[q.theme] || {};
  const score = th.score ?? 7.8, bench = th.benchmark ?? 7.4;
  const delta = (score - bench).toFixed(1);
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 70 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onKeep(); }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="tc-title">
        <div className="dialog-header is-sm">
          <div className="dialog-header-top">
            <Icon name="themes" size={20} className="dialog-header-icon is-brand" />
            <h3 className="dialog-title" id="tc-title">Keep the {q.theme} theme complete</h3>
          </div>
          <p className="dialog-subtitle">
            This is the last question holding the {q.theme} theme together. Keep it and you unlock one
            benchmarked composite score — a clearer, comparable read than the individual questions alone.</p>
        </div>
        <div className="tc-preview" aria-hidden="true">
          <div className="tc-preview-head"><Icon name="pie-chart" size={14} />Results preview · {q.theme}</div>
          <div className="tc-score-row">
            <span className="tc-score-num">{score.toFixed(1)}</span>
            <span className="tc-score-max">/ 10</span>
            <span className="tc-score-lbl">Composite score</span>
          </div>
          <div className="tc-bar">
            <div className="tc-bar-fill" style={{ width: (score * 10) + "%" }} />
            <div className="tc-bar-bench" style={{ left: (bench * 10) + "%" }} />
          </div>
          <div className="tc-bench-row">
            Benchmark {bench.toFixed(1)}
            <span className="tc-delta"><Icon name="benchmark-up" size={16} />+{delta} vs. industry</span>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-tertiary" onClick={onRemove}>Remove anyway</button>
          <button className="btn btn-primary" onClick={onKeep}>Keep question</button>
        </div>
      </div>
    </div>
  );
}

export function EditQuestionsDialog({ initialPool, initialSelected, tweaks, onClose, onSave }) {
  const [pool, setPool] = useState(initialPool);
  const [sel, setSel] = useState(() => new Set(initialSelected));
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("library");
  const [customOpen, setCustomOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const status = useMemo(() => themeStatus([...sel]), [sel]);
  const statusFor = (name) => status.find(t => t.name === name);

  const toggle = (qq) => {
    const isOn = sel.has(qq.id);
    if (isOn && qq.theme && tweaks.integrity === "lock" && statusFor(qq.theme)?.complete) { setConfirm(qq); return; }
    setSel(s => { const n = new Set(s); isOn ? n.delete(qq.id) : n.add(qq.id); return n; });
  };
  const doRemove = (qq) => { setSel(s => { const n = new Set(s); n.delete(qq.id); return n; }); setConfirm(null); };
  const setMany = (ids, on) => setSel(s => { const n = new Set(s); ids.forEach(id => on ? n.add(id) : n.delete(id)); return n; });
  const addCustom = (nq) => { setPool(p => [...p, nq]); setSel(s => new Set([...s, nq.id])); setCustomOpen(false); };

  const visible = pool.filter(x => [x.text, x.theme, x.topic].some(v => (v || "").toLowerCase().includes(q.toLowerCase())));
  const groups = groupQuestions(visible, sort);
  const selCount = [...sel].length;
  const sortOptions = [
    { value: "library", label: "Order in question library", hint: "How questions appear in the library" },
    { value: "theme", label: "Theme", hint: "Grouped by composite-score themes" },
  ];
  const entry = tweaks.customEntry || "toolbar";
  const AddCustomBtn = ({ variant }) => (
    <button className={"btn " + (variant || "btn-secondary")} style={{ flex: "none" }} onClick={() => setCustomOpen(true)}>
      <Icon name="plus" size={16} />Add custom question</button>
  );

  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog dialog-l dialog-worksurface" role="dialog" aria-modal="true" aria-labelledby="eq-title"
        style={{ display: "flex", flexDirection: "column", height: "min(940px, calc(100vh - 64px))" }}>
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onClose}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header" style={{ paddingRight: 24 }}>
          <h2 className="dialog-title" id="eq-title">Add questions</h2>
          <p className="dialog-subtitle">Choose questions from pre-defined topics and themes to add to your template.</p>
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-base-tight)", alignItems: "center" }}>
          <div className="search-wrap" style={{ flex: 1 }}>
            <span className="search-icon"><Icon name="search" size={16} /></span>
            <input type="search" className="srch" placeholder="Search questions, topics or themes" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <SortBy value={sort} options={sortOptions} onChange={setSort} />
          {(entry === "toolbar" || entry === "both") && <AddCustomBtn />}
        </div>

        <div className="dialog-body scroll-y">
          {sort === "theme" && (
            <p className="text-medium" style={{ margin: "var(--spacing-tight) 0 0", color: "var(--content-secondary)" }}>
              Themes are research-based sets of questions that roll up into one composite score. Add a theme as a whole to keep
              its score — around a third of all questions belong to a theme.</p>
          )}
          {groups.map(g => {
            const ids = g.items.map(x => x.id);
            const allOn = ids.every(id => sel.has(id));
            const someOn = ids.some(id => sel.has(id));
            if (g.kind === "theme") {
              return (
                <section key={g.key} style={{ marginTop: "var(--spacing-loose)", border: "1px solid " + (someOn ? "var(--border-brand-subtle)" : "var(--border-base)"),
                  borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  <div style={{ background: someOn ? "var(--bg-brand-subtle)" : "var(--bg-secondary)", padding: "var(--spacing-base)", borderBottom: "1px solid var(--border-base)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-base-tight)" }}>
                      <Checkbox on={allOn} indeterminate={someOn && !allOn} onClick={() => setMany(ids, !allOn)} />
                      <Icon name="themes" size={18} style={{ color: "var(--content-brand-base)" }} />
                      <span className="text-l5">{g.label}</span>
                      <span className="tag tag-count">{g.items.filter(x => sel.has(x.id)).length}/{g.items.length}</span>
                      <div className="spacer" />
                      {allOn ? <Tag kind="theme" icon="check">Composite score on</Tag>
                        : someOn ? <Tag kind="theme-broken" icon="alert-triangle">Score hidden until complete</Tag>
                        : <button className="btn btn-link" style={{ padding: "4px 6px" }} onClick={() => setMany(ids, true)}><Icon name="plus" size={16} />Add theme</button>}
                    </div>
                    <p className="text-medium" style={{ margin: "var(--spacing-tight) 0 0 32px", color: "var(--content-secondary)" }}>{g.desc}</p>
                  </div>
                  <div>{g.items.map(qq => <QRow key={qq.id} q={qq} sub={rowSubtext(qq, sort)} on={sel.has(qq.id)} onToggle={() => toggle(qq)} />)}</div>
                </section>
              );
            }
            return (
              <section key={g.key} style={{ marginTop: "var(--spacing-loose)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-base-tight)", marginBottom: "var(--spacing-tight)" }}>
                  <h3 className="text-l5" style={{ margin: 0 }}>{g.label}</h3>
                  <span className="tag tag-count">{g.items.length}</span>
                  <div className="spacer" />
                  <button className="btn btn-link" style={{ padding: "4px 6px" }} onClick={() => setMany(ids, !allOn)}>{allOn ? "Deselect all" : "Select all"}</button>
                </div>
                <div className="card" style={{ overflow: "hidden", boxShadow: "none" }}>
                  {g.items.map(qq => <QRow key={qq.id} q={qq} sub={rowSubtext(qq, sort)} on={sel.has(qq.id)} onToggle={() => toggle(qq)} />)}
                </div>
              </section>
            );
          })}

          {(entry === "inline-bottom" || entry === "both") && (
            <button className="btn btn-secondary" style={{ marginTop: "var(--spacing-loose)", width: "100%", height: 48, borderStyle: "dashed" }}
              onClick={() => setCustomOpen(true)}><Icon name="plus" size={16} />Add a custom question</button>
          )}
        </div>

        <div className="dialog-footer">
          <span className="text-medium text-w600" style={{ color: "var(--content-secondary)" }}>{selCount} questions selected</span>
          {entry === "footer" && <AddCustomBtn variant="btn-tertiary" />}
          <div className="spacer" />
          <button className="btn btn-tertiary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave([...sel], pool)}>Apply selection</button>
        </div>
      </div>

      {customOpen && <CustomQuestionDialog onCancel={() => setCustomOpen(false)} onAdd={addCustom} />}
      {confirm && <ThemeConfirm q={confirm} onKeep={() => setConfirm(null)} onRemove={() => doRemove(confirm)} />}
    </div>
  );
}
