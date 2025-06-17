<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class GravityForms {

	public static function init() {
		$self = new self();
		add_action( 'gform_after_submission', array($self, 'handle_gravity_form_submission'), 10, 2);
	}

    public function handle_gravity_form_submission($entry, $form) {
        // // Initialize an array to store the submitted data
        // $submitted_data = [];

        // // Loop through form fields and extract submitted values
        // foreach ($form['fields'] as $field) {
        //     $field_id = $field->id;
        //     $submitted_data[sanitize_key($field->label)] = rgar($entry, $field_id);
        // }

        // error_log((print_r('creating post', true)));

        // $post_id = wp_insert_post([
        //         'post_title'  => 'Partner Form Submission', // Use a dynamic title if needed
        //         'post_type'   => 'partner',                // Replace with your custom post type
        //         'post_status' => 'publish',               // Post status (publish, draft, etc.)
        //     ]);

        // error_log((print_r($submitted_data, true)));


        // // Save each submitted field to ACF fields
        // if (function_exists('update_field')) {
        //     foreach ($submitted_data as $field_key => $field_value) {
        //         // Match ACF field keys/names to submitted data keys
        //         switch ($field_key) {
        //             case 'availability':
        //                 update_field('availability', $field_value, $post_id);
        //                 break;
        //             case 'bookingnotice':
        //                 update_field('booking_notice', $field_value, $post_id);
        //                 break;
        //             case 'booking_period':
        //                 update_field('booking_period', $field_value, $post_id);
        //                 break;
        //             default:
        //                 // Optionally save unmatched fields as post meta
        //                 update_post_meta($post_id, $field_key, $field_value);
        //                 break;
        //         }
        //     }
        // }
    }

}
