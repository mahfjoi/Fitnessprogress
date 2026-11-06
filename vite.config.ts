import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages liefert die App unter /Fitnessprogress/ aus
  base: process.env.GITHUB_PAGES ? '/Fitnessprogress/' : '/',
})
