import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import remarkSnippetServiceIncludes from './remark-snippet-service-includes.mjs';
import remarkSnippetServicePrice from './remark-snippet-service-price.mjs';
import remarkSnippetServiceWhy from './remark-snippet-service-why.mjs';
import remarkImageAttrs from './remark-image-attrs.mjs';
import rehypeTableWrap from './rehype-table-wrap.mjs';
import { resolveLastmod } from './sitemap-lastmod.mjs';

export default defineConfig({
  site: 'https://thepetcare.ru',

  adapter: node({ mode: 'standalone' }),

  markdown: {
    remarkPlugins: [
      remarkSnippetServicePrice,
      remarkSnippetServiceIncludes,
      remarkSnippetServiceWhy,
      remarkImageAttrs,
    ],
    rehypePlugins: [
      rehypeTableWrap,
    ],
  },

  integrations: [
    sitemap({
      // lastmod из frontmatter `updated`/`date` → git log → mtime файла.
      // Подробности и приоритеты — в ./sitemap-lastmod.mjs.
      serialize(item) {
        const lastmod = resolveLastmod(item.url);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    inlineStylesheets: 'auto', // мелкий CSS инлайнится, крупный (fancybox) грузится отдельно
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  image: {
    defaultFormat: 'webp',
  },

  // SEO-редиректы: старые WP-пути → новые Astro-пути
  redirects: {
    '/sitemap.xml': '/sitemap-index.xml'
  },
});
