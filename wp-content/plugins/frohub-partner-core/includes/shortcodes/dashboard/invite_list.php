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
        ob_start();
        ?>
        <style>
                .invite-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px 16px;
                    font-family: inherit;
                    max-width: 100%;
                    box-shadow: 0 0 0 1px #f0f0f0;
                }

                .invite-text {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 500;
                    color: #000;
                    flex: 1;
                }

                .invite-text .heart {
                    color: #E63946;
                    margin-left: 4px;
                }

                .invite-icons {
                    display: flex;
                    gap: 8px;
                    margin-left: 12px;
                    position: relative;
                }

                .invite-icons a {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #f1f1f1;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    text-decoration: none;
                    color: #000;
                    font-size: 14px;
                    position: relative;
                    transition: background 0.2s;
                }

                .invite-icons a:hover {
                    background-color: #e2e2e2;
                }

                .copy-popover {
                    position: absolute;
                    bottom: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: #333;
                    color: #fff;
                    font-size: 12px;
                    padding: 5px 8px;
                    border-radius: 4px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                }

                .copy-popover.show {
                    opacity: 1;
                }
            </style>

        <div class="invite-container">
            <p class="invite-text">I’ve joined FroHub to grow my Black hair & beauty business — would love for you to join me! x</p>
            <div class="invite-icons">
                <a href="https://wa.me/?text=Hey%2C+I%E2%80%99ve+been+using+FroHub+to+book+Afro+hairdressers%2C+and+it%E2%80%99s+amazing!+I+think+you%E2%80%99d+be+a+great+addition+to+their+community.+Check+it+out+if+you%E2%80%99d+like+to+join%3A+https%3A%2F%2Ffrohub.com%2Fpartners%2F+x+%F0%9F%98%8A%E2%9D%A4%EF%B8%8F" target="_blank"><i class="fab fa-whatsapp"></i></a>
                <a href="https://www.messenger.com/" target="_blank"><i class="fab fa-facebook-messenger"></i></a>
                <a href="/messages" target="_blank"><i class="fas fa-comments-alt"></i></a>
                <a href="sms:?body=Join+this+amazing+community!" target="_blank"><i class="fas fa-sms"></i></a>
                <a href="#" onclick="copyInviteLink(event)" id="copyLink"><i class="fas fa-link"></i></a>
                <div class="copy-popover" id="copyPopover">Link copied!</div>
            </div>
        </div>

        <script>
                function copyInviteLink(event) {
                    event.preventDefault();
                    const text = "Hey, I’ve been using FroHub to book Afro hairdressers, and it’s amazing! I think you’d be a great addition to their community. Check it out if you’d like to join: https://frohub.com/partners/ x 😊❤️"; // Replace with your actual invite link
                    const popover = document.getElementById('copyPopover');

                    navigator.clipboard.writeText(text).then(() => {
                        popover.classList.add('show');
                        setTimeout(() => {
                            popover.classList.remove('show');
                        }, 1200);
                    });
                }
            </script>

        <?php
        return ob_get_clean();
    }
}
