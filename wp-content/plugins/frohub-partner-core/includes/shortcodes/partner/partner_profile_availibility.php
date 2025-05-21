<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class PartnerProfileAvailibility {

    public static function init() {
        $self = new self();
        add_shortcode( 'partner_profile_availibility', array($self, 'partner_profile_availibility_shortcode') );
    }

    public function partner_profile_availibility_shortcode() {
        $unique_key = 'partner_profile_availibility' . uniqid();
        return '<div class="partner_profile_availibility" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
