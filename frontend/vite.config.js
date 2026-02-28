import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(() => {
  const useHttps = process.env.VITE_HTTPS === 'true'
  return {
    plugins: [react(), tailwindcss(), useHttps ? basicSsl() : undefined].filter(Boolean),
    server: {
      https: useHttps,
      host: true,
      port: 5173,
      strictPort: true,
    },
  }
})
