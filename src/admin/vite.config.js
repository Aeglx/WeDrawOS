import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })
const devPort = Number(process.env.ADMIN_PORT) || 6000

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: devPort,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist/admin'),
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2018'
  },
  preview: {
    port: devPort,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    // 确保能找到根目录的node_modules
    modules: [path.resolve(__dirname, '../../node_modules'), 'node_modules']
  },
  // 确保vite能正确解析导入路径
  root: __dirname
})