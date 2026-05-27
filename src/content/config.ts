import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title:           z.string(),
    h1:              z.string(),
    metaTitle:       z.string(),
    metaDescription: z.string().optional().default(''),
    ogImage:         z.string().optional(),
    /** Дата последнего значимого обновления контента. Используется в sitemap `lastmod`. */
    updated:         z.coerce.date().optional(),
  }),
});

const portfolioImageEntry = z.object({
  image: z.string(),
});

const services = defineCollection({
  type: 'content',
  schema: z.object({
    title:           z.string(),
    h1:              z.string(),
    metaTitle:       z.string(),
    metaDescription: z.string().optional().default(''),
    excerpt:         z.string().optional(),
    price:           z.string().optional(),
    category:        z.string().optional(),
    imageId:         z.string().optional(),
    image:           z.string().optional(),
    order:           z.coerce.number().default(0),
    /** Галерея «Примеры работ» с фото из CMS */
    portfolioImages: z.array(portfolioImageEntry).optional().default([]),
    /** Нижний блок «Записаться» на странице услуги */
    bottomCtaTitle: z.string().optional(),
    bottomCtaSub:  z.string().optional(),
    /** Дата последнего значимого обновления контента. Используется в sitemap `lastmod`. */
    updated:       z.coerce.date().optional(),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    excerpt:     z.string(),
    coverImage:  z.string(),
    date:        z.coerce.date(),
    tags:        z.array(z.string()).optional().default([]),
    author:      z.string().optional().default('Редакция The Pet Care'),
    /** Дата последнего значимого обновления статьи. Используется в sitemap `lastmod`. */
    updated:     z.coerce.date().optional(),
  }),
});

export const collections = { pages, services, blog };
