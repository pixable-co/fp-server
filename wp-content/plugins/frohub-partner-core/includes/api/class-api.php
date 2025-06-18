<?php
namespace FPServer;

use FPServer\GetGoogleCalenderEvents;
use FPServer\CloneEcomProduct;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class API {

	public static function init() {
		$self = new self();
		GetGoogleCalenderEvents::init();
		CloneEcomProduct::init();
	}
}