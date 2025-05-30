<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class PartnerMessage {

    public static function init() {
        $self = new self();
        add_shortcode( 'partner_message', array($self, 'partner_message_shortcode') );
    }

    public function partner_message_shortcode() {
        $unique_key = 'partner_message' . uniqid();
        return '<div class="partner_message" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
