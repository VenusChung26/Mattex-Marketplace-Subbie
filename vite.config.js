import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { handleRfqBlobUpload } from "./api/blob-upload.js";

function blobUploadPlugin() {
  return {
    name: "rfq-blob-upload",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = String(req.url || "").split("?")[0];
        if (path !== "/api/blob-upload" || req.method !== "POST") {
          next();
          return;
        }
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        let body = {};
        try {
          body = JSON.parse(raw);
        } catch {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "invalid json" }));
          return;
        }
        const request = new Request("http://localhost:5176/api/blob-upload", {
          method: "POST",
          headers: { "content-type": "application/json", ...(req.headers.host ? { host: req.headers.host } : {}) },
          body: raw,
        });
        try {
          const json = await handleRfqBlobUpload(body, request);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(json));
        } catch (error) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error?.message || "upload failed" }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.BLOB_READ_WRITE_TOKEN) process.env.BLOB_READ_WRITE_TOKEN = env.BLOB_READ_WRITE_TOKEN;
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnon =
    env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return {
    plugins: [react(), blobUploadPlugin()],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseAnon),
    },
    server: {
      port: 5176,
      host: true,
    },
  };
});
