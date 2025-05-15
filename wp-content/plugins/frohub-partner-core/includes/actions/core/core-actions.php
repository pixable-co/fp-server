<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class CoreActions {

    public static function init() {
        $self = new self();
        add_action( 'template_redirect', array($self, 'restrict_site_access_except_login_signup'));
    }

    public function restrict_site_access_except_login_signup() {
        if (is_user_logged_in()) {
            return; // User is logged in, allow access
        }

        // Allowed slugs for non-logged-in users
        $allowed_pages = [
            'partner-login',
            'partner-signup',
        ];

        // Get the current URL path (without domain)
        $current_path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

        // Extract the first part of the path (like 'partner-login')
        $current_slug = explode('/', $current_path)[0];

        // Allow if the slug is in allowed list
        if (in_array($current_slug, $allowed_pages)) {
            return; // Allow access
        }

        // Redirect non-logged-in user to partner-login
        wp_redirect(site_url('/partner-login'));
        exit;
    }
}
