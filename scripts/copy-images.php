<?php
/**
 * copy-images.php
 * Выводит JSON: imageId → file path relative to uploads/
 * Запуск: wp --allow-root eval-file scripts/copy-images.php
 */

$needed_ids = [11056, 11055, 11054, 11059, 11388, 11389, 11412, 11416, 11400, 11420, 11580, 11251, 11264];

$result = [];
foreach ($needed_ids as $id) {
    $url  = wp_get_attachment_url($id);
    $path = get_attached_file($id);
    if ($url) {
        $result[$id] = [
            'url'  => $url,
            'path' => $path,
            'file' => basename($path),
        ];
    }
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
