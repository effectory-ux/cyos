# CYOS — Survey creation flow

Implementation of the CYOS survey-creation flow from the Claude Design handoff
bundle (`cyos-v2`), built on the **Effectory Engage Design System v1.6.0**
(tokens, components, icons — copied verbatim from the design-system skill).

**Live demo:** https://n33g3k.github.io/cyos-survey-creation-flow-demo/ (served
from a separate public repo; redeploy with `./deploy-demo.sh`).

## What's implemented

- **Surveys page** — DS Main Navigation sidebar (`.mainnav` + `.av` avatar), survey
  list with status tags, **Create survey**. Rows are clickable: **Draft** and
  **Planned** surveys open the questionnaire builder for editing (saving keeps the
  row's status); **Live** and **Closed** rows open an out-of-scope dialog pointing
  at the separate prototype they'd belong to (live monitoring / results &
  reporting). Each row also has an actions menu — **Draft** surveys can be deleted
  (other statuses show the action disabled with a reason). Surveys created via the
  flow are saved here as Drafts on *Save & close*.
- **Template dialog** — 6 template cards, search, *Start from scratch* next to
  search, and an in-place **template preview** (a *Back to templates* secondary
  button, hero, "Why is it valuable?", per-template questionnaire from the
  question-library export) at a constant dialog height.
- **Name your survey dialog** — shown after a template is chosen or *Start from
  scratch* is pressed, before the builder. Prefills the template name (empty for
  scratch), *Back* returns to template selection, and an empty name surfaces a DS
  error state (no disabled button).
- **Questionnaire builder** — full-width (no sidebar), wizard stepper, template
  card with *Edit template* info dialog, draggable topic sections (grip-aligned,
  border-top rows), drag-and-drop for questions (within/across sections) and
  whole sections (including gaps between cards), topic kebab menu (*Rename topic*,
  *Remove topic from questionnaire*), survey rename, footer bar.
- **Drag-and-drop polish** — the lifted item dims + its grip lights up on hover; a
  clear brand insertion line (with a leading dot) marks the drop point between
  rows or in the gap between section cards; on drop, every affected row/section
  slides to its new spot via a FLIP animation (forced-reflow, no rAF, so the end
  state is always correct; respects `prefers-reduced-motion`).
- **Add questions dialog** — library-order topics + a distinct **Theme** sort view
  (themes selectable as a whole, composite-score status), search, per-topic
  Select all, selected rows in brand colour, *Add custom question* in the toolbar.
- **Custom question dialog** — answer type + *Add to topic* selects, editable
  respondent-style preview (5-point scale with distribution-colour dots,
  multiple-choice option editor, text answer), DS error states (never a disabled
  button), and the same dialog prefilled for **editing** a custom question
  (kebab menu on custom rows) with delete.
- **Theme soft-lock** — removing the last question of a complete theme shows the
  positive "Keep the theme complete" dialog with a results preview.
- **Icon-button tooltips** — every icon-only button (kebabs, close, remove, etc.)
  carries an `aria-label` plus a DS `.tooltip` bubble revealed on hover/focus
  (`Tooltip` wrapper in `shared.jsx`), per the design-system rule.

Behaviour intentionally **not** carried over from the prototype: the Tweaks
debug panel and the screenshot/demo deep-link hooks — prototype tooling, not
part of the design.

## Develop

[Vite](https://vite.dev) dev server with React Fast Refresh (HMR) — edits to a
component swap in live **without losing app state** (you stay in whatever dialog
or step you're testing).

```sh
npm install     # first time only
npm run dev     # http://localhost:5180  (Fast Refresh on save)
```

## Build (production)

```sh
npm run build     # → dist/  (self-contained: bundled JS/CSS + icons + svgs)
npm run preview   # serve the built dist/ to sanity-check it
```

> Don't open `index.html` over `file://` — the DS icon loader fetches SVGs over
> HTTP. Use the dev server (or `npm run preview` for the build).

## Structure

```
index.html            DS boilerplate (base href, tokens→foundation→components→app css)
vite.config.js        Vite + @vitejs/plugin-react, dev server on :5180
public/
  icons.js            Engage DS icon loader (verbatim) — served at /icons.js
  assets/icons/       204 DS icon SVGs (verbatim) — served at /assets/icons/
styles/
  tokens.css          DS tokens (auto-generated — do not edit)
  foundation.css      DS foundation (verbatim)
  components.css      DS components (verbatim)
  app.css             app-specific layout + the few token-built patterns the DS
                      builds ad-hoc (tags, type tile, list rows, drag styles)
src/
  main.jsx            entry
  app.jsx             flow controller (screen/survey/dialog state)
  data/data.js        templates, question pool, topics & themes
  data/qlib.js        per-template preview content (generated — do not hand-edit)
  components/         Icon, shared, Shell, TemplateModal, Builder,
                      EditQuestionsDialog, CustomQuestionDialog
```

## Design-system notes (flagged upstream in the handoff chats)

- `tokens.css`/`foundation.css`/`components.css` are the DS skill's files —
  never edit them here; regenerate from the `effectory-design-documentation` repo.
- `app.css` contains one deliberate DS correction: `btn-primary`/`btn-danger`
  disabled states lack a background rule in the DS — worth an upstream ticket.
- Token-built customs with no DS component (escape hatch per the skill): wizard
  stepper, status/benchmark/custom tags, list rows (`.qrow`), question-type tile
  (`.qtile`), and the `.dialog-worksurface` scroll helper for tall dialogs.
