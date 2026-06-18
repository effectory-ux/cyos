// Icon.jsx — React wrapper around the Engage DS icon loader (icons.js).
// Renders <i data-icon="name"> and asks the DS loader to inject the real SVG.
// Use ONLY icon names that exist in assets/icons/ (see design-system-reference §5).
import { useLayoutEffect, useRef } from "react";

export function Icon({ name, size = 16, color, className, style, title }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.getAttribute("data-icon") !== name) {
      el.removeAttribute("data-icon-loaded");
      el.innerHTML = "";
      el.setAttribute("data-icon", name);
    }
    if (window.Icons) window.Icons.renderOne(el);
  });
  return (
    <i ref={ref} data-icon={name} title={title} className={className}
      style={{ display: "inline-flex", width: size, height: size, color, flex: "none", ...style }} />
  );
}
