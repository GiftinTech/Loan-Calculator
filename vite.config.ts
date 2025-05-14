// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',               // use current directory as root
  base: './',              // ensures relative paths
  build: {
    outDir: 'build',        // output directory
    emptyOutDir: true      // clean before build
  }
})
