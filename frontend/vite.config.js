import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
