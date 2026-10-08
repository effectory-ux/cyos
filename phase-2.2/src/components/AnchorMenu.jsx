// AnchorMenu.jsx — the small menu a control opens in place: in the question
// library (a ticked question that is in already → Move, Select all's choices,
// where a new topic goes) and in the custom question check (a possible
// duplicate that's already in).
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";

// A small menu anchored to an Add button. It renders in a portal at fixed
// coordinates (the list scrolls and clips), below the button or above it when
// the bottom of the dialog is too close, follows the button while the list
// scrolls, and closes on a click anywhere else.
// `align` "left" lines the menu up with the button's left edge (a row's
// checkbox, at the start of the row); by default it lines up on the right.
// `gap` is the room between button and menu (more for one with a pointer);
// `at.side` says whether it opened below or above the button.
export function useAnchorMenu(height, align = "right", gap = 4) {
  const btn = useRef(null);
  const [at, setAt] = useState(null);
  const place = () => {
    const r = btn.current.getBoundingClientRect();
    const x = align === "left" ? { left: Math.round(r.left) } : { right: Math.round(window.innerWidth - r.right) };
    return r.bottom + gap + height > window.innerHeight - 96
      ? { bottom: Math.round(window.innerHeight - r.top + gap), side: "above", ...x }
      : { top: Math.round(r.bottom + gap), side: "below", ...x };
  };
  useEffect(() => {
    if (!at) return;
    // Clicks on the button itself are left to its own toggle.
    const off = (e) => {
      if (btn.current && btn.current.contains(e.target)) return;
      if (!e.target.closest || !e.target.closest(".aql-anchor-menu")) setAt(null);
    };
    const follow = () => {
      const el = btn.current;
      if (!el) return setAt(null);
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return setAt(null);
      setAt(place());
    };
    document.addEventListener("mousedown", off);
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      document.removeEventListener("mousedown", off);
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [at ? 1 : 0]); // eslint-disable-line
  return { btn, at, toggle: () => setAt(a => (a ? null : place())), close: () => setAt(null) };
}

export function AnchorMenu({ at, width = 288, children }) {
  return createPortal(
    // A click in it doesn't take focus: whatever had it (a list's button, the
    // custom question's field with its check) keeps it.
    <div className="menu aql-anchor-menu" role="menu" onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
      style={{ position: "fixed", top: at.top, bottom: at.bottom, left: at.left, right: at.right, width, zIndex: 1200 }}>
      {children}
    </div>, document.body);
}

export function MenuItem({ icon, title, sub, onPick, disabled }) {
  return (
    <div className={"menu-item" + (disabled ? " is-disabled" : "")} role="menuitem" aria-disabled={disabled || undefined}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onPick(); }}>
      <span className="menu-item-icon">{icon && <Icon name={icon} size={16} />}</span>
      <span className="menu-item-body">
        <span className="menu-item-title">{title}</span>
        {sub && <span className="menu-item-sub">{sub}</span>}
      </span>
    </div>
  );
}

// A short question with its action(s) under it, anchored to the control that
// asked — for a yes/no step ("Already in “X”" → Move here) where a menu with a
// header and one item is a detour. Built from DS parts only: the .menu
// surface and DS buttons, laid out in one row. It is a small non-modal
// dialog: the primary action takes focus, Escape closes it and gives focus
// back to the control, a press elsewhere closes it (see useAnchorMenu).
// A pointer on its edge points at the control's middle — the DS spotlight's
// 8px arrow, in the menu's white and border. Open it with useAnchorMenu(…,
// CONFIRM_GAP). Under a small control (a checkbox) the pointer would sit in
// the rounded corner, so the whole confirm sits a little further over —
// placed there before it is painted (left/right, not a transform, which the
// entrance animation would override and then let jump), and it grows out of
// its pointer.
//   actions: [{ label, primary?, onPick }], in order — the primary one first,
//   on the left; the others are secondary.
//   dismiss: optional label of a last button that only closes (nothing
//   changes); usually there is none — a press elsewhere or Escape does that.
//   A label too long for the confirm (a long topic name) ends in "…".
export const CONFIRM_GAP = 12;
export function AnchorConfirm({ at, anchor, text, actions, dismiss, onClose }) {
  const ref = useRef(null);
  const [arrow, setArrow] = useState({ x: null, shift: 0 });
  const [ready, setReady] = useState(false); // measured: only then is it shown
  useLayoutEffect(() => {
    if (!ref.current || !anchor || !anchor.current) return;
    // From the placement, not the menu's own rect: that one is mid-way through
    // the DS menu's entrance (scaled) when this runs.
    const a = anchor.current.getBoundingClientRect(), w = ref.current.offsetWidth;
    const left = at.left != null ? at.left : window.innerWidth - at.right - w;
    const want = a.left + a.width / 2 - left, edge = 20;
    const shift = want < edge ? Math.round(want - edge) : want > w - edge ? Math.round(want - (w - edge)) : 0;
    setArrow({ x: Math.round(want - shift), shift });
    setReady(true);
  }, [at && at.top, at && at.bottom, at && at.left, at && at.right]); // eslint-disable-line
  // Focus goes to the primary action once it is placed and shown — a frame
  // later, outside the click that opened it (focus moved during that click
  // doesn't stick).
  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => {
      const b = ref.current && ref.current.querySelector(".btn-primary");
      if (b) b.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [ready]);
  const close = () => { onClose(); if (anchor && anchor.current) anchor.current.focus({ preventScroll: true }); };
  return createPortal(
    <div ref={ref} className={"menu aql-anchor-menu aql-confirm is-" + (at.side || "below") + (ready ? " is-ready" : "")} role="dialog" aria-label={text}
      onMouseDown={e => { e.stopPropagation(); if (e.target.tagName !== "BUTTON") e.preventDefault(); }}
      onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } }}
      style={{ position: "fixed", top: at.top, bottom: at.bottom, zIndex: 1200,
        left: at.left != null ? at.left + arrow.shift : undefined, right: at.right != null ? at.right - arrow.shift : undefined,
        "--arrow-x": arrow.x == null ? "50%" : arrow.x + "px" }}>
      <span className="aql-confirm-text">{text}</span>
      <div className="aql-confirm-actions">
        {actions.map(a => (
          <button key={a.label} type="button" className={"btn " + (a.primary ? "btn-primary" : "btn-secondary")}
            onClick={(e) => { e.stopPropagation(); onClose(); a.onPick(); }}><span className="aql-confirm-label">{a.label}</span></button>
        ))}
        {dismiss && <button type="button" className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); close(); }}>{dismiss}</button>}
      </div>
    </div>, document.body);
}
