import React from 'react';
import { Skeleton } from 'antd';

const SubscriptionDetails = () => {
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
                        <table className="w-full text-sm border-collapse">
                            <thead>
                            <tr className="text-left border-b border-gray-300">
                                <th className="py-2">Date</th>
                                <th className="py-2">Total</th>
                                <th className="py-2">Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {billingHistory.map((entry, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="py-2">{entry.start_date}</td>
                                    <td className="py-2">{entry.total}</td>
                                    <td className="py-2">
                                        {entry.status === 'Failed' ? (
                                            <button className="text-red-600 underline hover:text-red-800">
                                                Pay
                                            </button>
                                        ) : (
                                            <span className="text-green-700">{entry.status}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {/*<a href="/downgrade" className="inline-block mt-4 text-blue-600 underline hover:text-blue-800">*/}
                        {/*    Downgrade to FroHub Lite*/}
                        {/*</a>*/}
                    </div>
                </>
            )}
        </div>
    );
};

export default SubscriptionDetails;