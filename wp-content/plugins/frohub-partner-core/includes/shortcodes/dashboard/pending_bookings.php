<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class PendingBookings {

    public static function init() {
        $self = new self();
        add_shortcode( 'pending_bookings', array($self, 'pending_bookings_shortcode') );
    }

    public function pending_bookings_shortcode() {
        // Get the current logged-in user
        $current_user_id = get_current_user_id();

        if (!$current_user_id) {
            return '<span>Error: Not logged in</span>';
        }

        // Retrieve 'partner_post_id' from ACF for the logged-in user
        $partner_id = get_field('partner_post_id', 'user_' . $current_user_id);

        // Validate that we have a valid partner_id
        if (!$partner_id || !is_numeric($partner_id)) {
            return '<span>Error: Invalid Partner ID</span>';
        }

        // Retrieve the Authorization Header from ACF Options Page (Already Includes 'Basic ')
        $auth_token = get_field('frohub_ecommerce_basic_authentication', 'option');

        // Validate Authorization Header
        if (empty($auth_token)) {
            return '<span>Error: Missing API Authorization Key</span>';
        }

        // Define API endpoint URL with the retrieved partner_id
        $api_url = "https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/partners_my_pending_orders_count/?partner_id=" . intval($partner_id);

        // Set up API request arguments
        $args = array(
            'method'  => 'GET',
            'headers' => array(
                'Authorization' => trim($auth_token)
            )
        );

        // Make API request
        $response = wp_remote_get($api_url, $args);

        if (is_wp_error($response)) {
            return '<span>Error retrieving order count</span>';
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        // Check if API returned a valid count
        $order_count = (!empty($data) && isset($data['order_count'])) ? intval($data['order_count']) : 0;

        // Return the pending bookings count inside a div
        return '<div class="pending_bookings dashboard-stats">' . esc_html($order_count) . '</div>';
    }
}
