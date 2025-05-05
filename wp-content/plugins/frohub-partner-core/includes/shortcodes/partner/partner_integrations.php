<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class PartnerIntegrations {

    public static function init() {
        $self = new self();
        add_shortcode( 'partner_integrations', array($self, 'partner_integrations_shortcode') );
    }

    public function partner_integrations_shortcode() {
        $unique_key = 'partner_integrations' . uniqid();
        return '<div class="partner_integrations" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
