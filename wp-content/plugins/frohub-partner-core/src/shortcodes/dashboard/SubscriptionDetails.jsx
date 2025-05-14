const SubscriptionDetails = () => {
    if (typeof fpserver_settings === 'undefined') {
        return <p>No subscription data found.</p>;
    }
    console.log(fpserver_settings)
    const hasActiveSubscription = fpserver_settings.has_active_subscription;
    const subscriptionData = fpserver_settings.subscription_data || {};
    const billingHistory = fpserver_settings.billing_history || [];

    const isLitePlan = !hasActiveSubscription || hasActiveSubscription === '';

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
                        <button className="upgrade-button">Upgrade</button>
                    </div>
                </>
            ) : (
                <>
                    <div className="subscription-card pro">
                        <div className="header">
                            <h3>FroHub Pro</h3>
                            <span className="current-plan-badge">✔ Your Current Plan</span>
                        </div>
                        <p>£16/month + 7% booking fee, paid Annually</p>
                        {subscriptionData.renewal_date && (
                            <p>Automatically renews on: {subscriptionData.renewal_date}</p>
                        )}
                    </div>

                    <div className="billing-history">
                        <h3>Billing History</h3>
                        <table>
                            <thead>
                            <tr>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {billingHistory.map((entry, index) => (
                                <tr key={index}>
                                    <td>{entry.date}</td>
                                    <td>{entry.total}</td>
                                    <td>
                                        {entry.status === 'Failed' ? (
                                            <button className="pay-button">Pay</button>
                                        ) : (
                                            entry.status
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <a href="/downgrade" className="downgrade-link">Downgrade to FroHub Lite</a>
                    </div>
                </>
            )}
        </div>
    );
};

export default SubscriptionDetails;
