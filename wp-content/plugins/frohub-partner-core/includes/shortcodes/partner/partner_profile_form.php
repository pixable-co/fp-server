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
        $api_url = FPSERVER_ECOM_BASE_API_URL . "/wp-json/frohub/v1/get-partner-data";

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
        $bookingNotice = esc_attr($partner_data['bookingNotice'] ?? 0);
        $bookingScope = esc_attr($partner_data['bookingScope'] ?? 0);
        $bufferPeriodMin = esc_attr($partner_data['bufferPeriodMin'] ?? 0);
        $bufferPeriodHour = esc_attr($partner_data['bufferPeriodHour'] ?? 0);


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
                    <label class="form-label" placeholder="The name of your business">Business Name</label>
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
                    <input type="text" name="addressLine1" class="form-input" value="<?php echo $address; ?>" placeholder="Street Address" />
                    <input type="text" name="city" class="form-input" value="<?php echo $city; ?>" placeholder="City" />
                    <input type="text" name="postcode" class="form-input" value="<?php echo $postcode; ?>" placeholder="Postcode" />
                    <input type="text" name="county" class="form-input" value="<?php echo $county; ?>" placeholder="County"/>
                </div>

                <div class="form-group">
                    <label class="form-label">Bio</label>
                    <textarea name="bio" class="form-textarea" placeholder="Tell us a bit about yourself."><?php echo $bio; ?></textarea>
                </div>


                <!-- Profile Image Upload -->
                <div class="image-upload">
                <label for="profile-image">Profile Picture:</label>
                <div class="image-upload-container profile-upload-container" onclick="document.getElementById('profileImageInput').click();">
                    <img id="profilePreview" src="<?php echo esc_url($partner_data['featuredImage'] ?? 'https://via.placeholder.com/120'); ?>" alt="Edit">
                    <div class="image-edit-overlay"><i class="fas fa-edit"></i></div>
                </div>
                <input type="file" id="profileImageInput" name="profileImage" accept="image/*" onchange="previewImage(event, 'profilePreview')">
                </div>

                <!-- Banner Image Upload -->
                <div class="image-upload">
                <label for="banner-image">Cover Image:</label>
                <div class="image-upload-container banner-upload-container" onclick="document.getElementById('bannerImageInput').click();">
                    <img id="bannerPreview" src="<?php echo esc_url($partner_data['bannerImage'] ?? 'https://via.placeholder.com/1200x250'); ?>" alt="Edit">
                    <div class="image-edit-overlay"><i class="fas fa-edit"></i></div>
                </div>
                <input type="file" id="bannerImageInput" name="bannerImage" accept="image/*" onchange="previewImage(event, 'bannerPreview')">
                    </div>


                <div class="form-group" id="availability">
                    <label class="form-label">Availability</label>
                    <p>
                        Set your working hours—either weekly or for specific dates—add premium charges for out-of-hours appointments,
                        define your booking notice period and advance scheduling. You can also add time for breaks between appointments.
                    </p>

                    <!-- Header -->
                    <div class="availability-header">
                        <div>Day</div>
                        <div>Start</div>
                        <div></div> <!-- to -->
                        <div>End</div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            Premium Time Fee (optional)
                            <span class="tooltip-container">
                                <i class="fas fa-info-circle tooltip-icon"></i>
                                <span class="tooltip">Optional fee for premium or out-of-hours appointments. Leave blank if not needed.</span>
                            </span>
                        </div>
                        <div></div> <!-- + -->
                        <div></div> <!-- − -->
                    </div>

                    <!-- Rows -->
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
                                <button type="button" class="add-row availability-add">+</button>
                                <button type="button" class="remove-row availability-remove">−</button>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <!-- 🔵 DATE-SPECIFIC AVAILABILITY SECTION -->
                <div class="form-group mt-5 pt-4">
                    <label class="form-label">Date-specific hours</label>
                    <div class="availability-header">
                                            <div>Day</div>
                                            <div>Start</div>
                                            <div></div> <!-- to -->
                                            <div>End</div>
                                            <div style="display: flex; align-items: center; gap: 4px;">
                                                Premium Time Fee (optional)
                                                <span class="tooltip-container">
                                                    <i class="fas fa-info-circle tooltip-icon"></i>
                                                    <span class="tooltip">Optional fee for premium or out-of-hours appointments. Leave blank if not needed.</span>
                                                </span>
                                            </div>
                                            <div></div> <!-- + -->
                                            <div></div> <!-- − -->
                                        </div>

                    <div id="date-specific-container">
                        <div class="availability-row">
                            <input type="date" name="specificDate[]">
                            <input type="time" name="specificStart[]">
                            <span>to</span>
                            <input type="time" name="specificEnd[]">
                            <input type="text" name="specificExtraCharge[]" placeholder="£0">
                            <button type="button" class="add-row date-add">+</button>
                            <button type="button" class="remove-row date-remove">−</button>
                        </div>
                    </div>
                </div>


                <div class="form-group">
                    <label class="form-label">Notice Period</label>

                    <div class="notice-fields">
                        <div class="notice-item">
                            <div>
                                <label>How much notice do you need before a client can book an appointment?</label>
                                <span class="tooltip-container">
                                <i class="fas fa-info-circle tooltip-icon"></i>
                                <span class="tooltip">dd a break between appointments — for mobile travel, clean-up, or a quick breather.</span></span>
                            </div>
                            <div class="inline-input-suffix">
                                <input type="number" name="bookingNotice" class="form-input" value="<?php echo esc_attr($bookingNotice); ?>" />
                                <span class="suffix-label">Day(s)</span>
                            </div>
                        </div>

                        <div class="notice-item">
                            <label>How far into the future can clients book an appointment with you?</label>
                            <div class="inline-input-suffix">
                                <input type="number" name="bookingScope" class="form-input" value="<?php echo esc_attr($bookingScope); ?>" />
                                <span class="suffix-label">Day(s)</span>
                             </div>
                        </div>

                        <div class="notice-item">
                            <label>How much time do you need between bookings?</label>
                            <div>
                                <div class="inline-input-suffix">
                                    <input type="number" name="bufferPeriodMin" class="form-input" value="<?php echo esc_attr($bufferPeriodMin); ?>" />
                                    <span class="suffix-label">Minute(s)</span>
                                </div>
                                <div class="inline-input-suffix">
                                    <input type="number" name="bufferPeriodHour" class="form-input" value="<?php echo esc_attr($bufferPeriodHour); ?>" />
                                    <span class="suffix-label">Hour(s)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-group" id="terms-conditions">
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

                <div class="form-group auto-reply-group">
                    <div class="auto-reply-header">
                        <div class="auto-reply-title">
                            <i class="fas fa-umbrella-beach"></i>
                            <label class="form-label reply-label">Auto Reply Message</label>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="auto_message" name="auto_message" <?php echo !empty($partner_data['auto_message']) ? 'checked' : ''; ?>>
                            <span class="slider round"></span>
                        </label>
                    </div>

                    <p class="auto-reply-description">
                        You may be busy with another appointment or away on holiday. Let your clients know.
                    </p>

                    <div class="form-group" id="auto_message_text_group">
                        <label class="form-label">Message</label>
                        <?php
                        $auto_message_text = $partner_data['auto_message_text'] ?? '';
                        $auto_message_enabled = !empty($partner_data['auto_message']);
                        wp_editor(
                            $auto_message_text,
                            'auto_message_text',
                            [
                                'textarea_name' => 'auto_message_text',
                                'textarea_rows' => 8,
                                'teeny'         => true,
                                'media_buttons' => false,
                                'quicktags'     => false,
                                'editor_class'  => 'auto-reply-editor' . ($auto_message_enabled ? '' : ' is-disabled'),
                            ]
                        );
                        ?>

                    </div>
                </div>

                <div class="deposit-policy-box">
                    <div class="deposit-policy-header"><span>Deposit Refund Policy</span><i class="fas fa-times close-icon"></i></div>
                        <div class="deposit-policy-content">
                            <p>At FroHub, we have a deposit refund policy in place to protect both our stylists and clients, ensuring a fair experience for everyone.</p>
                            <p><b>Cancellations up to 7 Days Before Appointment:</b> If a client cancels their booking at least 7 days before the scheduled appointment, they will receive a full refund of their deposit. However, the booking fee is non-refundable.</p>
                            <p><b>Cancellations Within 7 Days:</b> If a client cancels their booking within 7 days of the scheduled appointment, or if the booking was made less than 7 days in advance, the client is not eligible for a refund of either the deposit or the booking fee.</p>
                            <p><b>If the Stylist Cancels:</b> If the stylist cancels the appointment for any reason, the client will be refunded all payments made, including both the deposit and the booking fee.</p>
                            <p><b>Why the 7-Day Notice?</b><br />The 7-day cancellation policy allows our stylists to fill their time slot with another client, reducing the financial impact of last-minute cancellations. We ask that clients keep this in mind when making bookings, as it helps stylists manage their schedules and maintain availability for all clients.</p>
                            </div>
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

            textarea:disabled {
                background-color: #f5f5f5;
                color: #999;
                cursor: not-allowed;
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
            const editorId = 'auto_message_text'; // TinyMCE ID
            const wrapper = document.querySelector('.auto-reply-editor');

            // Function to disable editor UI
            function setEditorDisabledState(disabled) {
                if (!wrapper) return;

                wrapper.classList.toggle('is-disabled', disabled);

                if (typeof tinymce !== 'undefined') {
                    const editor = tinymce.get(editorId);
                    if (editor) {
                        editor.setMode(disabled ? 'readonly' : 'design');
                    }
                }
            }

            // Handle toggle interaction
            if (checkbox) {
                checkbox.addEventListener('change', function () {
                    setEditorDisabledState(!this.checked);
                });
            }

            // Wait for TinyMCE to fully load
            function waitForEditorReady(callback) {
                const interval = setInterval(() => {
                    if (typeof tinymce !== 'undefined') {
                        const editor = tinymce.get(editorId);
                        if (editor && editor.initialized) {
                            clearInterval(interval);
                            callback(editor);
                        }
                    }
                }, 100);
            }

            waitForEditorReady(() => {
                setEditorDisabledState(!checkbox.checked);
            });
        });

        document.addEventListener("DOMContentLoaded", function () {
            document.getElementById("date-specific-container").addEventListener("click", function (e) {
                if (e.target.classList.contains("date-add")) {
                     const row = e.target.closest(".availability-row");
                     const clone = row.cloneNode(true);
                     clone.querySelectorAll("input").forEach(el => {
                         if (el.type !== 'button') el.value = '';
                    });
                        this.appendChild(clone);
                }

                if (e.target.classList.contains("date-remove")) {
                    const rows = this.querySelectorAll(".availability-row");
                        if (rows.length > 1) {
                            e.target.closest(".availability-row").remove();
                        }
                    }
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
            "bookingNotice" => intval($_POST["bookingNotice"]),
            "bookingScope"  => intval($_POST["bookingScope"]),
            "bufferPeriodMin"  => intval($_POST["bufferPeriodMin"]),
            "bufferPeriodHour"  => intval($_POST["bufferPeriodHour"]),
            "auto_message" => isset($_POST["auto_message"]),
            "auto_message_text" => sanitize_textarea_field($_POST["auto_message_text"] ?? ''),
        ];

        $ecommerce_api_url = FPSERVER_ECOM_BASE_API_URL . "/wp-json/frohub/v1/update-partner";

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
