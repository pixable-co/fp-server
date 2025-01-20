<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MediaUpload {

    public static function init() {
        $self = new self();
        add_action( 'wp_ajax_fp/media/upload', array( $self, 'upload_media' ) );
        add_action( 'wp_ajax_nopriv_fp/media/upload', array( $self, 'upload_media' ) );

        add_action( 'wp_ajax_fp/media/delete', array( $self, 'delete_media' ) );
        add_action( 'wp_ajax_nopriv_fp/media/delete', array( $self, 'delete_media' ) );
    }

    public function upload_media() {
        // Check if file was uploaded
        if (empty($_FILES['file'])) {
            wp_send_json_error(array(
                'message' => 'No file was uploaded'
            ));
            return;
        }

        // Ensure WordPress media functions are available
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

        // Setup upload overrides
        $upload_overrides = array(
            'test_form' => false,
            'test_size' => true,
        );

        // Handle the upload
        $uploaded_file = $_FILES['file'];
        $moved_file = wp_handle_upload($uploaded_file, $upload_overrides);

        if ($moved_file && !isset($moved_file['error'])) {
            // Create attachment
            $attachment = array(
                'post_mime_type' => $moved_file['type'],
                'post_title'     => preg_replace('/\.[^.]+$/', '', basename($uploaded_file['name'])),
                'post_content'   => '',
                'post_status'    => 'inherit'
            );

            // Insert attachment into the WordPress media library
            $attach_id = wp_insert_attachment($attachment, $moved_file['file']);

            // Generate metadata for the attachment
            $attach_data = wp_generate_attachment_metadata($attach_id, $moved_file['file']);
            wp_update_attachment_metadata($attach_id, $attach_data);

            wp_send_json_success(array(
                'url'  => $moved_file['url'],
                'id'   => $attach_id,
                'type' => $moved_file['type']
            ));
        } else {
            wp_send_json_error(array(
                'message' => $moved_file['error'] ?? 'Upload failed'
            ));
        }
    }

     public function delete_media() {
            // Verify nonce if you're using one
            // check_ajax_referer('fp_delete_media', 'nonce');

            // Get the attachment ID
            $attachment_id = isset($_POST['attachment_id']) ? intval($_POST['attachment_id']) : 0;

            if (!$attachment_id) {
                wp_send_json_error(array(
                    'message' => 'No attachment ID provided'
                ));
                return;
            }

            // Verify the attachment exists
            if (!get_post($attachment_id)) {
                wp_send_json_error(array(
                    'message' => 'Attachment not found'
                ));
                return;
            }

            // Delete the attachment
            $deleted = wp_delete_attachment($attachment_id, true);

            if ($deleted) {
                wp_send_json_success(array(
                    'message' => 'Attachment deleted successfully'
                ));
            } else {
                wp_send_json_error(array(
                    'message' => 'Failed to delete attachment'
                ));
            }
     }
}
