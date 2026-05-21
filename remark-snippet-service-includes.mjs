/**
 * Блок «Что входит в услугу» — сетка с иконкой и текстом.
 *
 * Формат (один абзац в .md):
 *   [snippet-service-includes:"Заголовок":icon:Текст пункта|icon:ещё пункт|...]
 *
 * Разделитель пунктов — "|", после ключа иконки первый ":" отделяет текст (в тексте двоеточия допустимы).
 * Иконки — латинские slug-и (универсальные): heart, heart-outline, scissors, check, paw, circle,
 * droplet, sparkles, leaf, star, chat, shield (неизвестный slug → circle).
 */

const SNIPPET_RE =
  /^\[snippet-service-includes:(?:\u201c([^\u201d]+)\u201d|"([^"]+)"|([^:]+)):([\s\S]*)\]\s*$/;

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
  'xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" class="snippet-service-includes__svg" aria-hidden="true" focusable="false"';

/** Обводные иконки (currentColor = --snippet-includes-icon) */
const ICONS = {
  heart: `<svg ${SVG_ATTRS} fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  'heart-outline': `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  scissors: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88"/><path d="m14.47 14.48 5.53 5.52"/><path d="M8.12 8.12 12 12"/></svg>`,
  check: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
  paw: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="17" rx="4" ry="3"/><circle cx="8" cy="11" r="2"/><circle cx="12" cy="9" r="2"/><circle cx="16" cy="11" r="2"/><circle cx="10" cy="14.5" r="1.4"/><circle cx="14" cy="14.5" r="1.4"/></svg>`,
  circle: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65"><circle cx="12" cy="12" r="10"/></svg>`,
  droplet: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 0-14c0-5 7-10 7-10s7 5 7 10a7 7 0 0 1-14 0Z"/></svg>`,
  sparkles: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"><path d="m12 3 1.8 5.5h5.8l-4.7 3.4 1.8 5.5-4.7-3.4-4.7 3.4 1.8-5.5L4.4 8.5h5.8z"/></svg>`,
  leaf: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 7 14 14 0 0 1 21 18a7 7 0 0 1-10 2Z"/><path d="M12 12 8 16"/></svg>`,
  star: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"><path d="m12 2 2.4 7.4h7.8l-6.3 4.6 2.4 7.4-6.3-4.6-6.3 4.6 2.4-7.4L2 9.4h7.8z"/></svg>`,
  chat: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  shield: `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
};

const ALIASES = {
  tick: 'check',
  done: 'check',
  love: 'heart',
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
 * @returns {string | null}
 */
export function parseSnippetServiceIncludesParagraph(raw, seq = 0) {
  const t = raw.trim();
  const m = t.match(SNIPPET_RE);
  if (!m) return null;

  const title = stripOuterQuotes((m[1] ?? m[2] ?? m[3] ?? '').trim());
  const itemsPart = (m[4] ?? '').trim();
  const items = itemsPart
    .split('|')
    .map(parseItem)
    .filter(Boolean);

  if (!title || items.length === 0) return null;

  const titleEsc = escapeHtml(title);
  const headingId =
    seq > 0 ? `snippet-includes-${seq}` : 'snippet-includes';

  const cells = items
    .map(({ slug, text }) => {
      const svg = resolveIcon(slug);
      const te = escapeHtml(text);
      return `<div class="snippet-service-includes__cell"><span class="snippet-service-includes__icon">${svg}</span><p class="snippet-service-includes__text">${te}</p></div>`;
    })
    .join('');

  return `<section class="snippet-service-includes" aria-labelledby="${headingId}">
  <h2 class="snippet-service-includes__title" id="${headingId}">${titleEsc}</h2>
  <div class="snippet-service-includes__grid">${cells}</div>
</section>`;
}

/** @returns {(tree: import('mdast').Root) => void} */
export default function remarkSnippetServiceIncludes() {
  let seq = 0;
  return function transformer(tree) {
    if (!tree.children?.length) return;

    tree.children = tree.children.flatMap((node) => {
      if (node.type !== 'paragraph') return [node];

      const text = collectParagraphText(node);
      if (text === null) return [node];

      const html = parseSnippetServiceIncludesParagraph(text, ++seq);
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
