/// <reference types="vitest/config" />
import { defineConfig } from "vite";

// Relative base so the build works on GitHub Pages project subpaths
// (e.g. https://user.github.io/repo/) without hardcoding the repo name.
export default defineConfig({
  base: "./",
  build: {
    target: "es2021",
    outDir: "dist",
    assetsInlineLimit: 0,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
