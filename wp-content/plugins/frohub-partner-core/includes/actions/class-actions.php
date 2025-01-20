<?php
namespace FPServer;

use FPServer\CoreActions;
use FPServer\GravityForms;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Actions {

	public static function init() {
		$self = new self();
		CoreActions::init();
		GravityForms::init();
	}
}
