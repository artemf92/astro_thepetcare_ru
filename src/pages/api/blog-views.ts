// Счётчик просмотров статей блога (SSR endpoint).
export const prerender = false;

import type { APIRoute } from 'astro';
import { getViews, incrementViews, isValidBlogSlug } from '../../lib/blogViews';

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' };

function badSlug(): Response {
  return new Response(JSON.stringify({ error: 'invalid_slug' }), {
    status: 400,
    headers: jsonHeaders,
  });
}

export const GET: APIRoute = ({ url }) => {
  const slug = (url.searchParams.get('slug') ?? '').trim();
  if (!isValidBlogSlug(slug)) return badSlug();
  const views = getViews(slug);
  return new Response(JSON.stringify({ views }), { status: 200, headers: jsonHeaders });
};

export const POST: APIRoute = async ({ request }) => {
  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }
  const slug = (body.slug ?? '').trim();
  if (!isValidBlogSlug(slug)) return badSlug();
  const views = incrementViews(slug);
  return new Response(JSON.stringify({ views }), { status: 200, headers: jsonHeaders });
};
