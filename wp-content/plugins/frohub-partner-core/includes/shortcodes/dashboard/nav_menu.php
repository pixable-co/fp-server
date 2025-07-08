<?php
namespace FPServer;

if (!defined('ABSPATH')) exit;

class NavMenu {

    public static function init() {
        $self = new self();

        add_shortcode('nav_menu', [$self, 'nav_menu_shortcode']);
        add_filter('nav_menu_item_title', [$self, 'wrap_menu_label'], 10, 4);
    }

    public function nav_menu_shortcode() {
        ob_start();
        ?>
        <!-- ✅ Topbar -->
        <div class="fp-topbar">
            <div class="fp-topbar-content">
                <img src="<?php echo site_url('/wp-content/uploads/2025/03/FroHub-Partners.png'); ?>" alt="FroHub Logo" style="height: 28px; margin-right: 10px;">
            </div>
            <div class="fp-topbar-icons">
                <?php echo do_shortcode('[my_booking_link]');?>
                <a href="/messages"><i class="fas fa-comments-alt"></i></a>
                <div class="fp-user-dropdown">
                    <i class="fas fa-user" id="fpUserToggle"></i>
                    <div class="fp-dropdown-menu" id="fpDropdownMenu">
                        <a href="/my-account">Account</a>
                        <a href="/help-centre">Help & FAQs</a>
                        <a href="/invite-a-friend">Invite a Friend</a>
                        <hr>
                        <a href="<?php echo wp_logout_url(home_url()); ?>">Log out</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- ✅ Sidebar -->
        <div class="fp-nav-sidebar">
            <span class="fp-toggle-container"><button class="fp-nav-toggle"><i class="far fa-chevron-left"></i></button></span>
            <nav class="fp-menu-wrapper">
                <?php
                wp_nav_menu([
                    'menu' => 'sidebar_menu',
                    'menu_class' => 'fp-nav-list',
                    'container' => false
                ]);
                ?>
            </nav>
        </div>

        <!-- Mobile toggle button that appears when sidebar is collapsed -->
        <button class="mobile-menu-toggle"><i class="far fa-bars"></i></button>

        <style>
        /* ===== TOPBAR ===== */
        .fp-topbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background-color: #f8f8f8;
            border-bottom: 1px solid #ddd;
            z-index: 1001;
            display: flex;
            align-items: center;
        }

        .fp-topbar-content {
            padding: 0 20px;
            font-size: 14px;
            color: #444;
            display: flex;
            align-items: center;
            height: 100%;
        }

        .fp-topbar-icons {
            margin-left: auto;
            margin-right: 20px;
            display: flex;
            align-items: center;
            gap: 20px;
            position: relative;
        }

        .fp-topbar-icons i {
            font-size: 18px;
            color: #888;
            cursor: pointer;
        }

        .fp-user-dropdown {
            position: relative;
        }

        .fp-dropdown-menu {
            display: none;
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 10px 0;
            border-radius: 6px;
            width: 180px;
            z-index: 1002;
        }

        .fp-dropdown-menu a {
            display: block;
            padding: 10px 16px;
            text-decoration: none;
            color: #333;
            font-size: 14px;
            white-space: nowrap;
        }

        .fp-dropdown-menu a:hover {
            background-color: #f5f5f5;
        }

        .fp-dropdown-menu hr {
            margin: 8px 0;
            border: none;
            border-top: 1px solid #eee;
        }

        body.admin-bar .fp-topbar {
            margin-top: 32px;
        }

        /* ===== SIDEBAR ===== */
        .fp-nav-sidebar {
            width: 250px;
            height: 100vh;
            background-color: #f5f5f5;
            transition: all 0.3s ease;
            color: #444;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 999;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            padding-top: 60px;
            /* Default state is expanded */
            transform: translateX(0);
        }

        body.admin-bar .fp-nav-sidebar {
            padding-top: 92px;
        }

        body:not(.admin-bar) .fp-nav-sidebar {
            padding-top: 60px;
        }

        .fp-nav-sidebar.collapsed {
            width: 60px;
        }

