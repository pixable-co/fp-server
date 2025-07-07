<?php
namespace FPServer;

use FPServer\SubscriptionHandeler;

use FPServer\GetPartnerData;

use FPServer\ReturnOrderDetails;

use FPServer\PartnerConversations;

use FPServer\ConnectCalender;


use FPServer\Twillo;
use FPServer\GoCardless;
use FPServer\Xero;

use FPServer\MediaUpload;
use FPServer\ForgotPassword;
use FPServer\SubscriptionHandler;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Ajax {

	public static function init() {
		$self = new self();
		MediaUpload::init();
// 		Twillo::init();
// 		GoCardless::init();
// 		Xero::init();
		ConnectCalender::init();
		ForgotPassword::init();
		PartnerConversations::init();
		ReturnOrderDetails::init();
		GetPartnerData::init();
		SubscriptionHandler::init();
	}
}
