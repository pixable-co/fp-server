<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BookingStatsCard {

    public static function init() {
        $self = new self();
        add_shortcode( 'booking_stats_card', array($self, 'booking_stats_card_shortcode') );
    }

    public function booking_stats_card_shortcode() {
        $unique_key = 'booking_stats_card' . uniqid();
        return '<div class="booking_stats_card" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
