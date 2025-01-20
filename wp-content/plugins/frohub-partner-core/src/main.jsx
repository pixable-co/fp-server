import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import { StyleProvider } from '@ant-design/cssinjs';
import './index.css'
import UserLogin from "./shortcodes/UserLogin/UserLogin.jsx"
import ServiceForm from "./shortcodes/ServiceForm/ServiceForm.jsx";
import PartnerBookings from "./shortcodes/PartnerBookings/PartnerBookings.jsx";
import BookingCalender from "./shortcodes/BookingCalender/BookingCalender.jsx";

// Define your theme configuration
const themeConfig = {
    token: {
        // Your custom token configuration
        colorPrimary: '#your-primary-color',
        borderRadius: 6,
        // ... other token configurations
    },
    components: {
        // Component-level configurations
        Select: {
            // Remove default styles
            className: 'custom-select',
            style: { all: 'unset' }
        },
        // ... other component configurations
    }
};

// Create a wrapper component to avoid code duplication
const WithConfigProvider = ({ children }) => (
    <StrictMode>
            <StyleProvider hashPriority="high">
                {children}
            </StyleProvider>
    </StrictMode>
);

const userLogin = document.querySelectorAll('.fp-login');
userLogin.forEach(element => {
    const key = element.getAttribute('data-key');
    createRoot(element).render(
        <WithConfigProvider>
            <UserLogin dataKey={key} />
        </WithConfigProvider>
    );
});

const partnerBookings = document.querySelectorAll('.fp-partner-bookings');
partnerBookings.forEach(element => {
    const key = element.getAttribute('data-key');
    createRoot(element).render(
        <WithConfigProvider>
            <PartnerBookings dataKey={key} />
        </WithConfigProvider>
    );
});

const serviceForm = document.querySelectorAll('.fp-add-service');
serviceForm.forEach(element => {
    const key = element.getAttribute('data-key');
    createRoot(element).render(
        <WithConfigProvider>
            <ServiceForm dataKey={key} />
        </WithConfigProvider>
    );
});

const bookingCalender = document.querySelectorAll('.fp-booking-calender');
bookingCalender.forEach(element => {
    const key = element.getAttribute('data-key');
    createRoot(element).render(
        <WithConfigProvider>
            <BookingCalender dataKey={key} />
        </WithConfigProvider>
    );
});
