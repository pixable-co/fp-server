<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class PartnerConversations {

    public static function init() {
        $self = new self();

        // AJAX for logged-in users
        add_action('wp_ajax_fpserver/partner_conversations', array($self, 'partner_conversations'));
        add_action('wp_ajax_fpserver/get_conversation_comments', array($self, 'get_conversation_comments'));
        add_action('wp_ajax_fpserver/send_partner_message', array($self, 'send_partner_message'));

        // AJAX for non-logged-in users
        add_action('wp_ajax_nopriv_fpserver/partner_conversations', array($self, 'partner_conversations'));
        add_action('wp_ajax_nopriv_fpserver/get_conversation_comments', array($self, 'get_conversation_comments'));
        add_action('wp_ajax_nopriv_fpserver/send_partner_message', array($self, 'send_partner_message'));
    }

    public function partner_conversations() {
        try {
            // Enable error logging for debugging
            error_log('partner_conversations() called');

            check_ajax_referer('fpserver_nonce');

            // Get current user and partner ID
            if (!is_user_logged_in()) {
                error_log('User not logged in');
                wp_send_json_error(['message' => 'User not logged in.']);
                return;
            }

            $current_user_id = get_current_user_id();
            error_log('Current user ID: ' . $current_user_id);

            $partner_id = get_field('partner_post_id', 'user_' . $current_user_id);
            error_log('Partner ID: ' . ($partner_id ?: 'not found'));

            if (!$partner_id) {
                wp_send_json_error(['message' => 'Partner ID not found for current user.']);
                return;
            }

            // Query for client posts associated with this partner
            $args = array(
                'post_type'      => 'client',
                'posts_per_page' => -1,
                'meta_query'     => array(
                    array(
                        'key'     => 'partner_id',
                        'value'   => $partner_id,
                        'compare' => '='
                    )
                ),
                'post_status' => 'publish'
            );

            $query = new \WP_Query($args);
            error_log('Query found posts: ' . $query->found_posts);

            $conversations = [];

            if ($query->have_posts()) {
                while ($query->have_posts()) {
                    $query->the_post();
                    $client_id = get_the_ID();

                    // Get client details - check if ACF functions exist
                    $firstName = function_exists('get_field') ? get_field('first_name', $client_id) : '';
                    $lastName = function_exists('get_field') ? get_field('last_name', $client_id) : '';
                    $fullName = trim($firstName . ' ' . $lastName);

                    // Get conversation metadata
                    $ecomm_conversation_id = function_exists('get_field') ? get_field('ecommerce_conversation_post_id', $client_id) : '';
                    $read_by_partner = function_exists('get_field') ? get_field('read_by_partner', $client_id) : false;

                    // Get last activity/message - add error handling
                    $last_activity = get_the_modified_date('c', $client_id);
                    if (!$last_activity) {
                        $last_activity = get_the_date('c', $client_id);
                    }

                    $conversations[] = [
                        'client_id' => (int)$client_id,
                        'customer_name' => $fullName ?: 'Client #' . $client_id,
                        'ecommerce_conversation_post_id' => $ecomm_conversation_id,
                        'read_by_partner' => (bool)$read_by_partner,
                        'last_activity' => $last_activity ?: date('c'), // Fallback to current date
                        'permalink' => get_permalink($client_id) ?: '',
                        'status' => 'Active',
                        'last_message' => '',
                    ];
                }
                wp_reset_postdata();
            }

            // Sort conversations by last activity (most recent first)
            if (!empty($conversations)) {
                usort($conversations, function($a, $b) {
                    $timeA = strtotime($a['last_activity']);
                    $timeB = strtotime($b['last_activity']);
                    return $timeB - $timeA;
                });
            }

            error_log('Returning ' . count($conversations) . ' conversations');
            wp_send_json_success($conversations);

        } catch (Exception $e) {
            error_log('Error in partner_conversations: ' . $e->getMessage());
            wp_send_json_error(['message' => 'An error occurred while fetching conversations.']);
        } catch (Error $e) {
            error_log('Fatal error in partner_conversations: ' . $e->getMessage());
            wp_send_json_error(['message' => 'A fatal error occurred.']);
        }
    }

    public function get_conversation_comments() {
        try {
            check_ajax_referer('fpserver_nonce');

            if (!is_user_logged_in()) {
                error_log('User not logged in for comments');
                wp_send_json_error(['message' => 'User not logged in.']);
                return;
            }

            $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
            if (!$post_id) {
                wp_send_json_error(['message' => 'Post ID is required.']);
                return;
            }

            $basicAuth = get_field('frohub_ecommerce_basic_authentication', 'option');
            $ecomm_conversation_Post_ID = get_field('ecommerce_conversation_post_id', $post_id);
            if (!$ecomm_conversation_Post_ID) {
                wp_send_json_error(['message' => 'Conversation ID not found for this post.']);
                return;
            }
            if (!$basicAuth) {
                error_log('Basic Auth not configured');
                wp_send_json_error(['message' => 'Authentication not configured.']);
                return;
            }

            $response = wp_remote_post('https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/get-conversation-comments', [
                'body' => json_encode(['conversation_post_id' => $ecomm_conversation_Post_ID]),
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => $basicAuth
                ],
                'timeout' => 30
            ]);

            error_log('API Response: ' . print_r($response['body'], true));

            if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
                $error_message = is_wp_error($response) ? $response->get_error_message() : 'HTTP ' . wp_remote_retrieve_response_code($response);
                error_log('API call failed: ' . $error_message);
                wp_send_json_error(['message' => 'Failed to fetch comments from API: ' . $error_message]);
                return;
            }

            $body = wp_remote_retrieve_body($response);
            $decoded = json_decode($body, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log('JSON decode error: ' . json_last_error_msg());
                wp_send_json_error(['message' => 'Invalid response from API.']);
                return;
            }

            // Extract fields
            $profile_picture = $decoded['profile_picture'] ?? '';
            $partner_profile_picture = $decoded['partner_profile_picture'] ?? '';
            $comments_data = $decoded['comments'] ?? [];

            // Get user partner id from either $decoded['user_partner_id'] or WordPress user meta
            $currentUserId = get_current_user_id();
            $userPartnerPostId = get_field('partner_post_id', 'user_' . $currentUserId);
            if (empty($userPartnerPostId)) {
                $userPartnerPostId = $decoded['user_partner_id'] ?? null;
            }

            // Allowed HTML tags for comment content
            $allowed_tags = [
                'p' => [], 'br' => [], 'strong' => [], 'em' => [], 'ul' => [], 'ol' => [], 'li' => [],
                'a' => ['href' => [], 'title' => []], 'img' => ['src' => [], 'alt' => [], 'width' => [], 'height' => []],
                'h1' => [], 'h2' => [], 'h3' => [], 'h4' => [], 'h5' => [], 'h6' => [],
                'blockquote' => [], 'code' => [], 'pre' => []
            ];

            // Process comments
            $allComments = array_map(function ($comment) use ($allowed_tags) {
                return [
                    'comment_id' => $comment['comment_id'] ?? '',
                    'author'     => $comment['author'] ?? '',
                    'content'    => wp_kses($comment['content'] ?? '', $allowed_tags),
                    'date'       => $comment['date'] ?? '',
                    'meta_data'  => $comment['meta_data'] ?? [],
                    'partner_id' => isset($comment['meta_data']['partner'][0]) ? $comment['meta_data']['partner'][0] : null
                ];
            }, $comments_data);

            // Sort comments by date
            usort($allComments, function ($a, $b) {
                return strtotime($a['date']) <=> strtotime($b['date']);
            });

            // Mark conversation as read by partner
            if (function_exists('update_field')) {
                update_field('read_by_partner', 1, $post_id);
            }

            wp_send_json_success([
                'profile_picture' => $profile_picture,
                'partner_profile_picture' => $partner_profile_picture,
                'comments' => $allComments,
                'user_partner_id' => $userPartnerPostId
            ]);

        } catch (Exception $e) {
            wp_send_json_error(['message' => 'An error occurred while fetching comments.']);
        } catch (Error $e) {
            wp_send_json_error(['message' => 'A fatal error occurred.']);
        }
    }

    public function send_partner_message() {
        try {
            error_log('send_partner_message() called');

            check_ajax_referer('fpserver_nonce');

            if (!is_user_logged_in()) {
                error_log('User not logged in for sending message');
                wp_send_json_error(['message' => 'User not logged in.']);
                return;
            }

            // Retrieve and sanitize input values
            $client_id = isset($_POST['client_id']) ? intval($_POST['client_id']) : 0;
            $content = isset($_POST['content']) ? sanitize_text_field($_POST['content']) : '';

            if (!$client_id || empty($content)) {
                wp_send_json_error(['message' => 'Client ID and content are required.']);
                return;
            }

            $basicAuth = get_field('frohub_ecommerce_basic_authentication', 'option');
            $current_user_id = get_current_user_id();
            $partner_id = get_field('partner_post_id', 'user_' . $current_user_id);

            if (!$basicAuth || !$partner_id) {
                wp_send_json_error(['message' => 'Missing authentication or partner data.']);
                return;
            }

            // Fetch partner data from API
            $get_partner_url = 'https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/get-partner-data';
            $get_partner_response = wp_remote_post($get_partner_url, [
                'body'    => json_encode(['partner_post_id' => $partner_id]),
                'headers' => [
                    'Content-Type'  => 'application/json',
                    'Authorization' => $basicAuth
                ],
                'timeout' => 15,
            ]);

            if (is_wp_error($get_partner_response)) {
                wp_send_json_error(['message' => 'Error retrieving partner data.']);
                return;
            }

            $partner_data = json_decode(wp_remote_retrieve_body($get_partner_response), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log('JSON decode error in partner data: ' . json_last_error_msg());
                wp_send_json_error(['message' => 'Invalid partner data response.']);
                return;
            }

            $partner_title = $partner_data['title'] ?? 'N/A';
            $partner_email = $partner_data['email'] ?? 'N/A';

            // Prepare message body
            $body = [
                'conversation_post_id' => get_field('ecommerce_conversation_post_id', $client_id),
                'content'              => $content,
                'partner_id'           => $partner_id,
                'author_name'          => $partner_title,
                'email'                => $partner_email
            ];

            if (!$body['conversation_post_id']) {
                wp_send_json_error(['message' => 'Conversation ID not found for client.']);
                return;
            }

            // Optional image upload
            if (!empty($_FILES['image']['name'])) {
                require_once ABSPATH . 'wp-admin/includes/file.php';
                require_once ABSPATH . 'wp-admin/includes/image.php';
                require_once ABSPATH . 'wp-admin/includes/media.php';

                $uploaded_file = $_FILES['image'];
                $upload = wp_handle_upload($uploaded_file, ['test_form' => false]);

                if (!isset($upload['error']) && isset($upload['file'])) {
                    $file_path = $upload['file'];
                    $file_url  = $upload['url'];
                    $filetype = wp_check_filetype($file_path);

                    $attachment = [
                        'post_mime_type' => $filetype['type'],
                        'post_title'     => sanitize_file_name($uploaded_file['name']),
                        'post_content'   => '',
                        'post_status'    => 'inherit'
                    ];
                    $attach_id = wp_insert_attachment($attachment, $file_path, $client_id);

                    if (!is_wp_error($attach_id)) {
                        require_once ABSPATH . 'wp-admin/includes/image.php';
                        $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
                        wp_update_attachment_metadata($attach_id, $attach_data);
                        $image_url = wp_get_attachment_url($attach_id);
                        $body['image_url'] = $image_url;
                    } else {
                        wp_send_json_error(['message' => 'Failed to add image to media library.']);
                        return;
                    }
                } else {
                    wp_send_json_error(['message' => 'Image upload failed: ' . $upload['error']]);
                    return;
                }
            }

            // Send message to API
            $api_url = 'https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/send-conversation-message';
            $response = wp_remote_post($api_url, [
                'body'    => json_encode($body),
                'headers' => [
                    'Content-Type'  => 'application/json',
                    'Authorization' => $basicAuth
                ],
                'timeout' => 30
            ]);

            if (is_wp_error($response)) {
                wp_send_json_error(['message' => 'Failed to connect to the REST API: ' . $response->get_error_message()]);
                return;
            }

            $response_code = wp_remote_retrieve_response_code($response);
            $response_body = wp_remote_retrieve_body($response);
            $response_data = json_decode($response_body, true);

            if ($response_code !== 200 || empty($response_data['success'])) {
                error_log('REST API error: ' . $response_body);
                wp_send_json_error(['message' => 'Failed to send message: ' . $response_body]);
                return;
            }

            // Mark conversation as read by partner
            if (function_exists('update_field')) {
                update_field('read_by_partner', 1, $client_id);
            }

            wp_send_json_success([
                'message' => __('Message sent successfully', 'textdomain'),
                'image_url' => $body['image_url'] ?? null,
                'response' => $response_data
            ]);

        } catch (Exception $e) {
            error_log('Exception in send_partner_message: ' . $e->getMessage());
            wp_send_json_error(['message' => 'An error occurred while sending the message.']);
        } catch (Error $e) {
            error_log('Fatal error in send_partner_message: ' . $e->getMessage());
            wp_send_json_error(['message' => 'A fatal error occurred.']);
        }
    }

}