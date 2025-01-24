<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FpBookingTable {

    public static function init() {
        $self = new self();
        add_shortcode( 'fp_booking_table', array($self, 'fp_booking_table_shortcode') );
    }

    public function fp_booking_table_shortcode() {
        $unique_key = 'fp_booking_table' . uniqid();
        return '<div class="fp_booking_table" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
