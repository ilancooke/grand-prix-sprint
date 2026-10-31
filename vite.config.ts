import { defineConfig } from 'vite';
import { SERVER } from './config/server.ts';

export default defineConfig({
  base: './',
  server: { ...SERVER, strictPort: true },
  preview: { ...SERVER, strictPort: true },
});
