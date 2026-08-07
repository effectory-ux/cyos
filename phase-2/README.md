# CYOS — Survey creation flow

Implementation of the CYOS survey-creation flow from the Claude Design handoff
bundle (`cyos-v2`), built on the **Effectory Engage Design System v1.6.0**
(tokens, components, icons — copied verbatim from the design-system skill).

**Live demo:** https://n33g3k.github.io/cyos-phase-2/ (deployed automatically
from `main` via GitHub Actions → GitHub Pages).

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
  card, and one bordered **topic card** per section (header band + question rows
  with full-width dividers, matching the Unified-survey-page frame). Each row:
  grip · text · theme/custom **tag** · type-icon tile · kebab. Theme = turquoise
  tag ("From the {theme} theme" on hover); custom = grey "Custom question" tag.
  Topic kebab: Move up/down + *Remove topic from questionnaire* (warns, with a
  don't-show-again option, when the topic has questions). Survey rename, footer bar.
- **Drag-and-drop** — live preview: items reflow to show the new order as you
  drag, committed on drop, reverted on cancel (FLIP animation, scroll-independent,
  skips the dragged element). **Sections** reorder as a whole. **Standard
  questions** reorder only within their topic — dragging one over another topic
  dims that card and shows a light-blue info pill ("You can reorder standard
  questions within their topic only"). **Custom questions** may change topic:
  dragging one highlights the target topic (no lock) and drops into it, and its
  kebab has a "For custom questions only" group with *Edit question* and a
  *Move to topic ›* submenu (back-navigable topic picker).
- **Add question from library dialog** (Unified-survey-page frame) — **Questions**
  / **Themes** tabs (Themes is a placeholder for now), search + a **Show:** filter
  (All / Selected / Not selected) + **Create custom question**. Rows are plain,
  divided; selection lives in the checkbox — a **solid** teal check = added this
  session, a **subtle** light check = already in from the template — each with a
  hover tooltip ("Add / Just added / Added from template"). Per-topic select-all
  header shows "N of M questions selected"; footer shows selected-question count.
- **Custom question dialog** — answer type + *Add to topic* (survey's current
  topics only) selects, editable respondent-style preview (5-point scale with
  distribution-colour dots, multiple-choice option editor, text answer), DS error
  states (never a disabled button), and the same dialog prefilled for **editing**
  a custom question (kebab menu on custom rows) with delete. On add, a DS system
  notification (top-right) names the topic it landed in and the new row scrolls
  into view.
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
npm run dev     # http://localhost:5181  (Fast Refresh on save)
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
vite.config.js        Vite + @vitejs/plugin-react, dev server on :5181
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
