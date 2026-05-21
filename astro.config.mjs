import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import remarkSnippetServiceIncludes from './remark-snippet-service-includes.mjs';
import remarkSnippetServicePrice from './remark-snippet-service-price.mjs';
import remarkSnippetServiceWhy from './remark-snippet-service-why.mjs';

export default defineConfig({
  site: 'https://thepetcare.ru',

  adapter: node({ mode: 'standalone' }),

  markdown: {
    remarkPlugins: [
      remarkSnippetServicePrice,
      remarkSnippetServiceIncludes,
      remarkSnippetServiceWhy,
    ],
  },

  integrations: [
    sitemap(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    inlineStylesheets: 'auto', // инлайн CSS < 4kb
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  image: {
    defaultFormat: 'webp',
  },

  // SEO-редиректы: старые WP-пути → новые Astro-пути
  redirects: {},
});
