<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class UserLogin {

	public static function init() {
		$self = new self();
		add_shortcode( 'fp_login', array($self, 'fp_login_shortcode'));
	}

    public function fp_login_shortcode() {
        $unique_key = 'fp-login'.uniqid();
//         if (is_user_logged_in()) {
//             return '<p>Already logged in</p>';
//         } else {
//             return '<div class="fp-login" data-key="' . esc_attr($unique_key) . '"></div>';
//         }

    return '<div class="fp-login" data-key="' . esc_attr($unique_key) . '"></div>';
    }

}
