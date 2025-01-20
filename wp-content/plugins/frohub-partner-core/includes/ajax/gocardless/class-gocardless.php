<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class GoCardless {

	public static function init() {
		$self = new self();
	}

    private $accessToken;

    public function __construct() {
       $this->accessToken = $this->getAccessToken();
    }

    public function getAccessToken() {
            $response = Http::post('https://bankaccountdata.gocardless.com/api/v2/token/new/', [
                'secret_id' => 'a98f6d8f-6348-448a-9353-e478642e3ad3',
                'secret_key' => '9e0136a48af29a5ff426ae939f62aa490bbec6ea5c06c9d967759f5f070edccc462e31b0c2809e4b4ce2482527a08261d076096e2b63875382f50aa787a95e45',
            ]);

            if ($response->successful()) {
                $responseData = json_decode($response->body(), true); // Decode JSON string to array
                return $responseData['access'] ?? null; // Return only the access token
            }

            throw new \Exception('Failed to obtain access token: ' . $response->body());
    }


    public function createAgreement(Request $request) {
            $institutionId = $request->input('institution_id');

            if (!$institutionId) {
                return response()->json(['error' => 'Institution ID is required'], 400);
            }

            $response = Http::withToken($this->accessToken)
                ->post('https://bankaccountdata.gocardless.com/api/v2/agreements/enduser/', [
                    'institution_id' => $institutionId,
                    'max_historical_days' => 90,
                    'access_valid_for_days' => 30,
                    'access_scope' => ['balances', 'details', 'transactions'],
                ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'Failed to create agreement', 'details' => $response->body()], $response->status());
    }

    public function getInstitutions(Request $request) {
            $country = $request->query('country', 'gb'); // Default to 'gb' (United Kingdom)

            $response = Http::withToken($this->accessToken)
                ->get('https://bankaccountdata.gocardless.com/api/v2/institutions/', [
                    'country' => $country,
                ]);

            if ($response->successful()) {
    //             return response()->json($response->json());
                return $response->json();
            }

            return response()->json(['error' => 'Failed to fetch institutions', 'details' => $response->body()], $response->status());
    }

    public function getRequisitions() {
            $response = Http::withToken($this->accessToken)
                ->get('https://bankaccountdata.gocardless.com/api/v2/requisitions/');

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'Failed to fetch requisitions', 'details' => $response->body()], $response->status());
    }

     public function createRequisition(Request $request) {
            $institutionId = $request->input('institution_id');
            $redirectUri = $request->input('redirect_uri', 'https://your-redirect-uri.com');

            if (!$institutionId) {
                return response()->json(['error' => 'Institution ID is required'], 400);
            }

            $response = Http::withToken($this->accessToken)
                ->post('https://bankaccountdata.gocardless.com/api/v2/requisitions/', [
                    'institution_id' => $institutionId,
                    'redirect' => $redirectUri,
                    'reference' => uniqid('req_', true),
                ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'Failed to create requisition', 'details' => $response->body()], $response->status());
     }


    public function getAccountDetails($accountId) {
            $response = Http::withToken($this->accessToken)
                ->get("https://bankaccountdata.gocardless.com/api/v2/accounts/{$accountId}/");

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'Failed to fetch account details', 'details' => $response->body()], $response->status());
    }

    public function getAllAccounts() {
            // Fetch requisitions
            $response = Http::withToken($this->accessToken)
                ->get('https://bankaccountdata.gocardless.com/api/v2/requisitions/');

            if ($response->successful()) {
                $data = $response->json(); // Decode JSON response to array

                // Extract and merge all accounts from the results
                $accountIds = collect($data['results'] ?? [])
                    ->pluck('accounts') // Get all 'accounts' arrays
                    ->flatten()         // Merge all arrays into one flat array
                    ->unique()          // Ensure unique account IDs
                    ->toArray();        // Convert back to array

                // Initialize array to hold detailed account data
                $detailedAccounts = [];

                foreach ($accountIds as $accountId) {
                    // Fetch account details
                    $detailsResponse = Http::withToken($this->accessToken)
                        ->get("https://bankaccountdata.gocardless.com/api/v2/accounts/{$accountId}/");

                    // Fetch account balance
                    $balanceResponse = Http::withToken($this->accessToken)
                        ->get("https://bankaccountdata.gocardless.com/api/v2/accounts/{$accountId}/balances/");

                    // Build detailed account information
                    $detailedAccounts[] = [
                        'account_id' => $accountId,
                        'details' => $detailsResponse->successful() ? $detailsResponse->json() : null,
                        'balance' => $balanceResponse->successful() ? $balanceResponse->json() : null,
                    ];
                }

                return response()->json(['accounts' => $detailedAccounts]);
            }

            return response()->json(['error' => 'Failed to fetch requisitions', 'details' => $response->body()], $response->status());
    }

    public function getAccountBalance($accountId) {
            $response = Http::withToken($this->accessToken)
                ->get("https://bankaccountdata.gocardless.com/api/v2/accounts/{$accountId}/balances/");

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'Failed to fetch account balance', 'details' => $response->body()], $response->status());
    }

}
