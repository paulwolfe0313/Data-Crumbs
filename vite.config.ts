import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'src/manifest.json', dest: '.' },
        { src: 'src/background.js', dest: '.' },
        { src: 'src/contentScript.js', dest: '.' },
        { src: 'src/icons', dest: '.' },
      ],
    }),
  ],
  publicDir: false,
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.html'),
      },
    },
  },
})
