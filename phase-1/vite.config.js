import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server on a fixed port so the preview tooling can find it.
// The Engage DS files (styles/*.css, icons.js, assets/icons/*) live at the
// project root and are served as static files via the <link>/<script> tags
// in index.html.
export default defineConfig({
  plugins: [react()],
  server: { port: 5180, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
});
