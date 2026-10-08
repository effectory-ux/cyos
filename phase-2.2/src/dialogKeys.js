// dialogKeys.js — Escape closes the dialog on top, for every dialog in the
// prototype, in one place (like menuKeys.js does for menus), so no dialog can
// only be left with the mouse. Imported once from main.jsx.
//   - The dialog on top is the innermost visible .overlay (a dialog opened
//     from a dialog sits inside it), and among those the highest z-index, the
//     last in the page on a tie: the dialog opened last closes first, then the
//     one under it.
//   - It closes the way its own controls do, so nothing is skipped: its close
//     button (the cross), else its Cancel or Close button, else its backdrop.
//     A dialog with none of those (a choice that has to be made) stays open.
//   - Whatever handled Escape before it (an open menu, the question check's
//     popover) wins: those stop the key or mark it handled.

const visible = (el) => el.getClientRects().length > 0;
const z = (el) => parseInt(getComputedStyle(el).zIndex, 10) || 0;

function topOverlay() {
  const all = [...document.querySelectorAll(".overlay")].filter(visible);
  // z-index only compares siblings: one nested in another is on top of it
  // whatever its own number says.
  const inner = all.filter(o => !all.some(x => x !== o && o.contains(x)));
  return inner.reduce((top, o) => (!top || z(o) >= z(top) ? o : top), null);
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || e.defaultPrevented) return;
  const top = topOverlay();
  if (!top) return;
  // Its own controls only, not those of a dialog nested inside it.
  const own = (el) => el.closest(".overlay") === top && visible(el);
  const buttons = [...top.querySelectorAll("button")].filter(own);
  const close = buttons.find(b => b.classList.contains("dialog-close") || b.getAttribute("aria-label") === "Close")
    || buttons.find(b => b.closest(".dialog-footer") && /^(Cancel|Close)$/.test(b.textContent.trim()));
  e.preventDefault();
  if (close) { close.click(); return; }
  // The backdrop: most dialogs close on a press beside them.
  top.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
});
