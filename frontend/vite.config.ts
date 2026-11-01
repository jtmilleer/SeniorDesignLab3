import { defineConfig } from 'vite';

// During development the page is served by Vite on :5173 and the API calls
// are forwarded to the backend on :3000.
export default defineConfig({
  server: {
    proxy: {
      '/state': 'http://localhost:3000',
      '/events': 'http://localhost:3000',
      '/live': 'http://localhost:3000',
    },
  },
});
