import React, { useEffect, useState } from 'react';
import FhChart from "../../common/controls/FhChart.jsx";
import FhProUpgrade from "../../common/controls/FhProUpgrade.jsx";

const ValueOfBookingChart = () => {
    const partner_id = fpserver_settings.partner_post_id;
    const chartGoal = 150; // 🎯 static goal for this chart

    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        // Show upgrade modal if user lacks active subscription
        if (
            typeof fpserver_settings !== 'undefined' &&
            fpserver_settings.has_active_subscription === ''
        ) {
            setShowUpgradeModal(true);
        }
    }, []);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await fetch("https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/return-order-details", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ partner_id }),
                });

                const orders = await response.json();
                const currentYear = new Date().getFullYear();

                const newClientsPerMonth = new Array(12).fill(0);
                const returningClientsPerMonth = new Array(12).fill(0);
                const customerOrderCount = {};

                const filteredOrders = orders.filter(order =>
                    ['processing', 'completed'].includes(order.status) &&
                    new Date(order.created_at).getFullYear() === currentYear
                );

                filteredOrders.forEach(order => {
                    const email = order.billing?.email || 'unknown';
                    customerOrderCount[email] = (customerOrderCount[email] || 0) + 1;
                });

                filteredOrders.forEach(order => {
                    const orderDate = new Date(order.created_at);
                    const month = orderDate.getMonth();
                    const email = order.billing?.email || 'unknown';
                    const isNew = customerOrderCount[email] === 1;

                    let total = 0;
                    order.line_items?.forEach(item => {
                        const deposit = parseFloat(item.meta?.deposit_due?.replace('£', '') || '0') || 0;
                        const totalDue = parseFloat(item.total || 0);
                        total += deposit + totalDue;
                    });

                    if (isNew) newClientsPerMonth[month] += total;
                    else returningClientsPerMonth[month] += total;
                });

                const chartPayload = {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [
                        {
                            label: 'New Clients',
                            data: newClientsPerMonth.map(n => parseFloat(n.toFixed(2))),
                            backgroundColor: '#6C2BD9',
                            stack: 'stack1',
                        },
                        {
                            label: 'Returning Clients',
                            data: returningClientsPerMonth.map(n => parseFloat(n.toFixed(2))),
                            backgroundColor: '#1CC8C8',
                            stack: 'stack1',
                        },
                    ],
                };

                setChartData(chartPayload);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load booking chart:", error);
                setLoading(false);
            }
        };

        if (partner_id) fetchChartData();
    }, [partner_id]);

    return (
        <div className="booking-chart">
            <h2 className="text-xl font-semibold mb-4">Total value of bookings</h2>
            {loading ? (
                <p>Loading chart...</p>
            ) : (
                <FhChart data={chartData} goal={chartGoal} />
            )}

            {/* Modal rendered conditionally */}
            <FhProUpgrade
                visible={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onUpgrade={() => {
                    // handle upgrade action here
                    console.log('Redirect to upgrade page');
                }}
            />
        </div>
    );
};

export default ValueOfBookingChart;
