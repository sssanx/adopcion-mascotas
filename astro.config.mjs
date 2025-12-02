// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),   // 🔹 Habilita React (necesario para Material UI)
    tailwind() // 🔹 Activa Tailwind CSS
  ],
  output: 'server', // 🔹 Genera salida del lado del servidor
});
