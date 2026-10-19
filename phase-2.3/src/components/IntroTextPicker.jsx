// IntroTextPicker.jsx — the welcome page's text color, in a menu from the
// welcome page editor's header ("Text color").
//
// Kept to what makes the text readable on any photo: light or dark text (a
// list, as Notion's color menu), and a background behind the welcome content,
// on or off. That background isn't chosen: it follows the text color — dark
// behind light text, light behind dark text (boxFill on the neutral gray).
import { Icon } from "./Icon.jsx";
import { DEFAULT_BOX } from "../data/designs.js";

const COLORS = [{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }];

export function IntroTextPicker({ look, boxOption = false, onChange, onClose }) {
  const boxOn = look.box !== "default";
  return (
    // Escape closes this menu, not the editor behind it.
    <div className="menu tpd-bg tpd-clr" role="menu" aria-label="Text color"
      onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose && onClose(); } }}>
      {COLORS.map(t => {
        const on = look.color === t.id;
        return (
          <button key={t.id} type="button" role="menuitemradio" aria-checked={on}
            className={"menu-item tpd-clr-row" + (on ? " is-selected" : "")} onClick={() => onChange({ ...look, color: t.id })}>
            <span className={"tpd-clr-swatch is-text is-" + t.id} aria-hidden="true">A</span>
            <span className="menu-item-body"><span className="menu-item-title">{t.label}</span></span>
            {on && <span className="menu-item-check"><Icon name="check" size={16} /></span>}
          </button>
        );
      })}
      {/* The text background only exists with its own variant. */}
      {boxOption && <>
      <div className="menu-divider" />
      <label className="tgl-label-wrap tpd-txt-box">
        <span className="tgl-wrap">
          <input type="checkbox" className="tgl" checked={boxOn}
            onChange={e => onChange({ ...look, box: e.target.checked ? DEFAULT_BOX : "default" })} />
          <span className="tgl-track"><span className="tgl-thumb" /></span>
        </span>
        <span>Text background</span>
      </label>
      </>}
    </div>
  );
}
