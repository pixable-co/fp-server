<?php
namespace FPServer;

if (!defined('ABSPATH')) {
    exit;
}

class ConnectCalender {

    public static function init() {
        require_once FPSERVER_ROOT_DIR_PATH . '/library/vendor/autoload.php';
        $self = new self();

        add_action('wp_ajax_fpserver/connect_calender', array($self, 'connect_calender'));
        add_action('wp_ajax_fpserver/refresh_google_token', array($self, 'ajax_refresh_google_token'));
        add_action('wp_ajax_fpserver/disconnect_google_calendar', array($self, 'disconnect_google_calendar'));
        add_action('wp_ajax_fpserver/get_google_auth_url', array($self, 'get_google_auth_url'));
        add_action('wp_ajax_fpserver/check_google_auth_status', array($self, 'check_google_auth_status'));
        add_action('wp_ajax_fpserver/google_oauth_callback', array($self, 'handle_oauth_callback'));
        add_action('wp_ajax_fpserver/get_google_calendars', array($self, 'get_google_calendars'));
        add_action('wp_ajax_fpserver/get_google_calendar_events', array($self, 'get_google_calendar_events'));
        add_action('wp_ajax_fpserver/save_user_calendar', array($self, 'save_user_calendar'));
    }

    public static function ajax_refresh_google_token() {
        check_ajax_referer('fpserver_nonce');

        $user_id = get_current_user_id();
        if (!$user_id) {
            wp_send_json_error(['message' => 'User not logged in.']);
        }

        $new_token = self::refreshAccessToken($user_id);
        if (!$new_token) {
            wp_send_json_error(['message' => 'Failed to refresh token. Please reconnect your Google account.']);
        }

        wp_send_json_success(['message' => 'Token refreshed successfully.']);
    }

    public static function getClient() {
        $secure_path = WP_CONTENT_DIR . '/uploads/credential/credentials.json';
        $client = new \Google_Client();
        $client->setAuthConfig($secure_path); // Google OAuth Credentials
        $client->setRedirectUri(admin_url('admin-ajax.php?action=fpserver/google_oauth_callback'));
        $client->addScope(\Google_Service_Calendar::CALENDAR_READONLY);

        // Make sure these are set properly
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        $client->setApprovalPrompt('force'); // Add this for older API versions

        return $client;
    }

    public function disconnect_google_calendar() {
        check_ajax_referer('fpserver_nonce');

        $user_id = get_current_user_id();
        if (!$user_id) {
            wp_send_json_error(['message' => 'User not logged in.']);
        }

        delete_user_meta($user_id, 'google_calendar_access_token');
        delete_user_meta($user_id, 'google_calendar_refresh_token');
        delete_user_meta($user_id, 'google_calendar_id');

        wp_send_json_success(['message' => 'Disconnected from Google Calendar.']);
    }

    public function get_google_auth_url() {
        check_ajax_referer('fpserver_nonce');

        $client = self::getClient();

        // Double-check these settings are applied
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        $client->setApprovalPrompt('force');

        // Add a state parameter to help with debugging
        $client->setState('new_auth_' . time());

        $auth_url = $client->createAuthUrl();
        error_log('Generated auth URL: ' . $auth_url);

        wp_send_json_success(['auth_url' => $auth_url]);
    }

    public static function check_google_auth_status() {
        $user_id = get_current_user_id();
        if (!$user_id) {
            wp_send_json_error(['message' => 'User not logged in.']);
        }

        $token = get_user_meta($user_id, 'google_calendar_access_token', true);

        if (!$token) {
            wp_send_json_success(['authenticated' => false, 'expired' => false]);
        }

        $token = json_decode($token, true);
        $client = self::getClient();
        $client->setAccessToken($token);

        if ($client->isAccessTokenExpired()) {
            delete_user_meta($user_id, 'google_calendar_access_token'); // Remove expired token
            wp_send_json_success(['authenticated' => false, 'expired' => true]);
        }

        wp_send_json_success(['authenticated' => true, 'expired' => false]);
    }

