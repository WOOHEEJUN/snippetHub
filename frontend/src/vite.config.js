// vite.config.js (프로젝트 루트에 위치)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Spring Boot 백엔드 주소
        changeOrigin: true,
        secure: false,
      },
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // 프로덕션 빌드 설정
  build: {
    outDir: 'build',
    sourcemap: false,
  },
});