        .fp-toggle-container {
            margin-left: 1rem;
            margin-top: 2rem;
        }

        .fp-nav-toggle {
            background: #f5f5f5;
            color: #444;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            padding: 0;
            font-size: 16px;
            position: relative;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }

        .fp-nav-sidebar.collapsed .fp-nav-toggle {
            margin-bottom: 15px;
        }

        .fp-menu-wrapper {
            width: 100%;
            overflow-y: auto;
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
            padding: 12px 15px;
            text-decoration: none;
            color: #444;
            gap: 15px;
            border-bottom: 1px solid #eee;
        }

        .fp-nav-list li a:hover {
            background: #e9e9e9;
        }

        .fp-submenu,
        .fp-nav-sidebar .sub-menu {
            display: none;
            background: #f0f0f0;
            padding: 0;
            margin: 0;
            list-style: none;
            transition: all 0.3s ease;
        }

        .fp-submenu li,
        .fp-nav-sidebar .sub-menu li {
            font-size: 13px;
            border-top: 1px solid #e0e0e0;
            color: #444;
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

        .fp-nav-sidebar.collapsed .menu-item-has-children > a::after {
            display: none;
        }

        /* Pro badge styling */
        .pro-badge {
            background: #666;
            color: white;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 3px;
            margin-left: 5px;
        }

        /* Reset and ensure icons stay left-aligned in collapsed mode */
        .fp-nav-sidebar.collapsed .fp-nav-list li a {
            justify-content: flex-start !important; /* Force left alignment */
            padding-left: 20px !important; /* Add specific left padding to control icon position */
            padding-right: 0 !important; /* Remove right padding when collapsed */
        }

        /* Control icon spacing specifically */
        .fp-nav-sidebar.collapsed .fp-nav-list li a i {
            margin-right: 0 !important; /* Remove right margin on icons */
        }

        /* Ensure chevron icon for dropdown is hidden */
        .fp-nav-sidebar.collapsed .fp-nav-list .menu-item-has-children > a i.fa-chevron-down {
            display: none !important;
        }

        /* If the issue persists, try this more forceful approach */
        @media (min-width: 769px) {
            .fp-nav-sidebar.collapsed .fp-nav-list li a {
                display: flex !important;
                justify-content: flex-start !important;
                align-items: center !important;
                padding-left: 20px !important;
            }
        }

        /* ===== MOBILE SPECIFIC STYLES ===== */
        @media (max-width: 768px) {
            /* Hide sidebar by default on mobile */
            .fp-nav-sidebar {
                transform: translateX(-100%);
                width: 250px; /* Always full width on mobile when shown */
            }

            /* Show sidebar when it has mobile-expanded class */
            .fp-nav-sidebar.mobile-expanded {
                transform: translateX(0);
            }

            /* Mobile menu toggle button */
            .mobile-menu-toggle {
                position: fixed;
                left: 10px;
                top: 70px;
                z-index: 998;
                display: flex; /* Always show on mobile */
                background: #f5f5f5;
                border: 1px solid #ddd;
                color: #444;
                width: 40px;
                height: 40px;
                border-radius: 4px;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }

            body.admin-bar .mobile-menu-toggle {
                top: 102px;
            }

            /* Hide regular toggle on mobile */
            .fp-nav-sidebar .fp-nav-toggle {
                display: none;
            }

            /* Make the dropdown menu touch-friendly */
            .fp-dropdown-menu a {
                padding: 12px 16px;
            }
        }

        /* Hide mobile menu toggle on desktop */
        @media (min-width: 769px) {
            .mobile-menu-toggle {
                display: none;
            }
        }

        /* ===== MAIN CONTENT SHIFTING (for Impreza) ===== */
        body:not(.admin-bar) #page-content.l-main {
            margin-left: 250px;
            margin-top: 60px;
            transition: margin-left 0.3s ease;
        }

