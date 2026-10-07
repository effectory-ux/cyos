// EditQuestionsDialog.jsx — "Select questions" (Unified-survey-page frame)
// Tabs: Library questions | Custom questions | Themes | Templates. The library
// tab shows ONLY library content grouped by library topics — custom questions
// and custom topics live in the questionnaire (and the Custom questions tab),
// never in the library view. Rows keep selection in the checkbox with hover
// tooltips.
import { useState, useMemo, useRef, useEffect, Fragment, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";
import { themeStatus, themesOf, groupQuestions, QTypeIcon, Checkbox, Tooltip, ThemeTag, CustomTag, RequiredMarker, useMediaQuery, Highlight } from "./shared.jsx";
import { CustomQuestionDialog } from "./CustomQuestionDialog.jsx";
import { useAnchorMenu, AnchorMenu, MenuItem } from "./AnchorMenu.jsx";
import { BenchmarkQuestionDialog } from "./BenchmarkQuestionDialog.jsx";
import { THEMES, POOL, TEMPLATES, BADGE_COLORS, ORG_CUSTOM } from "../data/data.js";
import { templatePoolQuestions, TEMPLATE_META } from "../data/qlib.js";

// This dialog only ADDS; removing happens in the questionnaire. Every question
// has a checkbox: ticking picks it, and the footer's Add puts what is picked
// in. The state behind the boxes lives in one context so the shared pieces
// (rows, cards, theme and template details) all read the same thing:
//   initial   ids that were in the questionnaire when the dialog opened
//   dups      of those, ones added a second time (no longer offered)
//   moves     of those, the ones to move, with the topic each moves to
//   where(id) the topic names a question already sits in
// A question that is in already starts unticked: ticking it offers to move it
// to the topic you are adding to. One with nothing to do (it sits there
// already) is greyed out, and its tooltip says where it is.
// Pieces used outside this dialog (the builder's theme details) get no context
// and keep their plain checkboxes.
const AddCtx = createContext(null);

// A topic, theme or survey named inside a sentence goes in quotes: names like
// "Tools & resources" otherwise run into the words around them.
const qt = (name) => `“${name}”`;

// Per-topic "Select all". Deliberately a BUTTON, not a checkbox: in the
// questionnaire a topic is only structure, and what you do here is pick its
// questions. It ticks only what can be ticked; once everything is, "Deselect
// all" clears what this dialog ticked. Labels stay short so translations fit,
// and the topic's total question count rides along in a grey pill.
function SelectAllTopic({ allOn, total, ids, onToggle }) {
  const ctx = useContext(AddCtx);
  if (!ctx) {
    // Outside the dialog (the builder's theme details): the old select control.
    return (
      <button className="btn btn-tertiary aql-selectall" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
        {allOn ? "Deselect all" : "Select all"}
        <span className="tag tag-count">{total}</span>
      </button>
    );
  }
  return <GroupSelect ids={ids || []} allOn={allOn} total={total} onToggle={onToggle} />;
}

// The box itself is the DS checkbox (.cb in .cb-wrap), drawn only; the control
// is the button around it, so it takes focus, reads as a checkbox, and can
// carry a tooltip and open a menu. Greyed out (`disabled`) it shows a muted
// tick: the question is there already. aria-disabled rather than disabled, so
// it stays focusable and its tooltip still says why.
function CheckBtn({ on, disabled, tip, btnRef, label, onClick, ...aria }) {
  return (
    <Tooltip label={tip}>
      <button ref={btnRef} type="button" role="checkbox" aria-checked={!!(on || disabled)} aria-label={label}
        aria-disabled={disabled || undefined} {...aria}
        className={"aql-check" + (disabled ? " is-disabled" : "")}
        onClick={(e) => { e.stopPropagation(); if (!disabled && onClick) onClick(e); }}>
        <span className="cb-wrap" aria-hidden="true">
          <input type="checkbox" className={"cb cb-lg" + (disabled ? " is-disabled" : "")} checked={!!(on || disabled)}
            readOnly tabIndex={-1} />
        </span>
      </button>
    </Tooltip>
  );
}

// A question row's checkbox. Ticked = picked here (it goes in on Add; untick to
// drop it). Ticked from the top bar, a question whose topic isn't in the
// questionnaire yet first asks where it goes: that topic as a new one, or an
// existing topic. A question that is in the questionnaire already starts
// unticked, and ticking it offers to move it to the topic you are adding to (a
// question is never in twice). Where there is nothing to do — it sits in that
// topic already, the same wording does, or the dialog has no topic to move it
// to — the box is greyed out and its tooltip says where the question is.
function QCheck({ q, on, onClick }) {
  const ctx = useContext(AddCtx);
  const menu = useAnchorMenu(320, "left");
  const label = q.text;
  if (ctx.initial.has(q.id)) {
    const chosen = ctx.dups.has(q.id) || ctx.moves.has(q.id);
    const dests = ctx.moveTargets(q.id);
    if (!chosen && !dests.length) {
      return <CheckBtn disabled label={label}
        tip={<span className="tt-title">{ctx.target ? "Already in this topic" : `Already in ${ctx.where(q.id)}`}</span>} />;
    }
    return (
      <>
        <CheckBtn btnRef={menu.btn} on={chosen} label={label}
          tip={chosen ? null : <><span className="tt-title">Already in {ctx.where(q.id)}</span>Select it to move it to {qt(ctx.target.label)}</>}
          aria-haspopup={chosen ? undefined : "menu"} aria-expanded={chosen ? undefined : !!menu.at}
          onClick={() => (chosen ? ctx.undo(q) : menu.toggle())} />
        {menu.at && (
          <AnchorMenu at={menu.at} width={320}>
            <div className="menu-header">This question is {ctx.inWhere(q.id)}</div>
            <MenuItem icon="arrow-right" title={`Move to ${qt(dests[0].label)}`}
              onPick={() => { menu.close(); ctx.move(q, dests[0].value); }} />
          </AnchorMenu>
        )}
      </>
    );
  }
  // The same wording already sits in the topic it would go to: a topic never
  // asks one question twice, so there is nothing to pick.
  const blocked = !on ? ctx.blocked(q.id) : null;
  if (blocked) return <CheckBtn disabled label={label}
    tip={<><span className="tt-title">Already in {qt(ctx.topicLabel(blocked))}</span>The same question is already in that topic</>} />;
  const ask = !on ? ctx.unrouted([q.id]) : [];
  return (
    <>
      <CheckBtn btnRef={menu.btn} on={on} label={label}
        aria-haspopup={ask.length ? "menu" : undefined} aria-expanded={ask.length ? !!menu.at : undefined}
        onClick={ask.length ? menu.toggle : onClick} />
      {menu.at && <RouteMenu at={menu.at} q={q} topics={ask} onPick={(to) => { menu.close(); ctx.route(ask, to); onClick(); }} />}
    </>
  );
}

// Where questions from topics that aren't in the questionnaire yet should go.
function RouteMenu({ at, topics, onPick, q }) {
  const ctx = useContext(AddCtx);
  const one = topics.length === 1;
  return (
    <AnchorMenu at={at} width={320}>
      <div className="menu-header">{one ? `The topic ${qt(topics[0])} isn't in your questionnaire yet` : `${topics.length} of these topics aren't in your questionnaire yet`}</div>
      <MenuItem icon="plus" title={one ? `Add ${qt(topics[0])} as a new topic` : "Add them as new topics"}
        sub={one ? "The question goes in there" : ctx.joinNames(topics.map(qt))} onPick={() => onPick("new")} />
      <div className="menu-divider" />
      <div className="aql-route-label">Or add to an existing topic</div>
      <div className="aql-route-list">
        {ctx.existingTopics.map(o => q && ctx.hasText(o.value, q.text)
          ? <MenuItem key={o.value} icon="check" title={o.label} sub="Already has this question" disabled />
          : <MenuItem key={o.value} icon="arrow-right" title={o.label} onPick={() => onPick(o.value)} />)}
      </div>
    </AnchorMenu>
  );
}

// A row is clicked the way its checkbox is, so it asks the same questions.
const clickCheck = (e) => { const b = e.currentTarget.querySelector(".aql-check"); if (b) b.click(); };

// "Select all" for a group: a topic header (`total` rides along in a pill), or
// the Select button of a theme or template `card` (Select, ✓ Selected once
// ticked here, ✓ Added when all of it is in the questionnaire already). When none of its questions
// are in yet it simply ticks them. When some are in already it asks what should
// happen to those — leave them where they are, or move them here — the same
// choice a single question gets. Once everything is ticked, a click clears
// what this dialog ticked in the group.
function GroupSelect({ ids, allOn, total, card, onToggle }) {
  const ctx = useContext(AddCtx);
  const menu = useAnchorMenu(240);
  const route = useAnchorMenu(320);
  const n = ids.length;
  const missingIds = ids.filter(id => !ctx.sel.has(id) && !ctx.blocked(id));
  const missing = missingIds.length;
  const staged = ids.filter(id => (ctx.sel.has(id) && !ctx.initial.has(id)) || ctx.moves.has(id) || ctx.dups.has(id));
  const existing = ids.filter(id => ctx.initial.has(id) && !ctx.moves.has(id) && !ctx.dups.has(id));
  // Adding to a topic, questions that sit in another topic still leave
  // something to do here (move them), so the group isn't done yet.
  const movable = ctx.target ? existing.filter(id => ctx.moveTargets(id).length > 0) : [];
  const nq = (k) => `${k} ${k === 1 ? "question" : "questions"}`;
  // Topics among the missing ones that aren't in the questionnaire yet. Only a
  // single topic's Select all asks where it goes, as one question does; a
  // theme or template brings its structure along, so its topics simply come in
  // as new ones (remembered, so their questions don't ask one by one later).
  const unrouted = !allOn && missing ? ctx.unrouted(missingIds) : [];
  const ask = !card && unrouted.length === 1 ? unrouted : [];
  const addMissing = () => {
    if (!missing || allOn) return;
    if (unrouted.length && !ask.length) ctx.route(unrouted, "new");
    onToggle();
  };
  const clearAll = () => staged.forEach(id => { ctx.undo({ id }); if (!ctx.initial.has(id) && ctx.sel.has(id)) ctx.unselect(id); });
  const done = missing === 0 && movable.length === 0;
  const click = () => {
    if (done) return clearAll();
    if (movable.length === 0) return ask.length ? route.toggle() : addMissing();
    menu.toggle();
  };
  const pick = (act) => () => { menu.close(); act(); };
  // Everything is in the questionnaire already: nothing a click could do.
  const disabled = done && !staged.length;
  const clears = done && staged.length > 0;
  const hasMenu = !done && (movable.length > 0 || ask.length > 0);
  const btnRef = (el) => { menu.btn.current = el; route.btn.current = el; };
  return (
    <>
      <Tooltip label={disabled ? <span className="tt-title">All questions are in</span> : null}>
        <button ref={btnRef} type="button" aria-disabled={disabled || undefined}
          className={(card ? "btn " + (clears ? "btn-primary" : "btn-secondary") : "btn btn-tertiary aql-selectall") + (disabled ? " is-disabled" : "")}
          aria-haspopup={hasMenu ? "menu" : undefined} aria-expanded={hasMenu ? !!(menu.at || route.at) : undefined}
          onClick={(e) => { e.stopPropagation(); if (!disabled) click(); }}>
          {card
            ? (clears ? <><Icon name="check" size={16} />Selected</> : disabled ? <><Icon name="check" size={16} />Added</> : "Select")
            : <>{clears ? "Deselect all" : "Select all"}{total != null && <span className="tag tag-count">{total}</span>}</>}
        </button>
      </Tooltip>
      {route.at && <RouteMenu at={route.at} topics={ask} onPick={(to) => { route.close(); ctx.route(ask, to); addMissing(); }} />}
      {menu.at && (
        <AnchorMenu at={menu.at} width={320}>
          <div className="menu-header">{existing.length} of {nq(n)} already in your questionnaire</div>
          {missing > 0 && <MenuItem icon="plus" title="Select only the new ones"
            sub={`Selects ${missing}. The other ${existing.length} stay where they are`} onPick={pick(addMissing)} />}
          {movable.length > 0 && <MenuItem icon="arrow-right" title={missing > 0 ? "Move the others here too"
              : movable.length === existing.length ? "Move them all here" : `Move the other ${movable.length} here`}
            sub={missing > 0 ? `Selects ${missing} and moves ${movable.length} to ${qt(ctx.target.label)}`
              : movable.length === existing.length ? `Moves ${movable.length} to ${qt(ctx.target.label)}`
              : `${existing.length - movable.length} ${existing.length - movable.length === 1 ? "is" : "are"} already in ${qt(ctx.target.label)}`}
            onPick={pick(() => { addMissing(); movable.forEach(id => ctx.move({ id }, ctx.target.key)); })} />}
        </AnchorMenu>
      )}
    </>
  );
}

// Under the wording, only once a choice is made for a question that was in
// already: what is about to happen to it.
function WhereLine({ q }) {
  const ctx = useContext(AddCtx);
  if (!ctx.moves.has(q.id) && !ctx.dups.has(q.id)) return null;
  const where = ctx.where(q.id);
  return <span className="aql-where">{ctx.moves.has(q.id) ? `Moves from ${where} to ${qt(ctx.topicLabel(ctx.moves.get(q.id)))}` : `Added a second time, also in ${where}`}</span>;
}

// Which survey a custom question is already used in. Truncates; the tooltip
// carries the whole sentence.
function UsedInTag({ survey }) {
  return (
    <Tooltip label={`Custom question used in ${qt(survey)}`} pos="is-above" float>
      <span className="tag tag-draft text-w500 eq-usedin">{survey}</span>
    </Tooltip>
  );
}

// Everything a row can do beyond the checkbox, in the same place the
// questionnaire keeps it: an icon button on the right. The first item opens the
// question's own dialog — where its wording, description and translations live.
// What a row offers beyond its checkbox, in the same corner the questionnaire
// keeps it. Two shapes, because the two kinds of question offer different things:
//
//   • a library question, or a custom one reused from another survey, has
//     exactly ONE action — open its dialog (wording, description, translations).
//     A menu holding one item is a click too many, so the button IS that action.
//   • a custom question written in THIS survey can also be deleted, which must
//     never be one stray click away. That one keeps the menu.
//
// The menu renders in a portal at fixed coordinates: the list it sits in
// scrolls and clips, and rows below it are painted later, so an absolutely
// positioned menu ends up under them.
function RowActions({ q, on, inQ, onToggle, onSettings, onEditCustom, onDelete }) {
  const ownCustom = !!q.custom && !q.from;
  const openDialog = () => (q.custom ? onEditCustom && onEditCustom(q) : onSettings && onSettings(q));
  const [at, setAt] = useState(null);
  const btn = useRef(null);
  const close = () => setAt(null);
  // Fixed coordinates have to be maintained: the list scrolls under the menu,
  // so it FOLLOWS its button (and closes only when the button leaves the view).
  // Closing on any scroll event looked like a menu that refused to open — the
  // click itself can scroll the row into view.
  useEffect(() => {
    if (!at) return;
    const h = (e) => { if (!e.target.closest || !e.target.closest(".qrow-portal-menu")) close(); };
    const follow = () => {
      const el = btn.current;
      if (!el) return close();
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return close();
      setAt({ top: Math.round(r.bottom + 4), right: Math.round(window.innerWidth - r.right) });
    };
    document.addEventListener("mousedown", h);
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      document.removeEventListener("mousedown", h);
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [at ? 1 : 0]); // eslint-disable-line

  // A library question's settings aren't offered here: this dialog is for
  // adding, and a question's wording and translations are edited from the
  // questionnaire. Only a custom question written here keeps its menu.
  if (!ownCustom) return null;

  const item = (icon, label, act, danger) => (
    <div className={"menu-item" + (danger ? " is-danger" : "")} role="menuitem"
      onClick={(e) => { e.stopPropagation(); close(); act(); }}>
      <span className="menu-item-icon"><Icon name={icon} size={16} /></span>
      <span className="menu-item-body"><span className="menu-item-title">{label}</span></span>
    </div>
  );
  const toggleMenu = () => {
    if (at) { close(); return; }
    const r = btn.current.getBoundingClientRect();
    setAt({ top: Math.round(r.bottom + 4), right: Math.round(window.innerWidth - r.right) });
  };
  return (
    <div className="qrow-menu-wrap" onClick={e => e.stopPropagation()}>
      <Tooltip label="Question actions">
        <button ref={btn} className="ib ib-36 ib-tertiary" aria-label="Question actions"
          aria-haspopup="menu" aria-expanded={!!at} onClick={toggleMenu}>
          <Icon name="more-vertical" size={16} />
        </button>
      </Tooltip>
      {at && createPortal(
        <div className="menu qrow-portal-menu" role="menu"
          style={{ position: "fixed", top: at.top, right: at.right, width: 264, zIndex: 1200 }}>
          {item("edit", "Edit question", openDialog)}
          {onDelete && !inQ && (
            <>
              <div className="menu-divider" />
              {item("trash", "Delete question", () => onDelete(q), true)}
            </>
          )}
        </div>, document.body)}
    </div>
  );
}

function QRow({ q, on, onToggle, onRequiredPress, rowRef, leaving, themeInfo, onOpenTheme, onEditCustom, onSettings, onDeleteCustom, usedInTag, hl, plain, hideTheme }) {
  const required = q.required;
  const ctxQ = useContext(AddCtx);
  const inQ = !!ctxQ?.initial.has(q.id);
  // The whole row is clicked the way its checkbox is.
  return (
    <div ref={rowRef} className={"aql-row" + (leaving ? " is-leaving" : "")}
      onClick={leaving ? undefined : clickCheck}>
      <QCheck q={q} on={on} onClick={onToggle} />
      <div className="aql-text">
        {hl ? <Highlight text={q.text} q={hl} /> : q.text}
        {/* Required rides along with the wording, small, instead of taking a
            column of its own among the row's tags and actions. */}
        {required && <span className="aql-req-inline"><RequiredMarker size={16} /></span>}
        {/* A question's description is always shown, as in the questionnaire:
            the survey's own (from its settings) or a custom question's. */}
        {(() => {
          const m = (ctxQ && ctxQ.qMeta && ctxQ.qMeta[q.id]) || {};
          const desc = m.descHidden ? null : (m.desc || q.desc);
          return desc ? <span className="aql-desc">{desc}</span> : null;
        })()}
        {inQ && <WhereLine q={q} />}
        {!inQ && on && ctxQ && ctxQ.routedTo(q.id) && <span className="aql-where">Goes to {qt(ctxQ.routedTo(q.id))}</span>}
      </div>
      {/* Tags and actions travel as one group so a narrow screen can drop them
          to their own line instead of squeezing the wording into a column. */}
      <div className="aql-meta">
        {/* On the Custom questions page the "Custom question" tag is redundant —
            you are on that page. The space carries where the question is used
            instead, truncated, with the full sentence in its tooltip. */}
        {/* plain (the grouped layout): the theme as a quiet label — its
            completion colours and the required marker are noise while
            choosing what to add. */}
        {plain
          ? (q.theme && !hideTheme ? <span className="tag aql-theme-plain">{hl ? <Highlight text={q.theme} q={hl} /> : q.theme}</span>
            : !q.theme && q.custom ? <span className="tag aql-theme-plain">{q.from ? q.from : "Custom question"}</span> : null)
          : q.theme
          ? <ThemeTag theme={q.theme} kept={themeInfo ? themeInfo.kept : 0} total={themeInfo ? themeInfo.total : 0} pos="is-above" float
              hl={hl} onOpen={onOpenTheme ? () => onOpenTheme(q.theme) : undefined} />
          : usedInTag
            ? (q.from ? <UsedInTag survey={q.from} /> : null)
            : q.custom ? <CustomTag label="Custom question" pos="is-above" float onOpen={onEditCustom ? () => onEditCustom(q) : undefined} /> : null}
        <QTypeIcon type={q.type} size={24} tip pos="is-above" float />
        <RowActions q={q} on={on} inQ={inQ} onToggle={onToggle} onSettings={onSettings} onEditCustom={onEditCustom} onDelete={onDeleteCustom} />
      </div>
    </div>
  );
}

// A theme card (Themes tab). Clicking the card adds/removes the whole theme; a
// progress bar shows how far the theme is toward complete, and a composite-score
// line explains that a complete theme becomes one benchmarked score in results.
// A theme / template card share one shape: title · description · a count (+
// progress bar for themes) · a Select/Active toggle button and a View details
// link. "Active" (all questions selected) highlights the card and turns the
// button into a filled "✓ Active"; clicking it again clears the selection.
// `art` is a template's DS illustration path (the same SVG the create-survey
// dialog shows); `illus` stays the icon tile themes use.
function ChoiceCard({ variant, title, desc, illus, art, selCount, total, ids, hl, onToggle, onDetails }) {
  const isTemplate = variant === "template";
  const allOn = total > 0 && selCount >= total;
  const ctx = useContext(AddCtx);
  const pct = total ? Math.round((selCount / total) * 100) : 0;
  // Once every question is in, the button already reads "Active", so the count
  // drops the "All questions selected" phrasing back to a plain question total.
  const countText = (allOn || selCount === 0) ? `${total} ${total === 1 ? "question" : "questions"}`
    : `${selCount} of ${total} questions selected`;
  // Clicking the card body opens View details; only the Select/Active button
  // toggles it into the questionnaire.
  return (
    <div className={"cc-card " + (isTemplate ? "cc-template" : "cc-theme") + (allOn ? " is-active" : "")}
      role="button" tabIndex={0} onClick={onDetails}
      // Only the card itself: Enter on its Add button adds, it doesn't open details too.
      onKeyDown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDetails(); } }}>
      <div className="cc-head">
        {art
          ? <img className="cc-art" src={"assets/illustrations/" + art} alt="" />
          : illus && <span className="cc-illus" style={{ background: illus.bg, color: illus.fg }}><Icon name={illus.icon} size={30} /></span>}
        <span className="cc-title">{hl ? <Highlight text={title} q={hl} /> : title}</span>
        <p className="cc-desc">{hl ? <Highlight text={desc} q={hl} /> : desc}</p>
      </div>
      {isTemplate ? (
        <span className="cc-count">{countText}</span>
      ) : (
        <div className="cc-meter">
          <span className="cc-count">{countText}</span>
          <div className="cc-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            {pct > 0 && <div className="cc-progress-fill" style={{ width: pct + "%" }} />}
          </div>
        </div>
      )}
      <div className="cc-foot">
        <GroupSelect card ids={ids || []} allOn={allOn} onToggle={onToggle} />
        <button className="btn btn-tertiary" onClick={(e) => { e.stopPropagation(); onDetails(); }}>View details</button>
      </div>
    </div>
  );
}

