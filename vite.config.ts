import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { contentPlugin } from './plugins/content.ts';

// BASE_PATH is set by the GitHub Pages workflow to "/<repo-name>/".
// Locally it defaults to "/".
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [contentPlugin(), react(), tailwindcss()],
  build: {
    // The flashcard and search data files are big on purpose (2,600+ cards, 535 topics).
    // They load only when Rapid Fire or search is opened, not on the first page load.
    chunkSizeWarningLimit: 800,
  },
});
