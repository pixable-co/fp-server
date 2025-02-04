<?php
namespace FPServer;

use FPServer\GetGoogleCalenderEvents;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class API {

	public static function init() {
		$self = new self();
		GetGoogleCalenderEvents::init();
	}
}