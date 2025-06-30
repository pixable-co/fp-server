import React, { useEffect, useState } from 'react';

const setCookie = (name, value, days = 3650) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
};

const getCookie = (name) => {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`))
        ?.split('=')[1];
};

const DashboardNotification = ({ isOnVacation = false, mobileServiceFee = true, serviceTypes = [], showStripeWarning = false }) => {
    const [isVacationVisible, setIsVacationVisible] = useState(false);
    const [isMobileFeeVisible, setIsMobileFeeVisible] = useState(false);
    const [isStripeVisible, setIsStripeVisible] = useState(false);

    const showMobileFeeWarning = !mobileServiceFee && serviceTypes.includes("Mobile");

    useEffect(() => {
        setIsVacationVisible(isOnVacation && !getCookie("hide_vacation"));
        setIsMobileFeeVisible(showMobileFeeWarning && !getCookie("hide_mobile_fee"));
        setIsStripeVisible(showStripeWarning && !getCookie("hide_stripe"));
    }, [isOnVacation, showMobileFeeWarning, showStripeWarning]);

    const handleVacationClose = () => {
        setIsVacationVisible(false);
        setCookie("hide_vacation", "1");
    };

    const handleMobileFeeClose = () => {
        setIsMobileFeeVisible(false);
        setCookie("hide_mobile_fee", "1");
    };

    const handleStripeClose = () => {
        setIsStripeVisible(false);
        setCookie("hide_stripe", "1");
    };

    return (
        <div className="notifications-wrapper" style={{ marginBottom: '20px' }}>
            {showStripeWarning && isStripeVisible && (
                <div className="notification-container" id="stripe-notification" style={{ marginBottom: '10px' }}>
                    <span className="notification-close" onClick={handleStripeClose}>×</span>
                    <i className="fas fa-exclamation-circle notification-icon"></i>
                    <strong>
                        <a href="/payouts" className="notification-link">
                            Connect Stripe to Start Getting Paid.
                        </a>
                    </strong> Link your Stripe account to receive deposit payments automatically.
                </div>
            )}

            {isOnVacation && isVacationVisible && (
                <div className="notification-container" id="vacation-notification" style={{ marginBottom: '10px' }}>
                    <span className="notification-close" onClick={handleVacationClose}>×</span>
                    <i className="fas fa-exclamation-circle notification-icon"></i>
                    <strong>You're currently on vacation mode.</strong> Go to your calendar to remove the event blocking your availability, or contact support for assistance.
                </div>
            )}

            {showMobileFeeWarning && isMobileFeeVisible && (
                <div className="notification-container" id="mobile-fee-notification" style={{ marginBottom: '10px' }}>
                    <span className="notification-close" onClick={handleMobileFeeClose}>×</span>
                    <i className="fas fa-exclamation-circle notification-icon"></i>
                    <strong>
                        <a href="/mobile-travel-fees" className="notification-link">
                            Set your Mobile Travel Fees.
                        </a>
                    </strong> You can now set custom travel fees for your mobile services.
                </div>
            )}
        </div>
    );
};

export default DashboardNotification;
