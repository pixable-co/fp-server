<?php
namespace FPServer;

if (!defined('ABSPATH')) {
    exit;
}

class BookingStats {

    public static function init() {
        $self = new self();
        add_shortcode('booking_stats', array($self, 'booking_stats_shortcode'));
    }

    public function booking_stats_shortcode() {
        $current_user_id = get_current_user_id();
        if (!$current_user_id) {
             return '<p>You need to be logged in to view booking statistics.</p>';
        }
        $partner_id = get_field('partner_post_id', 'user_' . $current_user_id);

        if (!$partner_id) {
           return '<p>No partner ID found for your account.</p>';
        }
        $api_url = "https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/return-order-details";

        // Prepare API request
        $args = array(
            'method'    => 'POST',
            'headers'   => array(
                'Content-Type' => 'application/json',
            ),
            'body'      => json_encode(array('partner_id' => $partner_id)),
        );

        // Fetch data from API
        $response = wp_remote_post($api_url, $args);

        if (is_wp_error($response)) {
            return '<p>Error fetching booking data: ' . esc_html($response->get_error_message()) . '</p>';
        }

        $body = wp_remote_retrieve_body($response);
        $orders = json_decode($body, true);

        if (!$orders || !is_array($orders)) {
            return '<p>No valid booking data found.</p>';
        }

        // Get current year
        $current_year = date("Y");

        // Filter orders for "processing" or "completed" and within the current year
        $filtered_orders = array_filter($orders, function ($order) use ($current_year) {
            $order_year = date("Y", strtotime($order['created_at']));
            return isset($order['status'])
                && in_array($order['status'], ['processing', 'completed'])
                && $order_year == $current_year;
        });

        $total_value = 0; // Sum of all total service amounts
        $total_deposits = 0; // Sum of all deposits
        $total_bookings = count($filtered_orders); // Count of filtered bookings

        foreach ($filtered_orders as $order) {
            if (!isset($order['line_items']) || !is_array($order['line_items'])) {
                continue; // Skip if line items are not present
            }

            foreach ($order['line_items'] as $item) {
                // Extract deposit amount (remove '£' and convert to number)
                $deposit = isset($item['meta']['deposit_due']) ? floatval(str_replace('£', '', $item['meta']['deposit_due'])) : 0;
                $total_due = isset($item['total']) ? floatval($item['total']) : 0;

                // Total Service Amount = Deposit + Total Due
                $total_service_amount = $deposit + $total_due;

                $total_value += $total_service_amount;
                $total_deposits += $deposit;
            }
        }

        // Calculate Average Booking Value
        $average_booking_value = $total_bookings > 0 ? $total_value / $total_bookings : 0;

        ob_start();
        ?>
        <div class="booking-stats-container">
            <div class="booking-stats">
                <h2 class="booking-stats__heading">Total Value of Bookings</h2>
                <p class="booking-stats__price">£<?php echo number_format($total_value, 2); ?></p>
            </div>

            <div class="booking-stats">
                <h2 class="booking-stats__heading">Total Value of Deposits</h2>
                <p class="booking-stats__price">£<?php echo number_format($total_deposits, 2); ?></p>
            </div>

            <div class="booking-stats">
                <h2 class="booking-stats__heading">Total Number of Bookings</h2>
                <p class="booking-stats__price"><?php echo $total_bookings; ?></p>
            </div>

            <div class="booking-stats">
                <h2 class="booking-stats__heading">Average Booking Value</h2>
                <p class="booking-stats__price">£<?php echo number_format($average_booking_value, 2); ?></p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
