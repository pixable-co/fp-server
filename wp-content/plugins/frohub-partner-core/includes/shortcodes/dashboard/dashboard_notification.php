<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class DashboardNotification {

    public static function init() {
        $self = new self();
        add_shortcode( 'dashboard_notification', array($self, 'dashboard_notification_shortcode') );
    }

    public function dashboard_notification_shortcode() {
        $unique_key = 'dashboard_notification' . uniqid();
        return '<div class="dashboard_notification" data-key="' . esc_attr($unique_key) . '"></div>';
    }
}
