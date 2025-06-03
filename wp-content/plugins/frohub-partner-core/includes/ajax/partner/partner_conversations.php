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
        add_action('wp_ajax_fpserver/upload_comment_image', array($self, 'upload_comment_image'));

        // AJAX for non-logged-in users
        add_action('wp_ajax_nopriv_fpserver/partner_conversations', array($self, 'partner_conversations'));
        add_action('wp_ajax_nopriv_fpserver/get_conversation_comments', array($self, 'get_conversation_comments'));
        add_action('wp_ajax_nopriv_fpserver/send_partner_message', array($self, 'send_partner_message'));
        add_action('wp_ajax_nopriv_fpserver/upload_comment_image', array($self, 'upload_comment_image'));
    }

    public function partner_conversations() {
        try {
            check_ajax_referer('fpserver_nonce');

            // Ensure user is logged in
            if (!is_user_logged_in()) {
                error_log('User not logged in');
                wp_send_json_error(['message' => 'User not logged in.']);
                return;
            }

            $current_user_id = get_current_user_id();

            $partner_id = get_field('partner_post_id', 'user_' . $current_user_id);

            if (!$partner_id) {
                wp_send_json_error(['message' => 'Partner ID not found for current user.']);
                return;
            }

            // Prepare REST API request
            $api_url = 'https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/partner-conversations';
            $api_url = add_query_arg(['partner_id' => $partner_id], $api_url);

            // Optional: Add Basic Auth if your REST API requires it
            $basicAuth = get_field('frohub_ecommerce_basic_authentication', 'option'); // e.g., 'Basic dXNlcjpwYXNzd29yZA=='
            $args = [
                'method'    => 'GET',
                'headers'   => [],
                'timeout'   => 15,
            ];
            if (!empty($basicAuth)) {
                $args['headers']['Authorization'] = $basicAuth;
            }

            $response = wp_remote_get($api_url, $args);

            if (is_wp_error($response)) {
                error_log('REST API request failed: ' . $response->get_error_message());
                wp_send_json_error(['message' => 'Failed to fetch conversations from API.']);
                return;
            }

            $status_code = wp_remote_retrieve_response_code($response);
            $body = json_decode(wp_remote_retrieve_body($response), true);

            if ($status_code !== 200 || empty($body['success'])) {
                $error_message = $body['message'] ?? 'Unknown error from API.';
                error_log('API error: ' . $error_message);
                wp_send_json_error(['message' => 'API error: ' . $error_message]);
                return;
            }

            $conversations = $body['data'] ?? [];
            error_log('Returning ' . count($conversations) . ' conversations from API');
            wp_send_json_success($conversations);

        } catch (\Exception $e) {
            error_log('Error in partner_conversations: ' . $e->getMessage());
            wp_send_json_error(['message' => 'An error occurred while fetching conversations.']);
        } catch (\Error $e) {
            error_log('Fatal error in partner_conversations: ' . $e->getMessage());
            wp_send_json_error(['message' => 'A fatal error occurred.']);
        }
    }

    public function get_conversation_comments() {
        try {
            check_ajax_referer('fpserver_nonce');

            if (!is_user_logged_in()) {
                wp_send_json_error(['message' => 'User not logged in.']);
                return;
            }

            $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
            if (!$post_id) {
                wp_send_json_error(['message' => 'Post ID is required.']);
                return;
            }

            $basicAuth = get_field('frohub_ecommerce_basic_authentication', 'option');

            if (!$basicAuth) {
                wp_send_json_error(['message' => 'Authentication not configured.']);
                return;
            }

            $response = wp_remote_post('https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/get-conversation-comments', [
                'body' => json_encode(['conversation_post_id' => $post_id]),
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => $basicAuth
                ],
                'timeout' => 30
            ]);

            if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
                wp_send_json_error(['message' => 'Failed to fetch comments from API: ' . $error_message]);
                return;
            }

            $body = wp_remote_retrieve_body($response);
            $decoded = json_decode($body, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
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
//                     'content'    => wp_kses($comment['content'] ?? '', $allowed_tags),
                    'content'    => $comment['content'],
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


    public function upload_comment_image() {
        check_ajax_referer('fpserver_nonce');

        if (!is_user_logged_in()) {
            wp_send_json_error(['message' => 'User not logged in.']);
        }

        if (empty($_FILES['file'])) {
            wp_send_json_error(['message' => 'No file uploaded.']);
        }

        $basicAuth = get_field('frohub_ecommerce_basic_authentication', 'option');
        if (!$basicAuth) {
            wp_send_json_error(['message' => 'Authentication not configured.']);
        }

        $file = $_FILES['file'];
        $upload = wp_upload_bits($file['name'], null, file_get_contents($file['tmp_name']));

        if ($upload['error']) {
            wp_send_json_error(['message' => 'Upload error: ' . $upload['error']]);
        }

        // Prepare external API request
        $remote_api_url = 'https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/upload-comment-image';

        $response = wp_remote_post($remote_api_url, [
            'method'    => 'POST',
            'headers'   => [
                'Authorization' => $basicAuth,
            ],
            'body'      => [
                'file' => curl_file_create($file['tmp_name'], $file['type'], $file['name']),
            ],
            'timeout'   => 30,
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }

        $response_body = json_decode(wp_remote_retrieve_body($response), true);
        if (!empty($response_body['success']) && !empty($response_body['url'])) {
            wp_send_json_success(['url' => $response_body['url']]);
        } else {
            wp_send_json_error(['message' => $response_body['error'] ?? 'Unknown error']);
        }

        wp_die();
    }

    public function send_partner_message() {
        // Security: Verify nonce
        check_ajax_referer('fpserver_nonce', '_ajax_nonce');

        // Get the Basic Auth credentials (if required by your REST API)
        $basicAuth = get_field('frohub_ecommerce_basic_authentication', 'option'); // e.g., 'Basic dXNlcjpwYXNzd29yZA=='

        // Get data from AJAX request
        $post_id     = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $partner_id  = isset($_POST['partner_id']) ? intval($_POST['partner_id']) : 0;
        $comment     = isset($_POST['comment']) ? sanitize_text_field($_POST['comment']) : '';
        $author_name = isset($_POST['author_name']) ? sanitize_text_field($_POST['author_name']) : '';
        $email       = isset($_POST['email']) ? sanitize_email($_POST['email']) : '';
        $image_url   = isset($_POST['image_url']) ? esc_url_raw($_POST['image_url']) : '';

        // Prepare API request arguments
        $args = array(
            'method'    => 'POST',
            'headers'   => array(
                'Content-Type'  => 'application/json',
            ),
            'body'      => json_encode(array(
                'post_id'     => $post_id,
                'partner_id'  => $partner_id,
                'comment'     => $comment,
                'author_name' => $author_name,
                'email'       => $email,
                'image_url'   => $image_url,
                'sent_from'   => 'partner'
            )),
        );

        // Add Basic Auth header if provided
        if (!empty($basicAuth)) {
            $args['headers']['Authorization'] = $basicAuth;
        }

        // 🌐 Custom API URL (staging site)
        $api_base_url = 'https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/create-comment';

        // Send the request to the REST API
        $response = wp_remote_post($api_base_url, $args);

        // Handle response
        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'error'   => true,
                'message' => $response->get_error_message(),
            ));
        } else {
            $body = json_decode(wp_remote_retrieve_body($response), true);
            if (!empty($body['error'])) {
                wp_send_json_error($body);
            } else {
                wp_send_json_success($body);
            }
        }

        // Always end with wp_die()
        wp_die();
    }

}