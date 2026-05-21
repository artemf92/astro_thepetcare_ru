<?php
/**
 * export-site-options.php
 * Экспорт данных шапки/подвала: телефон, адрес, email, соцсети, логотип
 *
 * Запуск через WP-CLI в окружении WordPress:
 *   wp eval-file .../scripts/export-site-options.php > .../scripts/data/site-options.json
 */

// ── Логотип ───────────────────────────────────────────
$logo_id  = (int) get_theme_mod('custom_logo');
$logo_url = $logo_id ? wp_get_attachment_url($logo_id) : null;
$logo_meta = $logo_id ? wp_get_attachment_image_src($logo_id, 'full') : null;

// ── Favicon ───────────────────────────────────────────
$icon_id  = (int) get_option('site_icon');
$icon_url = $icon_id ? wp_get_attachment_url($icon_id) : null;

// ── Все theme mods ────────────────────────────────────
$mods = get_theme_mods();

// ── ACF Options ───────────────────────────────────────
$acf = function_exists('get_fields') ? get_fields('options') : null;

// ── Меню ─────────────────────────────────────────────
$menus = [];
foreach (wp_get_nav_menus() as $menu) {
    $items = wp_get_nav_menu_items($menu->term_id);
    $parsed = [];
    if ($items) {
        foreach ($items as $item) {
            $parsed[] = [
                'id'       => $item->ID,
                'title'    => $item->title,
                'url'      => $item->url,
                'parent'   => (int) $item->menu_item_parent,
                'order'    => (int) $item->menu_order,
                'target'   => $item->target,
            ];
        }
    }
    $menus[$menu->slug] = [
        'id'    => $menu->term_id,
        'name'  => $menu->name,
        'slug'  => $menu->slug,
        'items' => $parsed,
    ];
}

$result = [
    'site_name'    => get_bloginfo('name'),
    'site_desc'    => get_bloginfo('description'),
    'site_url'     => get_site_url(),
    'logo'         => [
        'id'     => $logo_id,
        'url'    => $logo_url,
        'width'  => $logo_meta ? $logo_meta[1] : null,
        'height' => $logo_meta ? $logo_meta[2] : null,
    ],
    'favicon_url'  => $icon_url,
    'theme_mods'   => $mods,
    'acf_options'  => $acf,
    'menus'        => $menus,
];

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
