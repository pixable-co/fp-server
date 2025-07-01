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

const DashboardNotification = ({
                                   isOnVacation = false,
                                   mobileServiceFee = true,
                                   serviceTypes = [],
                                   showStripeWarning = false
                               }) => {
    const [isVacationVisible, setIsVacationVisible] = useState(false);
    const [isMobileFeeVisible, setIsMobileFeeVisible] = useState(false);
    const [isStripeVisible, setIsStripeVisible] = useState(showStripeWarning);
    const [isTipVisible, setIsTipVisible] = useState(() => {
        return !showStripeWarning && !getCookie("hide_tip_notice");
    });

    const showMobileFeeWarning = !mobileServiceFee && serviceTypes.includes("Mobile");

    useEffect(() => {
        setIsVacationVisible(isOnVacation && !getCookie("hide_vacation"));
        setIsMobileFeeVisible(showMobileFeeWarning && !getCookie("hide_mobile_fee"));

        if (!isStripeVisible && !getCookie("hide_tip_notice")) {
            setIsTipVisible(true);
        } else {
            setIsTipVisible(false);
        }
    }, [isOnVacation, showMobileFeeWarning, isStripeVisible]);

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
    };

    const handleTipClose = () => {
        setIsTipVisible(false);
        setCookie("hide_tip_notice", "1");
    };

    return (
        <div className="notifications-wrapper" style={{ marginBottom: '20px' }}>
            {isStripeVisible && (
                <div className="notification-container" id="stripe-notification" style={{ marginBottom: '10px' }}>
                    <i className="fas fa-exclamation-circle notification-icon"></i>
                    <strong>
                        <a href="/payouts" className="notification-link">
                            Connect Stripe to Start Getting Paid.
                        </a>
                    </strong> Link your Stripe account to receive deposit payments automatically.
                    <span className="notification-close" onClick={handleStripeClose}>×</span>
                </div>
            )}

            {isTipVisible && (
                <div className="flex items-center justify-between bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 mb-2">
                    <div className="flex items-center gap-3">
                        <i className="fas fa-lightbulb text-gray-500 text-sm"></i>
                        <span className="font-medium text-gray-600">Tip</span>
                        <span className="text-gray-600">The more services you add, the better your marketing reach to new clients.</span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <a
                            href="/my-services/create-a-service/"
                            className="text-gray-800 underline font-medium whitespace-nowrap"
                        >
                            Add Services
                        </a>
                        <span
                            onClick={handleTipClose}
                            className="cursor-pointer text-gray-500 font-bold text-base"
                        >
                ×
            </span>
                    </div>
                </div>
            )}

            {isVacationVisible && (
                <div className="notification-container" id="vacation-notification" style={{ marginBottom: '10px' }}>
                    <span className="notification-close" onClick={handleVacationClose}>×</span>
                    <i className="fas fa-exclamation-circle notification-icon"></i>
                    <strong>You're currently on vacation mode.</strong> Go to your calendar to remove the event blocking your availability, or contact support for assistance.
                </div>
            )}

            {isMobileFeeVisible && (
                <div className="notification-container" id="mobile-fee-notification" style={{ marginBottom: '10px' }}>
                    <span className="notification-close" onClick={handleMobileFeeClose}>×</span>
                    <i className="fas fa-exclamation-circle notification-icon"></i>
                    <strong>
                        <a href="/mobile-travel-fees" className="notification-link">
                            Set your Mobile Travel Fees.
                        </a>
                    </strong> If you offer mobile services, you can now set custom travel fees.
                </div>
            )}
        </div>
    );
};

export default DashboardNotification;
