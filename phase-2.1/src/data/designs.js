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

// The welcome page's photo (as on the design template's landing page in
// GTMA), under a scrim so the white content on top stays readable. Each
// design brings its own (intro); the default one uses the GTMA photo. The
// others are free Unsplash photos.
export const INTRO_IMAGE = "assets/img/layout-landing.jpeg";
// The scrim takes the design's own colour as a tint over a neutral dark
// gradient — the photo feels like the theme, and white text stays readable.
export const introBackground = (design) => {
  const tint = design ? `linear-gradient(color-mix(in srgb, ${design.color} 38%, transparent), color-mix(in srgb, ${design.color} 38%, transparent)), ` : "";
  return `${tint}linear-gradient(180deg, rgba(0, 0, 0, .28), rgba(0, 0, 0, .55)), url("${(design && design.intro) || INTRO_IMAGE}") center / cover no-repeat`;
};
