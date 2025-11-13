import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
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
      '@': path.resolve(__dirname, './')
    },
    // 确保能找到根目录的node_modules
    modules: [path.resolve(__dirname, '../../node_modules'), 'node_modules']
  },
  // 确保vite能正确解析导入路径
  root: __dirname
})