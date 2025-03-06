<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BookingChart {

    public static function init() {
        $self = new self();
        add_shortcode( 'booking_chart', array($self, 'booking_chart_shortcode') );
    }

    public function booking_chart_shortcode() {
        $unique_key = 'booking_chart' . uniqid();
        return '<div class="booking_chart" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
