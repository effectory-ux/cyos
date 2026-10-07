// menuKeys.js — keyboard support for every popup menu and list in the
// prototype, in one place (the WAI-ARIA menu and listbox patterns), so no menu
// can be mouse-only. Imported once from main.jsx; it watches the page for any
// [role="menu"] or [role="listbox"] that appears:
//   - opening one moves focus to its first item (the trigger is remembered);
//   - ↑/↓ move through the items, Home/End jump to the ends, ←/→ do the same
//     in a menu laid out as a row or grid. Disabled items take focus too (so
//     their reason is read out) but can't be chosen;
//   - Enter / Space choose the focused item;
//   - → opens an item's submenu, ← or Escape closes a submenu;
//   - Escape closes the menu and puts focus back on its trigger; Tab closes it
//     and moves on as usual;
//   - when choosing an item closes the menu and focus has nowhere to go, it
//     returns to the trigger.
// Menus close the way they already do — through their trigger, which toggles —
// so no component needs to know about this file.

const POPUP = '[role="menu"], [role="listbox"]';
const ITEM = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="option"]';

const disabled = (el) => el.classList.contains("is-disabled") || el.getAttribute("aria-disabled") === "true" || !!el.disabled;
const itemsOf = (menu) => [...menu.querySelectorAll(ITEM)].filter(i => i.closest(POPUP) === menu && i.getClientRects().length > 0);

const triggerOf = new WeakMap(); // popup -> the element that had focus when it opened
let lastFocus = null;            // last focused element outside any popup

const focusItem = (el) => { if (el) el.focus({ preventScroll: false }); };

function prepare(menu) {
  if (triggerOf.has(menu)) return;
  const active = document.activeElement;
  triggerOf.set(menu, active && active !== document.body && !menu.contains(active) ? active : lastFocus);
  // Items that aren't natively focusable (the menus' <div> rows) become
  // focusable by script only — a menu is one Tab stop, through its trigger.
  menu.querySelectorAll(ITEM).forEach(i => { if (!i.hasAttribute("tabindex") && i.tagName !== "BUTTON") i.setAttribute("tabindex", "-1"); });
  // After the menu has placed itself: focus the selected item, or the first.
  requestAnimationFrame(() => {
    if (!menu.isConnected) return;
    const items = itemsOf(menu);
    const sel = items.find(i => i.getAttribute("aria-selected") === "true" || i.getAttribute("aria-checked") === "true");
    focusItem(sel || items.find(i => !disabled(i)) || items[0]);
  });
}

// The element that opens/closes this popup: the remembered one if it still
// says it's expanded, else an expanded toggle next to the popup.
function toggleFor(menu) {
  const t = triggerOf.get(menu);
  if (t && t.isConnected && t.getAttribute("aria-expanded") === "true") return t;
  let p = menu.parentElement;
  while (p && p !== document.body) {
    const c = [...p.querySelectorAll('[aria-haspopup][aria-expanded="true"]')].find(x => !menu.contains(x));
    if (c) return c;
    p = p.parentElement;
  }
  return null;
}

function closeMenu(menu) {
  const t = toggleFor(menu);
  const back = triggerOf.get(menu);
  if (t) t.click();
  else {
    // No toggle to press: the backdrop most menus close on.
    const scrim = menu.parentElement && [...menu.parentElement.children].find(c => c !== menu && (c.classList.contains("cq-menu-scrim") || getComputedStyle(c).position === "fixed"));
    if (scrim) scrim.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  }
  const to = (t && t.isConnected) ? t : (back && back.isConnected ? back : null);
  if (to) to.focus({ preventScroll: true });
}

new MutationObserver((records) => {
  for (const r of records) {
    r.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.matches(POPUP)) prepare(n);
      n.querySelectorAll && n.querySelectorAll(POPUP).forEach(prepare);
      // Items added to a menu that's already open.
      const host = n.closest && n.closest(POPUP);
      if (host) host.querySelectorAll(ITEM).forEach(i => { if (!i.hasAttribute("tabindex") && i.tagName !== "BUTTON") i.setAttribute("tabindex", "-1"); });
    });
    r.removedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      const gone = n.matches(POPUP) ? [n] : (n.querySelectorAll ? [...n.querySelectorAll(POPUP)] : []);
      gone.forEach(m => {
        const t = triggerOf.get(m);
        // Choosing an item closed it: if focus fell to the page (and no
        // dialog took it), give it back to the trigger.
        requestAnimationFrame(() => {
          if ((document.activeElement === document.body || !document.activeElement) && t && t.isConnected) t.focus({ preventScroll: true });
        });
      });
    });
  }
}).observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener("focusin", (e) => { if (!e.target.closest || !e.target.closest(POPUP)) lastFocus = e.target; }, true);

document.addEventListener("keydown", (e) => {
  const t = e.target;
  // Escape on a trigger whose menu is open (focus never went in) closes it.
  if (e.key === "Escape" && t && t.getAttribute && t.getAttribute("aria-haspopup") && t.getAttribute("aria-expanded") === "true") {
    e.preventDefault(); e.stopPropagation(); t.click(); return;
  }
  const menu = t && t.closest ? t.closest(POPUP) : null;
  if (!menu) return;
  const items = itemsOf(menu);
  const at = items.indexOf(t.closest(ITEM));
  const isSub = (() => { const tr = triggerOf.get(menu); return !!(tr && tr.closest && tr.closest(ITEM)); })();
  const grid = menu.classList.contains("dsg-menu");
  const move = (to) => { e.preventDefault(); e.stopPropagation(); focusItem(items[(to + items.length) % items.length]); };
  switch (e.key) {
    case "ArrowDown": return move(at < 0 ? 0 : at + 1);
    case "ArrowUp": return move(at < 0 ? items.length - 1 : at - 1);
    case "Home": return move(0);
    case "End": return move(items.length - 1);
    case "ArrowRight": {
      const it = items[at];
      if (it && !disabled(it) && it.getAttribute("aria-haspopup") && it.getAttribute("aria-expanded") !== "true") { e.preventDefault(); e.stopPropagation(); it.click(); return; }
      if (grid) return move(at + 1);
      return;
    }
    case "ArrowLeft":
      if (isSub) { e.preventDefault(); e.stopPropagation(); closeMenu(menu); return; }
      if (grid) return move(at - 1);
      return;
    case "Enter":
    case " ": {
      const it = items[at];
      if (!it || it.tagName === "BUTTON") return; // native buttons activate themselves
      e.preventDefault(); e.stopPropagation();
      if (!disabled(it)) it.click();
      return;
    }
    case "Escape":
      e.preventDefault(); e.stopPropagation(); // the menu closes, not the dialog behind it
      closeMenu(menu);
      return;
    case "Tab":
      closeMenu(menu); // focus is on the trigger now; Tab carries on from there
      return;
    default:
  }
}, true);