    public function handle_oauth_callback() {
        if (!isset($_GET['code'])) {
            wp_send_json_error(['message' => 'Authorization code missing']);
        }

        $client = self::getClient();

        try {
            $token = $client->fetchAccessTokenWithAuthCode($_GET['code']);
            error_log('Received token response: ' . json_encode($token));

            if (isset($token['error'])) {
                error_log('Error retrieving access token: ' . $token['error']);
                wp_send_json_error(['message' => 'Error retrieving access token: ' . $token['error']]);
            }

            $user_id = get_current_user_id();
            if (!$user_id) {
                wp_send_json_error(['message' => 'User not logged in.']);
            }

            // Store the access token
            update_user_meta($user_id, 'google_calendar_access_token', json_encode($token));

            // Check for and store refresh token
            if (!empty($token['refresh_token'])) {
                error_log('Received refresh token: ' . substr($token['refresh_token'], 0, 5) . '...');
                update_user_meta($user_id, 'google_calendar_refresh_token', $token['refresh_token']);
            } else {
                error_log('No refresh token received in this authentication flow');

                // Check if we already have a refresh token stored
                $existing_refresh = get_user_meta($user_id, 'google_calendar_refresh_token', true);
                if (!$existing_refresh) {
                    error_log('No existing refresh token found. User will need to reconnect soon.');
                } else {
                    error_log('Using existing refresh token from database.');
                }
            }

            wp_redirect(site_url('/google-calender'));
            exit;
        } catch (\Exception $e) {
            error_log('Exception during OAuth callback: ' . $e->getMessage());
            wp_send_json_error(['message' => 'Authentication error: ' . $e->getMessage()]);
        }
    }

    public static function getAccessToken() {
        $user_id = get_current_user_id();
        $token = json_decode(get_user_meta($user_id, 'google_calendar_access_token', true), true);

        if (!$token) {
            return null;
        }

        $client = self::getClient();
        $client->setAccessToken($token);

        // Refresh token if expired
        if ($client->isAccessTokenExpired()) {
            $new_token = self::refreshAccessToken($user_id);
            if (!$new_token) {
                return null; // Re-authentication needed
            }
            return $new_token;
        }

        return $token;
    }

    public static function refreshAccessToken($user_id) {
        $refresh_token = get_user_meta($user_id, 'google_calendar_refresh_token', true);

        if (!$refresh_token) {
            return false; // No refresh token found, user must reauthenticate
        }

        $client = self::getClient();
        $client->fetchAccessTokenWithRefreshToken($refresh_token);
        $new_token = $client->getAccessToken();

        if (isset($new_token['error'])) {
            return false; // Token refresh failed
        }

        update_user_meta($user_id, 'google_calendar_access_token', json_encode($new_token));
        return $new_token;
    }

    public function get_google_calendars() {
        check_ajax_referer('fpserver_nonce');

        $user_id = get_current_user_id();
        if (!$user_id) {
            wp_send_json_error(['message' => 'User not logged in.']);
        }

        $token = get_user_meta($user_id, 'google_calendar_access_token', true);
        if (!$token) {
            wp_send_json_error(['message' => 'User is not authenticated.']);
        }

        $token = self::getAccessToken();
        if (!$token) {
            wp_send_json_error(['message' => 'Access token expired. Please reconnect.']);
        }

        $client = self::getClient();
        $client->setAccessToken($token);

        if ($client->isAccessTokenExpired()) {
            wp_send_json_error(['message' => 'Access token expired. Please reconnect.']);
        }

        $service = new \Google_Service_Calendar($client);
        $calendarList = $service->calendarList->listCalendarList();
        $calendars = [];

        foreach ($calendarList->getItems() as $calendar) {
            $calendars[] = [
                'id'   => $calendar->getId(),
                'name' => $calendar->getSummary(),
            ];
        }

        wp_send_json_success(['calendars' => $calendars]);
    }

    public function save_user_calendar() {
        check_ajax_referer('fpserver_nonce');

        if (!isset($_POST['calendar_id']) || empty($_POST['calendar_id'])) {
            wp_send_json_error(['message' => 'Calendar ID is required.']);
        }

        $calendar_id = sanitize_text_field($_POST['calendar_id']);
        $user_id = get_current_user_id();

        if (!$user_id) {
            wp_send_json_error(['message' => 'User not logged in.']);
        }

        update_user_meta($user_id, 'google_calendar_id', $calendar_id);
        wp_send_json_success(['message' => 'Calendar saved successfully.']);
    }

    public static function get_user_calendar_events($partner_id, $date) {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            wp_send_json_error(['message' => 'Invalid date format. Use YYYY-MM-DD.']);
        }

        $user_query = new \WP_User_Query([
            'meta_key'   => 'partner_post_id', // ACF field storing partner ID
            'meta_value' => $partner_id,
            'number'     => 1,
        ]);