// Theme details (Figma 6154:13236): explanation, a composite-score notification
// that flips from info ("not shown") to positive ("unlocked") once every question
// is in, and the theme's questions to toggle one by one. Toggles apply live and
// skip the soft-lock; Cancel reverts this theme's questions to how they were on
// open, Got it keeps them.
export function ThemeDetailsDialog({ theme, sel, onToggle, onToggleAll, onClose }) {
  const { name, about, desc, questions, kept, total } = theme;
  const complete = total > 0 && kept >= total;
  const ctx = useContext(AddCtx);
  // Snapshot the theme's selection on open so Cancel can restore it.
  const initial = useMemo(() => new Set(questions.filter(qq => sel.has(qq.id)).map(qq => qq.id)), []); // eslint-disable-line
  const cancel = () => {
    questions.forEach(qq => { if (initial.has(qq.id) !== sel.has(qq.id)) onToggle(qq.id); });
    onClose();
  };
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 65 }}
      onMouseDown={e => { if (e.target === e.currentTarget) (ctx ? onClose() : cancel()); }}>
      <div className="dialog dialog-m dialog-worksurface" role="dialog" aria-modal="true" aria-labelledby="thd-title"
        style={{ display: "flex", flexDirection: "column", maxHeight: "min(880px, calc(100vh - 96px))" }}>
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={ctx ? onClose : cancel}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h2 className="dialog-title" id="thd-title">{name}</h2>
          <p className="dialog-subtitle">{about || desc}</p>
        </div>
        <div className={"inline-notif " + (complete ? "is-success" : "is-info")}>
          <img className="inline-notif-icon" alt="" width="24" height="24"
            src={"assets/icons/notification-" + (complete ? "positive" : "information") + ".svg"} />
          <div className="inline-notif-content">
            <div className="inline-notif-text">
              <span className="inline-notif-title">{complete ? "Theme score unlocked for the results!" : "Theme score not shown in results"}</span>
              <span className="inline-notif-msg">{complete
                ? "When all questions in a theme are included, their answers combine into one theme score."
                : "All theme questions need to be selected for a theme to show in the results."}</span>
            </div>
          </div>
        </div>
        <div className="dialog-body scroll-y">
          {/* Same header as a topic's: title, then the select-all button with the
              total in a grey pill. One component, one behaviour. */}
          <div className="aql-sechead" style={{ paddingTop: 0 }}>
            <h3>Theme questions</h3>
            <div className="spacer" />
            <SelectAllTopic allOn={complete} total={total} ids={questions.map(x => x.id)} onToggle={() => onToggleAll(kept < total)} />
          </div>
          {questions.map(qq => ctx ? (
            <div key={qq.id} className="aql-row" onClick={clickCheck}>
              <QCheck q={qq} on={sel.has(qq.id)} onClick={() => onToggle(qq.id)} />
              <div className="aql-text">
                <span className="thm-q-text">{qq.text}</span>
                {ctx.initial.has(qq.id) ? <WhereLine q={qq} /> : qq.topic && <span className="thm-q-topic">Found under {qt(qq.topic)}</span>}
              </div>
              <QTypeIcon type={qq.type} size={24} tip pos="is-above" float />
            </div>
          ) : (
            <div key={qq.id} className="aql-row" onClick={() => onToggle(qq.id)}>
              <Tooltip label={sel.has(qq.id) ? "Remove from questionnaire" : "Add to questionnaire"} pos="is-above" float>
                <Checkbox on={sel.has(qq.id)} large onClick={(e) => { e.stopPropagation(); onToggle(qq.id); }} />
              </Tooltip>
              <div className="aql-text">
                <span className="thm-q-text">{qq.text}</span>
                {qq.topic && <span className="thm-q-topic">Found under {qt(qq.topic)}</span>}
              </div>
              <QTypeIcon type={qq.type} size={24} tip pos="is-above" float />
            </div>
          ))}
        </div>
        {/* In the Question library its ticks are part of that dialog's
            selection, which its own footer adds, so the cross (and the
            backdrop) only close it. Opened from the questionnaire it edits
            directly, and keeps Cancel and Confirm. */}
        {!ctx && (
          <div className="dialog-footer">
            <div className="spacer" />
            <button className="btn btn-secondary" onClick={cancel}>Cancel</button>
            <button className="btn btn-primary" onClick={onClose}>Confirm</button>
          </div>
        )}
      </div>
    </div>
  );
}

