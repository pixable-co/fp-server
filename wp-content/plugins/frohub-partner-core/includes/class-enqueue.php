<?php

namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Enqueue {

	public static function init() {
		$self = new self();
		add_action( 'wp_enqueue_scripts', array( $self, 'fpserver_scripts' ) );
	}

    public function fpserver_scripts() {
        $current_user_id = get_current_user_id();
        $subscription_data = $this->get_user_subscription_data($current_user_id);
        $has_valid_subscription = $subscription_data['has_active_subscription'];
        $billing_history = $subscription_data['billing_history'];
        $has_pending_cancellation = $subscription_data['has_pending_cancellation'];

        wp_enqueue_style( 'fpserver-shortcode-style', FPSERVER_ROOT_DIR_URL . 'includes/assets/shortcode/style.css' );
        wp_enqueue_style( 'fpserver-style', FPSERVER_ROOT_DIR_URL . 'includes/assets/build/frontend.css' );
        wp_enqueue_script( 'fpserver-script', FPSERVER_ROOT_DIR_URL . 'includes/assets/build/frontend.js', 'jquery', '0.0.5', true );
        wp_localize_script(
            'fpserver-script',
            'fpserver_settings',
            array(
                'ajax_url'        => admin_url( 'admin-ajax.php' ),
                'nonce'           => wp_create_nonce( 'fpserver_nonce' ),
                'cancel_subscription_nonce' => wp_create_nonce('wcs_change_subscription_to_cancelled'),
                'partner_post_id' => get_field('partner_post_id', 'user_' . $current_user_id),
                'has_active_subscription'=> $has_valid_subscription,
                'has_pending_cancellation' => (bool) $has_pending_cancellation,
                'billing_history'=> $billing_history,
                'base_api_url' => FPSERVER_ECOM_BASE_API_URL,
                'google_api_key' => FPSERVER_GOOGLE_API_KEY
            )
        );

        add_filter( 'script_loader_tag', array( $this, 'add_module_type_to_script' ), 10, 3 );
    }

	public function add_module_type_to_script( $tag, $handle, $src ) {
		if ( 'fpserver-script' === $handle ) {
			$tag = '<script type="module" src="' . esc_url( $src ) . '"></script>';
		}
		return $tag;
	}

    public function get_user_subscription_data($user_id) {
        $has_valid_subscription = false;
        $has_pending_cancellation = false;
        $billing_history = [];

        if (!function_exists('wcs_get_users_subscriptions')) {
            return [
                'has_active_subscription' => false,
                'has_pending_cancellation' => false,
                'billing_history' => [],
            ];
        }

        $subscriptions = wcs_get_users_subscriptions($user_id);

        foreach ($subscriptions as $subscription) {
            if (!in_array($subscription->get_status(), ['active', 'pending-cancel'])) {
                continue;
            }

            foreach ($subscription->get_items() as $item) {
                $raw_plan_name = $item->get_name();
                $clean_name = trim(str_replace(['FroHub - ', 'FroHub – '], '', $raw_plan_name));

                if (stripos($clean_name, 'Pro') !== false) {
                    // Manual check for pending cancel fallback
                    $cancelled_date = $subscription->get_date('cancelled');
                    $end_date = $subscription->get_date('end');
                    $is_pending_cancel = in_array($subscription->get_status(), ['pending-cancel']) || ($subscription->has_status('active') && $subscription->get_date('cancelled') && $subscription->get_date('end'));

                    $billing_history[] = [
                        'subscription_id'   => $subscription->get_id(),
                        'plan_name'         => $clean_name,
                        'status'            => $subscription->get_status(),
                        'pending_cancel'    => $is_pending_cancel,
                        'start_date'        => $subscription->get_date('start'),
                        'next_payment'      => $subscription->get_date('next_payment'),
                        'last_payment'      => $subscription->get_date('last_payment'),
                        'end_date'          => $end_date,
                        'total'             => $subscription->get_total(),
                        'payment_method'    => $subscription->get_payment_method_title(),
                        'subscription_plan' => $clean_name,
                    ];

                    $has_valid_subscription = true;

                    if ($is_pending_cancel) {
                        $has_pending_cancellation = true;
                    }
                }
            }
        }

        return [
            'has_active_subscription' => $has_valid_subscription,
            'has_pending_cancellation' => $has_pending_cancellation,
            'billing_history' => $billing_history,
        ];
    }
}
