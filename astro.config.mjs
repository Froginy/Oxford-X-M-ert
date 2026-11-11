// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  // Routes d'API serveur (réservation) : fonctions Vercel ; le reste du site reste statique
  adapter: vercel(),

  // Variables d'environnement (Vercel ; en local : `vercel env pull .env.local`)
  env: {
    schema: {
      KV_REST_API_URL: envField.string({ context: 'server', access: 'secret' }),
      KV_REST_API_TOKEN: envField.string({ context: 'server', access: 'secret' }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret' }),
      // Sans clé Resend, les réservations fonctionnent mais aucun e-mail ne part
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_EXPEDITEUR: envField.string({ context: 'server', access: 'secret', default: 'Méert × Oxford <onboarding@resend.dev>' }),
      PLACES_TOTAL: envField.number({ context: 'server', access: 'secret', default: 10 }),
      // Clé de test Cloudflare par défaut (toujours valide)
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', default: '1x00000000000000000000AA' }),
    },
  },

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
