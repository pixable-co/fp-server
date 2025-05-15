<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class CoreActions {

    public static function init() {
        $self = new self();
        add_action( 'template_redirect', array($self, 'restrict_site_access_except_login_signup'));
        add_filter( 'login_redirect', array($self, 'redirect_after_login'), 10, 3 );
    }

    public function restrict_site_access_except_login_signup() {
        $current_path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
        $current_slug = explode('/', $current_path)[0];

        $allowed_pages = [
            'partner-login',
            'registration',
            'forgot-password',
        ];

        if (is_user_logged_in()) {
            if (in_array($current_slug, $allowed_pages)) {
                wp_redirect(home_url('/'));
                exit;
            }
            return; // Allow other pages
        }

        if (in_array($current_slug, $allowed_pages)) {
            return; // Allow access to login/signup
        }

        wp_redirect(site_url('/partner-login'));
        exit;
    }

    public function redirect_after_login($redirect_to, $requested_redirect_to, $user) {
        return home_url('/'); // Redirect to homepage
    }
}
