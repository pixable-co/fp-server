<?php
namespace FPServer;

use FPServer\UserLogin;
use FPServer\ServiceForm;
use FPServer\BookingCalender;
use FPServer\PartnerBookings;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Shortcodes {

	public static function init() {
		$self = new self();
		UserLogin::init();
		ServiceForm::init();
		BookingCalender::init();
		PartnerBookings::init();
	}
}
