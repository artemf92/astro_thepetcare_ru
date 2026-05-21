/**
 * wp-to-astro.mjs  v2
 * Конвертер: WP CLI JSON → Astro Content Collections (Markdown)
 *
 * Что делает:
 *  1. Очищает WPBakery/Visual Composer шорткоды из всего контента
 *  2. Конвертирует HTML → Markdown
 *  3. Определяет страницы-услуги (дочерние страницы "services")
 *  4. Парсит данные услуг (название, цена, slug, image_id) из services page
 *  5. Экспортирует services в src/content/services/
 *  6. Экспортирует обычные страницы в src/content/pages/
 *  7. Генерирует src/data/services-list.ts — список услуг для главной
 *
 * Запуск: node scripts/wp-to-astro.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join }  from 'path';
import { fileURLToPath }  from 'url';
import TurndownService    from 'turndown';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, '..');

const td = new TurndownService({
  headingStyle:     'atx',
  hr:               '---',
  bulletListMarker: '-',
});

// ════════════════════════════════════════════════════════
// УТИЛИТЫ
// ════════════════════════════════════════════════════════

function readJSON(path) {
  if (!existsSync(path)) { console.warn(`⚠  Не найден: ${path}`); return []; }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function escYaml(str = '') {
  return String(str).replace(/"/g, '\\"').replace(/\n/g, ' ').trim();
}

function writeMd(filePath, frontmatter, body) {
  mkdirSync(dirname(filePath), { recursive: true });
  const fm = Object.entries(frontmatter)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: "${escYaml(v)}"`)
    .join('\n');
  writeFileSync(filePath, `---\n${fm}\n---\n\n${body.trim()}\n`);
}

// ════════════════════════════════════════════════════════
// ОЧИСТКА SHORTCODES (WPBakery / Visual Composer / Nectar)
// ════════════════════════════════════════════════════════

/**
 * Убирает все шорткоды, оставляя только текстовое содержимое внутри них.
 * Порядок важен: сначала вложенные, потом обёртки.
 */
function stripShortcodes(html = '') {
  let s = html;

  // 1. Убрать самозакрывающиеся шорткоды без контента
  //    [nectar_badge text="от 1100 ₽"] → ''
  s = s.replace(/\[nectar_badge[^\]]*\]/g, '');
  s = s.replace(/\[vc_custom_heading[^\]]*\]/g, '');
  s = s.replace(/\[vc_empty_space[^\]]*\]/g, '');
  s = s.replace(/\[vc_separator[^\]]*\]/g, '');
  s = s.replace(/\[vc_btn[^\]]*\]/g, '');
  s = s.replace(/\[vc_single_image[^\]]*\]/g, '');

  // 2. Парные шорткоды — оставить содержимое
  const pairTags = [
    'vc_row', 'vc_row_inner', 'vc_column', 'vc_column_inner',
    'vc_column_text', 'vc_raw_html',
    'tabbed_section', 'tab',
    'fancy_box',
    'nectar_cta', 'nectar_blog', 'nectar_highlighted_text',
    'uncode_index',
  ];

  for (const tag of pairTags) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const before = s;
      s = s.replace(
        new RegExp(`\\[${tag}[^\\]]*\\]([\\s\\S]*?)\\[\\/${tag}\\]`, 'g'),
        '$1',
      );
      if (s === before) break;
    }
  }

  // 3. Убрать любые оставшиеся шорткоды вместе с содержимым
  //    (неизвестные блочные шорткоды)
  s = s.replace(/\[[a-z_]+[^\]]*\][\s\S]*?\[\/[a-z_]+\]/g, '');
  // самозакрывающиеся
  s = s.replace(/\[[a-z_]+[^\]]*\/?\]/g, '');

  return s;
}

/**
 * Полный pipeline: шорткоды → HTML → Markdown → замена WP-путей
 */
function toMarkdown(rawContent = '') {
  const cleaned = stripShortcodes(rawContent);
  let md = td.turndown(cleaned || '');
  // Заменить пути к изображениям
  md = md
    .replace(/https?:\/\/localhost\/wp-content\/uploads\//g, '/images/uploads/')
    .replace(/https?:\/\/thepetcare\.ru\/wp-content\/uploads\//g, '/images/uploads/');
  return md.trim();
}

// ════════════════════════════════════════════════════════
// ПАРСИНГ УСЛУГ ИЗ СТРАНИЦЫ services
// ════════════════════════════════════════════════════════

/**
 * Извлекает атрибут из шорткода: атрибут="значение"
 */
function attr(shortcode, name) {
  const m = shortcode.match(new RegExp(`${name}="([^"]*)"`) );
  return m ? m[1] : '';
}

/**
 * Парсит структуру услуг из raw WPBakery-контента страницы services.
 *
 * Возвращает массив:
 * { category, title, price, slug, imageId, hoverDesc }
 */
function parseServicesFromPage(raw = '') {
  const services = [];

  // Разбиваем на табы [tab ... title="Для собак"] ... [/tab]
  const tabRegex = /\[tab[^\]]+title="([^"]+)"[^\]]*\]([\s\S]*?)\[\/tab\]/g;
  let tabMatch;

  while ((tabMatch = tabRegex.exec(raw)) !== null) {
    const category   = tabMatch[1].trim();     // "Для собак" / "Для кошек"
    const tabContent = tabMatch[2];

    // Внутри таба ищем все [fancy_box ...] ## Название [/fancy_box]
    const boxRegex = /(\[nectar_badge[^\]]*\])?\s*\[fancy_box([^\]]*)\]([\s\S]*?)\[\/fancy_box\]/g;
    let boxMatch;

    while ((boxMatch = boxRegex.exec(tabContent)) !== null) {
      const badgeTag  = boxMatch[1] || '';
      const boxAttrs  = boxMatch[2];
      const boxBody   = boxMatch[3];

      const price     = attr(badgeTag, 'text');              // "от 1100 ₽"
      const linkUrl   = attr(boxAttrs, 'link_url');          // "/services/strizhka-sobak/"
      const imageId   = attr(boxAttrs, 'image_url');         // "11056"
      const hoverDesc = attr(boxAttrs, 'hover_content');     // описание

      // Заголовок — <h2>Название</h2> или ## Название внутри boxBody
      const titleMatch = boxBody.match(/<h2[^>]*>(.*?)<\/h2>/i) || boxBody.match(/##\s+(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : '';

      // Slug из URL: /services/strizhka-sobak/ → strizhka-sobak
      const slugMatch = linkUrl.match(/\/services\/([^/]+)\//);
      const slug = slugMatch ? slugMatch[1] : '';

      if (title && slug) {
        services.push({ category, title, price, slug, imageId, hoverDesc, linkUrl });
      }
    }
  }

  return services;
}

// ════════════════════════════════════════════════════════
// ЗАГРУЗКА ДАННЫХ
// ════════════════════════════════════════════════════════

// Предпочитаем pages-full.json (с post_parent), fallback на pages.json
const pagesPath = existsSync(join(__dirname, 'data/pages-full.json'))
  ? join(__dirname, 'data/pages-full.json')
  : join(__dirname, 'data/pages.json');

const allPages = readJSON(pagesPath);
const seoRaw   = readJSON(join(__dirname, 'data/seo-meta.json'));
const seoMap   = Object.fromEntries(seoRaw.map(m => [String(m.id), m]));

// ════════════════════════════════════════════════════════
// ОПРЕДЕЛИТЬ СТРАНИЦЫ УСЛУГ
// ════════════════════════════════════════════════════════

// Найти ID страницы "services"
const servicesPage = allPages.find(p =>
  p.post_name === 'services' || p.post_name === 'uslugi'
);
const servicesParentId = servicesPage ? String(servicesPage.ID) : null;

// Дочерние страницы = индивидуальные услуги
const servicePages = servicesParentId
  ? allPages.filter(p =>
      String(p.post_parent) === servicesParentId &&
      p.post_status === 'publish'
    )
  : [];

const servicePageSlugs = new Set(servicePages.map(p => p.post_name));

// Также пометим саму страницу services и дочерние как "не обычные страницы",
// а также технические страницы WP-темы, которые не нужны в Astro
const WP_THEME_PAGES = new Set([
  'corporate-3-landing',  // шаблон главной страницы темы Corporate 3
  'rezhim-tehobsluzhivaniya', // страница тех.обслуживания WP
]);

const skipAsPagesSet = new Set([
  ...(servicesPage ? [servicesPage.post_name] : []),
  ...servicePages.map(p => p.post_name),
  ...WP_THEME_PAGES,
]);

console.log(`\n📋 Найдено страниц: ${allPages.length}`);
console.log(`📦 Страница услуг: ${servicesPage?.post_name ?? '—'} (ID: ${servicesParentId ?? '—'})`);
console.log(`🐾 Индивидуальных услуг (дочерние): ${servicePages.length}`);

// ════════════════════════════════════════════════════════
// ПАРСИНГ УСЛУГ ИЗ ГЛАВНОЙ СТРАНИЦЫ services
// ════════════════════════════════════════════════════════

let parsedServices = [];
if (servicesPage) {
  parsedServices = parseServicesFromPage(servicesPage.post_content || '');
  console.log(`\n✨ Услуги, найденные в шорткодах страницы services:`);
  parsedServices.forEach(s => console.log(`   [${s.category}] ${s.title} — ${s.price}  (/${s.slug}/)`));
}

// ════════════════════════════════════════════════════════
// ЭКСПОРТ УСЛУГ В src/content/services/
// ════════════════════════════════════════════════════════

mkdirSync(join(root, 'src/content/services'), { recursive: true });

let servicesOk = 0;

