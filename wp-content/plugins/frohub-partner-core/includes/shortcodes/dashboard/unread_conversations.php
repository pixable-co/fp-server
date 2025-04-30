<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class UnreadConversations {

    public static function init() {
        $self = new self();
        add_shortcode( 'unread_conversations', array($self, 'unread_conversations_shortcode') );
    }

    public function unread_conversations_shortcode() {
        // Query client posts with ACF field 'read_by_partner' as false
        $args = array(
            'post_type'      => 'client', // Change to your actual post type
            'posts_per_page' => -1, // Retrieve all posts
            'meta_query'     => array(
                array(
                    'key'   => 'read_by_partner',
                    'value' => '0', // ACF stores boolean values as '0' and '1' (string format)
                    'compare' => '='
                ),
            ),
        );

        $query = new \WP_Query($args);

        // Get the count of unread conversations
        $count = $query->found_posts;

        // Reset post data
        wp_reset_postdata();

        // Return the count within a div element
        return '<div class="unread-conversations dashboard-stats"> 
         <h2>  Unread Messages </h2>
         <p class="booking-stats-value">' . esc_html($count) . '</p>
         </div>';
    }
}