// After Add from the bar's Add questions: a DS system notification in the
// questionnaire, top-right, saying how many questions went in and where — a
// template's worth spread over a dozen topics is impossible to check by
// scrolling. Auto-dismisses; a live region, so it is announced too.
export function AddedNotice({ summary, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line
  const { count, topics } = summary;
  const nq = (k) => `${k} ${k === 1 ? "question" : "questions"}`;
  const join = (names) => names.length < 2 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  const fresh = topics.filter(t => t.isNew);
  let desc;
  if (topics.length === 1) {
    desc = fresh.length ? `In ${qt(topics[0].label)}, a new topic.` : `In ${qt(topics[0].label)}.`;
  } else if (fresh.length === topics.length) {
    desc = topics.length <= 3 ? `In the new topics ${join(topics.map(t => qt(t.label)))}.` : `In ${topics.length} new topics.`;
  } else if (topics.length <= 3) {
    desc = `In ${join(topics.map(t => qt(t.label)))}.`
      + (fresh.length === 1 ? ` ${qt(fresh[0].label)} is a new topic.` : fresh.length ? ` ${fresh.length} of them are new topics.` : "");
  } else {
    desc = `Across ${topics.length} topics` + (fresh.length ? `, ${fresh.length} of them new.` : ".");
  }
  return (
    <div className="sysnotif-stack">
      <div className="sysnotif" role="status" aria-live="polite">
        <div className="sysnotif-title">{nq(count)} added</div>
        <div className="sysnotif-desc">{desc}</div>
        <button className="sysnotif-close" aria-label="Dismiss" onClick={onClose}><Icon name="cross" size={16} /></button>
      </div>
    </div>
  );
}

// DS system notification, top-right, auto-dismissing — confirms a custom
// question was added and names the topic it landed in.
function AddedToast({ topic, onClose }) {
  return (
    <div className="sysnotif-stack">
      <div className="sysnotif" role="status">
        <div className="sysnotif-title">Custom question created</div>
        <div className="sysnotif-desc">Selected for “{topic}”. Add it to put it in your questionnaire</div>
        <button className="sysnotif-close" aria-label="Dismiss" onClick={onClose}><Icon name="cross" size={16} /></button>
      </div>
    </div>
  );
}

// Info notification shown when a required question is pressed, or when a
// "Deselect all" keeps required questions selected — a live region
// (role=status + aria-live) so the reason is announced, not just seen.
function RequiredNotice({ count = 1, onClose }) {
  return (
    <div className="sysnotif-stack">
      <div className="sysnotif is-info" role="status" aria-live="polite">
        <div className="sysnotif-title">{count > 1 ? `${count} questions are required` : "This question is required"}</div>
        <div className="sysnotif-desc">{count > 1
          ? "They’re set up as required and stay selected in this survey"
          : "It’s set up as required and is always included in this survey"}</div>
        <button className="sysnotif-close" aria-label="Dismiss" onClick={onClose}><Icon name="cross" size={16} /></button>
      </div>
    </div>
  );
}

// First sentence of a description (for the multi-theme stacked cards, which cut
// the description to one sentence instead of the usual two).
const firstSentence = (t) => { const m = (t || "").match(/^.*?[.!?](\s|$)/); return m ? m[0].trim() : (t || ""); };
// Join theme names as “A”, “B” and “C”.
const joinThemes = (names) => {
  const q = names.map(n => `“${n}”`);
  return q.length <= 1 ? (q[0] || "") : q.slice(0, -1).join(", ") + " and " + q[q.length - 1];
};

// The soft-lock example card for one theme: name, description and the two score
// bars. `multi` cuts the description to a single (clamped) sentence.
function TcThemeCard({ name, multi, style }) {
  const th = THEMES[name] || {};
  const groupPct = Math.round((th.score ?? 8.1) * 10);
  const benchPct = Math.round((th.benchmark ?? 7.6) * 10);
  const desc = multi ? firstSentence(th.desc) : (th.desc || "");
  return (
    <div className={"tc-theme-card" + (multi ? " is-multi" : "")} style={style}>
      <div className="tc-theme-name">{name}</div>
      {desc && <p className="tc-theme-desc">{desc}</p>}
      <div className="tc-bars">
        <div className="tc-pbar">
          <div className="tc-pbar-lbl"><span className="tc-pbar-name">Group score</span><span className="tc-pbar-val">{groupPct}%</span></div>
          <div className="tc-track"><div className="tc-fill tc-fill-current" style={{ width: groupPct + "%" }} /></div>
        </div>
        <div className="tc-pbar">
          <div className="tc-pbar-lbl"><span className="tc-pbar-name">Benchmark</span><span className="tc-pbar-val">{benchPct}%</span></div>
          <div className="tc-track"><div className="tc-fill tc-fill-bench" style={{ width: benchPct + "%" }} /></div>
        </div>
      </div>
    </div>
  );
}

export function ThemeConfirm({ q, themes, pool, onKeep, onRemove }) {
  const list = themes && themes.length ? themes : (q.theme ? [q.theme] : []);
  const multi = list.length > 1;
  const count = (pool || POOL).filter(p => themesOf(p).includes(list[0])).length;
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 70 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onKeep(); }}>
      <div className="dialog dialog-s" role="dialog" aria-modal="true" aria-labelledby="tc-title">
        <Tooltip label="Close" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onKeep}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm" style={{ paddingRight: 16 }}>
          <h3 className="dialog-title" id="tc-title">{multi ? "Keep the multiple themes complete" : `Keep the “${list[0]}” theme complete`}</h3>
          <p className="dialog-subtitle">
            {multi
              ? <>This is the last question that is holding the themes {joinThemes(list)} complete. You need the average score of all questions to unlock the theme scores.</>
              : <>This is the last question that is holding the theme {joinThemes(list)} complete. You need the average score of all {count} questions to unlock the composite score.</>}
          </p>
        </div>
        <div className="tc-example" aria-hidden="true">
          <span className="tc-example-tag">Not real scores</span>
          {multi ? (
            <div className="tc-stack">
              {list.map((name, i) => <TcThemeCard key={name} name={name} multi style={{ zIndex: i + 1 }} />)}
            </div>
          ) : (
            <TcThemeCard name={list[0]} />
          )}
        </div>
        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={onRemove}>Remove anyway</button>
          <button className="btn btn-primary" onClick={onKeep}>Keep question</button>
        </div>
      </div>
    </div>
  );
}

