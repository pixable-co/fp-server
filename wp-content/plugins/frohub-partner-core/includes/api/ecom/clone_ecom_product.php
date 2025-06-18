<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class CloneEcomProduct {

    public static function init() {
        add_action('rest_api_init', function () {
            register_rest_route('fpserver/v1', '/clone-ecom-product', array(
                'methods'             => 'POST',
                'callback'            => array(__CLASS__, 'handle_request'),
                'permission_callback' => '__return_true',
            ));
        });
    }

    public static function handle_request(\WP_REST_Request $request) {
        $data = $request->get_json_params();

        // Basic validation
        if (empty($data['service_name']) || empty($data['partner_id'])) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Missing service_name or partner_id.'
            ], 400);
        }

        $service_name = sanitize_text_field($data['service_name']);
        $partner_id   = (int) $data['partner_id'];

        // Check for duplicate ecommerce-product by service_name + partner_id
        $existing = get_posts([
            'post_type'      => 'ecommerce-product',
            'post_status'    => 'any',
            'title'          => $service_name,
            'meta_query'     => [
                [
                    'key'     => 'partner_id',
                    'value'   => $partner_id,
                    'compare' => '='
                ]
            ],
            'posts_per_page' => 1
        ]);

        if (!empty($existing)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'A product with this service_name and partner_id already exists.',
                'post_id' => $existing[0]->ID
            ], 200);
        }

        // Create new ecommerce-product post
        $post_id = wp_insert_post([
            'post_title'  => $service_name,
            'post_type'   => 'ecommerce-product',
            'post_status' => $data['service_status'] ?? 'draft'
        ]);

        if (is_wp_error($post_id)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Failed to clone product.',
                'error'   => $post_id->get_error_message()
            ], 500);
        }

        // Save ACF fields
        update_field('partner_id', $partner_id, $post_id);
        update_field('partner_product_data', wp_json_encode($data, JSON_PRETTY_PRINT), $post_id);

        return new \WP_REST_Response([
            'success' => true,
            'message' => 'Product Cloned to Partner Portal Successfully',
            'post_id' => $post_id
        ], 200);
    }
}
