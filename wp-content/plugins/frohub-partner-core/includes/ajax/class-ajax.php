<?php
namespace FPServer;

use FPServer\ConnectCalender;


use FPServer\Twillo;
use FPServer\GoCardless;
use FPServer\Xero;

use FPServer\MediaUpload;

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
	}
}
