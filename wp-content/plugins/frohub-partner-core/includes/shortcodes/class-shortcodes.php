<?php
namespace FPServer;

use FPServer\UserLogin;
use FPServer\ServiceForm;
use FPServer\MobileService;
use FPServer\BookingCalender;
use FPServer\PartnerBookings;
use FPServer\GoogleCalender;
use FPServer\BookingChart;
use FPServer\BookingStats;
use FPServer\ReviewCount;
use FPServer\UpcomingOrder;
use FPServer\PendingBookings;
use FPServer\UnreadConversations;
use FPServer\PartnerIntegrations;
use FPServer\ValueOfBookingChart;
use FPServer\PartnerProfileAutoMessage;
use FPServer\PartnerMessage;
use FPServer\PartnerMessageMobile;
use FPServer\PartnerBrodcastMessage;

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
		BookingStats::init();
		ReviewCount::init();
		UpcomingOrder::init();
		PendingBookings::init();
		UnreadConversations::init();
		NavMenu::init();
		PartnerIntegrations::init();
		ValueOfBookingChart::init();
		ForgotPasswordForm::init();
		PartnerProfileForm::init();
		PartnerProfileAvailibility::init();
		PartnerProfileAutoMessage::init();
		PartnerMessage::init();
		PartnerMessageMobile::init();
		PartnerBrodcastMessage::init();
	}
}
