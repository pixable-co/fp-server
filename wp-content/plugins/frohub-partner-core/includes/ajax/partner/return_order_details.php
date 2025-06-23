<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class ReturnOrderDetails {

    public static function init() {
        $self = new self();

        // AJAX for logged-in users
        add_action('wp_ajax_fpserver/return_order_details', array($self, 'return_order_details'));
        // AJAX for non-logged-in users
        add_action('wp_ajax_nopriv_fpserver/return_order_details', array($self, 'return_order_details'));
    }

    public function return_order_details() {
        check_ajax_referer('fpserver_nonce');

        // Get partner_id from AJAX request
        $partner_id = isset($_POST['partner_id']) ? sanitize_text_field($_POST['partner_id']) : '';

        if (empty($partner_id)) {
            wp_send_json_error(array(
                'message' => 'Partner ID is required.',
            ));
            return;
        }

        // External API URL
        $api_url = "https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/return-order-details";

        // Prepare API request
        $args = array(
            'method'    => 'POST',
            'headers'   => array(
                'Content-Type' => 'application/json',
            ),
            'body'      => json_encode(array('partner_id' => $partner_id)),
            'timeout'   => 30,
        );

        // Fetch data from external API
        $response = wp_remote_post($api_url, $args);

        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Error fetching booking data: ' . $response->get_error_message(),
            ));
            return;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            wp_send_json_error(array(
                'message' => 'API request failed with status code: ' . $response_code,
            ));
            return;
        }

        $body = wp_remote_retrieve_body($response);
        $orders = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error(array(
                'message' => 'Invalid JSON response from API.',
            ));
            return;
        }

        if (!$orders || !is_array($orders)) {
            wp_send_json_error(array(
                'message' => 'No valid booking data found.',
            ));
            return;
        }

        // Return successful response with orders data
        wp_send_json_success(array(
            'orders' => $orders,
            'message' => 'Orders retrieved successfully.',
        ));
    }
}