<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class SubscriptionHandler {

    public static function init() {
        $self = new self();

        // Existing AJAX actions
        add_action('wp_ajax_fpserver/set_pending_cancellation', [$self, 'set_pending_cancellation']);
        add_action('wp_ajax_nopriv_fpserver/set_pending_cancellation', [$self, 'set_pending_cancellation']);

        add_action('wp_ajax_fpserver/load_gravity_form', [$self, 'load_gravity_form']);
        add_action('wp_ajax_nopriv_fpserver/load_gravity_form', [$self, 'load_gravity_form']);

        // Form schema and submission via backend
        add_action('wp_ajax_fpserver/load_gf_form_schema', [$self, 'load_gf_form_schema']);
        add_action('wp_ajax_nopriv_fpserver/load_gf_form_schema', [$self, 'load_gf_form_schema']);

        add_action('wp_ajax_fpserver/submit_gf_form', [$self, 'submit_gf_form']);
        add_action('wp_ajax_nopriv_fpserver/submit_gf_form', [$self, 'submit_gf_form']);

        // Optional: Relax Gravity Forms REST API permissions
        add_filter('gform_rest_api_capability_get_forms', [$self, 'allow_all_rest_capability']);
        add_filter('gform_rest_api_capability_get_form', [$self, 'allow_all_rest_capability'], 10, 2);
        add_filter('gform_rest_api_capability_submit_form', [$self, 'allow_all_rest_capability'], 10, 2);
    }

    public function set_pending_cancellation() {
        check_ajax_referer('fpserver_nonce');

        $user_id = get_current_user_id();
        if (!$user_id) {
            wp_send_json_error(['message' => 'User not authenticated.']);
        }

        if (!function_exists('wcs_get_users_subscriptions')) {
            wp_send_json_error(['message' => 'WooCommerce Subscriptions not active.']);
        }

        $subscriptions = wcs_get_users_subscriptions($user_id);

        foreach ($subscriptions as $subscription) {
            if (!$subscription->has_status('active')) {
                continue;
            }

            foreach ($subscription->get_items() as $item) {
                $product = $item->get_product();
                if (!$product) {
                    continue;
                }

                $product_name = strtolower($product->get_name());

                // Allow cancel only for Pro plans (e.g. 'FroHub - Pro Yearly', 'FroHub - Pro Monthly')
                if (strpos($product_name, 'pro') !== false) {
                    $subscription->update_status('pending-cancel');
                    wp_send_json_success(['message' => 'Pro subscription marked for cancellation.']);
                }
            }
        }

        wp_send_json_error(['message' => 'No active subscription found to cancel.']);
    }

    public function load_gravity_form() {
        check_ajax_referer('fpserver_nonce', 'security');

        $form_id = 16;

        if (!class_exists('GFAPI') || !$form_id) {
            wp_send_json_error(['message' => 'Invalid or missing form ID.']);
        }

        $form_html = do_shortcode('[gravityform id="' . $form_id . '" title="false" description="false" ajax="true"]');

        wp_send_json_success(['html' => $form_html]);
    }

    public function load_gf_form_schema() {
        check_ajax_referer('fpserver_nonce', '', true);

        $form_id = 16;

        if (!class_exists('\GFAPI')) {
            wp_send_json_error(['message' => 'Gravity Forms is not active.']);
        }

        $form = \GFAPI::get_form($form_id);

        if (!$form || empty($form['fields'])) {
            wp_send_json_error(['message' => 'Form not found or has no fields.']);
        }

        wp_send_json_success(['fields' => $form['fields']]);
    }

    public function submit_gf_form() {
        check_ajax_referer('fpserver_nonce', '', true);

        $form_id = 16;
        $data = json_decode(file_get_contents('php://input'), true);

        $entry = [];

        foreach ($data as $key => $value) {
            if (strpos($key, 'input_') === 0) {
                $entry[$key] = sanitize_text_field($value);
            }
        }

        $result = \GFAPI::submit_form($form_id, $entry);

        if (is_wp_error($result)) {
            wp_send_json_error(['message' => $result->get_error_message()]);
        }

        wp_send_json_success(['message' => 'Form submitted successfully.']);
    }

    public function allow_all_rest_capability($capability, $request = null) {
        return true;
    }
}
