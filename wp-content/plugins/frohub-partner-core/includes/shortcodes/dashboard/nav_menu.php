<?php
namespace FPServer;

if (!defined('ABSPATH')) exit;

class NavMenu {

    public static function init() {
        $self = new self();

        // Register shortcode
        add_shortcode('nav_menu', [$self, 'nav_menu_shortcode']);

        // Filter menu item titles to wrap with <span class="label">
        add_filter('nav_menu_item_title', [$self, 'wrap_menu_label'], 10, 4);
    }

    public function nav_menu_shortcode() {
        ob_start();
        ?>
        <div class="fp-nav-sidebar expanded">
            <button class="fp-nav-toggle">&lt;</button>
            <nav class="fp-menu-wrapper">
                <?php
                wp_nav_menu([
                    'menu' => 'sidebar_menu', // Replace with your menu slug or ID
                    'menu_class' => 'fp-nav-list',
                    'container' => false
                ]);
                ?>
            </nav>
        </div>

        <style>
        .fp-nav-sidebar {
            width: 250px;
            height: 100vh;
            background-color: #1e3050;
            padding: 15px;
            padding-top: 5rem;
            transition: width 0.3s ease;
            color: #fff;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 999;
        }

        @media (max-width: 768px) {
            .fp-nav-sidebar {
                transform: translateX(-100%);
            }

            .fp-nav-sidebar.expanded {
                transform: translateX(0);
            }

            .fp-nav-toggle {
                position: fixed;
                left: 10px;
                top: 10px;
                z-index: 1000;
            }
        }

        .fp-nav-sidebar.collapsed {
            width: 80px;
        }

        .fp-nav-toggle {
            background: #222;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 10px;
            padding: 6px 10px;
            font-size: 14px;
        }

        .fp-nav-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .fp-nav-list li {
            font-size: 14px;
            transition: background 0.2s;
        }

        .fp-nav-list li a {
            display: flex;
            align-items: center;
            padding: 10px;
            text-decoration: none;
            color: #fff;
            gap: 10px;
        }

        .fp-nav-list li a:hover {
            background: #111;
        }

        .fp-nav-list li.menu-item-has-children > a::after {
            content: "▼";
            margin-left: auto;
            font-size: 10px;
        }

        .fp-submenu,
        .fp-nav-sidebar .sub-menu {
            display: none;
            background: #111;
            padding: 0;
            margin: 0;
            list-style: none;
        }

        .fp-submenu li,
        .fp-nav-sidebar .sub-menu li {
/*             padding: 8px 35px; */
            font-size: 13px;
            border-top: 1px solid #222;
            color: white;
        }

        .fp-submenu li:hover,
        .fp-nav-sidebar .sub-menu li:hover {
            background: #222;
        }

        .fp-nav-sidebar .menu-item-has-children:hover > .sub-menu {
            display: block;
        }

        .fp-nav-sidebar.collapsed .label {
            display: none;
        }

        .fp-nav-sidebar.collapsed .menu-item-has-children .sub-menu {
            display: none !important;
        }
        </style>

        <script>
        document.addEventListener('DOMContentLoaded', function () {
            const sidebar = document.querySelector('.fp-nav-sidebar');
            const toggleBtn = document.querySelector('.fp-nav-toggle');

            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                sidebar.classList.toggle('expanded');
                toggleBtn.innerHTML = sidebar.classList.contains('collapsed') ? '›' : '&lt;';
            });

            // Auto-collapse sidebar when a link is clicked on mobile
            document.querySelectorAll('.fp-nav-list a').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('expanded');
                        sidebar.classList.add('collapsed');
                    }
                });
            });
        });
        </script>
        <?php
        return ob_get_clean();
    }

    public function wrap_menu_label($title, $item, $args, $depth) {
        if (!empty($args->menu_class) && $args->menu_class === 'fp-nav-list') {
            // If icon is present in title, wrap only the label part
            if (preg_match('/<\/i>\s*(.+)/', $title, $matches)) {
                return preg_replace('/<\/i>\s*(.+)/', '</i> <span class="label">' . $matches[1] . '</span>', $title);
            }
            return '<span class="label">' . $title . '</span>';
        }
        return $title;
    }
}
