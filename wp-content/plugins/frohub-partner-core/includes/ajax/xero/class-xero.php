<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Xero {

	public static function init() {
		$self = new self();
	}

    private $clientId;
    private $clientSecret;
    private $redirectUri;

    public function __construct() {
            $this->clientId = env('XERO_CLIENT_ID');
            $this->clientSecret = env('XERO_CLIENT_SECRET');
            $this->redirectUri = env('XERO_REDIRECT_URI');
    }

        /**
         * Redirect to Xero for OAuth2 Authentication
         */
    public function connect(Request $request) {
            $url = "https://login.xero.com/identity/connect/authorize";
            $state = csrf_token(); // Generate a unique state to prevent CSRF attacks
            $scopes = "offline_access accounting.transactions accounting.contacts.read";

            $query = http_build_query([
                'response_type' => 'code',
                'client_id' => $this->clientId,
                'redirect_uri' => $this->redirectUri,
                'scope' => $scopes,
                'state' => $state,
            ]);

            return redirect("{$url}?{$query}");
    }

        /**
         * Handle OAuth2 Callback
         */
    public function callback(Request $request) {
            $code = $request->query('code');
            $state = $request->query('state');

            if (!$code) {
                return response()->json(['error' => 'Authorization code not provided'], 400);
            }

            try {
                // Exchange the authorization code for access and refresh tokens
                $response = Http::asForm()->post('https://identity.xero.com/connect/token', [
                    'grant_type' => 'authorization_code',
                    'code' => $code,
                    'redirect_uri' => $this->redirectUri,
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                ]);

                if ($response->failed()) {
                    return response()->json(['error' => 'Failed to exchange token', 'details' => $response->json()], 500);
                }

                $tokens = $response->json();

                // Save tokens securely (e.g., in database or encrypted session)
                return response()->json([
                    'message' => 'Xero connected successfully',
                    'tokens' => $tokens,
                ]);
            } catch (\Exception $e) {
                return response()->json(['error' => 'Failed to exchange token', 'message' => $e->getMessage()], 500);
            }
    }

        /**
         * Example API Call: Get Invoices
         */
    public function getInvoices(Request $request)  {
            $accessToken = $request->header('Authorization'); // Pass the token securely from the frontend
            $tenantId = $request->header('Xero-Tenant-Id'); // Pass the tenant ID from the frontend

            if (!$accessToken || !$tenantId) {
                return response()->json(['error' => 'Access token or tenant ID missing'], 400);
            }

            try {
                $response = Http::withHeaders([
                    'Authorization' => "Bearer {$accessToken}",
                    'Xero-Tenant-Id' => $tenantId,
                ])->get('https://api.xero.com/api.xro/2.0/Invoices');

                if ($response->failed()) {
                    return response()->json(['error' => 'Failed to fetch invoices', 'details' => $response->json()], 500);
                }

                return response()->json($response->json());
            } catch (\Exception $e) {
                return response()->json(['error' => 'Failed to fetch invoices', 'message' => $e->getMessage()], 500);
            }
    }

}
