/**
 * convert-to-webp.mjs
 * Конвертирует PNG → WebP и пережимает hero-bg.webp
 * Запуск: node scripts/convert-to-webp.mjs
 *
 * Требования: sharp (уже в зависимостях)
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const IMAGES_DIR = new URL('../public/images/wp', import.meta.url).pathname;
const QUALITY    = 80;   // WebP quality (0–100), 80 = хороший баланс
const EFFORT     = 4;    // скорость кодирования (0–6), 4 = умеренно

async function formatKB(filepath) {
  const s = await stat(filepath);
  return Math.round(s.size / 1024) + ' КБ';
}

async function main() {
  const files = await readdir(IMAGES_DIR);

  const exts   = ['.png', '.jpg', '.jpeg'];
  const images = files.filter(f => exts.includes(extname(f).toLowerCase()));
  console.log(`\n📦 Конвертация в WebP: ${images.length} файлов\n`);

  let totalSaved = 0;

  for (const file of images) {
    const ext    = extname(file).toLowerCase();
    const input  = join(IMAGES_DIR, file);
    const output = join(IMAGES_DIR, file.slice(0, -ext.length) + '.webp');

    // Пропускаем если WebP уже актуальнее исходника
    try {
      const [si, so] = await Promise.all([stat(input), stat(output).catch(() => null)]);
      if (so && so.mtimeMs > si.mtimeMs) {
        // console.log(`  — ${file} (пропущен, WebP свежее)`);
        continue;
      }
    } catch {}

    const before = (await stat(input)).size;
    try {
      const info  = await sharp(input).webp({ quality: QUALITY, effort: EFFORT }).toFile(output);
      const saved = before - info.size;
      totalSaved += saved;
      const sign = saved > 0 ? `−${Math.round(saved/1024)}` : `+${Math.round(-saved/1024)}`;
      console.log(`  ✓ ${file.padEnd(24)} ${Math.round(before/1024).toString().padStart(5)} → ${Math.round(info.size/1024).toString().padStart(5)} КБ  (${sign} КБ)`);
    } catch (e) {
      console.error(`  ✗ ${file}: ${e.message}`);
    }
  }

  // ── Re-compress hero-bg.webp (может быть большим) ─────
  const heroBg = join(IMAGES_DIR, 'hero-bg.webp');
  const tmp    = join(IMAGES_DIR, 'hero-bg.tmp.webp');
  try {
    const before = (await stat(heroBg)).size;
    if (before > 200 * 1024) { // пережимаем если > 200 КБ
      console.log(`\n🎨 Re-compress hero-bg.webp (${Math.round(before/1024)} КБ)...`);
      const info = await sharp(heroBg).webp({ quality: QUALITY, effort: EFFORT }).toFile(tmp);
      const { rename } = await import('fs/promises');
      await rename(tmp, heroBg);
      const saved = before - info.size;
      totalSaved += saved;
      console.log(`  ✓ hero-bg.webp  ${Math.round(before/1024)} → ${Math.round(info.size/1024)} КБ  (−${Math.round(saved/1024)} КБ)`);
    }
  } catch (e) {
    if (!e.message.includes('ENOENT')) console.error(`  ✗ hero-bg.webp: ${e.message}`);
  }

  console.log(`\n✅ Итого сохранено: ${Math.round(totalSaved / 1024 / 1024 * 10) / 10} МБ\n`);
}

main().catch(console.error);
