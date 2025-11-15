import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })
const devPort = (Number(process.env.ADMIN_PORT) === 6000 ? 6001 : (Number(process.env.ADMIN_PORT) || 6001))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: devPort,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: devPort,
    strictPort: false
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