        $users = $user_query->get_results();
        if (empty($users)) {
            wp_send_json_error(['message' => 'No user found for this partner ID.']);
        }

        $user_id = $users[0]->ID;
        $calendar_id = get_user_meta($user_id, 'google_calendar_id', true);

        if (!$calendar_id) {
            wp_send_json_error(['message' => 'No calendar found for this user.']);
        }

        $token = get_user_meta($user_id, 'google_calendar_access_token', true);
        if (!$token) {
            wp_send_json_error(['message' => 'User is not authenticated.']);
        }

        $token = json_decode($token, true);
        $client = self::getClient();
        $client->setAccessToken($token);

        if ($client->isAccessTokenExpired()) {
            wp_send_json_error(['message' => 'Access token expired. Please reconnect.']);
        }

        $timeMin = $date . 'T00:00:00Z';
        $timeMax = $date . 'T23:59:59Z';

        $service = new \Google_Service_Calendar($client);
        $events = $service->events->listEvents($calendar_id, [
            'timeMin'      => $timeMin,
            'timeMax'      => $timeMax,
            'singleEvents' => true,
            'orderBy'      => 'startTime'
        ]);

        $event_list = [];

        foreach ($events->getItems() as $event) {
            $event_list[] = [
                'id'    => $event->getId(),
                'title' => $event->getSummary(),
                'start' => $event->getStart()->getDateTime() ?: $event->getStart()->getDate(),
                'end'   => $event->getEnd()->getDateTime() ?: $event->getEnd()->getDate(),
            ];
        }

        return $event_list;
    }

    public static function get_user_all_calendar_events($partner_id) {
        $user_query = new \WP_User_Query([
            'meta_key'   => 'partner_post_id',
            'meta_value' => $partner_id,
            'number'     => 1,
        ]);

        $users = $user_query->get_results();
        if (empty($users)) {
            wp_send_json_error(['message' => 'No user found for this partner ID.']);
        }

        $user_id = $users[0]->ID;
        $calendar_id = get_user_meta($user_id, 'google_calendar_id', true);

        if (!$calendar_id) {
            wp_send_json_error(['message' => 'No calendar found for this user.']);
        }

        // 🔹 Step 1: Get the current access token
        $token = json_decode(get_user_meta($user_id, 'google_calendar_access_token', true), true);

        // 🔹 Step 2: Check if the token is expired
        $client = self::getClient();
        $client->setAccessToken($token);

        if ($client->isAccessTokenExpired()) {
            error_log("Access token expired for user " . $user_id . ". Attempting to refresh...");

            // 🔹 Step 3: Refresh the token automatically
            $new_token = self::refreshAccessToken($user_id);

            if (!$new_token) {
                error_log("Token refresh failed for user " . $user_id);
                wp_send_json_error(['message' => 'Access token expired. Please reconnect your Google account.']);
            }

            $client->setAccessToken($new_token);
            error_log("Token refreshed successfully for user " . $user_id);
        }

        // 🔹 Step 4: Fetch upcoming events using the valid token
        $service = new \Google_Service_Calendar($client);

        // Get current date and time in RFC3339 format
        $now = (new \DateTime('now', new \DateTimeZone('UTC')))->format(\DateTime::RFC3339);

        $events = $service->events->listEvents($calendar_id, [
            'singleEvents' => true,
            'orderBy'      => 'startTime',
            'timeMin'      => $now, // Get only future events
        ]);

        $event_list = [];
        $uk_timezone = new \DateTimeZone('Europe/London');

        foreach ($events->getItems() as $event) {
            $start_time = $event->getStart()->getDateTime() ?: $event->getStart()->getDate();
            $end_time = $event->getEnd()->getDateTime() ?: $event->getEnd()->getDate();

            if ($event->getStart()->getDateTime()) {
                $start_datetime = new \DateTime($start_time);
                $start_datetime->setTimezone($uk_timezone);
                $start_time = $start_datetime->format('Y-m-d\TH:i:sP');
            }

            if ($event->getEnd()->getDateTime()) {
                $end_datetime = new \DateTime($end_time);
                $end_datetime->setTimezone($uk_timezone);
                $end_time = $end_datetime->format('Y-m-d\TH:i:sP');
            }

            $event_list[] = [
                'id'    => $event->getId(),
                'title' => $event->getSummary(),
                'start' => $start_time,
                'end'   => $end_time,
            ];
        }

        return $event_list;
    }

}