// "Show:" filter — DS selection button + menu (All / Added / Not added).
const SHOW_OPTIONS = [
  { value: "all", label: "All questions" },
  { value: "selected", label: "Added" },
  { value: "unselected", label: "Not added" },
];
const THEME_SHOW_OPTIONS = [
  { value: "all", label: "All themes" },
  { value: "complete", label: "Complete" },
  { value: "incomplete", label: "Incomplete" },
];
const TEMPLATE_SHOW_OPTIONS = [
  { value: "all", label: "All templates" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Not active" },
];
// Sidebar variant: the filter row sits next to the ONE global search and works
// on whichever section is open, so its labels stay general ("Show: All").
const RESULT_FILTERS = [
  { value: "all", label: "All results" },
  { value: "questions", label: "Questions" },
  { value: "themes", label: "Themes" },
  { value: "templates", label: "Templates" },
];
// The dialog's pages, in rail order. `group` starts a labelled group ("Question
// sets"), which the compact menu repeats so both navigations read the same.
// Topic choices for the custom-question dialog: the survey's own list (which
// includes custom topics with no questions yet, the very ones you create in
// order to fill) plus anything only present in this dialog's working pool.
function mergeTopics(options, poolTopics) {
  const out = [...(options || [])];
  const seen = new Set(out.map(o => o.value));
  [...new Set(poolTopics)].forEach(t => { if (!seen.has(t)) out.push({ value: t, label: t }); });
  return out;
}

const EQ_PAGES = [
  // Each item names where you are; the dialog's title says what you do
  // there (Add questions), and the rows' checkboxes and the footer's Add do it.
  { value: "questions", label: "Library questions", icon: "list-unordered" },
  { value: "custom", label: "Custom questions", icon: "edit" },
  { value: "themes", label: "Themes", icon: "themes" },
  { value: "templates", label: "Templates", icon: "layout" },
];
// The default layout. Two sources — the library and custom questions — and the
// library browsed by one trait: its topic, its theme, or the template a question
// is in. The rail shows that hierarchy: the three ways of browsing sit under
// Library questions; Custom questions stands on its own.
const EQ_VIEWS = [
  { value: "topic", label: "By topic", icon: "folder", group: "Library questions" },
  { value: "theme", label: "By theme", icon: "themes" },
  { value: "template", label: "By template", icon: "layout" },
  { value: "custom", label: "Custom questions", icon: "edit", top: true },
];
// Under this the dialog can't hold the 280px rail next to a usable list, so the
// rail becomes a menu button on the left of the search field.
const EQ_COMPACT = "(max-width: 1120px)";

const GENERIC_SHOW = {
  questions: [
    { value: "all", label: "All" }, { value: "selected", label: "Added" }, { value: "unselected", label: "Not added" }],
  custom: [
    { value: "all", label: "All" }, { value: "selected", label: "Added" }, { value: "unselected", label: "Not added" }],
  themes: [
    { value: "all", label: "All" }, { value: "complete", label: "Complete" }, { value: "incomplete", label: "Incomplete" }],
  templates: [
    { value: "all", label: "All" }, { value: "active", label: "Active" }, { value: "inactive", label: "Not active" }],
};
// The rail as a menu, for when the dialog is too narrow to hold it. Same pages,
// same order, same group label — and the page you are on is selected.
function PagesMenu({ tab, onPick, pages = EQ_PAGES, label = "Pages" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const cur = pages.find(p => p.value === tab);
  return (
    <div ref={ref} style={{ position: "relative", flex: "none" }}>
      <Tooltip label={cur ? label + ": " + cur.label : label}>
        <button className={"ib ib-36 ib-secondary" + (open ? " is-pressed" : "")} aria-label={label}
          aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <Icon name="menu" size={16} />
        </button>
      </Tooltip>
      {open && (
        <div className="menu" role="menu" style={{ position: "absolute", left: 0, top: 44, width: 240, zIndex: 30 }}>
          {pages.map(p => (
            <Fragment key={p.value}>
              {p.group && <div className="menu-group-lbl" role="presentation">{p.group}</div>}
              <div className={"menu-item" + (p.value === tab ? " is-selected" : "")} role="menuitem"
                onClick={() => { onPick(p.value); setOpen(false); }}>
                <span className="menu-item-icon"><Icon name={p.icon} size={16} /></span>
                <span className="menu-item-body"><span className="menu-item-title">{p.label}</span></span>
                {p.value === tab && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// One "Filter" button holding every narrowing the page offers: what to show of
// this page, plus (while a search is running) which kind of result to keep. The
// count badge says how many are actually narrowing anything — "All" on both is
// the default and counts for nothing.
function FilterMenu({ show, showOptions, onShow, kind, kindOptions, onKind, compact }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const active = (show && show !== "all" ? 1 : 0) + (kindOptions && kind && kind !== "all" ? 1 : 0);
  const group = (label, value, options, onPick) => (
    <>
      <div className="menu-group-lbl" role="presentation">{label}</div>
      {options.map(o => (
        <div key={o.value} className={"menu-item" + (o.value === value ? " is-selected" : "")}
          onClick={() => { onPick(o.value); setOpen(false); }}>
          <span className="menu-item-body"><span className="menu-item-title">{o.label}</span></span>
          {o.value === value && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
        </div>
      ))}
    </>
  );
  return (
    <div ref={ref} style={{ position: "relative", flex: "none" }}>
      {compact ? (
        <Tooltip label={active > 0 ? `Filter (${active} active)` : "Filter"}>
          <button className={"ib ib-36 ib-secondary" + (open ? " is-pressed" : "")} aria-label="Filter"
            aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
            <Icon name="filter" size={16} />
            {active > 0 && <span className="eq-filter-count is-dot">{active}</span>}
          </button>
        </Tooltip>
      ) : (
        <button className={"sel-btn" + (open ? " is-pressed" : "")} aria-haspopup="menu" aria-expanded={open}
          onClick={() => setOpen(o => !o)}>
          <Icon name="filter" size={16} style={{ color: "var(--content-secondary)" }} />
          <span className="sel-btn-name">Filter</span>
          {active > 0 && <span className="eq-filter-count">{active}</span>}
        </button>
      )}
      {open && (
        <div className="menu" role="menu" style={{ position: "absolute", right: 0, top: 44, width: 240, zIndex: 30 }}>
          {group("Show", show, showOptions, onShow)}
          {kindOptions && (
            <>
              <div className="menu-divider" />
              {group("Type of content", kind, kindOptions, onKind)}
            </>
          )}
          {active > 0 && (
            <>
              <div className="menu-divider" />
              <div className="menu-item" onClick={() => { onShow("all"); onKind && onKind("all"); setOpen(false); }}>
                <span className="menu-item-icon"><Icon name="refresh" size={16} /></span>
                <span className="menu-item-body"><span className="menu-item-title">Reset filters</span></span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ShowFilter({ value, onChange, options = SHOW_OPTIONS, label = "Show:" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const cur = options.find(o => o.value === value) || options[0];
  return (
    <div ref={ref} style={{ position: "relative", flex: "none" }}>
      <button className={"sel-btn" + (open ? " is-pressed" : "")} onClick={() => setOpen(o => !o)}>
        <Icon name="filter" size={16} style={{ color: "var(--content-secondary)" }} />
        <span className="sel-btn-name">{label}</span>
        <span className="sel-btn-value">{cur.label}</span>
      </button>
      {open && (
        <div className="menu" style={{ position: "absolute", right: 0, top: 44, width: 220, zIndex: 30 }}>
          {options.map(o => (
            <div key={o.value} className={"menu-item" + (o.value === value ? " is-selected" : "")}
              onClick={() => { onChange(o.value); setOpen(false); }}>
              <span className="menu-item-body"><span className="menu-item-title">{o.label}</span></span>
              {o.value === value && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Templates tab → "View details": a full-takeover view (replaces the tabs +
// toolbar + list) showing a template's questionnaire, with per-question
// checkboxes and a "Select all questions" toggle. Selecting here is the same
// action as the card's Select button — it just works question by question.
function TemplateDetailView({ t, sel, onBack, onToggleQuestion, onSelectAll }) {
  const b = BADGE_COLORS[t.badge] || {};
  const meta = TEMPLATE_META[t.id] || {};
  const groups = groupQuestions(t.questions, "library");
  const allOn = t.total > 0 && t.selCount >= t.total;
  const ctx = useContext(AddCtx);
  return (
    <>
      <div className="dialog-header tpv-dhead">
        <div className="tpv-topbar">
          <button className="btn btn-secondary" onClick={onBack}><Icon name="arrow-left" size={16} />Back to templates</button>
        </div>
      </div>
      <div className="dialog-body scroll-y tpv-body">
        <div className="tpv-hero">
          <img className="tpv-illus" src={"assets/illustrations/" + t.illus} alt="" />
          <div style={{ minWidth: 0 }}>
            <h2 className="dialog-title" id="tpv-title">{t.name}</h2>
            <div className="tpv-meta">Standard template · {t.total} questions · {meta.minutes || Math.max(3, Math.round(t.total * 0.5))} minutes</div>
          </div>
        </div>
        <p className="text-medium" style={{ margin: 0, color: "var(--content-base)", lineHeight: 1.6 }}>{t.desc}</p>
        {t.why && (
          <div>
            <h3 className="tpv-section-title">Why is it valuable?</h3>
            <p className="text-medium" style={{ margin: 0, color: "var(--content-base)", lineHeight: 1.6 }}>{t.why}{t.why2 ? " " + t.why2 : ""}</p>
          </div>
        )}
        <div className="tmpl-qpanel">
          <div className="tmpl-qpanel-head">
            <h3 className="tpv-section-title" style={{ fontSize: 20, margin: 0 }}>Questionnaire</h3>
            <GroupSelect ids={t.questions.map(x => x.id)} allOn={allOn} onToggle={() => onSelectAll(!allOn)} />
          </div>
          {groups.map(g => {
            const ids = g.items.map(x => x.id);
            const gAll = ids.every(id => sel.has(id));
            const gSome = ids.some(id => sel.has(id));
            const nSel = g.items.filter(x => sel.has(x.id)).length;
            return (
              <section key={g.key} className="tmpl-qsec">
                <div className="aql-sechead tmpl-qsec-head">
                  <h3>{g.label}</h3>
                  <div className="spacer" />
                  <SelectAllTopic allOn={gAll} total={ids.length} ids={ids}
                    onToggle={() => ids.forEach(id => { if (gAll ? sel.has(id) : !sel.has(id)) onToggleQuestion(id); })} />
                </div>
                {g.items.map(qq => (
                  <div key={qq.id} className="aql-row" onClick={clickCheck}>
                    <QCheck q={qq} on={sel.has(qq.id)} onClick={() => onToggleQuestion(qq.id)} />
                    <div className="aql-text">
                      {qq.text}
                      {ctx.initial.has(qq.id) && <WhereLine q={qq} />}
                    </div>
                    <QTypeIcon type={qq.type} size={24} tip pos="is-above" float />
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

// `nav` switches the dialog's navigation (prototype variant, toolbar-driven):
// "tabs"    — the four tabs on top, search scoped to the active tab (current).
// "sidebar" — Miro/Qualtrics-style: a left rail to browse (with the topics as
//             jump anchors) and ONE search on top that looks across questions,
//             themes and templates, results grouped by where they came from.
export function EditQuestionsDialog({ initialPool, initialSelected, tweaks, initialTab = "questions", nav = "tabs", qMeta = {}, addToTopic = null, topicOptions = [], onUpdateQMeta, onMoveTopic, translationsFor, onClose, onSave }) {
  const compact = useMediaQuery(EQ_COMPACT);
  const [pool, setPool] = useState(initialPool);
  const [sel, setSel] = useState(() => new Set(initialSelected));
  const initial = useMemo(() => new Set(initialSelected), []); // selection when the dialog opened
  // "Add questions to this topic": while set, everything selected here files
  // into that topic on Confirm. The user can drop back to normal adding with
  // the notice's own button; the mode never outlives the dialog.
  const [target, setTarget] = useState(addToTopic || null);
  // Questions that were in already and get added once more, or moved into the
  // target topic. Both are staged like any other add and land on Confirm.
  const [dups, setDups] = useState(() => new Set());
  const [moves, setMoves] = useState(() => new Map());
  // Library topic → where its questions go when that topic isn't in yet: an
  // existing topic's key, or "new". Asked once per topic, on its first add.
  const [routes, setRoutes] = useState(() => new Map());
  const routesRef = useRef(routes);
  const targetAdds = useRef(new Set());
  const markAdded = (ids) => { if (target) ids.forEach(id => targetAdds.current.add(id)); };
  const [q, setQ] = useState("");
  const [gq, setGq] = useState("");                 // sidebar variant: the one global query
  // Narrowing AFTER the query (Miro's "Filter by"): the search always looks
  // at everything, and this trims the results to one kind — so you never miss
  // a match by pre-scoping, but you can still get precision on demand.
  const [resFilter, setResFilter] = useState("all");
  const [tab, setTab] = useState(initialTab);
  const [view, setView] = useState(() => ({ themes: "theme", templates: "template", custom: "custom" })[initialTab] || "topic");
  const customOnly = view === "custom";
  const groupBy = customOnly ? "topic" : view;
  const [gq2, setGq2] = useState("");               // grouped layout: its one search
  const [show, setShow] = useState("all");
  const [themeQ, setThemeQ] = useState("");       // Themes tab search
  const [themeShow, setThemeShow] = useState("all"); // Themes tab completion filter
  const [tmplQ, setTmplQ] = useState("");         // Templates tab search
  const [tmplShow, setTmplShow] = useState("all"); // Templates tab active filter
  const [templateDetail, setTemplateDetail] = useState(null); // template id whose detail takeover is open
  const [customOpen, setCustomOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [customQ, setCustomQ] = useState("");   // tabs variant: search on the Custom questions page
  const [justAdded, setJustAdded] = useState(null); // scroll target right after adding a custom question
  const [toast, setToast] = useState(null);         // { topic }
  const [reqNotice, setReqNotice] = useState(0);    // key: increments each time a required question is pressed (re-announces)
  const [reqCount, setReqCount] = useState(1);      // how many required questions the notice is about
  const [themeDetails, setThemeDetails] = useState(null); // theme name whose details dialog is open
  const [editCustomQ, setEditCustomQ] = useState(null);
  // Set together with editCustomQ by the detach path, so the title arrives
  // focused and selected — rewriting it is why you detached.
  const [focusTitleQ, setFocusTitleQ] = useState(false);
  // A library question's own dialog, opened from a row's menu: wording,
  // description, topic and translations. Its edits are survey-scoped meta, so
  // they go straight to the survey (the dialog has its own Save/Cancel) rather
  // than riding along with the selection.
  const [settingsQ, setSettingsQ] = useState(null);   // custom question being edited (via its tag)
  const [collapsed, setCollapsed] = useState(() => new Set()); // collapsed Question-tab section keys
  // Rows the active filter is about to hide (a question toggled under the
  // Selected / Not-selected filter): kept in view briefly so they ease out
  // instead of vanishing.
  const [leaving, setLeaving] = useState(() => new Set());
  const addedRef = useRef(null);
  const timers = useRef([]);
  const easeOut = (id) => {
    setLeaving(s => new Set(s).add(id));
    timers.current.push(setTimeout(() => setLeaving(s => { const n = new Set(s); n.delete(id); return n; }), 260));
  };

  const status = useMemo(() => themeStatus([...sel], pool), [sel, pool]);
  const statusFor = (name) => status.find(t => t.name === name);
  // Org-required questions are always selected and can't be toggled/deselected.
  const requiredIds = useMemo(() => new Set(pool.filter(qq => qq.required).map(qq => qq.id)), [pool]);

  // Themes present in this pool, with their questions and selection progress.
  const themeGroups = useMemo(() => {
    const map = {};
    pool.forEach(qq => themesOf(qq).forEach(nm => (map[nm] = map[nm] || []).push(qq)));
    return Object.entries(map).map(([name, questions]) => {
      const meta = THEMES[name] || {};
      return {
        name, questions, ...meta,
        desc: meta.desc || "A group of related questions that combine into one theme score.",
        about: meta.about || meta.desc || "Add all of this theme's questions to read them together as one benchmarked score in your results.",
        kept: questions.filter(qq => sel.has(qq.id)).length, total: questions.length,
      };
    });
  }, [pool, sel]);
  const detailTheme = themeGroups.find(t => t.name === themeDetails) || null;
  const themeCountFor = (name) => themeGroups.find(t => t.name === name);

  // Themes tab: filter cards by search text + completion state.
  const visibleThemes = themeGroups.filter(t => {
    const matchesText = [t.name, t.desc].some(v => (v || "").toLowerCase().includes(themeQ.toLowerCase()));
    const done = t.total > 0 && t.kept >= t.total;
    const matchesShow = themeShow === "all" || (themeShow === "complete" ? done : !done);
    return matchesText && matchesShow;
  });
  // Templates tab: every template with its own question set + how much of it is
  // currently selected. "active" = the template is fully in the questionnaire
  // (all its questions selected) — i.e. used as a starting point.
  const templateCards = useMemo(() => TEMPLATES.map(t => {
    const questions = templatePoolQuestions(t.id);
    const selCount = questions.filter(qq => sel.has(qq.id)).length;
    return { ...t, questions, total: questions.length, selCount, active: questions.length > 0 && selCount === questions.length };
  }), [sel]);
  const detailTemplate = templateCards.find(t => t.id === templateDetail) || null;

  // Sidebar variant: one query across everything. A search should never come
  // back empty because the match lived under another tab.
  const gqt = nav === "sidebar" ? gq.trim().toLowerCase() : "";
  // Custom questions created OUTSIDE this survey (other coordinators/surveys):
  // shown as their own group — customer content stays split from the library,
  // and from this survey's own customs. Adding one pulls it into this survey.
  const poolIds = useMemo(() => new Set(pool.map(x => x.id)), [pool]);
  // Grouping follows WHERE a question was created, not whether this survey uses
  // it: adding one from another survey must not move it between groups, so the
  // overview stays put while you work through it.
  const orgCustomQs = tweaks.orgCustoms === false ? [] : ORG_CUSTOM;
  // Selecting one that isn't in this survey's pool yet pulls it in first.
  // A custom question reused from another survey arrives WITHOUT a topic: the
  // topic it had over there is that survey's structure, not this one's, so it
  // lands in the "No topic" section at the bottom and can be filed from there.
  const toggleOrgQuestion = (oq) => {
    if (poolIds.has(oq.id)) { toggle(oq); return; }
    markAdded([oq.id]);
    setPool(p => [...p, { ...oq, topic: null }]);
    setSel(s2 => new Set([...s2, oq.id]));
  };

  // Result priority: library questions first (validated + benchmarked, the
  // answer we want found), then this survey's customs, then the org's — the
  // other content types follow in their own groups below.
  const bySource = (a, b) => (b.bench ? 1 : 0) - (a.bench ? 1 : 0);
  const gRes = gqt ? (() => {
    // "Show" narrows search results too — one Filter button, so every option in
    // it has to actually do something while a query is live.
    const byShow = (x) => (show === "selected" ? sel.has(x.id) : show === "unselected" ? !sel.has(x.id) : true);
    // A question matches on its own wording OR on a tag it carries: searching a
    // theme has to find the questions IN that theme, not only the theme card.
    // Wording matches lead — they are what you typed — and tag matches follow.
    const inText = (x) => (x.text || "").toLowerCase().includes(gqt);
    const inTheme = (x) => themesOf(x).some(t => t.toLowerCase().includes(gqt));
    const direct = pool.filter(x => !x.dupOf && (inText(x) || inTheme(x))).filter(byShow)
      .sort((a, b) => (inText(b) ? 1 : 0) - (inText(a) ? 1 : 0) || bySource(a, b));
    const seen = new Set(direct.map(x => x.id));
    // A theme or topic whose NAME matches brings its questions along. The
    // reason they matched is the group they sit in, not their own wording, so
    // they arrive collapsed under that name instead of padding the direct hits.
    // A matching THEME is already answered by its card in the Themes group
    // (with Select all and View details), so it doesn't get a second section
    // here. A topic has no card anywhere, so it does.
    const topicNames = [...new Set(pool.map(x => x.topic).filter(Boolean))];
    const viaTopic = topicNames
      .filter(n => n.toLowerCase().includes(gqt))
      .map(n => ({ kind: "topic", key: "tp:" + n, name: n,
        questions: pool.filter(x => !x.dupOf && x.topic === n && !seen.has(x.id)).filter(byShow) }))
      .filter(g => g.questions.length);
    viaTopic.forEach(g => g.questions.forEach(x => seen.add(x.id)));
    return {
      questions: direct,
      // One pool for search: org-created customs join the results,
      // differentiated by their tags and source — never excluded.
      orgQuestions: orgCustomQs.filter(x => !poolIds.has(x.id) && x.text.toLowerCase().includes(gqt)).filter(byShow),
      indirect: viaTopic,
      themes: themeGroups.filter(t => t.name.toLowerCase().includes(gqt) || (t.desc || "").toLowerCase().includes(gqt)),
      templates: templateCards.filter(t => t.name.toLowerCase().includes(gqt) || (t.desc || "").toLowerCase().includes(gqt)),
    };
  })() : null;
  // Indirect groups start collapsed; opening one is per-group.
  const [resOpen, setResOpen] = useState(() => new Set());
  const toggleResGroup = (k) => setResOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const visibleTemplates = templateCards.filter(t => {
    const matchesText = [t.name, t.desc].some(v => (v || "").toLowerCase().includes(tmplQ.toLowerCase()));
    const matchesShow = tmplShow === "all" || (tmplShow === "active" ? t.active : !t.active);
    return matchesText && matchesShow;
  });
  // Selecting a template adds any of its questions missing from the pool, then
  // selects (or clears) the whole set — several templates can be active at once.
  const mergeIntoPool = (qs) => setPool(p => {
    const have = new Set(p.map(x => x.id));
    const add = qs.filter(qq => !have.has(qq.id));
    return add.length ? [...p, ...add] : p;
  });
  const setTemplate = (t, on) => {
    const ids = t.questions.map(qq => qq.id);
    if (on) mergeIntoPool(t.questions);
    setSel(s => { const n = new Set(s); ids.forEach(id => on ? n.add(id) : (initial.has(id) || n.delete(id))); return n; });
  };
  const toggleTemplateQuestion = (t, id) => {
    if (initial.has(id)) return;
    mergeIntoPool(t.questions.filter(qq => qq.id === id));
    setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // Editing a custom question from its tag: update / delete it in the pool.
  // Editing a custom question. One that was REUSED from another survey may not
  // be in this survey's pool yet (its settings are reachable from its row), so
  // saving it there brings it in — you edited it to use it.
  const saveCustomEdit = (nq) => {
    setPool(p => (p.some(x => x.id === nq.id) ? p.map(x => x.id === nq.id ? nq : x) : [...p, nq]));
    setSel(s2 => (s2.has(nq.id) ? s2 : new Set([...s2, nq.id])));
    setEditCustomQ(null);
  };
  const deleteCustomQ = (nq) => {
    if (initial.has(nq.id)) return; // in the questionnaire: removed there, not here
    setPool(p => p.filter(x => x.id !== nq.id));
    setSel(s => { const n = new Set(s); n.delete(nq.id); return n; });
    setEditCustomQ(null);
  };
  // Flip one question without the theme soft-lock (used inside a theme card / details).
  const plainToggle = (id) => { if (requiredIds.has(id) || initial.has(id)) return; setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  // Scroll the just-added question into view inside the dialog body.
  useEffect(() => {
    if (justAdded && addedRef.current) addedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [justAdded]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Pressing a required question surfaces the info notice (re-mounted via key so
  // it re-plays + re-announces on each press), auto-dismissing after a moment.
  const reqTimer = useRef(null);
  const showReqNotice = (count = 1) => {
    setReqCount(count);
    setReqNotice(n => n + 1);
    if (reqTimer.current) clearTimeout(reqTimer.current);
    reqTimer.current = setTimeout(() => setReqNotice(0), 4000);
  };
  const toggle = (qq) => {
    if (qq.required) return; // required questions are locked on
    if (initial.has(qq.id)) return; // already in the questionnaire: removed there
    const isOn = sel.has(qq.id);
    if (!isOn && blocked(qq.id)) return;
    if (isOn && tweaks.integrity === "lock") {
      // Removing this question may break one OR several complete themes.
      const broken = themesOf(qq).filter(name => statusFor(name)?.complete);
      if (broken.length) { setConfirm({ q: qq, themes: broken }); return; }
    }
    const willBeOn = !isOn;
    if (willBeOn) markAdded([qq.id]);
    setSel(s => { const n = new Set(s); isOn ? n.delete(qq.id) : n.add(qq.id); return n; });
    // Under a Selected / Not-selected filter the row no longer matches — ease it out.
    if ((show === "selected" && !willBeOn) || (show === "unselected" && willBeOn)) easeOut(qq.id);
  };
  const doRemove = (qq) => {
    setSel(s => { const n = new Set(s); n.delete(qq.id); return n; }); setConfirm(null);
    if (show === "selected") easeOut(qq.id);
  };
  // Closing always drops the dialog back to the default (unfiltered) view.
  // What is ticked goes in with the footer's Add; leaving any other way
  // (Cancel, the cross, the backdrop) drops it.
  const close = () => { setShow("all"); setThemeShow("all"); setTmplShow("all"); onClose(); };
  const apply = () => {
    setShow("all"); setThemeShow("all"); setTmplShow("all");
    // Added from the top bar, a question whose topic wasn't in yet goes where
    // its route says: an existing topic (filed like a target add below), or
    // — "new" — its own topic, which the questionnaire then adds.
    const routed = target ? [] : [...sel].filter(id => !initial.has(id)).map(id => pool.find(p2 => p2.id === id))
      .filter(x => x && routes.has(topicOf(x)) && routes.get(topicOf(x)) !== "new");
    // File everything selected under a target topic. Custom questions carry
    // their topic on the pool object (saved wholesale below); a library
    // question keeps its canonical topic and gets a survey-scoped override.
    let outPool = pool;
    if (target) {
      const adds = [...targetAdds.current].filter(id => sel.has(id));
      outPool = pool.map(x => (adds.includes(x.id) && x.custom) ? { ...x, topic: target.key } : x);
      adds.forEach(id => {
        const x = pool.find(p2 => p2.id === id);
        if (x && !x.custom) onMoveTopic && onMoveTopic(id, target.key);
      });
    }
    routed.forEach(x => {
      const key = routes.get(topicOf(x));
      if (x.custom) outPool = outPool.map(p2 => p2.id === x.id ? { ...p2, topic: key } : p2);
      else onMoveTopic && onMoveTopic(x.id, key);
    });
    // Moves, each to its chosen topic: same routes as a filed add above.
    moves.forEach((key, id) => {
      const x = outPool.find(p2 => p2.id === id);
      if (!x) return;
      if (x.custom) outPool = outPool.map(p2 => p2.id === id ? { ...p2, topic: key } : p2);
      else onMoveTopic && onMoveTopic(id, key);
    });
    // A question added again becomes its own copy (new id, pointing back at the
    // original), so the questionnaire can hold it twice — always in the target
    // topic, never next to the original.
    const copies = [...dups].map((id, n) => {
      const x = pool.find(p2 => p2.id === id);
      return x && { ...x, id: `${id}~${Date.now().toString(36)}${n}`, dupOf: id, required: false,
        topic: target ? target.key : topicOf(x) };
    }).filter(Boolean);
    // What Add did, for the notification the questionnaire shows once the
    // questions are in — only when added from the bar's Add questions: they
    // can land anywhere then, and after a whole template the list alone can't
    // tell you whether everything arrived. Added to one topic, they arrive
    // highlighted in that topic, which says it already.
    const here = new Set(topicOptions.map(o => o.value));
    const placed = [...sel].filter(id => !initial.has(id)).map(id => pool.find(p2 => p2.id === id)).filter(Boolean).map(destOf);
    const summary = target ? null : {
      count: placed.length,
      topics: [...new Set(placed)].map(k => ({ label: topicLabel(k), isNew: !!k && !here.has(k) })),
    };
    onSave([...sel, ...copies.map(c => c.id)], [...outPool, ...copies], summary);
  };
  const setMany = (ids, on) => {
    // Deselect all keeps required questions — and says so, same notice as
    // pressing one directly.
    if (!on) {
      const kept = ids.filter(id => requiredIds.has(id) && sel.has(id)).length;
      if (kept > 0) showReqNotice(kept);
    }
    if (on) ids = ids.filter(id => !blocked(id));
    if (on) markAdded(ids);
    setSel(s => { const n = new Set(s); ids.forEach(id => { if (!on && (requiredIds.has(id) || initial.has(id))) return; on ? n.add(id) : n.delete(id); }); return n; });
  };
  // Adding without closing the create dialog: it confirms the question there
  // and offers writing another one, so it decides when it goes away.
  const addCustomKeepOpen = (nq) => {
    setPool(p => [...p, nq]); setSel(s => new Set([...s, nq.id]));
    // Make the new question visible where it landed: clear search/filter,
    // switch to the Questions tab, scroll to the row, and toast.
    setQ(""); setShow("all"); setTab("custom");
    setJustAdded(nq.id); setToast({ topic: nq.topic });
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => setJustAdded(null), 2600),
      setTimeout(() => setToast(null), 5000),
    ];
  };
  const addCustom = (nq) => { addCustomKeepOpen(nq); setCustomOpen(false); };

  const customQs = pool.filter(x => x.custom && !x.from && !x.dupOf);   // written in this survey
// The tabbed variant searches per page, so the Custom questions page filters
// its own two groups. In the sidebar variant a query goes to the global search
// instead, so nothing here is ever filtered.
  const cqt = nav === "tabs" ? customQ.trim().toLowerCase() : "";
  const customShown = cqt ? customQs.filter(x => (x.text || "").toLowerCase().includes(cqt)) : customQs;
  const orgShown = cqt ? orgCustomQs.filter(x => (x.text || "").toLowerCase().includes(cqt)) : orgCustomQs;

  const visible = pool.filter(x => !x.custom && !x.dupOf)
    .filter(x => [x.text, x.theme, x.topic].some(v => (v || "").toLowerCase().includes(q.toLowerCase())))
    .filter(x => (show === "all" ? true : show === "selected" ? sel.has(x.id) : !sel.has(x.id)) || leaving.has(x.id));
  const groups = groupQuestions(visible, "library");
  const selCount = [...sel].length;
  // What Confirm actually does now: add the questions picked in this session.
  const newCount = [...sel].filter(id => !initial.has(id)).length + dups.size;
  const moveCount = moves.size;
  const pickCount = newCount + moveCount;
  const hasChanges = pickCount > 0;

  // Where a question already sits: its topic, plus the topic of every copy of
  // it, by the names this survey uses.
  const topicOf = (x) => ((qMeta[x.id] || {}).topic) || x.topic;
  const topicLabel = (k) => (topicOptions.find(o => o.value === k) || {}).label || k || "No topic";
  const whereKeys = (id) => [...new Set(pool.filter(x => initial.has(x.id) && (x.id === id || x.dupOf === id)).map(topicOf))];
  const joinNames = (names) => names.length < 2 ? (names[0] || "") : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  const where = (id) => joinNames(whereKeys(id).map(k => qt(topicLabel(k))));
  // "This question is already in the topic X" (or "the topics X and Y").
  const inWhere = (id) => `already in the ${whereKeys(id).length > 1 ? "topics" : "topic"} ${where(id)}`;
  // Where a second copy lands: the target topic (never the original's).
  const dupTo = () => target && target.label;
  // Topics from the library that aren't in the questionnaire yet, among
  // questions about to be added from the top bar — unless already decided.
  // With nothing in the questionnaire there is nothing else to pick from.
  const existingTopics = topicOptions;
  const unrouted = (ids) => {
    if (target || !existingTopics.length) return [];
    const here = new Set(existingTopics.map(o => o.value));
    return [...new Set(ids.map(id => pool.find(p2 => p2.id === id)).filter(x => x && !sel.has(x.id) && !initial.has(x.id)).map(topicOf))]
      .filter(t => t && !here.has(t) && !routes.has(t));
  };
  const routedTo = (id) => { const x = pool.find(p2 => p2.id === id); const to = x && routes.get(topicOf(x)); return to && to !== "new" ? topicLabel(to) : null; };
  const route = (topics, to) => {
    const n = new Map(routesRef.current); topics.forEach(t => n.set(t, to));
    routesRef.current = n; setRoutes(n);
  };
  // Same wording, same question: the library has some wordings under several
  // topics. The topic a question would land in, and whether that topic
  // already asks it (in the questionnaire, or added in this dialog).
  const norm = (t) => (t || "").trim().toLowerCase();
  const destOf = (x) => {
    if (target) return target.key;
    const to = routesRef.current.get(topicOf(x));
    return to && to !== "new" ? to : topicOf(x);
  };
  const hasText = (key, text) => pool.some(x => norm(x.text) === norm(text) && (
    initial.has(x.id) ? (moves.get(x.id) || topicOf(x)) === key
      : sel.has(x.id) ? destOf(x) === key
      : dups.has(x.id) && target && target.key === key));
  const blocked = (id) => {
    const x = pool.find(p2 => p2.id === id);
    if (!x || sel.has(id) || initial.has(id)) return null;
    const key = destOf(x);
    return hasText(key, x.text) ? key : null;
  };
  // Where a question can move to: the target topic, unless it sits there
  // already. Opened without a target (the bar's Add questions) there is no
  // "here", so nothing to move to.
  const moveTargets = (id) => {
    const x = pool.find(p2 => p2.id === id);
    return target && !whereKeys(id).includes(target.key) && !(x && hasText(target.key, x.text) && !dups.has(id) && moves.get(id) !== target.key)
      ? [{ value: target.key, label: target.label }] : [];
  };
  const drop = (set, id) => { const n = new Set(set); n.delete(id); return n; };
  const addCtx = { initial, sel, qMeta, dups, moves, where, target, topicLabel, moveTargets,
    unselect: (id) => setSel(s0 => { const n = new Set(s0); n.delete(id); return n; }),
    move: (qq, key) => setMoves(m => new Map(m).set(qq.id, key)),
    inWhere, dupTo, existingTopics, routedTo, blocked, hasText, unrouted, route, routes, joinNames,
    dup: (qq) => setDups(d => new Set(d).add(qq.id)),
    undo: (qq) => { setDups(d => drop(d, qq.id)); setMoves(m => { const n = new Map(m); n.delete(qq.id); return n; }); } };
  // Per-section collapse (Questions tab): a chevron per header, plus a
  // collapse-all / expand-all toolbar toggle over the currently visible groups.
  // Collapse all acts on the sections of the page you are on.
  const secKeys = tab === "custom"
    ? [...(customQs.length ? ["cq:own"] : []), ...(orgCustomQs.length ? ["cq:org"] : [])]
    : groups.map(g => g.key);
  const allCollapsed = secKeys.length > 0 && secKeys.every(k => collapsed.has(k));
  const toggleSec = (k) => setCollapsed(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const toggleAllSecs = () => setCollapsed(allCollapsed ? new Set() : new Set(secKeys));

  // ---- grouped layout ------------------------------------------------------
  // Every group is { key, title, sub?, meta?, rows, noAddAll?, onAll? }; a row
  // is { q, kind } where kind says how it is added: a pool question, a custom
  // one from another survey, or a template's question (pulled in on add).
  const gqt2 = gq2.trim().toLowerCase();
  const libAndOwn = pool.filter(x => !x.dupOf && !(x.custom && x.from));
  const rowsOf = (qs, kind, t) => qs.map(q => ({ q, kind, t }));
  const groupsFor = () => {
    if (customOnly) return [
      { key: "own", title: "Created in this survey", rows: rowsOf(customQs, "pool") },
      { key: "org", title: "Created in other surveys", rows: rowsOf(orgCustomQs, "org") }];
    // Themes and templates render as cards, not groups (see the body below).
    if (groupBy === "theme" || groupBy === "template") return [];
    // Library questions only: custom ones have their own place in the rail.
    return groupQuestions(libAndOwn.filter(x => !x.custom), "library")
      .map(g => ({ key: g.key, title: topicLabel(g.key), rows: rowsOf(g.items, "pool") }));
  };
  const rowShown = (x) => (show === "selected" ? sel.has(x.id) : show === "unselected" ? !sel.has(x.id) : true);
  const rowHit = (x) => [x.text, x.theme, x.topic].some(v => (v || "").toLowerCase().includes(gqt2));
  // A search matches wording, theme and topic; a group whose NAME matches keeps
  // all its questions, so searching a theme or template finds all of it.
  const gGroups = groupsFor().map(g => {
    const byName = gqt2 && g.title.toLowerCase().includes(gqt2);
    return { ...g, shown: g.rows.filter(r => (!gqt2 || byName || rowHit(r.q)) && (rowShown(r.q) || leaving.has(r.q.id))) };
  }).filter(g => g.shown.length > 0);
  const gKey = (g) => view + ":" + g.key;
  const gAllCollapsed = gGroups.length > 0 && gGroups.every(g => collapsed.has(gKey(g)));
  const toggleAllGroups = () => setCollapsed(gAllCollapsed ? new Set() : new Set(gGroups.map(gKey)));
  const toggleRow = (r) => (r.kind === "org" ? toggleOrgQuestion(r.q) : r.kind === "tmpl" ? toggleTemplateQuestion(r.t, r.q.id) : toggle(r.q));
  const addAllGroup = (g, allOn) => {
    if (g.onAll) return g.onAll(!allOn);
    const ids = g.rows.map(r => r.q.id);
    if (allOn) return setMany(ids, false);
    g.rows.forEach(r => { if (!sel.has(r.q.id)) { if (r.kind === "org") toggleOrgQuestion(r.q); } });
    setMany(g.rows.filter(r => r.kind !== "org").map(r => r.q.id), true);
  };
  const renderRow = (r) => r.kind === "org" ? (
    <div key={r.q.id} className="aql-row" onClick={clickCheck}>
      <QCheck q={r.q} on={sel.has(r.q.id)} onClick={() => toggleOrgQuestion(r.q)} />
      <div className="aql-text">
        {gqt2 ? <Highlight text={r.q.text} q={gqt2} /> : r.q.text}
        {initial.has(r.q.id) && <WhereLine q={r.q} />}
      </div>
      <div className="aql-meta">
        <UsedInTag survey={r.q.from} />
        <QTypeIcon type={r.q.type} size={24} tip pos="is-above" float />
        <RowActions q={r.q} on={sel.has(r.q.id)} inQ={initial.has(r.q.id)} onToggle={() => toggleOrgQuestion(r.q)} onEditCustom={setEditCustomQ} />
      </div>
    </div>
  ) : (
    <QRow key={r.q.id} q={r.q} on={sel.has(r.q.id)} hl={gqt2 || undefined} usedInTag={customOnly}
      leaving={leaving.has(r.q.id)} themeInfo={r.q.theme ? themeCountFor(r.q.theme) : null}
      onOpenTheme={setThemeDetails} onEditCustom={setEditCustomQ} onSettings={setSettingsQ} onDeleteCustom={deleteCustomQ}
      onToggle={() => toggleRow(r)} onRequiredPress={showReqNotice} rowRef={r.q.id === justAdded ? addedRef : null} />
  );

  return (
    <AddCtx.Provider value={addCtx}>
    <div className="overlay is-fullbleed" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      {/* Height lives in CSS (.eq-dialog): on a small screen this dialog IS
          the screen, and an inline height would win over that rule. */}
      <div className={"dialog dialog-l dialog-worksurface eq-dialog" + (nav === "sidebar" ? " eq-wide" : "")} role="dialog" aria-modal="true" aria-labelledby="eq-title"
        style={{ display: "flex", flexDirection: "column" }}>
        {nav === "tabs" && (
          <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
            <button className="dialog-close" aria-label="Close" onClick={close}><Icon name="cross" /></button>
          </Tooltip>
        )}
        {nav === "group" ? (
        <div className="eq-frame">
          {!compact && (
            <nav className="eq-rail" aria-label="Browse questions">
              <div className="eq-rail-title" id="eq-title">Add questions</div>
              {EQ_VIEWS.map(p => (
                <Fragment key={p.value}>
                  {p.group && <div className="eq-rail-group">{p.group}</div>}
                  <button className={"eq-rail-item" + (p.top ? " is-top" : " is-sub") + (view === p.value ? " is-active" : "")}
                    aria-current={view === p.value ? "true" : undefined}
                    onClick={() => { setView(p.value); setTemplateDetail(null); }}>
                    <Icon name={p.icon} size={16} />{p.label}</button>
                </Fragment>
              ))}
            </nav>
          )}
          <div className="eq-main">
            {view === "template" && templateDetail && detailTemplate ? (
              <TemplateDetailView t={detailTemplate} sel={sel} onBack={() => setTemplateDetail(null)}
                onToggleQuestion={(id) => toggleTemplateQuestion(detailTemplate, id)}
                onSelectAll={(on) => setTemplate(detailTemplate, on)} />
            ) : (<>
            <div className="eq-toolbar">
              {compact && <PagesMenu tab={view} onPick={(v) => { setView(v); setTemplateDetail(null); }} pages={EQ_VIEWS} label="Browse" />}
              <div className="search-wrap eq-toolbar-search">
                <span className="search-icon"><Icon name="search" size={16} /></span>
                <input type="search" className="srch" placeholder={customOnly ? "Search custom questions" : "Search questions, themes and templates"}
                  value={gq2} onChange={e => setGq2(e.target.value)} />
              </div>
              <Tooltip label="Close" pos="is-left">
                <button className="ib ib-36 ib-tertiary" aria-label="Close" onClick={close}><Icon name="cross" size={16} /></button>
              </Tooltip>
            </div>
            {target && (
              <span className="eq-target-line" role="status">
                Adding to <b>{target.label}</b>
              </span>
            )}
            <div className="dialog-body scroll-y">
              {/* Themes and templates are sets: they read best as cards — what
                  the set is for, how much of it is in, and one Add — with their
                  questions a click away. */}
              {groupBy === "theme" || groupBy === "template" ? (() => {
                const hitCard = (t) => !gqt2 || [t.name, t.desc].some(v => (v || "").toLowerCase().includes(gqt2));
                const cards = (groupBy === "theme" ? themeGroups : templateCards).filter(hitCard);
                if (!cards.length) return (
                  <div className="eq-empty">
                    <img className="eq-empty-art" src="assets/illustrations/templates/search-no-results-illustration.svg" alt="" />
                    <div className="eq-empty-title">We couldn't find any matches for "{gq2.trim()}"</div>
                    <p className="eq-empty-body">Check the spelling or try another word</p>
                  </div>
                );
                return (
                  <div className="thm-grid">
                    {groupBy === "theme"
                      ? cards.map(t => <ChoiceCard key={t.name} variant="theme" hl={gqt2 || undefined}
                          title={t.name} desc={t.desc} selCount={t.kept} total={t.total} ids={t.questions.map(x => x.id)}
                          onToggle={() => setMany(t.questions.map(x => x.id), t.kept < t.total)}
                          onDetails={() => setThemeDetails(t.name)} />)
                      : cards.map(t => <ChoiceCard key={t.id} variant="template" hl={gqt2 || undefined}
                          title={t.name} desc={t.desc} art={t.illus} selCount={t.selCount} total={t.total} ids={t.questions.map(x => x.id)}
                          onToggle={() => setTemplate(t, !t.active)}
                          onDetails={() => setTemplateDetail(t.id)} />)}
                  </div>
                );
              })() : gGroups.length === 0 ? (
                customOnly && !gqt2 && customQs.length === 0 && orgCustomQs.length === 0 ? (
                  <div className="eq-empty">
                    <img className="eq-empty-art" src="assets/illustrations/templates/search-no-results-illustration.svg" alt="" />
                    <div className="eq-empty-title">No custom questions yet</div>
                    <p className="eq-empty-body">The library covers most of what organizations measure. Write your own for something specific to your context. Custom questions don't carry a benchmark.</p>
                    <button className="btn btn-primary" onClick={() => setCustomOpen(true)}><Icon name="plus" size={16} />Create custom question</button>
                  </div>
                ) : (
                  <div className="eq-empty">
                    <img className="eq-empty-art" src="assets/illustrations/templates/search-no-results-illustration.svg" alt="" />
                    <div className="eq-empty-title">We couldn't find any matches for "{gq2.trim()}"</div>
                    <p className="eq-empty-body">Check the spelling or try another word</p>
                  </div>
                )
              ) : gGroups.map(g => {
                const ids = g.rows.map(r => r.q.id);
                const allOn = ids.length > 0 && ids.every(id => sel.has(id));
                return (
                  <section key={gKey(g)} className="aql-sec">
                    <div className="aql-sechead">
                      <div className="aql-sechead-text">
                        <h3>
                          {gqt2 ? <Highlight text={g.title} q={gqt2} /> : g.title}<span className="aql-sec-count">{g.shown.length}</span></h3>
                        {(g.meta || g.sub) && <p className="aql-sechead-sub">{g.meta}{g.meta && g.sub ? " · " : ""}{g.sub}</p>}
                      </div>
                      <div className="spacer" />
                      {!g.noAddAll && <SelectAllTopic allOn={allOn} total={ids.length} ids={ids} onToggle={() => addAllGroup(g, allOn)} />}
                    </div>
                    {g.shown.map(renderRow)}
                  </section>
                );
              })}
            </div>
            </>)}
          </div>
        </div>
        ) : templateDetail && detailTemplate ? (
          <TemplateDetailView t={detailTemplate} sel={sel} onBack={() => setTemplateDetail(null)}
            onToggleQuestion={(id) => toggleTemplateQuestion(detailTemplate, id)}
            onSelectAll={(on) => setTemplate(detailTemplate, on)} />
        ) : (
        <>
        {nav === "tabs" && (
          <div className="dialog-header" style={{ paddingRight: 24 }}>
            <h2 className="dialog-title" id="eq-title" style={{ fontSize: 20, lineHeight: "28px" }}>Add questions</h2>
          </div>
        )}

        {nav === "tabs" && (
        <div className="tabs" role="tablist">
          <button className={"tab" + (tab === "questions" ? " is-active" : "")} role="tab" aria-selected={tab === "questions"}
            onClick={() => setTab("questions")}><Icon name="list-unordered" size={16} />Library questions</button>
          <button className={"tab" + (tab === "custom" ? " is-active" : "")} role="tab" aria-selected={tab === "custom"}
            onClick={() => setTab("custom")}><Icon name="edit" size={16} />Custom questions</button>
          <button className={"tab" + (tab === "themes" ? " is-active" : "")} role="tab" aria-selected={tab === "themes"}
            onClick={() => setTab("themes")}><Icon name="themes" size={16} />Themes</button>
          <button className={"tab" + (tab === "templates" ? " is-active" : "")} role="tab" aria-selected={tab === "templates"}
            onClick={() => setTab("templates")}><Icon name="layout" size={16} />Templates</button>
        </div>
        )}

        <div className={nav === "sidebar" ? "eq-frame" : "eq-col"}>
        {nav === "sidebar" && !compact && (
          <div className="eq-rail" role="tablist" aria-orientation="vertical">
            <div className="eq-rail-title" id="eq-title">Add questions</div>
            {/* Source is a place (Library / Custom); the global search is the
                everything view. While a query is live NO rail item is active —
                the results belong to the whole library, not to a section.
                Questions are atoms; themes and templates SELECT sets of them,
                so naming that group teaches the library's structure instead of
                listing four equal destinations. */}
            {EQ_PAGES.map(p => (
              <Fragment key={p.value}>
                {p.group && <div className="eq-rail-group">{p.group}</div>}
                <button className={"eq-rail-item" + (tab === p.value && !gqt ? " is-active" : "")}
                  role="tab" aria-selected={tab === p.value}
                  onClick={() => { setTab(p.value); setGq(""); setResFilter("all"); }}>
                  <Icon name={p.icon} size={16} />{p.label}</button>
              </Fragment>
            ))}
          </div>
        )}
        <div className="eq-main">
        {nav === "sidebar" && (
          <div className="eq-toolbar">
            {/* With no room for the rail, the pages move into a menu that sits
                where the rail was: left of the search field. */}
            {compact && <PagesMenu tab={tab} onPick={(v) => { setTab(v); setGq(""); setResFilter("all"); }} />}
            {/* OUT OF SCOPE for v2 (feedback round 2): one search across
                questions, themes and templates isn't in the product today and
                is extra work. Kept in the prototype because it tested well —
                not part of the v2 release. */}
            <div className="search-wrap eq-toolbar-search">
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input type="search" className="srch" placeholder="Search questions, themes and templates"
                value={gq} onChange={e => setGq(e.target.value)} />
            </div>
            <FilterMenu compact={compact}
              show={tab === "themes" ? themeShow : tab === "templates" ? tmplShow : show}
              onShow={tab === "themes" ? setThemeShow : tab === "templates" ? setTmplShow : setShow}
              showOptions={GENERIC_SHOW[tab] || GENERIC_SHOW.questions}
              kind={resFilter} onKind={setResFilter}
              kindOptions={gqt ? RESULT_FILTERS : null} />
            {/* Writing a custom question starts from the questionnaire's Add
                questions menu; this dialog adds what already exists. */}
            <span className="eq-tool-div" aria-hidden="true" />
            <Tooltip label="Close" pos="is-left">
              <button className="ib ib-36 ib-tertiary" aria-label="Close" onClick={close}><Icon name="cross" size={16} /></button>
            </Tooltip>
          </div>
        )}

        {/* The rail names the page, so the list needs no title of its own —
            only a live search says what the results are. Without the rail
            (narrow screens) the dialog keeps a hidden accessible name. */}
        {nav === "sidebar" && (gqt ? (
          <div className="eq-section-row">
            <h3 className="eq-section-title" id={compact ? "eq-title" : undefined}>Results for “{gq.trim()}”</h3>
          </div>
        ) : compact && <h3 className="eq-sr-only" id="eq-title">Add questions</h3>)}


        {nav === "tabs" && tab === "questions" && (
          <div style={{ display: "flex", gap: "var(--spacing-base-tight)", alignItems: "center" }}>
            <div className="search-wrap" style={{ flex: 1 }}>
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input type="search" className="srch" placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <ShowFilter value={show} onChange={setShow} />
            <button className={"btn btn-secondary" + (secKeys.length === 0 ? " is-disabled" : "")} disabled={secKeys.length === 0}
              style={{ flex: "none" }} onClick={toggleAllSecs}>
              <Icon name={allCollapsed ? "double-chevron-down" : "double-chevron-up"} size={16} />{allCollapsed ? "Expand all" : "Collapse all"}</button>
          </div>
        )}

        {/* In the tabbed variant every page carries its own search, so this one
            searches custom questions only — and the action that creates one
            sits next to it, where it does on every other page. */}
        {nav === "tabs" && tab === "custom" && (
          <div style={{ display: "flex", gap: "var(--spacing-base-tight)", alignItems: "center" }}>
            <div className="search-wrap" style={{ flex: 1 }}>
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input type="search" className="srch" placeholder="Search custom questions"
                value={customQ} onChange={e => setCustomQ(e.target.value)} />
            </div>
            <button className="btn btn-secondary" style={{ flex: "none" }} onClick={() => setCustomOpen(true)}>
              <Icon name="plus" size={16} />Create custom question</button>
          </div>
        )}

        {nav === "tabs" && tab === "themes" && themeGroups.length > 0 && (
          <div style={{ display: "flex", gap: "var(--spacing-base-tight)", alignItems: "center" }}>
            <div className="search-wrap" style={{ flex: 1 }}>
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input type="search" className="srch" placeholder="Search themes" value={themeQ} onChange={e => setThemeQ(e.target.value)} />
            </div>
            <ShowFilter value={themeShow} onChange={setThemeShow} options={THEME_SHOW_OPTIONS} />
          </div>
        )}

        {nav === "tabs" && tab === "templates" && (
          <div style={{ display: "flex", gap: "var(--spacing-base-tight)", alignItems: "center" }}>
            <div className="search-wrap" style={{ flex: 1 }}>
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input type="search" className="srch" placeholder="Search templates" value={tmplQ} onChange={e => setTmplQ(e.target.value)} />
            </div>
            <ShowFilter value={tmplShow} onChange={setTmplShow} options={TEMPLATE_SHOW_OPTIONS} />
          </div>
        )}

        {/* The one thing that changes in "add to this topic" mode: a quiet
            banner naming where selections go, with its own way out. */}
        {target && (
          <div className="eq-target-note" role="status">
            <Icon name="info" size={16} />
            <span className="eq-target-txt">Questions you add go to <b>{target.label}</b></span>
          </div>
        )}

        <div className="dialog-body scroll-y">
          {gRes ? (
            (resFilter === "all" ? gRes.questions.length + gRes.orgQuestions.length + gRes.indirect.length + gRes.themes.length + gRes.templates.length
              : resFilter === "questions" ? gRes.questions.length + gRes.orgQuestions.length + gRes.indirect.length
              : resFilter === "themes" ? gRes.themes.length : gRes.templates.length) === 0 ? (
              <div className="eq-empty">
                <img className="eq-empty-art" src="assets/illustrations/templates/search-no-results-illustration.svg" alt="" />
                <div className="eq-empty-title">We couldn't find any matches for "{gq.trim()}"</div>
                <p className="eq-empty-body">{resFilter === "all"
                  ? "Check the spelling or try another word"
                  : "No matches of this kind. Choose All results to see everything"}</p>
              </div>
            ) : (
              <>
                {(resFilter === "all" || resFilter === "questions") && gRes.questions.length + gRes.orgQuestions.length + gRes.indirect.length > 0 && (
                  <section className="eq-gres">
                    <div className="eq-gres-head">Questions <span className="tag tag-count">
                      {gRes.questions.length + gRes.orgQuestions.length
                        + gRes.indirect.reduce((n, g) => n + g.questions.length, 0)}</span></div>
                    {gRes.questions.map(qq => <QRow key={qq.id} q={qq} on={sel.has(qq.id)} hl={gqt}
                      leaving={leaving.has(qq.id)} themeInfo={qq.theme ? themeCountFor(qq.theme) : null}
                      onOpenTheme={setThemeDetails} onEditCustom={setEditCustomQ} onSettings={setSettingsQ} onDeleteCustom={deleteCustomQ}
                      onToggle={() => toggle(qq)} onRequiredPress={showReqNotice} rowRef={null} />)}
                    {gRes.orgQuestions.map(oq => (
                      <div key={oq.id} className="aql-row" onClick={clickCheck}>
                        <QCheck q={oq} on={sel.has(oq.id)} onClick={() => toggleOrgQuestion(oq)} />
                        <div className="aql-text"><Highlight text={oq.text} q={gqt} /></div>
                        <CustomTag label="Custom question" pos="is-above" float />
                        <UsedInTag survey={oq.from} />
                        <QTypeIcon type={oq.type} size={24} tip pos="is-above" float />
                      </div>
                    ))}
                    {/* A theme or topic that matched by name renders exactly like a
                        section in the library list: same header, same count pill,
                        same collapse chevron. It IS that group, just reached
                        through search. */}
                    {gRes.indirect.map(g => {
                      const open = resOpen.has(g.key);
                      const ids = g.questions.map(x => x.id);
                      const allOn = ids.every(id => sel.has(id));
                      return (
                        <section key={g.key} className={"aql-sec eq-res-sec" + (open ? "" : " is-collapsed")}>
                          <div className="aql-sechead">
                            <Tooltip label={open ? "Collapse" : "Expand"} pos="is-above" float>
                              <button className="ib ib-tertiary aql-sec-toggle" aria-label={open ? "Collapse questions" : "Expand questions"}
                                aria-expanded={open} onClick={() => toggleResGroup(g.key)}>
                                <Icon name="chevron-right" size={16} className={"aql-chevron" + (open ? " is-expanded" : "")} />
                              </button>
                            </Tooltip>
                            <h3 className="aql-sec-title" onClick={() => toggleResGroup(g.key)}><Highlight text={g.name} q={gqt} /></h3>
                            <span className="text-medium text-subdued">{g.kind}</span>
                            <div className="spacer" />
                            <SelectAllTopic allOn={allOn} total={ids.length} ids={ids} onToggle={() => setMany(ids, !allOn)} />
                          </div>
                          {open && g.questions.map(qq => <QRow key={qq.id} q={qq} on={sel.has(qq.id)}
                            leaving={leaving.has(qq.id)} themeInfo={qq.theme ? themeCountFor(qq.theme) : null}
                            onOpenTheme={setThemeDetails} onEditCustom={setEditCustomQ} onSettings={setSettingsQ} onDeleteCustom={deleteCustomQ}
                            onToggle={() => toggle(qq)} onRequiredPress={showReqNotice} rowRef={null} />)}
                        </section>
                      );
                    })}
                  </section>
                )}
                {(resFilter === "all" || resFilter === "themes") && gRes.themes.length > 0 && (
                  <section className="eq-gres">
                    <div className="eq-gres-head">Themes <span className="tag tag-count">{gRes.themes.length}</span></div>
                    <div className="thm-grid">
                      {gRes.themes.map(t => <ChoiceCard key={t.name} variant="theme" hl={gqt}
                        title={t.name} desc={t.desc} selCount={t.kept} total={t.total} ids={t.questions.map(x => x.id)}
                        onToggle={() => setMany(t.questions.map(x => x.id), t.kept < t.total)}
                        onDetails={() => setThemeDetails(t.name)} />)}
                    </div>
                  </section>
                )}
                {(resFilter === "all" || resFilter === "templates") && gRes.templates.length > 0 && (
                  <section className="eq-gres">
                    <div className="eq-gres-head">Templates <span className="tag tag-count">{gRes.templates.length}</span></div>
                    <div className="thm-grid">
                      {gRes.templates.map(t => <ChoiceCard key={t.id} variant="template" hl={gqt}
                        title={t.name} desc={t.desc} art={t.illus} selCount={t.selCount} total={t.total} ids={t.questions.map(x => x.id)}
                        onToggle={() => setTemplate(t, !t.active)}
                        onDetails={() => setTemplateDetail(t.id)} />)}
                    </div>
                  </section>
                )}
              </>
            )
          ) : tab === "themes" ? (
            themeGroups.length === 0 ? (
              <div className="aql-themes-empty">
                <Icon name="themes" size={32} />
                <div className="text-l5" style={{ color: "var(--content-secondary)" }}>No themes in this library</div>
                <div className="text-medium">Add individual questions from the Questions tab.</div>
              </div>
            ) : (
              <>
                {visibleThemes.length === 0 ? (
                  <div className="aql-themes-empty"><div className="text-medium">No themes match your search or filter.</div></div>
                ) : (
                  <div className="thm-grid">
                    {visibleThemes.map(t => <ChoiceCard key={t.name} variant="theme"
                      title={t.name} desc={t.desc} selCount={t.kept} total={t.total} ids={t.questions.map(x => x.id)}
                      onToggle={() => setMany(t.questions.map(x => x.id), t.kept < t.total)}
                      onDetails={() => setThemeDetails(t.name)} />)}
                  </div>
                )}
              </>
            )
          ) : tab === "custom" ? (
            cqt && customShown.length === 0 && orgShown.length === 0 ? (
              <div className="eq-empty">
                <img className="eq-empty-art" src="assets/illustrations/templates/search-no-results-illustration.svg" alt="" />
                <div className="eq-empty-title">We couldn't find any matches for "{customQ.trim()}"</div>
                <p className="eq-empty-body">Check the spelling or try another word</p>
              </div>
            ) : customQs.length === 0 && orgCustomQs.length === 0 ? (
              <div className="eq-empty">
                <img className="eq-empty-art" src="assets/illustrations/templates/search-no-results-illustration.svg" alt="" />
                <div className="eq-empty-title">No custom questions yet</div>
                <p className="eq-empty-body">
                  The library covers most of what organizations measure. Write your own for
                  something specific to your context. Custom questions don't carry a benchmark.
                </p>
                <button className="btn btn-primary" onClick={() => setCustomOpen(true)}>
                  <Icon name="plus" size={16} />Create custom question</button>
              </div>
            ) : (
              <>
                {/* Two groups, behaving like the library's topics: count pill,
                    collapse chevron, and Select all where selecting is what the
                    checkbox does. */}
                {customShown.length > 0 && (
                  <section className={"aql-sec" + (collapsed.has("cq:own") ? " is-collapsed" : "")}>
                    <div className="aql-sechead">
                      <Tooltip label={collapsed.has("cq:own") ? "Expand" : "Collapse"} pos="is-above" float>
                        <button className="ib ib-tertiary aql-sec-toggle" aria-label="Collapse questions"
                          aria-expanded={!collapsed.has("cq:own")} onClick={() => toggleSec("cq:own")}>
                          <Icon name="chevron-right" size={16} className={"aql-chevron" + (collapsed.has("cq:own") ? "" : " is-expanded")} />
                        </button>
                      </Tooltip>
                      <h3 className="aql-sec-title" onClick={() => toggleSec("cq:own")}>Created in this survey</h3>
                      <div className="spacer" />
                      <SelectAllTopic allOn={customShown.every(x => sel.has(x.id))} total={customShown.length} ids={customShown.map(x => x.id)}
                        onToggle={() => setMany(customShown.map(x => x.id), !customShown.every(x => sel.has(x.id)))} />
                    </div>
                    {!collapsed.has("cq:own") && customShown.map(qq => <QRow key={qq.id} q={qq} on={sel.has(qq.id)} usedInTag
                      leaving={leaving.has(qq.id)} themeInfo={null}
                      onOpenTheme={setThemeDetails} onEditCustom={setEditCustomQ} onSettings={setSettingsQ} onDeleteCustom={deleteCustomQ}
                      onToggle={() => toggle(qq)} onRequiredPress={showReqNotice} rowRef={qq.id === justAdded ? addedRef : null} />)}
                  </section>
                )}
                {orgShown.length > 0 && (
                  <section className={"aql-sec" + (collapsed.has("cq:org") ? " is-collapsed" : "")}>
                    <div className="aql-sechead">
                      <Tooltip label={collapsed.has("cq:org") ? "Expand" : "Collapse"} pos="is-above" float>
                        <button className="ib ib-tertiary aql-sec-toggle" aria-label="Collapse questions"
                          aria-expanded={!collapsed.has("cq:org")} onClick={() => toggleSec("cq:org")}>
                          <Icon name="chevron-right" size={16} className={"aql-chevron" + (collapsed.has("cq:org") ? "" : " is-expanded")} />
                        </button>
                      </Tooltip>
                      <h3 className="aql-sec-title" onClick={() => toggleSec("cq:org")}>Created and used in other surveys</h3>
                      <div className="spacer" />
                      <SelectAllTopic allOn={orgShown.length > 0 && orgShown.every(x => sel.has(x.id))} total={orgShown.length} ids={orgShown.map(x => x.id)}
                        onToggle={() => {
                          const allOn = orgShown.every(x => sel.has(x.id));
                          if (allOn) setMany(orgShown.map(x => x.id), false);
                          else orgShown.forEach(x => { if (!sel.has(x.id)) toggleOrgQuestion(x); });
                        }} />
                    </div>
                    {!collapsed.has("cq:org") && orgShown.map(oq => (
                      <div key={oq.id} className="aql-row" onClick={clickCheck}>
                        <QCheck q={oq} on={sel.has(oq.id)} onClick={() => toggleOrgQuestion(oq)} />
                        <div className="aql-text">
                          {oq.text}
                          {initial.has(oq.id) && <WhereLine q={oq} />}
                        </div>
                        <div className="aql-meta">
                          <UsedInTag survey={oq.from} />
                          <QTypeIcon type={oq.type} size={24} tip pos="is-above" float />
                          <RowActions q={oq} on={sel.has(oq.id)} inQ={initial.has(oq.id)} onToggle={() => toggleOrgQuestion(oq)} onEditCustom={setEditCustomQ} />
                        </div>
                      </div>
                    ))}
                  </section>
                )}
              </>
            )
          ) : tab === "templates" ? (
            visibleTemplates.length === 0 ? (
              <div className="aql-themes-empty"><div className="text-medium">No templates match your search or filter.</div></div>
            ) : (
              <div className="thm-grid">
                {visibleTemplates.map(t => <ChoiceCard key={t.id} variant="template"
                  title={t.name} desc={t.desc} art={t.illus} selCount={t.selCount} total={t.total} ids={t.questions.map(x => x.id)}
                  onToggle={() => setTemplate(t, !t.active)}
                  onDetails={() => setTemplateDetail(t.id)} />)}
              </div>
            )
          ) : (
            <>
              {groups.map(g => {
                const ids = g.items.map(x => x.id);
                const allOn = ids.every(id => sel.has(id));
                const someOn = ids.some(id => sel.has(id));
                const nSel = g.items.filter(x => sel.has(x.id)).length;
                const isColl = collapsed.has(g.key);
                return (
                  <section key={g.key} id={"eq-sec-" + g.key} className={"aql-sec" + (isColl ? " is-collapsed" : "")}>
                    <div className="aql-sechead">
                      <Tooltip label={isColl ? "Expand" : "Collapse"} pos="is-above" float>
                        <button className="ib ib-tertiary aql-sec-toggle" aria-label={isColl ? "Expand questions" : "Collapse questions"}
                          aria-expanded={!isColl} onClick={() => toggleSec(g.key)}>
                          <Icon name="chevron-right" size={16} className={"aql-chevron" + (isColl ? "" : " is-expanded")} />
                        </button>
                      </Tooltip>
                      <h3 className="aql-sec-title" onClick={() => toggleSec(g.key)}>{g.label}</h3>
                      <div className="spacer" />
                      <SelectAllTopic allOn={allOn} total={ids.length} ids={ids} onToggle={() => setMany(ids, !allOn)} />
                    </div>
                    {!isColl && g.items.map(qq => <QRow key={qq.id} q={qq} on={sel.has(qq.id)}
                      leaving={leaving.has(qq.id)} themeInfo={qq.theme ? themeCountFor(qq.theme) : null}
                      onOpenTheme={setThemeDetails} onEditCustom={setEditCustomQ} onSettings={setSettingsQ} onDeleteCustom={deleteCustomQ}
                      onToggle={() => toggle(qq)} onRequiredPress={showReqNotice} rowRef={qq.id === justAdded ? addedRef : null} />)}
                  </section>
                );
              })}
              {groups.length === 0 && (
                <div className="aql-themes-empty"><div className="text-medium">No questions match your search or filter.</div></div>
              )}
            </>
          )}
        </div>
        </div>
        </div>
        </>
        )}

        {/* What is ticked, and the one place it goes in. Moves count too: in
            the topic you are adding to, a moved question is an added one. */}
        <div className="dialog-footer">
          <span className="text-medium text-w500" style={{ color: "var(--content-base)" }}>
            {pickCount} {pickCount === 1 ? "question" : "questions"} selected</span>
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={close}>Cancel</button>
          <button className={"btn btn-primary" + (hasChanges ? "" : " is-disabled")} disabled={!hasChanges} onClick={apply}>
            {hasChanges ? `Add ${pickCount} ${pickCount === 1 ? "question" : "questions"}` : "Add questions"}</button>
        </div>
      </div>

      {customOpen && <CustomQuestionDialog defaultTopic={target ? target.key : undefined}
        topics={mergeTopics(topicOptions, pool.filter(x => sel.has(x.id) && x.topic).map(x => x.topic))}
        pool={[...pool, ...orgCustomQs]} selectedIds={[...sel]}
        alwaysSimilar={tweaks.similarAlways} checkBlocks={!tweaks.checkWarnsOnly} qMeta={qMeta}
        onUseSuggestion={(q) => { if (pool.some(pq => pq.id === q.id)) setMany([q.id], true); else toggleOrgQuestion(q); }}
        onCancel={() => setCustomOpen(false)} onAdd={addCustom} onAddAnother={addCustomKeepOpen}
        onOpenCreated={(q) => { setCustomOpen(false); setEditCustomQ(q); }} />}
      {/* Its translations: still riding on the question when it was made in
          this dialog, otherwise from the survey's store. */}
      {editCustomQ && <CustomQuestionDialog question={editCustomQ} focusTitle={focusTitleQ}
        translations={editCustomQ.i18n || (translationsFor ? translationsFor(editCustomQ) : {})}
        topics={mergeTopics(topicOptions, pool.filter(x => (sel.has(x.id) || x.id === editCustomQ.id) && x.topic).map(x => x.topic))}
        onCancel={() => { setEditCustomQ(null); setFocusTitleQ(false); }}
        onSubmit={(q2) => { saveCustomEdit(q2); setFocusTitleQ(false); }}
        onDelete={initial.has(editCustomQ.id) ? undefined : (q2) => { deleteCustomQ(q2); setFocusTitleQ(false); }} />}
      {settingsQ && (() => {
        const meta = qMeta[settingsQ.id] || {};
        const t = themeGroups.find(g => g.name === settingsQ.theme);
        return (
          <BenchmarkQuestionDialog q={settingsQ} meta={meta}
            topicKey={meta.topic || settingsQ.topic}
            themeInfo={t ? { kept: t.kept, total: t.total } : undefined}
            allVariants={!!tweaks.altWordings}
            topicOptions={[...new Set(pool.filter(x => sel.has(x.id) && x.topic).map(x => x.topic))].map(x => ({ value: x, label: x }))}
            onCancel={() => setSettingsQ(null)}
            onDetach={({ text, topic }) => {
              // Same move as in the questionnaire: the library question leaves
              // the selection and a custom copy of it takes its place, opened
              // for editing — wording is the reason anyone detaches.
              const id = "c" + Date.now();
              const custom = {
                id, topic: topic || meta.topic || settingsQ.topic, theme: null, themes: undefined,
                bench: false, type: settingsQ.type, custom: true, required: false,
                text: text || settingsQ.text, desc: meta.desc || undefined, options: settingsQ.options,
              };
              setPool(p2 => [...p2, custom]);
              setSel(s2 => { const n = new Set(s2); n.delete(settingsQ.id); n.add(id); return n; });
              onUpdateQMeta && onUpdateQMeta(settingsQ.id, { variant: undefined, desc: undefined, topic: undefined });
              setSettingsQ(null);
              setFocusTitleQ(true);
              setEditCustomQ(custom);
            }}
            onSave={({ qMeta: patch, topic }) => {
              onUpdateQMeta && onUpdateQMeta(settingsQ.id, patch);
              if (topic) onMoveTopic && onMoveTopic(settingsQ.id, topic);
              setSettingsQ(null);
            }} />
        );
      })()}
      {confirm && <ThemeConfirm q={confirm.q} themes={confirm.themes} pool={pool} onKeep={() => setConfirm(null)} onRemove={() => doRemove(confirm.q)} />}
      {detailTheme && <ThemeDetailsDialog theme={detailTheme} sel={sel}
        onToggle={plainToggle} onToggleAll={(on) => setMany(detailTheme.questions.map(x => x.id), on)}
        onClose={() => setThemeDetails(null)} />}
      {toast && <AddedToast topic={toast.topic} onClose={() => setToast(null)} />}
      {reqNotice > 0 && <RequiredNotice key={reqNotice} count={reqCount} onClose={() => setReqNotice(0)} />}
    </div>
    </AddCtx.Provider>
  );
}
