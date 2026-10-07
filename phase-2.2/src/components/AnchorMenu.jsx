// AnchorMenu.jsx — the small menu a control opens in place: in the question
// library (a ticked question that is in already → Move, Select all's choices,
// where a new topic goes) and in the custom question check (a possible
// duplicate that's already in).
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";

// A small menu anchored to an Add button. It renders in a portal at fixed
// coordinates (the list scrolls and clips), below the button or above it when
// the bottom of the dialog is too close, follows the button while the list
// scrolls, and closes on a click anywhere else.
// `align` "left" lines the menu up with the button's left edge (a row's
// checkbox, at the start of the row); by default it lines up on the right.
export function useAnchorMenu(height, align = "right") {
  const btn = useRef(null);
  const [at, setAt] = useState(null);
  const place = () => {
    const r = btn.current.getBoundingClientRect();
    const x = align === "left" ? { left: Math.round(r.left) } : { right: Math.round(window.innerWidth - r.right) };
    return r.bottom + 4 + height > window.innerHeight - 96
      ? { bottom: Math.round(window.innerHeight - r.top + 4), ...x }
      : { top: Math.round(r.bottom + 4), ...x };
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
