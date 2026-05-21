<?php
/**
 * export-seo-meta.php
 * Экспорт SEO-мета + ACF для всех страниц и услуг
 *
 * Запуск через WP-CLI в окружении WordPress:
 *   wp eval-file .../scripts/export-seo-meta.php > .../scripts/data/seo-meta.json
 */

$post_types = ['page', 'uslugi']; // TODO: уточнить реальное имя CPT

$posts = get_posts([
    'post_type'   => $post_types,
    'numberposts' => -1,
    'post_status' => 'publish',
]);

$result = [];

foreach ($posts as $p) {
    $id = $p->ID;

    // ── Yoast SEO ────────────────────────────────────
    $yoast_title = get_post_meta($id, '_yoast_wpseo_title', true);
    $yoast_desc  = get_post_meta($id, '_yoast_wpseo_metadesc', true);
    $yoast_og    = get_post_meta($id, '_yoast_wpseo_opengraph-image', true);

    // ── Rank Math ────────────────────────────────────
    $rm_title = get_post_meta($id, 'rank_math_title', true);
    $rm_desc  = get_post_meta($id, 'rank_math_description', true);
    $rm_og    = get_post_meta($id, 'rank_math_og_image', true);

    // ── ACF ──────────────────────────────────────────
    $acf = function_exists('get_fields') ? get_fields($id) : null;

    // ── Featured image ───────────────────────────────
    $thumb_url = get_the_post_thumbnail_url($id, 'full') ?: null;

    $result[] = [
        'id'               => $id,
        'slug'             => $p->post_name,
        'post_type'        => $p->post_type,
        'h1'               => get_the_title($id),
        'meta_title'       => $yoast_title ?: $rm_title ?: get_the_title($id),
        'meta_description' => $yoast_desc  ?: $rm_desc  ?: '',
        'og_image'         => $yoast_og    ?: $rm_og    ?: $thumb_url,
        'thumbnail'        => $thumb_url,
        'acf'              => $acf,
    ];
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
