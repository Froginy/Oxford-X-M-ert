// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      fallbacks: ['sans-serif'],
    },
    // Titres de la modale de réservation
    {
      provider: fontProviders.fontsource(),
      name: 'Playfair Display',
      cssVariable: '--font-playfair',
      weights: [400],
      styles: ['italic'],
      fallbacks: ['serif'],
    },
    // Écriture manuscrite (champs, annotations)
    {
      provider: fontProviders.fontsource(),
      name: 'Caveat',
      cssVariable: '--font-caveat',
      weights: [400, 700],
      styles: ['normal'],
      fallbacks: ['cursive'],
    },
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});
