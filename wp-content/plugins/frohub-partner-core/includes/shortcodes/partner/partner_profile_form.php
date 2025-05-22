<?php
namespace FPServer;

if (!defined('ABSPATH')) {
    exit;
}

class PartnerProfileForm
{
    public static function init()
    {
        $self = new self();
        add_shortcode('partner_profile_form', [$self, 'partner_profile_form_shortcode']);
    }

    public function partner_profile_form_shortcode()
    {
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

        if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["partnerPostId"])) {
            $submitted = $this->handle_form_submission($partner_post_id, $partner_data, $basicAuth);
            if ($submitted === true) {
                wp_redirect(add_query_arg('updated', 'true', $_SERVER['REQUEST_URI']));
                exit;
            } else {
                echo "<p>Error: Failed to update Partner Profile.</p>";
            }
        }

        // Prepopulate fields
        $title = esc_attr($partner_data['title'] ?? '');
        $bio = esc_textarea($partner_data['bio'] ?? '');
        $address = esc_attr($partner_data['streetAddress'] ?? '');
        $city = esc_attr($partner_data['city'] ?? '');
        $postcode = esc_attr($partner_data['postcode'] ?? '');
        $county = esc_attr($partner_data['countyDistrict'] ?? '');
        $serviceTypes = $partner_data['serviceTypes'] ?? [];
        $availability = $partner_data['availability'] ?? [];
        $profileImageUrl = esc_url($partner_data['featuredImage'] ?? '');
        $bannerImageUrl = esc_url($partner_data['bannerImage'] ?? '');
        $terms = esc_textarea($partner_data['terms'] ?? '');
        $lateFees = esc_textarea($partner_data['lateFees'] ?? '');
        $payments = esc_textarea($partner_data['payments'] ?? '');
        $isAutoMessage = !empty($partner_data['auto_message']);
        $autoMessageContent = esc_textarea($partner_data['auto_message_text'] ?? '');

        ob_start();
        ?>
        <div class="partner-profile-wrapper">
            <h2>My Partner Profile</h2>
            <?php if (isset($_GET['updated']) && $_GET['updated'] === 'true') : ?>
                <p style="color: green;">✅ Partner details updated successfully!</p>
            <?php endif; ?>
            <form method="post" enctype="multipart/form-data">
                <input type="hidden" name="partnerPostId" value="<?php echo esc_attr($partner_post_id); ?>" />

                <div class="form-group">
                    <label class="form-label">Business Name</label>
                    <input type="text" name="title" class="form-input" value="<?php echo $title; ?>" />
                </div>

                <div class="form-group">
                    <label class="form-label">Business Type</label>
                    <p>Select one or more business types to let clients know how they can book with you.</p>
                    <div class="business-type-options">
                        <?php
                        $types = [
                            "Home-based" => ["icon" => "home", "desc" => "Clients come to your home"],
                            "Salon-based" => ["icon" => "store", "desc" => "Clients come to your salon"],
                            "Mobile" => ["icon" => "car", "desc" => "You travel to your clients"]
                        ];
                        foreach ($types as $label => $info):
                            $checked = in_array($label, $serviceTypes) ? 'checked' : '';
                            $selected = in_array($label, $serviceTypes) ? 'selected' : '';
                        ?>
                        <label class="type-option <?php echo $selected; ?>">
                            <input type="checkbox" name="serviceTypes[]" value="<?php echo esc_attr($label); ?>" <?php echo $checked; ?> style="display:none;" />
                            <div class="type-icon"><i class="fas fa-<?php echo $info['icon']; ?>"></i></div>
                            <div class="type-title"><?php echo esc_html($label); ?></div>
                            <div class="type-desc"><?php echo esc_html($info['desc']); ?></div>
                        </label>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Business Address</label>
                    <p>Enter your business address. If you’re mobile or home-based, please enter your home address - it will only be shown to clients after they’ve made a booking. Business addresses are only publicly visible if you select the option to display it.</p>
                    <input type="text" name="addressLine1" class="form-input" value="<?php echo $address; ?>" />
                    <input type="text" name="city" class="form-input" value="<?php echo $city; ?>" />
                    <input type="text" name="postcode" class="form-input" value="<?php echo $postcode; ?>" />
                    <input type="text" name="county" class="form-input" value="<?php echo $county; ?>" />
                </div>

                <div class="form-group">
                    <label class="form-label">Bio</label>
                    <textarea name="bio" class="form-textarea"><?php echo $bio; ?></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Availability</label>
                    <div id="availability-container">
                        <?php foreach ($availability as $slot): ?>
                            <div class="availability-row">
                                <select name="availabilityDay[]">
                                    <?php foreach (["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as $day): ?>
                                        <option value="<?php echo $day; ?>" <?php selected($slot['day'], $day); ?>><?php echo $day; ?></option>
                                    <?php endforeach; ?>
                                </select>
                                <input type="time" name="availabilityStart[]" value="<?php echo esc_attr($slot['from']); ?>">
                                <span>to</span>
                                <input type="time" name="availabilityEnd[]" value="<?php echo esc_attr($slot['to']); ?>">
                                <input type="text" name="extraCharge[]" value="<?php echo esc_attr($slot['extra_charge']); ?>" placeholder="£0">
                                <button type="button" class="add-row">+</button>
                                <button type="button" class="remove-row">−</button>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Terms and Conditions</label>
                    <p>Set clear expectations for your clients with your service terms, payment preferences, and policies. These help protect both you and your clients and create a smoother booking experience.</p>
                    <textarea name="terms" class="form-textarea"><?php echo $terms; ?></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Your Late Fee Policy</label>
                    <p>If you have a late fee policy, please add it here. Be fair and consider that things can come up for both you and your clients. Make sure your policy reflects this and sets clear expectations.</p>
                    <textarea name="lateFees" class="form-textarea"><?php echo $lateFees; ?></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Your Payment Policy</label>
                    <p>Specify how you wish to receive the remainder of the payment after the deposit has been collected. Choose from options such as cash, card, or other payment methods.</p>
                    <textarea name="payments" class="form-textarea"><?php echo $payments; ?></textarea>
                </div>

                <div class="profile-form-footer">
                    <div class="btn-group">
                        <a class="us-btn-style_5 w-btn" href="/"> View Profile </a>
                        <button type="submit" class="save-btn">Save</button>
                    </div>
                </div>
            </form>
        </div>

        <style>
            .partner-profile-wrapper { max-width: 1100px; margin: 0 auto; background: #fff; border-radius: 10px;}
            .form-group { margin-bottom: 24px; }
            .form-label { display: block; font-weight: 600; margin-bottom: 8px; }
            .form-input, .form-textarea { width: 100%; padding: 10px; font-size: 14px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; margin-bottom:1rem; }
            .form-textarea { resize: vertical; height: 120px; }
            .save-btn { padding: 10px 20px; background-color: #000; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
            .text-right { text-align: right; }
            .business-type-options { display: flex; gap: 16px; flex-wrap: wrap; }
            .type-option { flex: 1; min-width: 150px; padding: 16px; border: 2px solid #ccc; border-radius: 8px; text-align: center; cursor: pointer; transition: 0.3s ease; user-select: none; }
            .type-option:hover { border-color: #999; }
            .type-option.selected { border-color: #2196F3; background-color: #E3F2FD; }
            .type-title { font-weight: bold; margin-bottom: 5px; }
            .type-desc { font-size: 12px; color: #666; }
            .type-icon { font-size: 24px; margin-bottom: 8px; }
            .availability-row { display: flex; gap: 10px; margin-bottom: 10px; }
            .availability-row select, .availability-row input[type=\"time\"], .availability-row input[type=\"text\"] {
                padding: 6px;
                border: 1px solid #ccc;
                border-radius: 4px;
            }
            .availability-row span { align-self: center; }
            .add-row, .remove-row {
                padding: 6px 10px;
                border: none;
                border-radius: 4px;
                background: #eee;
                cursor: pointer;
            }
            .add-row:hover { background: #d4f0d4; }
            .remove-row:hover { background: #f8d7da; }

            .profile-form-footer 
            { 
                position: fixed;
                bottom: 0;
                width: 100%;
                left: 0;
                height: 100px;
                padding: 2rem;
                background: #F5F5F5;
                box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;
            }
            .btn-group{
                position: absolute;
                right:10rem;
            }
        </style>

        <script>
        document.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll('.type-option').forEach(function (el) {
                el.addEventListener('click', function () {
                    const checkbox = el.querySelector('input[type=\"checkbox\"]');
                    checkbox.checked = !checkbox.checked;
                    el.classList.toggle('selected', checkbox.checked);
                });
            });

            const container = document.getElementById('availability-container');
            container.addEventListener('click', function (e) {
                if (e.target.classList.contains('add-row')) {
                    const row = e.target.closest('.availability-row');
                    const clone = row.cloneNode(true);
                    clone.querySelectorAll('input').forEach(input => input.value = '');
                    container.insertBefore(clone, row.nextSibling);
                }
                if (e.target.classList.contains('remove-row')) {
                    const row = e.target.closest('.availability-row');
                    if (container.querySelectorAll('.availability-row').length > 1) {
                        row.remove();
                    }
                }
            });
        });

        document.addEventListener('DOMContentLoaded', function () {
                        const checkbox = document.getElementById('auto_message');
                        const messageGroup = document.getElementById('auto_message_text_group');
                        checkbox.addEventListener('change', function () {
                            messageGroup.style.display = this.checked ? 'block' : 'none';
                        });
        });
        </script>
        <?php
        return ob_get_clean();
    }

    private function handle_form_submission($partner_post_id, $partner_data, $basicAuth)
    {
        $profileImageUrl = !empty($_FILES["profileImage"]["name"]) ? $this->upload_image($_FILES["profileImage"]) : esc_url($partner_data['featuredImage'] ?? '');
        $bannerImageUrl = !empty($_FILES["bannerImage"]["name"]) ? $this->upload_image($_FILES["bannerImage"]) : esc_url($partner_data['bannerImage'] ?? '');

        $availability = [];
        if (!empty($_POST["availabilityDay"])) {
            for ($i = 0; $i < count($_POST["availabilityDay"]); $i++) {
                $availability[] = [
                    "day"          => sanitize_text_field($_POST["availabilityDay"][$i]),
                    "from"         => sanitize_text_field($_POST["availabilityStart"][$i]),
                    "to"           => sanitize_text_field($_POST["availabilityEnd"][$i]),
                    "extra_charge" => sanitize_text_field($_POST["extraCharge"][$i])
                ];
            }
        }

        $payload = [
            "partnerPostId" => $partner_post_id,
            "title"         => sanitize_text_field($_POST["title"]),
            "bio"           => sanitize_textarea_field($_POST["bio"]),
            "addressLine1"  => sanitize_text_field($_POST["addressLine1"]),
            "city"          => sanitize_text_field($_POST["city"]),
            "postcode"      => sanitize_text_field($_POST["postcode"]),
            "county"        => sanitize_text_field($_POST["county"]),
            "serviceTypes"  => isset($_POST["serviceTypes"]) ? array_map('sanitize_text_field', $_POST["serviceTypes"]) : [],
            "availability"  => $availability,
            "terms"         => sanitize_textarea_field($_POST['terms'] ?? ''),
            "lateFees"      => sanitize_textarea_field($_POST['lateFees'] ?? ''),
            "payments"      => sanitize_textarea_field($_POST['payments'] ?? ''),
            "profileImage"  => $profileImageUrl,
            "bannerImage"   => $bannerImageUrl,
            "email" => sanitize_email($_POST["email"]),
            "phone" => sanitize_text_field($_POST["phone"]),
        ];

        $ecommerce_api_url = "https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/update-partner";

        $response = wp_remote_post($ecommerce_api_url, [
            'body'    => json_encode($payload),
            'headers' => ['Content-Type' => 'application/json', 'authorization' => $basicAuth],
            'method'  => 'POST',
            'timeout' => 30
        ]);

        return !is_wp_error($response);
    }

    private function upload_image($file)
    {
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        if (empty($file['name']) || $file['error'] !== 0) return false;

        $upload = wp_handle_upload($file, ['test_form' => false]);
        if (!$upload || isset($upload['error'])) return false;

        $file_path = $upload['file'];
        $attachment = [
            'guid'           => $upload['url'],
            'post_mime_type' => $upload['type'],
            'post_title'     => preg_replace('/\\.[^.]+$/', '', basename($file_path)),
            'post_content'   => '',
            'post_status'    => 'inherit'
        ];
        $attach_id = wp_insert_attachment($attachment, $file_path);

        if (!is_wp_error($attach_id)) {
            $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
            wp_update_attachment_metadata($attach_id, $attach_data);
            return wp_get_attachment_url($attach_id);
        }

        return false;
    }
}
