<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class ForgetPassword {

    public static function init() {
        $self = new self();
        add_shortcode( 'forget_password', array( $self, 'render_forgot_password_form' ) );
    }

    public function render_forgot_password_form() {
        ob_start();

        if ( isset($_POST['fp_forgot_password_nonce']) && wp_verify_nonce($_POST['fp_forgot_password_nonce'], 'fp_forgot_password_action') ) {
            $user_login = sanitize_text_field( $_POST['user_login'] );

            if ( empty($user_login) ) {
                $error = 'Please enter your username or email.';
            } else {
                $user = get_user_by( 'login', $user_login );
                if ( ! $user ) {
                    $user = get_user_by( 'email', $user_login );
                }

                if ( $user ) {
                    $reset_key = get_password_reset_key( $user );
                    if ( is_wp_error($reset_key) ) {
                        $error = 'Could not generate reset link. Please try again.';
                    } else {
                        $reset_url = network_site_url( "wp-login.php?action=rp&key=$reset_key&login=" . rawurlencode( $user->user_login ), 'login' );
                        wp_mail(
                            $user->user_email,
                            'Password Reset Request',
                            "Click the link below to reset your password:\n\n" . $reset_url
                        );
                        $success = 'A password reset link has been sent to your email.';
                    }
                } else {
                    $error = 'No user found with that username or email.';
                }
            }
        }

        ?>
        <form method="post" class="fp-forgot-password-form">
            <?php if ( isset($error) ) : ?>
                <p style="color: red;"><?php echo esc_html($error); ?></p>
            <?php elseif ( isset($success) ) : ?>
                <p style="color: green;"><?php echo esc_html($success); ?></p>
            <?php endif; ?>

            <p>
                <label for="user_login">Username or Email</label><br>
                <input type="text" name="user_login" id="user_login" required>
            </p>
            <p>
                <input type="hidden" name="fp_forgot_password_nonce" value="<?php echo wp_create_nonce('fp_forgot_password_action'); ?>">
                <button type="submit">Send Reset Link</button>
            </p>
        </form>
        <?php

        return ob_get_clean();
    }
}
