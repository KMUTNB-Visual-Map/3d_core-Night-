import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl' // 1. Import มา

export default defineConfig({
  plugins: [
    react(),
    basicSsl() // 2. ใส่เข้าไปตรงนี้
  ],
  server: {
    host: true, // เพื่อให้มือถือใน Wi-Fi เดียวกันจอยได้
  }
})