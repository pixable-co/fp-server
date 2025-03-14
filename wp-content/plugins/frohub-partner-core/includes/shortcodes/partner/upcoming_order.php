<?php
namespace FPServer;

if (!defined('ABSPATH')) {
    exit;
}

class UpcomingOrder {

    public static function init() {
        $self = new self();
        add_shortcode('upcoming_order', array($self, 'upcoming_order_shortcode'));
    }

    public function upcoming_order_shortcode($atts) {
        $atts = shortcode_atts(
            array(
                'partner_id' => '',
            ),
            $atts,
            'upcoming_order'
        );

        $current_user_id = get_current_user_id();

        // Check if user is logged in
        if (!$current_user_id) {
            return '<p>You need to be logged in to view upcoming bookings.</p>';
        }

        // Get partner ID from ACF field
        $partner_id = get_field('partner_post_id', 'user_' . $current_user_id);

        // If no partner ID is found
        if (!$partner_id) {
            return '<p>No associated partner found.</p>';
        }

        // Fetch data from API
        $response = $this->fetch_upcoming_booking($partner_id);

        // Check if the API request was successful and contains data
        if (!$response || !isset($response['success']) || $response['success'] !== true || empty($response['data'])) {
            return '<div class="upcoming-order-container dashboard-stats">
                        <p>No upcoming bookings found.</p>
                    </div>';
        }

        // Get the booking data from the response
        $booking_data = $response['data'];

        // Format the date and time
        $date_time = $booking_data['start_date'] . ' at ' . $booking_data['start_time'];

        // Build the client profile URL using partner_platform_client_id
        $client_profile_url = get_permalink($booking_data['partner_platform_client_id']);

        // Display the upcoming booking in the format shown in the screenshot
        return '<div class="upcoming-order-container dashboard-stats">
                    <h2> Next Upcoming Booking </h2>
                    <div class="booking-date-time">' . esc_html($date_time) . '</div>
                    <div class="booking-service">' . esc_html($booking_data['service_name']) . '</div>
                    <div class="booking-client-info">
                        <div class="client-name-email">
                            <span class="client-name">' . esc_html($booking_data['client_name']) . '</span>
                            <a href="' . esc_url($client_profile_url) . '" class="client-email-icon" title="Conversation of ' . esc_attr($booking_data['client_name']) . '"><i class="fas fa-comment-alt"></i></a>
                        </div>
                        <div class="client-phone">
                            <a href="tel:' . esc_attr($booking_data['client_phone']) . '" class="client-phone-link">' . esc_html($booking_data['client_phone']) . '</a>
                        </div>
                    </div>
                </div>';
    }

    /**
     * Fetches upcoming booking data from the API.
     *
     * @param int $partner_id
     * @return array|null API response data
     */
    private function fetch_upcoming_booking($partner_id) {
        $api_url = 'https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/get-upcoming-booking';

        $response = wp_remote_get(add_query_arg(
            array('partner_id' => $partner_id),
            $api_url
        ));

        // Check if request was successful
        if (is_wp_error($response)) {
            return null;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        return $data;
    }
}
