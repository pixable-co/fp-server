<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class PartnerProfileTermsConditions {

    public static function init() {
        $self = new self();
        add_shortcode( 'partner_profile_terms_conditions', array($self, 'partner_profile_terms_conditions_shortcode') );
    }

    public function partner_profile_terms_conditions_shortcode() {
        $unique_key = 'partner_profile_terms_conditions' . uniqid();
        return '<div class="partner_profile_terms_conditions" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
