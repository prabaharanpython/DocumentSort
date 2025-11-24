import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY specifically.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Define process.env as an empty object for compatibility, 
      // but only if it hasn't been replaced by other defines (like NODE_ENV).
      // We rely on Vite's default handling for NODE_ENV.
      'process.env': {}
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});