/**
 * Резолвер `lastmod` для @astrojs/sitemap.
 *
 * Источники по приоритету:
 *   1. frontmatter `updated`           (если стоит в .md/.mdx)
 *   2. frontmatter `date`              (для блога — публикация — лучше git-времени файла)
 *   3. git log -1 --format=%aI         (реальное последнее изменение файла в репозитории)
 *   4. fs.statSync.mtime               (fallback на хостингах без .git)
 *
 * Для индексных страниц (/blog/, /services/) — берётся max от lastmod детей.
 *
 * ВАЖНО: НЕ возвращаем `new Date()` от build-time — иначе Google перестаёт
 * доверять lastmod (см. https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping).
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));

/** Кэш ISO-строк по абсолютному пути, чтобы не дёргать git десятки раз. */
const fileCache = new Map();

function toIso(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function gitMtime(filePath) {
  try {
    const out = execSync(`git log -1 --format=%aI -- "${filePath}"`, {
      cwd:      PROJECT_ROOT,
      encoding: 'utf8',
      stdio:    ['ignore', 'pipe', 'ignore'],
    }).trim();
    return toIso(out);
  } catch {
    return null;
  }
}

function fsMtime(filePath) {
  try {
    return toIso(statSync(filePath).mtime);
  } catch {
    return null;
  }
}

function frontmatterDate(filePath) {
  if (!filePath || !/\.mdx?$/.test(filePath)) return null;
  try {
    const text = readFileSync(filePath, 'utf8');
    const fm = text.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!fm) return null;
    const yaml = fm[1];
    const grab = (key) => {
      const m = yaml.match(new RegExp('^' + key + ':\\s*(.+)$', 'm'));
      if (!m) return null;
      const v = m[1].trim().replace(/^['"]|['"]$/g, '');
      return toIso(v);
    };
    return grab('updated') || grab('date') || null;
  } catch {
    return null;
  }
}

function fromFile(filePath) {
  if (!filePath) return null;
  if (fileCache.has(filePath)) return fileCache.get(filePath);
  const value = frontmatterDate(filePath) || gitMtime(filePath) || fsMtime(filePath);
  fileCache.set(filePath, value);
  return value;
}

function maxLastmod(values) {
  const ts = values
    .filter(Boolean)
    .map((v) => new Date(v).getTime())
    .filter((n) => !Number.isNaN(n));
  if (!ts.length) return null;
  return new Date(Math.max(...ts)).toISOString();
}

function listContent(dir) {
  try {
    return readdirSync(dir)
      .filter((f) => /\.mdx?$/.test(f))
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

const SERVICES_DIR = path.join(PROJECT_ROOT, 'src/content/services');
const BLOG_DIR     = path.join(PROJECT_ROOT, 'src/content/blog');
const PAGES_DIR    = path.join(PROJECT_ROOT, 'src/content/pages');
const PAGES_ROUTES = path.join(PROJECT_ROOT, 'src/pages');

/** URL → исходный файл, чьё mtime отражает контент маршрута. */
function findSourceForPath(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  if (!clean) return path.join(PAGES_ROUTES, 'index.astro');

  const parts = clean.split('/');

  // /blog/, /blog/<slug>/
  if (parts[0] === 'blog') {
    if (parts.length === 1) return path.join(PAGES_ROUTES, 'blog/index.astro');
    return path.join(BLOG_DIR, `${parts[1]}.md`);
  }
  // /services/, /services/<slug>/
  if (parts[0] === 'services') {
    if (parts.length === 1) return path.join(PAGES_ROUTES, 'services/index.astro');
    return path.join(SERVICES_DIR, `${parts[1]}.md`);
  }
  // Одноуровневые: сначала .astro (`/contact/`, `/masters/`, `/prices/`), потом коллекция `pages`
  if (parts.length === 1) {
    const astro = path.join(PAGES_ROUTES, `${parts[0]}.astro`);
    if (existsSync(astro)) return astro;
    const md = path.join(PAGES_DIR, `${parts[0]}.md`);
    if (existsSync(md)) return md;
  }
  return null;
}

/**
 * Вычисляет lastmod для заданного URL из sitemap.
 * @param {string} loc — полный URL (как приходит в serialize)
 * @returns {string | null} ISO-строка или null, если ничего не нашли
 */
export function resolveLastmod(loc) {
  let pathname;
  try {
    pathname = new URL(loc).pathname;
  } catch {
    return null;
  }
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  const parts = clean ? clean.split('/') : [];

  // Индексы коллекций: max(дочерние).
  if (parts.length === 1 && parts[0] === 'blog') {
    return maxLastmod(listContent(BLOG_DIR).map(fromFile));
  }
  if (parts.length === 1 && parts[0] === 'services') {
    return maxLastmod(listContent(SERVICES_DIR).map(fromFile));
  }
  // Главная: max(главные источники — index.astro и подборки услуг/блога).
  if (!clean) {
    return maxLastmod([
      fromFile(path.join(PAGES_ROUTES, 'index.astro')),
      ...listContent(SERVICES_DIR).map(fromFile),
      ...listContent(BLOG_DIR).map(fromFile),
    ]);
  }

  return fromFile(findSourceForPath(pathname));
}
