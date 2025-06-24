import React, { useState } from 'react';

const DashboardNotification = ({ isOnVacation = false, mobileServiceFee = true, serviceTypes = [] }) => {
    const [isVacationVisible, setIsVacationVisible] = useState(true);
    const [isMobileFeeVisible, setIsMobileFeeVisible] = useState(true);

    // Check if mobile service exists but mobileServiceFee is false
    const showMobileFeeWarning = !mobileServiceFee && serviceTypes.includes("Mobile");

    // Handle close notifications
    const handleVacationClose = () => {
        setIsVacationVisible(false);
    };

    const handleMobileFeeClose = () => {
        setIsMobileFeeVisible(false);
    };

    return (
        <div className="notifications-wrapper" style={{ marginBottom: '20px' }}>
            {/* Vacation Notification */}
            {isOnVacation && isVacationVisible && (
                <div className="notification-container" id="vacation-notification" style={{ marginBottom: '10px' }}>
                    <span className="notification-close" onClick={handleVacationClose}>×</span>
                    <i className="fas fa-exclamation-circle notification-icon"></i>
                    <strong>You're currently on vacation mode.</strong> Go to your calendar to remove the event blocking your availability, or contact support for assistance.
                </div>
            )}

            {/* Mobile Fee Warning Notification */}
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