<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class ValueOfBookingChart {

    public static function init() {
        $self = new self();
        add_shortcode( 'value_of_booking_chart', array($self, 'value_of_booking_chart_shortcode') );
    }

    public function value_of_booking_chart_shortcode() {
        $unique_key = 'value_of_booking_chart' . uniqid();
        return '<div class="value_of_booking_chart" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
