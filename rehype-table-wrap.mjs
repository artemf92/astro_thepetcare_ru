import { visit } from 'unist-util-visit';

/**
 * Оборачивает каждую <table> в <div class="table-wrap"> — это даёт
 * горизонтальный скролл на мобильных, не ломая раскладку самой таблицы.
 * (overflow-x на display:table не работает, нужен block-контейнер.)
 */
export default function rehypeTableWrap() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || node.tagName !== 'table' || index == null) return;

      // Не оборачиваем повторно, если уже обёрнуто.
      if (
        parent.type === 'element' &&
        parent.tagName === 'div' &&
        Array.isArray(parent.properties?.className) &&
        parent.properties.className.includes('table-wrap')
      ) {
        return;
      }

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'] },
        children: [node],
      };
    });
  };
}
