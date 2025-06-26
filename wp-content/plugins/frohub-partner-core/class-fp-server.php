<?php

	/**
	 *
	 * @link              https://pixable.co/
	 * @since             0.0.5
	 * @package           Frohub Partners Server Plugin
	 *
	 * @wordpress-plugin
	 * Plugin Name:       Frohub Partners Server Plugin
	 * Plugin URI:        https://pixable.co/
	 * Description:       Core Plugin & Functions Fro Frohub Pratners
	 * Version:           0.0.5
	 * Author:            Pixable
	 * Author URI:        https://pixable.co/
	 * License:           GPL-2.0+
	 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
	 * Text Domain:       fp-server
	 * Tested up to:      6.7
	 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class FrohubServer {

	private function __construct() {
		$this->define_constants();
		$this->load_dependency();
		register_activation_hook( __FILE__, array( $this, 'activate' ) );
		register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );
		add_action( 'plugins_loaded', array( $this, 'init_plugin' ) );
	}

	public static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new self();
		}

			return $instance;
	}

	public function define_constants() {
		define( 'FPSERVER_VERSION', '0.0.4' );
		define( 'FPSERVER_PLUGIN_FILE', __FILE__ );
		define( 'FPSERVER_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );
		define( 'FPSERVER_ROOT_DIR_PATH', plugin_dir_path( __FILE__ ) );
		define( 'FPSERVER_ROOT_DIR_URL', plugin_dir_url( __FILE__ ) );
		define( 'FPSERVER_INCLUDES_DIR_PATH', FPSERVER_ROOT_DIR_PATH . 'includes/' );
		define( 'FPSERVER_PLUGIN_SLUG', 'fp-server' );
		define( 'FPSERVER_ECOM_BASE_API_URL',untrailingslashit(get_field( 'frohub_ecom_base_api_url', 'option' )));
		define( 'FPSERVER_GOOGLE_API_KEY',untrailingslashit(get_field( 'google_api_key', 'option' )));
	}

	public function on_plugins_loaded() {
		do_action( 'fpserver_loaded' );
	}

	public function init_plugin() {
		$this->load_textdomain();
		$this->dispatch_hooks();
	}

	public function dispatch_hooks() {
		FPServer\Autoload::init();
		FPServer\Enqueue::init();
		FPServer\Shortcodes::init();
		FPServer\Ajax::init();
		FPServer\API::init();
		FPServer\Actions::init();
	}

	public function load_textdomain() {
		load_plugin_textdomain(
			'fp-server',
			false,
			dirname( plugin_basename( __FILE__ ) ) . '/languages/'
		);
	}

	public function load_dependency() {
		require_once FPSERVER_INCLUDES_DIR_PATH . 'class-autoload.php';
	}

	public function activate() {
	}

	public function deactivate() {
	}
}

function fpserver_start() {
	return FrohubServer::init();
}


    fpserver_start();