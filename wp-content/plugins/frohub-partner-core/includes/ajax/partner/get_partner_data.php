<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class GetPartnerData {

    public static function init() {
        $self = new self();

        // AJAX for logged-in users
        add_action('wp_ajax_fpserver/get_partner_data', array($self, 'get_partner_data'));
        // AJAX for non-logged-in users
        add_action('wp_ajax_nopriv_fpserver/get_partner_data', array($self, 'get_partner_data'));
    }

    public function get_partner_data() {
        check_ajax_referer('fpserver_nonce');

        // Get current user ID
        $current_user_id = get_current_user_id();

        // Check if user is logged in
        if (!$current_user_id) {
            wp_send_json_error(array(
                'message' => 'You need to be logged in to view partner data.'
            ));
        }

        // Get partner ID from ACF field for current user
        $partner_post_id = get_field('partner_post_id', 'user_' . $current_user_id);

        // If no partner ID is found
        if (!$partner_post_id) {
            wp_send_json_error(array(
                'message' => 'No associated partner found.'
            ));
        }

        // Call the API
        $api_response = $this->fetch_partner_api_data($partner_post_id);

        if ($api_response === null) {
            wp_send_json_error(array(
                'message' => 'Failed to fetch partner data from API.'
            ));
        }

        // Return the API response
        wp_send_json_success($api_response);
    }

    /**
     * Fetches partner data from the external API.
     *
     * @param int $partner_post_id
     * @return array|null API response data
     */
    private function fetch_partner_api_data($partner_post_id) {
        // Use the external API endpoint
        $api_url = 'https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/get-partner-data';

        $response = wp_remote_post($api_url, array(
            'body'    => json_encode(array('partner_post_id' => $partner_post_id)),
            'headers' => array(
                'Content-Type' => 'application/json'
            ),
            'timeout' => 30
        ));

        // Check if request was successful
        if (is_wp_error($response)) {
            error_log('Partner API Error: ' . $response->get_error_message());
            return null;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            error_log('Partner API returned status code: ' . $response_code);
            return null;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        // Check if JSON decode was successful
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('Partner API JSON decode error: ' . json_last_error_msg());
            return null;
        }

        return $data;
    }
}