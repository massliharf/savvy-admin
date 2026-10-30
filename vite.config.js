import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build`        -> normal multi-file build in dist/
// `npm run build:single` -> one self-contained HTML file in dist-single/ (hash routing, inlined logo)
// `npm run build:pages`  -> GitHub Pages: hash routing and relative paths (works under any path),
//                           images as files so the saved mock data stays small
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "single" ? [viteSingleFile()] : [])],
  base: mode === "single" || mode === "pages" ? "./" : "/",
  build: {
    outDir: mode === "single" ? "dist-single" : mode === "pages" ? "dist-pages" : "dist",
    assetsInlineLimit: mode === "single" ? 100000000 : 4096,
    chunkSizeWarningLimit: 4000,
  },
  server: { port: 5173 },
}));
