<?php
namespace FECore;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class ForgotPassword {

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
            <div class="fp-message" style="margin-bottom: 1em;"></div>
            <p>
                <label for="user_login">Username or Email</label><br>
                <input type="text" name="user_login" id="user_login" required>
            </p>
            <p>
                <input type="hidden" name="fp_nonce" value="<?php echo esc_attr($nonce); ?>">
                <button type="submit">Send Reset Link</button>
            </p>
        </form>

        <script>
        document.addEventListener('DOMContentLoaded', function () {
            const form = document.querySelector('.fp-forgot-password-form');
            if (!form) return;

            form.addEventListener('submit', function (e) {
                e.preventDefault();

                const messageBox = form.querySelector('.fp-message');
                messageBox.textContent = '';
                messageBox.style.color = '';
                const formData = new FormData(form);

                formData.append('action', 'fpserver/forgot_password');
                formData.append('_ajax_nonce', formData.get('fp_nonce'));

                fetch('<?php echo esc_url($ajax_url); ?>', {
                    method: 'POST',
                    body: new URLSearchParams(formData)
                })
                .then(res => {
                    if (!res.ok) throw new Error('Request failed with status ' + res.status);
                    return res.json();
                })
                .then(response => {
                    if (response.success) {
                        messageBox.style.color = 'green';
                        messageBox.textContent = response.data.message;
                        form.reset();
                    } else {
                        messageBox.style.color = 'red';
                        messageBox.textContent = response.data.message;
                    }
                })
                .catch(err => {
                    console.error(err);
                    messageBox.style.color = 'red';
                    messageBox.textContent = 'Something went wrong. Please try again.';
                });
            });
        });
        </script>
        <?php

        return ob_get_clean();
    }
}
