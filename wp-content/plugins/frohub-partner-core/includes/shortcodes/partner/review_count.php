<?php
namespace FPServer;

if (!defined('ABSPATH')) {
    exit;
}

class ReviewCount {

    public static function init() {
        $self = new self();
        add_shortcode('review_count', array($self, 'review_count_shortcode'));
    }

    public function review_count_shortcode() {
        $current_user_id = get_current_user_id();

        // Check if user is logged in
        if (!$current_user_id) {
            return '<p>You need to be logged in to view booking statistics.</p>';
        }

        // Get partner ID from ACF field
        $partner_id = get_field('partner_post_id', 'user_' . $current_user_id);

        // If no partner ID is found
        if (!$partner_id) {
            return '<p>No associated partner found.</p>';
        }

        // Fetch data from API
        $api_response = $this->fetch_api_data($partner_id);

        // Calculate the average rating
        $average_rating = $this->calculate_average_rating($api_response);

        // Display rating in the existing format
        return '<div class="review-stats dashboard-stats">
                    <h2> Your Reviews </h2>
                    <p class="booking-stats__price">' . esc_html($average_rating) . '</p>
                </div>';
    }

    /**
     * Fetches partner review data from the API.
     *
     * @param int $partner_id
     * @return array|null API response data
     */
    private function fetch_api_data($partner_id) {
        $api_url = 'https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/get-partner-data';

        $response = wp_remote_post($api_url, [
            'body'    => json_encode(['partner_post_id' => $partner_id]),
            'headers' => [
                'Content-Type' => 'application/json'
            ]
        ]);

        // Check if request was successful
        if (is_wp_error($response)) {
            return null;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        return $data;
    }

    /**
     * Calculates the average rating from API response data.
     *
     * @param array|null $api_response
     * @return string Average rating or "No Reviews"
     */
    private function calculate_average_rating($api_response) {
        if (!$api_response || !isset($api_response['reviews'])) {
            return "No Reviews";
        }
    
        $total_rating = 0;
        $review_count = 0;
    
        foreach ($api_response['reviews'] as $review) {
            if (!empty($review['rating'])) {
                $total_rating += floatval($review['rating']);
                $review_count++;
            }
        }
    
        return ($review_count > 0) ? number_format($total_rating / $review_count, 1) . ' / 5' : "No Reviews";
    }
    
}
