<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MobileService {

    public static function init() {
        $self = new self();
        add_shortcode( 'fp_mobile_service', array($self, 'fp_mobile_service_shortcode') );
    }

    public function fp_mobile_service_shortcode() {
        $unique_key = 'fp-mobile-service' . uniqid();
        return '<div class="fp-mobile-service" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
