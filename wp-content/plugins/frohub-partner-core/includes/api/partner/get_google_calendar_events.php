<?php
namespace FPServer;

use FPServer\ConnectCalender;

if (!defined('ABSPATH')) {
    exit;
}

class GetGoogleCalenderEvents
{

    public static function init()
    {
        $self = new self();
        add_action('rest_api_init', [$self, 'register_rest_routes']);
    }

    /**
     * Registers the REST API routes.
     */
    public function register_rest_routes()
    {
        register_rest_route('fpserver/v1', '/google-calendar-events', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_product_service_types'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('fpserver/v1', '/google-calendar-all-events', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_all_calendar_events'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function get_all_calendar_events(\WP_REST_Request $request)
    {
        $partner_id = $request->get_param('partner_id');

        if (!$partner_id) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'partner_id is required.'
            ], 400);
        }

        $events = ConnectCalender::get_user_all_calendar_events($partner_id);

        if (is_wp_error($events)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $events->get_error_message()
            ], 400);
        }

        return new \WP_REST_Response([
            'success' => true,
            'events'  => $events
        ], 200);
    }

    /**
     * Handles both single-date and range-based calendar queries
     */
    public function get_product_service_types(\WP_REST_Request $request)
    {
        $partner_id = $request->get_param('partner_id');
        $date = $request->get_param('date');
        $start = $request->get_param('start');
        $end   = $request->get_param('end');

        if (!$partner_id) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'partner_id is required.'
            ], 400);
        }

        // ✅ NEW: Range-based request (fast path)
        if ($start && $end) {
            $all_events = ConnectCalender::get_user_all_calendar_events($partner_id);

            if (is_wp_error($all_events)) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => $all_events->get_error_message()
                ], 400);
            }

            $filtered = [];
            foreach ($all_events as $event) {
                try {
                    $event_start = new \DateTime($event['start']);
                    $event_end   = new \DateTime($event['end']);

                    if ($event_end < new \DateTime($start) || $event_start > new \DateTime($end)) {
                        continue;
                    }

                    $filtered[] = $event;
                } catch (\Exception $e) {
                    continue;
                }
            }

            return new \WP_REST_Response([
                'success' => true,
                'events'  => $filtered
            ], 200);
        }

        // 🗓️ Fallback: single-date request (existing behaviour)
        if (!$date) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Either date or start/end must be provided.'
            ], 400);
        }

        $events = ConnectCalender::get_user_calendar_events($partner_id, $date);

        if (is_wp_error($events)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $events->get_error_message()
            ], 400);
        }

        return new \WP_REST_Response([
            'success' => true,
            'events'  => $events
        ], 200);
    }
}
