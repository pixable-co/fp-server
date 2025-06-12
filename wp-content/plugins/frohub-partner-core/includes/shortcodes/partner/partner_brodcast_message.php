<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class PartnerBrodcastMessage {

    public static function init() {
        $self = new self();
        add_shortcode( 'partner_brodcast_message', array($self, 'partner_brodcast_message_shortcode') );
    }

    public function partner_brodcast_message_shortcode() {
        $unique_key = 'partner_brodcast_message' . uniqid();
        return '<div class="partner_brodcast_message" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
