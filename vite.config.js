import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxies /api/* to the Firebase Functions emulator during local dev.
      // This means in development you can call /api/spotifyToken instead of
      // the full Cloud Function URL, avoiding CORS issues entirely.
      '/api': {
        target: 'http://127.0.0.1:5001/titan-tunes-37528/us-central1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
