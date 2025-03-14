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
        $unique_key = 'unread_conversations' . uniqid();
        return '<div class="unread_conversations" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
