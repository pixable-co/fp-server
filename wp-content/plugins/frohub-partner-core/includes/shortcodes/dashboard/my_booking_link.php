<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MyBookingLink {

    public static function init() {
        $self = new self();
        add_shortcode( 'my_booking_link', array($self, 'my_booking_link_shortcode') );
    }

    public function my_booking_link_shortcode() {
        $unique_key = 'my_booking_link' . uniqid();
        return '<div class="my_booking_link" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
