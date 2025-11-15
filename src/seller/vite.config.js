import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.SELLER_PORT) || 5000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    modules: [path.resolve(__dirname, '../../node_modules'), 'node_modules']
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist/seller'),
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2018'
  },
  preview: {
    port: Number(process.env.SELLER_PORT) || 5000,
    strictPort: true
  },
  root: __dirname
})