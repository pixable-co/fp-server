import React, { useEffect } from 'react';
import { Skeleton } from 'antd';

const SubscriptionDetails = () => {
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = 'h2 { display: none !important; }';
        document.head.appendChild(style);

        // Clean up on unmount
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    if (typeof fpserver_settings === 'undefined') {
        return <p>No subscription data found.</p>;
    }

    const hasActiveSubscription = fpserver_settings.has_active_subscription;
    const subscriptionData = fpserver_settings.subscription_data || {};
    const billingHistory = fpserver_settings.billing_history || [];

    const isLitePlan = !hasActiveSubscription || hasActiveSubscription === '';
    const currentPlan = billingHistory[0]?.plan_name?.toLowerCase() || '';

    const handleUpgrade = () => {
        window.location.href = `/product/frohub/?switch-subscription=5479&item=659`;
    };

    return (
        <div className="frohub-subscription-wrapper">
            {isLitePlan ? (
                <>
                    <div className="subscription-card lite">
                        <div className="header">
                            <h3>FroHub Lite</h3>
                            <span className="current-plan-badge">✔ Your Current Plan</span>
                        </div>
                        <p>All the essentials you need to provide great service to your clients.</p>
                        <p>£0/month + 7% booking fee</p>
                    </div>

                    <div className="subscription-card pro-offer">
                        <h3>FroHub Pro</h3>
                        <p>Advanced features to support serious professionals ready to grow their business.</p>
                        <ul className="features">
                            <li>✅ Everything in Lite</li>
                            <li>✅ Sync your calendar for real-time availability</li>
                            <li>✅ FroHub Mobile app for quick access</li>
                            <li>✅ In-depth client insights</li>
                            <li>✅ Client marketing tools</li>
                            <li>✅ Advanced reporting and analytics</li>
                            <li>✅ Set and track growth goals</li>
                            <li>✅ Verified Partner Badge</li>
                        </ul>
                        <div className="pricing">
                            <p><strong>£16/month + 7% per booking</strong></p>
                            <p>Save 20% when paid annually</p>
                        </div>
                        <button onClick={handleUpgrade} className="mt-4 upgrade-button">Upgrade</button>
                    </div>
                </>
            ) : (
                <>
                    <div className="subscription-card pro">
                        <div className="header">
                            <h3>
                                {currentPlan.includes('yearly') ? 'FroHub Pro Yearly' : 'FroHub Pro Monthly'}
                            </h3>
                            <span className="current-plan-badge">✔ Your Current Plan</span>
                        </div>

                        {currentPlan.includes('yearly') ? (
                            <>
                                <p>£192/year + 7% booking fee</p>
                                {subscriptionData.renewal_date && (
                                    <p>Automatically renews on: {subscriptionData.renewal_date}</p>
                                )}
                            </>
                        ) : (
                            <>
                                <p>£20/month + 7% booking fee</p>
                                {subscriptionData.renewal_date && (
                                    <p>Renews monthly on: {subscriptionData.renewal_date}</p>
                                )}
                            </>
                        )}
                    </div>

                    <div className="billing-history mt-6">
                        <h3 className="text-lg font-semibold mb-2">Billing History</h3>
                        <div className="w-3/6 text-sm">
                            <div className="grid grid-cols-3 gap-0 font-semibold border-b border-gray-300 py-2">
                                <span>Date</span>
                                <span>Total</span>
                                <span>Status</span>
                            </div>

                            {billingHistory.length > 0 ? (
                                billingHistory.map((entry, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-3 border-b border-gray-200 py-3 text-sm items-center"
                                    >
                                        <span>{entry.start_date}</span>
                                        <span>{entry.total}</span>
                                        <span>
                        {entry.status.toLowerCase() === 'failed' ? (
                            <button className="text-red-600 underline hover:text-red-800">
                                Pay
                            </button>
                        ) : (
                            <span className="text-green-700">{entry.status}</span>
                        )}
                    </span>
                                    </div>
                                ))
                            ) : (
                                <div className="py-3 text-gray-500">No billing history found.</div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SubscriptionDetails;