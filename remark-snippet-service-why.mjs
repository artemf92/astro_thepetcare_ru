/**
 * Блок «Почему выбирают The Pet Care».
 *
 * Заголовок собирается автоматически:
 *   Почему «фраза» в Калининграде выбирают в The Pet Care
 * где «фраза» задаётся первым параметром (в кавычках или без двоеточий).
 *
 * Формат:
 *   [snippet-service-why:"стрижку собак":check:Текст|star:Текст|thumb:Текст|heart:Текст]
 *
 * Иконки: check, star (или paw — то же), thumb (или thumbs-up), heart (+ те же запасные, что в includes: circle, shield и т.д.)
 */

const SNIPPET_RE =
  /^\[snippet-service-why:(?:\u201c([^\u201d]+)\u201d|"([^"]+)"|([^:]+)):([\s\S]*)\]\s*$/;

function stripOuterQuotes(s) {
  let t = s.trim();
  if (t.length >= 2) {
    const pairs = [
      ['"', '"'],
      ['\u201c', '\u201d'],
      ['«', '»'],
    ];
    for (const [open, close] of pairs) {
      if (t.startsWith(open) && t.endsWith(close)) {
        t = t.slice(1, -1).trim();
        break;
      }
    }
  }
  return t;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SVG_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" class="snippet-service-why__svg" aria-hidden="true" focusable="false"';

const ICONS = {
  check: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  star: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/></svg>`,
  thumb: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`,
  heart: `<svg ${SVG_ATTRS} fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  circle: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65"><circle cx="12" cy="12" r="10"/></svg>`,
};

const ALIASES = {
  'thumbs-up': 'thumb',
  tick: 'check',
  done: 'check',
  love: 'heart',
  paw: 'star',
};

function resolveIcon(slug) {
  const k = String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
  const key = ALIASES[k] ?? k;
  return ICONS[key] ?? ICONS.circle;
}

/** @param {string} segment */
function parseItem(segment) {
  const s = segment.trim();
  const i = s.indexOf(':');
  if (i <= 0) return null;
  const slug = s.slice(0, i).trim();
  const text = s.slice(i + 1).trim();
  if (!slug || !text) return null;
  return { slug, text };
}

/**
 * @param {string} raw
 * @param {number} seq
 * @returns {string | null}
 */
export function parseSnippetServiceWhyParagraph(raw, seq = 0) {
  const t = raw.trim();
  const m = t.match(SNIPPET_RE);
  if (!m) return null;

  const phrase = stripOuterQuotes((m[1] ?? m[2] ?? m[3] ?? '').trim());
  const itemsPart = (m[4] ?? '').trim();
  const items = itemsPart
    .split('|')
    .map(parseItem)
    .filter(Boolean);

  if (!phrase || items.length === 0) return null;

  const phraseEsc = escapeHtml(phrase);
  const headingId = seq > 0 ? `snippet-why-${seq}` : 'snippet-why';

  const titleHtml = phraseEsc;

  const cells = items
    .map(({ slug, text }) => {
      const svg = resolveIcon(slug);
      const te = escapeHtml(text);
      return `<div class="snippet-service-why__cell"><div class="snippet-service-why__ring" aria-hidden="true">${svg}</div><p class="snippet-service-why__text">${te}</p></div>`;
    })
    .join('');

  return `<section class="snippet-service-why" aria-labelledby="${headingId}">
  <h2 class="snippet-service-why__title" id="${headingId}">${titleHtml}</h2>
  <div class="snippet-service-why__grid">${cells}</div>
</section>`;
}

/** @returns {(tree: import('mdast').Root) => void} */
export default function remarkSnippetServiceWhy() {
  let seq = 0;
  return function transformer(tree) {
    if (!tree.children?.length) return;

    tree.children = tree.children.flatMap((node) => {
      if (node.type !== 'paragraph') return [node];

      const text = collectParagraphText(node);
      if (text === null) return [node];

      const html = parseSnippetServiceWhyParagraph(text, ++seq);
      if (!html) return [node];

      return [{ type: 'html', value: html }];
    });
  };
}

/** @param {import('mdast').Paragraph} node */
function collectParagraphText(node) {
  let buf = '';
  for (const c of node.children ?? []) {
    if (c.type === 'text') buf += c.value;
    else return null;
  }
  return buf;
}
