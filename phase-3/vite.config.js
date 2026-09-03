import path from "node:path";
import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react";
import { protoEdits } from "prototype-toolbar/vite-plugin-proto-edits.js";
import { protoVersions } from "prototype-toolbar/vite-plugin-proto-versions.js";
import { VERSIONS } from "../prototype-versions.js";

// The prototype toolbar is the npm package `prototype-toolbar` (installed from
// github:effectory-ux/prototype-toolbar, pinned to a release line — see
// package.json; `npm update prototype-toolbar` moves to its newest release).
// To work on the toolbar from inside this app, point PROTO_TOOLBAR_DEV at a
// local clone: the package is then aliased to that folder (the vite plugins
// above still come from node_modules; `npm install` after changing those).
const TOOLBAR_DEV = process.env.PROTO_TOOLBAR_DEV ? path.resolve(process.env.PROTO_TOOLBAR_DEV) : null;

// Dev server on a fixed port so the preview tooling can find it.
// The Engage DS files (styles/*.css, icons.js, assets/icons/*) live at the
// project root and are served as static files via the <link>/<script> tags
// in index.html.
//
// `base: './'` for builds makes the output path-agnostic, so the same bundle
// runs at the domain root AND under a GitHub Pages project subpath
// (e.g. /cyos-survey-creation-flow-demo/). Dev keeps the absolute '/' base.
export default defineConfig(({ command }) => ({
  plugins: [react(), protoEdits(), protoVersions(VERSIONS)],
  base: command === "build" ? "./" : "/",
  resolve: {
    dedupe: ["react", "react-dom"], // one React, also for an aliased toolbar clone
    alias: TOOLBAR_DEV ? [{ find: /^prototype-toolbar\//, replacement: TOOLBAR_DEV + "/" }] : [],
  },
  server: { port: 5182, strictPort: true, fs: { allow: [searchForWorkspaceRoot(process.cwd()), ...(TOOLBAR_DEV ? [TOOLBAR_DEV] : [])] } },
  build: { outDir: "dist", emptyOutDir: true },
}));
