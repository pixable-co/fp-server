<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class BookingCalender {

	public static function init() {
		$self = new self();
		add_shortcode( 'fp_booking_calender', array($self, 'fp_booking_calender_shortcode'));
	}

    public function fp_booking_calender_shortcode() {
        $unique_key = 'fp-booking-calender'.uniqid();
        if (is_user_logged_in()) {
            return '<div class="fp-booking-calender" data-key="' . esc_attr($unique_key) . '"></div>';
        } else {
            return 'Please Login First Using Your Partner Account';
        }
    }

}
