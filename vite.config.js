import { defineConfig }                      from "vite";
import react                                  from "@vitejs/plugin-react";
import { resolve, dirname }                   from "path";
import { fileURLToPath }                      from "url";
import { copyFileSync, mkdirSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const r = (...p) => resolve(__dirname, ...p);

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-extension-assets",
      closeBundle() {
        copyFileSync(r("manifest.json"), r("dist/manifest.json"));
        mkdirSync(r("dist/icons"), { recursive: true });
        for (const icon of ["icon16.png","icon32.png","icon48.png","icon128.png","logo.svg"]) {
          const src = r("public/icons", icon);
          if (existsSync(src)) copyFileSync(src, r("dist/icons", icon));
        }
      },
    },
  ],

  root: __dirname,

  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      input: {
        popup:      r("popup.html"),
        dashboard:  r("dashboard.html"),
        options:    r("options.html"),
        archive:    r("archive.html"),
        background: r("src/background/service-worker.js"),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background") return "background.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames:  "assets/[name]-[hash].js",
        assetFileNames:  "assets/[name]-[hash].[ext]",
      },
    },
  },

  resolve: { alias: { "@": r("src") } },
});