// A) Из индивидуальных дочерних страниц (если есть контент)
for (const p of servicePages) {
  const meta   = seoMap[String(p.ID)] ?? {};
  const parsed = parsedServices.find(s => s.slug === p.post_name);
  const h1     = meta.h1 || p.post_title || '';
  const body   = toMarkdown(p.post_content);

  writeMd(
    join(root, `src/content/services/${p.post_name}.md`),
    {
      title:           h1,
      h1,
      metaTitle:       meta.meta_title       || h1,
      metaDescription: meta.meta_description || parsed?.hoverDesc || '',
      excerpt:         parsed?.hoverDesc     || '',
      price:           parsed?.price         || '',
      category:        parsed?.category      || '',
      imageId:         parsed?.imageId       || '',
      image:           meta.og_image         || meta.thumbnail || '',
      order:           String(p.menu_order   || 0),
    },
    body || parsed?.hoverDesc || '',
  );
  console.log(`✓ service (page): ${p.post_name}  [${parsed?.category ?? '—'}]  ${parsed?.price ?? ''}`);
  servicesOk++;
}

// B) Услуги из шорткодов, у которых НЕТ дочерней страницы
for (const [i, s] of parsedServices.entries()) {
  if (servicePageSlugs.has(s.slug)) continue;   // уже обработан выше
  writeMd(
    join(root, `src/content/services/${s.slug}.md`),
    {
      title:           s.title,
      h1:              s.title,
      metaTitle:       s.title,
      metaDescription: s.hoverDesc || '',
      excerpt:         s.hoverDesc || '',
      price:           s.price,
      category:        s.category,
      imageId:         s.imageId,
      image:           '',
      order:           String(i),
    },
    s.hoverDesc || '',
  );
  console.log(`✓ service (shortcode): ${s.slug}  [${s.category}]  ${s.price}`);
  servicesOk++;
}

// ════════════════════════════════════════════════════════
// ЭКСПОРТ СТРАНИЦ В src/content/pages/
// ════════════════════════════════════════════════════════

mkdirSync(join(root, 'src/content/pages'), { recursive: true });

let pagesOk = 0;

for (const p of allPages) {
  if (p.post_status !== 'publish') continue;
  if (skipAsPagesSet.has(p.post_name))  continue;  // услуги — не в pages

  const meta = seoMap[String(p.ID)] ?? {};
  const h1   = meta.h1 || p.post_title || '';
  const body = toMarkdown(p.post_content);

  writeMd(
    join(root, `src/content/pages/${p.post_name}.md`),
    {
      title:           h1,
      h1,
      metaTitle:       meta.meta_title       || h1,
      metaDescription: meta.meta_description || '',
      ogImage:         meta.og_image         || meta.thumbnail || '',
    },
    body,
  );
  console.log(`✓ page: ${p.post_name}`);
  pagesOk++;
}

// ════════════════════════════════════════════════════════
// ГЕНЕРАЦИЯ src/data/services-list.ts
// ════════════════════════════════════════════════════════

const servicesByCategory = parsedServices.reduce((acc, s) => {
  if (!acc[s.category]) acc[s.category] = [];
  acc[s.category].push(s);
  return acc;
}, {});

const categoriesCode = Object.entries(servicesByCategory)
  .map(([cat, items]) => {
    const itemsCode = items
      .map(s => `    { title: ${JSON.stringify(s.title)}, slug: ${JSON.stringify(s.slug)}, price: ${JSON.stringify(s.price)}, imageId: ${JSON.stringify(s.imageId)} },`)
      .join('\n');
    return `  {\n    category: ${JSON.stringify(cat)},\n    items: [\n${itemsCode}\n    ],\n  },`;
  })
  .join('\n');

const servicesListTs = `// Автогенерировано: node scripts/wp-to-astro.mjs
// Список услуг для главной страницы и навигации

export interface ServiceItem {
  title:   string;
  slug:    string;
  price:   string;
  imageId: string;
}

export interface ServiceCategory {
  category: string;
  items:    ServiceItem[];
}

export const serviceCategories: ServiceCategory[] = [
${categoriesCode}
];

export const allServices: ServiceItem[] =
  serviceCategories.flatMap(c => c.items);
`;

writeFileSync(join(root, 'src/data/services-list.ts'), servicesListTs);
console.log(`\n📁 src/data/services-list.ts сгенерирован`);

// ════════════════════════════════════════════════════════
// ИТОГ
// ════════════════════════════════════════════════════════

console.log(`\n✅ Готово:`);
console.log(`   📄 Страниц:  ${pagesOk}`);
console.log(`   🐾 Услуг:    ${servicesOk}`);
console.log(`\nСледующий шаг: экспортировать изображения по imageId`);
console.log(`  cd old && wp --allow-root eval-file ../ThePetCare.ru/scripts/export-media.php > ../ThePetCare.ru/scripts/data/media.json`);