        body.admin-bar #page-content.l-main {
            margin-left: 250px;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
            body:not(.admin-bar) #page-content.l-main,
            body.admin-bar #page-content.l-main {
                margin-left: 0px !important;
            }
        }

        .fp-nav-sidebar.collapsed ~ #page-content.l-main {
            margin-left: 60px;
        }

        @media (max-width: 768px) {
            .fp-nav-sidebar.collapsed ~ #page-content.l-main {
                margin-left: 0 !important;
            }
        }

        #page-content.l-main {
            padding: 20px;
        }

        /* Add this overlay to darken background when mobile menu is open */
        .mobile-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 998;
        }

        .mobile-overlay.active {
            display: block;
        }
        </style>

        <div class="mobile-overlay"></div>

        <script>
        document.addEventListener('DOMContentLoaded', function () {
            const sidebar = document.querySelector('.fp-nav-sidebar');
            const toggleBtn = document.querySelector('.fp-nav-toggle');
            const mobileToggle = document.querySelector('.mobile-menu-toggle');
            const overlay = document.querySelector('.mobile-overlay');
            const isMobile = window.innerWidth <= 768;

            // Initialize sidebar state based on screen size
            if (isMobile) {
                sidebar.classList.remove('collapsed');
                // Don't add mobile-expanded initially on mobile
            } else {
                sidebar.classList.remove('collapsed');
            }

            // Toggle sidebar when the internal button is clicked (desktop)
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    sidebar.classList.toggle('collapsed');
                    toggleBtn.innerHTML = sidebar.classList.contains('collapsed') ?
                        '<i class="far fa-chevron-right"></i>' :
                        '<i class="far fa-chevron-left"></i>';
                });
            }

            // Toggle sidebar when the mobile button is clicked
            if (mobileToggle) {
                mobileToggle.addEventListener('click', () => {
                    sidebar.classList.toggle('mobile-expanded');
                    overlay.classList.toggle('active');
                });
            }

            // Close sidebar when clicking on overlay
            if (overlay) {
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('mobile-expanded');
                    overlay.classList.remove('active');
                });
            }

            // Close sidebar on link click for mobile
            document.querySelectorAll('.fp-nav-list a').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('mobile-expanded');
                        overlay.classList.remove('active');
                    }
                });
            });

            // User dropdown toggle
            const userToggle = document.getElementById('fpUserToggle');
            const dropdownMenu = document.getElementById('fpDropdownMenu');

            if (userToggle && dropdownMenu) {
                userToggle.addEventListener('click', function (e) {
                    dropdownMenu.style.display = (dropdownMenu.style.display === 'block') ? 'none' : 'block';
                    e.stopPropagation();
                });

                // Close on outside click
                document.addEventListener('click', function () {
                    dropdownMenu.style.display = 'none';
                });
            }

            // Handle window resize
            window.addEventListener('resize', function() {
                const currentIsMobile = window.innerWidth <= 768;

                // Update layout when switching between mobile and desktop
                if (currentIsMobile !== isMobile) {
                    if (currentIsMobile) {
                        sidebar.classList.remove('mobile-expanded');
                        overlay.classList.remove('active');
                    } else {
                        sidebar.classList.remove('collapsed');
                    }
                }
            });
        });
        </script>
        <?php
        return ob_get_clean();
    }

    public function wrap_menu_label($title, $item, $args, $depth) {
        if (!empty($args->menu_class) && $args->menu_class === 'fp-nav-list') {
            // Check if the title already contains an icon
            if (strpos($title, '<i class="') !== false) {
                $label = preg_replace('/<\/i>\s*(.+)/', '</i> <span class="label">$1</span>', $title);
            } else {
                // Default icon if none exists
                $label = '<i class="far fa-circle"></i> <span class="label">' . $title . '</span>';
            }

            // Add Pro badge if this item has a specific class
            if (in_array('pro-item', $item->classes)) {
                $label .= ' <span class="pro-badge">PRO</span>';
            }

            // Add dropdown icon if menu item has children
            if (in_array('menu-item-has-children', $item->classes) && $depth === 0) {
                $label .= ' <i class="far fa-chevron-down"></i>';
            }

            return $label;
        }
        return $title;
    }
}