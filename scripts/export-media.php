<?php
/**
 * export-media.php
 * Экспорт всех медиафайлов: ID → URL + путь на диске
 *
 * Запуск на сервере/в контейнере WordPress через WP-CLI:
 *   wp --allow-root eval-file /path/to/ThePetCare.ru/scripts/export-media.php \
 *     > /path/to/ThePetCare.ru/scripts/data/media.json
 */

$attachments = get_posts([
    'post_type'   => 'attachment',
    'numberposts' => -1,
    'post_status' => 'inherit',
]);

$result = [];

foreach ($attachments as $a) {
    $meta     = wp_get_attachment_metadata($a->ID);
    $fullUrl  = wp_get_attachment_url($a->ID);
    $filePath = get_attached_file($a->ID); // абсолютный путь на сервере

    $result[] = [
        'id'       => $a->ID,
        'title'    => $a->post_title,
        'url'      => $fullUrl,
        'path'     => $filePath,
        'filename' => basename($filePath),
        'width'    => $meta['width']  ?? null,
        'height'   => $meta['height'] ?? null,
        'mime'     => $a->post_mime_type,
    ];
}

// Сортировать по ID для удобства
usort($result, fn($a, $b) => $a['id'] <=> $b['id']);

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
