<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class GoogleCalender {

    public static function init() {
        $self = new self();
        add_shortcode( 'google_calender', array($self, 'google_calender_shortcode') );
    }

    public function google_calender_shortcode() {
        $unique_key = 'google_calender' . uniqid();
        return '<div class="google_calender" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
