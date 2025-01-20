<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Twillo {

	public static function init() {
		$self = new self();
	}

    public function sendSms(Request $request) {
            // Validate the request
    //         $request->validate([
    //             'phone_number' => 'required|string', // Validate phone number
    //         ]);

            $twilioSid = 'ACbe089503bb54a4607c201ce0540961ed';
            $twilioToken = '3b3690d5a56b44d8a6c6818ba5fd8f60';
            $twilioServiceSid = 'VA5b1a480aea68793b2c594f74c1abb847'; // Twilio Verify Service SID

            $toNumber = '+4407855941709';

            try {
                $client = new Client($twilioSid, $twilioToken);

                // Create a verification request
                $verification = $client->verify->v2->services($twilioServiceSid)
                                                   ->verifications
                                                   ->create($toNumber, 'sms');

                return response()->json(['success' => true, 'message' => 'Verification code sent successfully', 'data' => $verification]);
            } catch (\Exception $e) {
                return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
            }
    }

}
