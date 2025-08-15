<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class ForgotPassword {

    public static function init() {
        $self = new self();

        // Register AJAX handler
        add_action('wp_ajax_fpserver_forgot_password', [ $self, 'handle' ]);
        add_action('wp_ajax_nopriv_fpserver_forgot_password', [ $self, 'handle' ]);

    }

    public function handle() {
        check_ajax_referer('fpserver_nonce');

        $email = sanitize_email($_POST['user_login'] ?? '');

        if (empty($email) || !is_email($email)) {
            wp_send_json_error(['message' => 'Please enter a valid email address.']);
        }

        $user = get_user_by('email', $email);
        if (!$user) {
            wp_send_json_error(['message' => 'If the email exists, you’ll receive a password reset link — check your inbox and junk folder.']);
        }

        $reset_key = get_password_reset_key($user);
        if (is_wp_error($reset_key)) {
            wp_send_json_error(['message' => 'Could not generate reset link. Please try again.']);
        }

        $custom_reset_url = home_url('/reset-password/');
        $reset_url = add_query_arg([
            'key'   => $reset_key,
            'login' => rawurlencode($user->user_login),
        ], $custom_reset_url);

        $mail_sent = wp_mail(
            $user->user_email,
            'Password Reset Request',
            "Click the link below to reset your password:\n\n" . $reset_url
        );

        if (!$mail_sent) {
            wp_send_json_error(['message' => 'Failed to send email. Please try again later.']);
        }

        $first_name = get_user_meta($user->ID, 'first_name', true);

        $webhook_url = 'https://flow.zoho.eu/20103370577/flow/webhook/incoming?zapikey=1001.41a0654ca8278cb1367b6f643c99cc59.ab1adbc257cd64052d037fc346a0a473&isdebug=false';
        //$webhook_url = 'https://webhook.site/20364340-b7e0-484c-a508-e183d585c326';
        $response = wp_remote_post($webhook_url, [
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => json_encode([
                'email'              => $user->user_email,
                'reset_password_url' => preg_replace('#^https?://#', '', $reset_url),
                'first_name'         => $first_name ?: '',
            ]),
        ]);

        if (is_wp_error($response)) {
            error_log('Zoho Flow call failed: ' . $response->get_error_message());
        }

        wp_send_json_success(['message' => 'If the email exists, you’ll receive a password reset link — check your inbox and junk folder.']);
    }
}
