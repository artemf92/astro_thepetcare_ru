// Подсчёт просмотров статей блога — JSON на диске (нужен персистентный том при деплое контейнеров).
// Путь по умолчанию: <cwd>/data/blog-views.json; переопределение: BLOG_VIEWS_PATH

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

function getDataFilePath(): string {
  const fromEnv = process.env.BLOG_VIEWS_PATH?.trim();
  if (fromEnv) return fromEnv;
  return join(process.cwd(), 'data', 'blog-views.json');
}

function ensureDirForFile(filePath: string) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function isValidBlogSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,240}$/.test(slug);
}

export function readViewsMap(): Record<string, number> {
  const path = getDataFilePath();
  if (!existsSync(path)) return {};
  try {
    const raw = readFileSync(path, 'utf8');
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k] = Math.floor(v);
    }
    return out;
  } catch {
    return {};
  }
}

export function getViews(slug: string): number {
  return readViewsMap()[slug] ?? 0;
}

export function incrementViews(slug: string): number {
  const path = getDataFilePath();
  ensureDirForFile(path);
  const map = readViewsMap();
  const next = (map[slug] ?? 0) + 1;
  map[slug] = next;
  writeFileSync(path, `${JSON.stringify(map)}\n`, 'utf8');
  return next;
}
