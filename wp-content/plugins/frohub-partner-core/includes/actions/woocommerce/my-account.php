<?php
namespace FPServer;

if (!defined('ABSPATH')) {
    exit;
}

class MyAccount {

    public static function init() {
        $self = new self();

        add_action('init', [$self, 'register_deactivated_role']);
        add_action('wp_login', [$self, 'block_deactivated_login'], 10, 2);

        remove_action('woocommerce_account_navigation', 'woocommerce_account_navigation');
        remove_action('woocommerce_account_edit-account_endpoint', 'woocommerce_account_edit_account', 10);

        add_action('woocommerce_account_content', [$self, 'inject_custom_tab_nav'], 5);
        add_action('woocommerce_account_edit-account_endpoint', [$self, 'render_reset_password_section']);

        add_filter('woocommerce_account_menu_items', [$self, 'rename_edit_account_tab'], 99);

        add_action('wp_footer', [$self, 'inject_custom_js']);
        add_action('wp_head', [$self, 'inject_custom_styles']);

        add_action('wp_ajax_fp_deactivate_account', [$self, 'handle_deactivation']);
    }

    public function register_deactivated_role() {
        if (!get_role('deactivated_user')) {
            add_role('deactivated_user', 'Deactivated User', []);
        }
    }

    public function block_deactivated_login($user_login, $user) {
        if (in_array('deactivated_user', (array) $user->roles)) {
            wp_logout();
            wp_die('Your account has been deactivated.', 'Account Disabled');
        }
    }

    public function rename_edit_account_tab($items) {
        if (isset($items['edit-account'])) {
            $items['edit-account'] = 'Login & Security';
        }
        return $items;
    }

    public function inject_custom_tab_nav() {
        $tabs = [
            'dashboard'        => 'Personal Info',
            'subscriptions'    => 'My Subscription',
            'payment-methods'  => 'Payment Methods',
            'edit-account'     => 'Login & Security',
        ];

        echo '<div class="fp-tab-wrapper">';
        foreach ($tabs as $endpoint => $label) {
            $url = wc_get_account_endpoint_url($endpoint);
            $is_active = is_wc_endpoint_url($endpoint) ? 'active' : '';
            echo '<a class="fp-tab ' . esc_attr($is_active) . '" href="' . esc_url($url) . '">' . esc_html($label) . '</a>';
        }
        echo '</div>';
    }

    public function render_reset_password_section() {
        echo '<div class="fp-security-wrapper">';
        echo '<h3 class="fp-title">Reset Password</h3>';

        echo '<form class="woocommerce-EditAccountForm edit-account" method="post">';
        do_action('woocommerce_edit_account_form_start');

        woocommerce_form_field('password_current', [
            'type'        => 'password',
            'label'       => 'Your current Password',
            'required'    => true,
            'input_class' => ['fp-input'],
        ], '');

        echo '<div class="fp-row">';
        woocommerce_form_field('password_1', [
            'type'        => 'password',
            'label'       => 'New Password',
            'required'    => true,
            'input_class' => ['fp-input'],
        ], '');

        woocommerce_form_field('password_2', [
            'type'        => 'password',
            'label'       => 'Re-enter New Password',
            'required'    => true,
            'input_class' => ['fp-input'],
        ], '');
        echo '</div>';

        wp_nonce_field('save_account_details', 'save-account-details-nonce');

        echo '<p><button type="submit" class="fp-save-btn" name="save_account_details" value="Save">Reset Password</button></p>';
        do_action('woocommerce_edit_account_form_end');
        echo '</form>';

        echo '<hr class="fp-divider">';

        echo '<div class="fp-deactivate-section">';
        echo '<a href="#" onclick="deactivateAccount(); return false;" class="fp-deactivate-button">';
        echo '<span class="fp-trash">&#128465;</span> Deactivate Account</a>';
        echo '</div>';

        // Inject the custom modal with Gravity Form
        echo '<div id="custom-deactivation-modal" class="custom-modal" style="display:none;">
            <div class="custom-modal-content">
                <span class="custom-modal-close" onclick="document.getElementById(\'custom-deactivation-modal\').style.display=\'none\'">&times;</span>
                ' . do_shortcode('[gravityform id="16" title="true"]') . '
            </div>
        </div>';

        echo '</div>';
    }

    public function inject_custom_js() {
        if (!is_account_page() || !is_wc_endpoint_url('edit-account')) return;
        ?>
        <script>
            function deactivateAccount() {
                const modal = document.getElementById('custom-deactivation-modal');
                if (modal) {
                    modal.style.display = 'block';
                }
            }

            // Listen for Gravity Form submission
            document.addEventListener('gform_confirmation_loaded', function(event) {
                const formId = 16;
                if (event.detail.formId === formId) {
                    // Hide the modal
                    document.getElementById('custom-deactivation-modal').style.display = 'none';

                    // Call the deactivation AJAX
                    var xhr = new XMLHttpRequest();
                    xhr.open("POST", "<?php echo esc_url(admin_url('admin-ajax.php')); ?>", true);
                    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                    xhr.onload = function () {
                        if (xhr.status === 200) {
                            var response = JSON.parse(xhr.responseText);
                            if (response.success) {
                                alert("Deactivated: " + response.data.message);
                                location.reload();
                            } else {
                                alert("Oops: " + response.data.message);
                            }
                        } else {
                            alert("Server error.");
                        }
                    };
                    xhr.send("action=fp_deactivate_account");
                }
            });
        </script>
        <?php
    }

    public function inject_custom_styles() {
        if (!is_account_page()) return;
        ?>
        <style>
            .fp-tab-wrapper {
                display: flex; justify-content: flex-start; gap: 30px;
                border-bottom: 1px solid #ddd; padding-bottom: 15px; margin-bottom: 40px;
            }
            .fp-tab { text-decoration: none; color: #333; font-weight: 500; padding: 6px 12px; border-bottom: 2px solid transparent; }
            .fp-tab.active { border-bottom: 2px solid #000; font-weight: 600; }
            .fp-security-wrapper { max-width: 640px; margin: 0 auto; padding: 10px; }
            .fp-title { font-size: 20px; font-weight: 600; margin-bottom: 20px; }
            .fp-row { display: flex; gap: 20px; flex-wrap: wrap; }
            .fp-input { width: 100% !important; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 20px; box-sizing: border-box; }
            .fp-save-btn { background: #999; color: #fff; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            .fp-save-btn:hover { background: #666; }
            .fp-divider { margin: 50px 0 20px; border-top: 1px solid #ccc; }
            .fp-deactivate-section { text-align: left; }
            .fp-deactivate-button { color: #000; text-decoration: none; font-weight: 500; font-size: 15px; display: inline-flex; align-items: center; }
            .fp-deactivate-button:hover { text-decoration: underline; }
            .fp-trash { font-size: 16px; margin-right: 8px; }
            .custom-modal { display: none; position: fixed; z-index: 9999; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); }
            .custom-modal-content { background-color: #fff; margin: 10% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 600px; }
            .custom-modal-close { float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
        </style>
        <?php
    }

    public function handle_deactivation() {
        if (!is_user_logged_in()) {
            wp_send_json_error(['message' => 'You must be logged in.'], 401);
        }

        $user_id = get_current_user_id();
        $user = get_userdata($user_id);

        if (!$user) {
            wp_send_json_error(['message' => 'User not found.'], 404);
        }

        if (!get_role('deactivated_user')) {
            add_role('deactivated_user', 'Deactivated User', []);
        }

        $user->set_role('deactivated_user');
        wp_send_json_success(['message' => 'Your account has been deactivated.']);
    }
}
