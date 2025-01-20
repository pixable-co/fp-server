<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PartnerBookings {

	public static function init() {
		$self = new self();
		add_shortcode( 'fp_partner_bookings', array($self, 'fp_partner_bookings_shortcode'));
	}

    public function fp_partner_bookings_shortcode() {
        $unique_key = 'fp-partner-bookings'.uniqid();
        if (is_user_logged_in()) {
            return '<div class="fp-partner-bookings" data-key="' . esc_attr($unique_key) . '"></div>';
        } else {
            return 'Please login using your partner account first';
        }

    }

}
