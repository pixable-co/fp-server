<?php
namespace FPServer;

use FPServer\UserLogin;
use FPServer\ServiceForm;
use FPServer\MobileService;
use FPServer\BookingCalender;
use FPServer\PartnerBookings;
use FPServer\GoogleCalender;
use FPServer\BookingChart;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Shortcodes {

	public static function init() {
		$self = new self();
		UserLogin::init();
		ServiceForm::init();
		MobileService::init();
		BookingCalender::init();
		PartnerBookings::init();
		FpBookingTable::init();
		GoogleCalender::init();
        BookingChart::init();
	}
}
