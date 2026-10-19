// designs.js — the survey designs an organization has available (Figma
// 6293:27553). A design is a survey PROPERTY: it colors what participants see,
// and in the builder it tints the page behind the cards so you always know
// which design the survey carries. Colors are the design's; the content cards
// stay white on top of it.
//
// The prototype ships one Effectory default plus fictional org designs — the
// demos are public, so no real client branding.
export const DESIGNS = [
  { id: "effectory", name: "Effectory default", color: "#fdbd12", button: "#30b3af", mark: "e", markBg: "#192743" },
  { id: "sky",       name: "Sky",               color: "#00a0e2", button: "#ffffff", mark: "S", markBg: "#ffffff", markColor: "#00a0e2", intro: "assets/img/welcome-sky.jpg" },
  { id: "navy",      name: "Navy",              color: "#0058a3", button: "#ffdb00", mark: "N", markBg: "#ffdb00", markColor: "#0058a3", intro: "assets/img/welcome-navy.jpg" },
  // A photo cover instead of a flat color; the builder tints with its overlay tone.
  { id: "photo",     name: "Photo cover",       color: "#8a7f6a", button: "#ffffff", mark: "P", markBg: "#ffffff", markColor: "#192743", intro: "assets/img/welcome-photo.jpg",
    photo: "linear-gradient(160deg, #c8b394 0%, #a98f6f 35%, #7d6f58 70%, #5d5442 100%)" },
];

export const DEFAULT_DESIGN = "effectory";
export const designById = (id) => DESIGNS.find(d => d.id === id) || null;

// The ONE tint every surface in the prototype uses for a design: the design's
// own colour, lightened. White cards and dark text sit on these backgrounds
// everywhere (the builder page, the question and topic dialogs, the design
// tiles), so a full-strength brand colour would fight the content and fail
// contrast. A photo cover keeps its image under a white wash; a flat colour is
// mixed toward white.
export const designWash = (d) => (!d ? undefined
  : d.photo
    ? `linear-gradient(rgba(255,255,255,.78), rgba(255,255,255,.78)), ${d.photo}`
    : `color-mix(in srgb, ${d.color} 24%, white)`);

// The welcome page shows the survey design's own photo. Photos are set up per
// design at project level and reused here as they are — a survey can't pick or
// edit one. The default design uses the GTMA landing photo.
const INTRO_IMAGE = "assets/img/layout-landing.jpeg";
const designPhoto = (design) => (design && design.intro) || INTRO_IMAGE;

// How the welcome text reads on that photo (intro.textColor, intro.boxColor):
// light or dark text, and — only with the "Welcome page text background"
// variant — a panel behind the content ("gray"; "default" for none). The panel
// follows the text: a dark gray behind light text, a light tint behind dark
// text. Always a little see-through, so the photo still shows: 80% for the
// dark one (5.3:1 at least), 75% for the light one (8.8:1 at least).
const GRAY = { tint: "#f1f1ef", base: "#787774" };
export const DEFAULT_BOX = "gray";
export const boxFill = (boxColor, textColor) => {
  if (boxColor !== DEFAULT_BOX) return null;
  const colour = textColor === "dark" ? GRAY.tint : `color-mix(in srgb, ${GRAY.base} 55%, #000)`;
  return `color-mix(in srgb, ${colour} ${textColor === "dark" ? 75 : 80}%, transparent)`;
};
// `boxOn`: the text background variant; off, there is never a panel.
export const textLook = (intro = {}, boxOn = false) => ({ color: intro.textColor || "light", box: boxOn ? (intro.boxColor || DEFAULT_BOX) : "default" });

// A soft layer over the photo, so the text reads on any photo: dark under
// light text, light under dark text.
const SHADE = {
  light: "linear-gradient(180deg, rgba(0, 0, 0, .22), rgba(0, 0, 0, .38))",
  dark: "linear-gradient(180deg, rgba(255, 255, 255, .32), rgba(255, 255, 255, .48))",
};
export const introSurface = (design, look = { color: "light", box: DEFAULT_BOX }) =>
  `${SHADE[look.color]}, url("${designPhoto(design)}") center / cover no-repeat`;
