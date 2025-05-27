<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class InviteList {

    public static function init() {
        $self = new self();
        add_shortcode( 'invite_list', array($self, 'invite_list_shortcode') );
    }

    public function invite_list_shortcode() {
        $unique_key = 'invite_list' . uniqid();
        return '<div class="invite-container">
                    <p class="invite-text">
                        I’ve joined FroHub to grow my Black hair & beauty business — would love for you to join me! x</i>
                    </p>
                    <div class="invite-icons">
                        <a href="https://wa.me/?text=Join+this+amazing+community!" target="_blank"><i class="fab fa-whatsapp"></i></a>
                        <a href="https://www.messenger.com" target="_blank"><i class="fab fa-facebook-messenger"></i></a>
                        <a href="mailto:?subject=Join+Our+Community&amp;body=Check+out+this+amazing+platform!" target="_blank"><i class="fas fa-envelope"></i></a>
                        <a href="sms:?body=Join+this+amazing+community!" target="_blank"><i class="fas fa-sms"></i></a>
                        <a href="#" onclick="copyInviteLink()"><i class="fas fa-link"></i></a>
                    </div>
        </div>';
    }
}
