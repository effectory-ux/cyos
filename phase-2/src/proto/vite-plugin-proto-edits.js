// vite-plugin-proto-edits.js — the dev-server half of the toolbar's copy
// editing (see copyEdit.js). While `vite dev` runs, the browser can GET and
// POST the survey of text overrides at /__proto/edits; every POST is written
// straight to public/proto-edits.json in the repo, so an edit made in the
// browser lands on disk in real time. The file lives in public/ on purpose:
// committed, it ships with the build and the deployed prototype shows the
// edited wording too (read-only there — no server to POST to).
import fs from "node:fs";
import path from "node:path";

export function protoEdits({ file = "public/proto-edits.json" } = {}) {
  let abs;
  return {
    name: "proto-edits",
    configResolved(config) { abs = path.resolve(config.root, file); },
    configureServer(server) {
      server.middlewares.use("/__proto/edits", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        if (req.method === "GET") {
          try { res.end(fs.readFileSync(abs, "utf8")); }
          catch (_) { res.end('{"edits":[]}'); }
          return;
        }
        if (req.method === "POST") {
          let body = "";
          req.on("data", (c) => { body += c; });
          req.on("end", () => {
            try {
              const data = JSON.parse(body);
              if (!Array.isArray(data.edits)) throw new Error("bad shape");
              fs.mkdirSync(path.dirname(abs), { recursive: true });
              fs.writeFileSync(abs, JSON.stringify(data, null, 2) + "\n");
              res.end('{"ok":true}');
            } catch (_) { res.statusCode = 400; res.end('{"ok":false}'); }
          });
          return;
        }
        res.statusCode = 405; res.end('{"ok":false}');
      });
    },
  };
}
