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

            $has_valid_subscription = false;

                if ( function_exists( 'wcs_get_users_subscriptions' ) ) {
                    $subscriptions = wcs_get_users_subscriptions( 194 );

                    foreach ( $subscriptions as $subscription ) {
                        if ( ! $subscription->has_status( 'active' ) ) {
                            continue;
                        }

                    foreach ( $subscription->get_items() as $item ) {
                                // Optionally use get_meta directly
                       $plan_name = $item->get_meta( 'Subscription Plan' );

                       if ( in_array( $plan_name, array( 'Pro', 'Pro Yearly' ) ) ) {
                               $has_valid_subscription = true;
                               break 2; // Found valid subscription, exit both loops
                       }
                   }
               }
           }

            wp_enqueue_style( 'fpserver-shortcode-style', FPSERVER_ROOT_DIR_URL . 'includes/assets/shortcode/style.css' );
			wp_enqueue_style( 'fpserver-style', FPSERVER_ROOT_DIR_URL . 'includes/assets/build/frontend.css' );
			wp_enqueue_script( 'fpserver-script', FPSERVER_ROOT_DIR_URL . 'includes/assets/build/frontend.js', 'jquery', '0.0.4', true );
			wp_localize_script(
				'fpserver-script',
				'fpserver_settings',
				array(
					'ajax_url'        => admin_url( 'admin-ajax.php' ),
					'nonce'           => wp_create_nonce( 'fpserver_nonce' ),
                    'partner_post_id' => get_field('partner_post_id', 'user_' . $current_user_id),
                    'has_active_subscription'=> $has_valid_subscription
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
}
