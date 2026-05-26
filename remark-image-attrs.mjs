import { visit } from 'unist-util-visit';
import sharp from 'sharp';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const dimensionCache = new Map();
const publicDir = resolve(process.cwd(), 'public');

function getDimensions(src) {
  if (!src || src.startsWith('http')) return null;
  if (dimensionCache.has(src)) return dimensionCache.get(src);

  const filePath = join(publicDir, src.replace(/^\//, ''));
  if (!existsSync(filePath)) {
    dimensionCache.set(src, null);
    return null;
  }
  try {
    const buf = readFileSync(filePath);
    const meta = sharp(buf).metadata();
    return meta.then(m => {
      const dims = (m.width && m.height) ? { width: m.width, height: m.height } : null;
      dimensionCache.set(src, dims);
      return dims;
    });
  } catch {
    dimensionCache.set(src, null);
    return null;
  }
}

export default function remarkImageAttrs() {
  return async (tree) => {
    const imageNodes = [];
    visit(tree, 'image', (node) => imageNodes.push(node));
    visit(tree, 'html', (node) => {
      if (/<img\b/i.test(node.value)) imageNodes.push(node);
    });

    // Подгружаем размеры всех найденных markdown image-ссылок параллельно.
    await Promise.all(
      imageNodes
        .filter(n => n.type === 'image')
        .map(async (node, idx) => {
          const dims = await getDimensions(node.url);
          node.data = node.data || {};
          node.data.hProperties = node.data.hProperties || {};
          const props = node.data.hProperties;

          props.decoding = 'async';
          if (idx === 0) {
            props.loading = 'eager';
            props.fetchpriority = 'high';
          } else {
            props.loading = 'lazy';
          }
          if (dims) {
            props.width = dims.width;
            props.height = dims.height;
          }
        }),
    );
  };
}
