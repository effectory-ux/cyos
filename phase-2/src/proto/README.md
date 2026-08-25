# Prototype toolbar

A self-contained toolbar for React prototypes, in the spirit of the Figma /
Claude Design prototype chrome: a dark, compact row **above** the prototype
(never an overlay) with three menus — jump to a **use case**, flip **edge
cases**, choose the **start point** — plus the current deep link with a copy
button. Hide it with Ctrl+` or the close button; a peek tab in the top-left
corner brings it back.

## What lives here

- `PrototypeBar.jsx` — the component. No imports from the host app.
- `prototype-bar.css` — all its styles, imported by the component. Includes
  `.proto-shell`, the wrapper the host puts around its whole app.
- `icons.jsx` — the glyphs it uses, inlined.
- `copyEdit.js` + `vite-plugin-proto-edits.js` — inline copy editing (below).

## Inline copy editing

The **Edit** button (dev server only) makes the whole prototype
contentEditable and freezes its interactions, so any text can be clicked and
retyped — open the state you want to edit first (the Use cases menu exists for
exactly that). Every keystroke is saved **in real time**: a debounced POST to
the Vite dev server writes `public/proto-edits.json` in the repo, each entry
carrying the element path, the new text and the original.

The same file is fetched at boot and re-applied after every React render, so
edits survive menus, dialogs, navigation and reloads. Committed, it ships with
the build — the deployed prototype shows the edited wording read-only (no Edit
button there). The undo button in edit mode discards everything and restores
the source wording.

Because each entry keeps `orig` next to `text`, the file doubles as a work
order: an agent can fold the new wording into the actual source strings and
empty the file — edits become the new base instead of a patch layer.

Hosting it in another project: add `protoEdits()` from
`vite-plugin-proto-edits.js` to the Vite plugins array. Everything else is
wired inside `PrototypeBar`.

## Dropping it into another project

1. Copy this folder.
2. Wrap your app: `<div className="proto-shell"><PrototypeBar …/><YourApp/></div>`
3. Pass your own config (all optional — a menu with no entries isn't rendered):

```jsx
<PrototypeBar
  storagePrefix="myproto"                 // localStorage namespace
  useCases={[{ key, label, desc }]}       // onUseCase(key) jumps there
  edgeCases={[{ key, label, desc, on }]}  // edges map + onToggleEdge(key)
  startPoints={[{ key, label }]}          // remembered across sessions
  edges={edges} onUseCase={goto} onToggleEdge={toggle}
/>
```

4. At boot, read the chosen start point with
   `getStartAt(storagePrefix, fallbackKey)`.

## Stacking

The bar and its menus sit at `z-index: 10000` so no sticky header, overlay or
dialog of the prototype can cover them. Keep the prototype's own layers below
that; raise the value in `prototype-bar.css` if a host app ever exceeds it.
