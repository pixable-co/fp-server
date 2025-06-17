<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class PartnerMessageMobile {

    public static function init() {
        $self = new self();
        add_shortcode( 'partner_message_mobile', array($self, 'partner_message_mobile_shortcode') );
    }

    public function partner_message_mobile_shortcode() {
        $unique_key = 'partner_message_mobile' . uniqid();
        return '<div class="partner_message_mobile" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
