import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { protoEdits } from "../toolbar/vite-plugin-proto-edits.js";
import { protoVersions } from "../toolbar/vite-plugin-proto-versions.js";
import { VERSIONS } from "../prototype-versions.js";

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
  server: { port: 5182, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
}));
