<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ServiceForm {

	public static function init() {
		$self = new self();
		add_shortcode( 'fp_add_service', array($self, 'fp_add_service_shortcode'));
	}

    public function fp_add_service_shortcode() {
        $unique_key = 'fp-add-service'.uniqid();
        if (is_user_logged_in()) {
            return '<div class="fp-add-service" data-key="' . esc_attr($unique_key) . '"></div>';
        } else {
            return 'Please Login First Using Your Partner Account';
        }
    }

}
