<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CoreActions {

	public static function init() {
		$self = new self();
		add_action( 'template_redirect', array($self, 'restrict_site_access_except_login_signup'), 10, 2);
	}


    public function restrict_site_access_except_login_signup() {
        if (is_user_logged_in()) {
            return;
        }

        // Allowed pages (modify slugs or paths as needed)
        $allowed_pages = [
            'login',    // Replace with the slug of your login page
            'sign-up',  // Replace with the slug of your signup page
        ];

        // Get the current page slug
        global $post;
        $current_page_slug = isset($post->post_name) ? $post->post_name : '';

        // Check if the current page is one of the allowed pages
        if (in_array($current_page_slug, $allowed_pages)) {
            return; // Allow access
        }

        // Redirect to the login page if not allowed
        wp_redirect(site_url('/login')); // Replace '/login' with the URL of your login page
        exit;
    }
}
