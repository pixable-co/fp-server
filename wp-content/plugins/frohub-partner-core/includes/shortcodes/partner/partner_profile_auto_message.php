<?php
namespace FPServer;

if (!defined('ABSPATH')) {
    exit;
}

class PartnerProfileAutoMessage {

    public static function init() {
        $self = new self();
        add_shortcode('partner_profile_auto_message', [$self, 'partner_profile_auto_message_shortcode']);
    }

    public function partner_profile_auto_message_shortcode() {
        if (!is_user_logged_in()) {
            wp_redirect(home_url('/partner-login'));
            exit;
        }

        $user_id = get_current_user_id();
        $partner_post_id = get_field('partner_post_id', 'user_' . $user_id);

        if (!$partner_post_id) {
            return "<p>Error: No Partner Post ID found for this user.</p>";
        }

        $basicAuth = get_field('frohub_ecommerce_basic_authentication', 'option');
        $api_url = "https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/get-partner-data";

        $response = wp_remote_post($api_url, [
            'headers' => [
                'Authorization' => $basicAuth,
                'Content-Type'  => 'application/json'
            ],
            'body' => json_encode(["partner_post_id" => $partner_post_id]),
            'timeout' => 30
        ]);

        if (is_wp_error($response)) {
            return "<p>Error: Unable to fetch partner data.</p>";
        }

        $partner_data = json_decode(wp_remote_retrieve_body($response), true);
        if (!$partner_data || !isset($partner_data['id'])) {
            return "<p>Error: Invalid partner data received.</p>";
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['auto_message_form_submit'])) {
            $auto_message = isset($_POST['auto_message']) ? true : false;
            $auto_message_text = sanitize_textarea_field($_POST['auto_message_text'] ?? '');

            $payload = [
                'partnerPostId' => $partner_post_id,
                'auto_message' => $auto_message,
                'auto_message_text' => $auto_message_text,
            ];

            $update_api_url = "https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/update-partner";

            $submit_response = wp_remote_post($update_api_url, [
                'body'    => json_encode($payload),
                'headers' => ['Content-Type' => 'application/json', 'authorization' => $basicAuth],
                'method'  => 'POST',
                'timeout' => 30
            ]);

            if (!is_wp_error($submit_response)) {
                echo "<p style='color: green;'>✅ Auto message updated successfully!</p>";
            } else {
                echo "<p style='color: red;'>❌ Failed to update auto message.</p>";
            }
        }

        $isAutoMessage = !empty($partner_data['auto_message']);
        $autoMessageContent = esc_textarea($partner_data['auto_message_text'] ?? '');

        ob_start();
        ?>
        <form method="post">
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" name="auto_message" id="auto_message" <?php echo $isAutoMessage ? 'checked' : ''; ?>>
                    Enable Auto Message
                </label>
            </div>

            <div class="form-group" id="auto_message_text_group" style="display: <?php echo $isAutoMessage ? 'block' : 'none'; ?>;">
                <label class="form-label">Auto Message Content</label>
                <textarea name="auto_message_text" class="form-textarea"><?php echo $autoMessageContent; ?></textarea>
            </div>

            <button type="submit" name="auto_message_form_submit" class="save-btn">Save Auto Message</button>
        </form>

        <script>
        document.addEventListener('DOMContentLoaded', function () {
            const checkbox = document.getElementById('auto_message');
            const messageGroup = document.getElementById('auto_message_text_group');
            checkbox.addEventListener('change', function () {
                messageGroup.style.display = this.checked ? 'block' : 'none';
            });
        });
        </script>

        <style>
            .form-group { margin-bottom: 20px; }
            .form-label { font-weight: bold; display: block; margin-bottom: 5px; }
            .form-textarea { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
            .save-btn { padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 5px; }
        </style>
        <?php
        return ob_get_clean();
    }
}
