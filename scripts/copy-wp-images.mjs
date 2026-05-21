/**
 * Одноразовое копирование изображений из WordPress wp-content/uploads.
 *
 * Переменная окружения WP_UPLOADS_BASE — путь к папке `uploads`:
 * абсолютный или относительно корня репозитория ThePetCare.ru.
 *
 * Сначала сформируйте scripts/data/media.json через export-media.php + WP-CLI.
 *
 * Пример:
 *   WP_UPLOADS_BASE=/Volumes/backup/wp-content/uploads node scripts/copy-wp-images.mjs
 */

import { readFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, '..');

const rawUploadsBase = process.env.WP_UPLOADS_BASE?.trim();
if (!rawUploadsBase) {
  console.error('❌ Задайте WP_UPLOADS_BASE — путь к wp-content/uploads копируемого WordPress.');
  console.error('   Пример: WP_UPLOADS_BASE=/path/to/wp-content/uploads node scripts/copy-wp-images.mjs');
  process.exit(1);
}

const uploadsBase =
  rawUploadsBase.startsWith('/') ? rawUploadsBase : join(root, rawUploadsBase);
const dest = join(root, 'public', 'images', 'wp');

mkdirSync(dest, { recursive: true });

const mediaPath = join(__dirname, 'data', 'media.json');

if (existsSync(mediaPath)) {
  const raw = readFileSync(mediaPath, 'utf8').trim();
  if (raw.length > 2) {
    const media = JSON.parse(raw);
    console.log(`✓ media.json: ${media.length} записей`);

    let copied = 0, missing = 0, skipped = 0;

    for (const m of media) {
      if (!m.path || !m.id) { skipped++; continue; }

      if (!/\.(jpe?g|png|webp|gif|svg|avif)$/i.test(m.path)) { skipped++; continue; }

      const uploadsMatch = m.path.match(/wp-content\/uploads\/(.+)$/);
      if (!uploadsMatch) { skipped++; continue; }

      const relPath = uploadsMatch[1];
      const srcFile = join(uploadsBase, relPath);

      if (!existsSync(srcFile)) {
        console.warn(`  ⚠ Не найден: ${relPath}`);
        missing++;
        continue;
      }

      const ext      = extname(m.path).toLowerCase().replace('.jpeg', '.jpg');
      const destFile = join(dest, `${m.id}${ext}`);
      copyFileSync(srcFile, destFile);
      console.log(`  ✓ ${m.id}${ext}  ← ${relPath}`);
      copied++;
    }

    console.log(`\n✅ Скопировано: ${copied}, не найдено: ${missing}, пропущено: ${skipped}`);
    process.exit(0);
  }
}

console.log('⚠ media.json не найден или пуст — копируются все файлы из WP_UPLOADS_BASE с сохранением структуры…');

if (!existsSync(uploadsBase)) {
  console.error(`❌ Папка не найдена: ${uploadsBase}`);
  process.exit(1);
}

function copyDir(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const dstPath = join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
    } else if (/\.(jpe?g|png|webp|gif|svg|avif)$/i.test(entry.name)) {
      copyFileSync(srcPath, dstPath);
    }
  }
}

copyDir(uploadsBase, dest);
console.log(`✅ Изображения скопированы из ${uploadsBase}`);
