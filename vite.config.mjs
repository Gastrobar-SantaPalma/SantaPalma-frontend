import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  // load .env files and expose variables to this config
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_BACKEND_URL || 'http://localhost:4000'

  return defineConfig({
    plugins: [react()],
    server: {
      // proxy /api calls to the backend during development to avoid CORS
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
          secure: false,
          // do not rewrite the path: forward /api/... to the backend as-is
        },
      },
    },
      // allow preview server to accept requests for Render host
      preview: {
        // add your Render host here so vite preview doesn't block the Host header
        allowedHosts: ['santapalma-frontend.onrender.com']
      },
  })
}
