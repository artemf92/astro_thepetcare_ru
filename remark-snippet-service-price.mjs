/**
 * Превращает абзац вида
 *   [snippet-service-price:Название услуги:строка1|строка2|...]
 * в HTML-блок цен.
 *
 * Строки таблицы разделены "|", колонки "название" и "цена" — "-" (поддерживается
 * «название - цена» или «название-цена»).
 */

const SNIPPET_RE =
  /^\[snippet-service-price:([^:]+):([^\]]*)\]\s*$/;

const DEFAULT_NOTE =
  '* – стоимость зависит от породы питомца и уровня грумера';

/** Убирает внешние кавычки, если автор случайно оставил их в названии */
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

/** @param {string} line */
function parsePriceRow(line) {
  const s = line.trim();
  const parts = s.split(/\s+-\s+/);
  if (parts.length >= 2) {
    return [parts[0].trim(), parts.slice(1).join(' - ').trim()];
  }
  const i = s.indexOf('-');
  if (i > 0) {
    return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
  }
  return [s, ''];
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} raw
 * @returns {string | null}
 */
export function parseSnippetServicePriceParagraph(raw) {
  const t = raw.trim();
  const m = t.match(SNIPPET_RE);
  if (!m) return null;

  const serviceName = stripOuterQuotes((m[1] ?? '').trim());
  const rowsPart = (m[2] ?? '').trim();
  const rows = rowsPart
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!serviceName || !rows?.length) return null;

  const nameEscaped = escapeHtml(serviceName);
  const rowsHtml = rows
    .map((row) => {
      const [name, price] = parsePriceRow(row);
      const ne = escapeHtml(name);
      const pe = escapeHtml(price);
      return `<div class="snippet-service-price__row"><span class="snippet-service-price__cell snippet-service-price__name">${ne}</span><span class="snippet-service-price__cell snippet-service-price__amount">${pe}</span></div>`;
    })
    .join('');

  const noteHtml = `<p class="snippet-service-price__note">${escapeHtml(DEFAULT_NOTE)}</p>`;

  return `<div class="snippet-service-price">
  <h2 class="snippet-service-price__title">Стоимость услуги <span class="snippet-service-price__accent">"${nameEscaped}"</span></h2>
  <div class="snippet-service-price__rows">${rowsHtml}</div>
  ${noteHtml}
</div>`;
}

/** @returns {(tree: import('mdast').Root) => void} */
export default function remarkSnippetServicePrice() {
  /** @param {import('mdast').Root} tree */
  return function transformer(tree) {
    if (!tree.children?.length) return;

    tree.children = tree.children.flatMap((node) => {
      if (node.type !== 'paragraph') return [node];

      const text = collectParagraphText(node);
      if (text === null) return [node];

      const html = parseSnippetServicePriceParagraph(text);
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
