import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }, // '@/x' = 'src/x'
  server: { host: true }, // expõe na rede local
  preview: {
    allowedHosts: true, // em produção (Railway) o host é o domínio gerado
    // Produção: o front serve a API em /api (mesma origem: cookie de login e sem CORS), encaminhando pela rede interna
    proxy: process.env.API_INTERNAL_URL
      ? { '/api': { target: process.env.API_INTERNAL_URL, rewrite: (path) => path.replace(/^\/api/, '') } }
      : undefined,
  },
})
