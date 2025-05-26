<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class ForgotPasswordForm {

    public static function init() {
        $self = new self();

        // Register shortcode
        add_shortcode( 'forget_password', array( $self, 'render_forgot_password_form' ) );
    }

    public function render_forgot_password_form() {
        ob_start();

        $nonce = wp_create_nonce('fpserver_nonce');
        $ajax_url = admin_url('admin-ajax.php');
        ?>
        <form class="fp-forgot-password-form" method="post" onsubmit="return false;">
            <div class="fp-message" style="margin-bottom: 1em; margin-top:1rem;"></div>
            <p>
                <label for="user_login">Email</label><br>
                <input type="text" name="user_login" id="user_login" required>
            </p>
            <p>
                <input type="hidden" name="fp_nonce" value="<?php echo esc_attr($nonce); ?>">
                <button type="submit">Send Reset Link</button>
            </p>
        </form>

        <script>
        jQuery(document).ready(function ($) {
            const form = $('.fp-forgot-password-form');
            const messageBox = form.find('.fp-message');

            form.on('submit', function (e) {
                e.preventDefault();

                messageBox.text('').css('color', '');

                const user_login = form.find('[name="user_login"]').val();
                const nonce = form.find('[name="fp_nonce"]').val();

                $.post('<?php echo esc_url($ajax_url); ?>', {
                    action: 'fpserver/forgot_password',
                    _ajax_nonce: nonce,
                    user_login: user_login
                }, function (response) {
                    if (response.success) {
                        messageBox.css('color', 'green').text(response.data.message);
                        form[0].reset();
                    } else {
                        messageBox.css('color', 'red').text(response.data.message);
                    }
                }).fail(function () {
                    messageBox.css('color', 'red').text('Something went wrong. Please try again.');
                });
            });
        });
        </script>
        <?php

        return ob_get_clean();
    }
}
