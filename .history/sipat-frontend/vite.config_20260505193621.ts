import { defineConfig } from 'vite'
import react from '@vitejs/react-refresh'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  }, plugins: [
    react(),
    tailwindcss(),
  ],
})