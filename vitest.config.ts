import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // Отключаем worker-ы - запускаем в основном потоке
    threads: false,
    // Запускаем тесты последовательно
    fileParallelism: false,
  },
});
