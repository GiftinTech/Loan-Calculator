// vite.config.ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // use current directory as root
  base: './', // ensures relative paths
  build: {
    outDir: 'build', // output directory
    emptyOutDir: true, // clean before build
  },
  test: {
    globals: true, // use describe, it, expect globally
    environment: 'jsdom', // DOM support for browser-like tests (needed for your loan calculator)
    include: ['tests/**/*.test.ts'],
  },
});
