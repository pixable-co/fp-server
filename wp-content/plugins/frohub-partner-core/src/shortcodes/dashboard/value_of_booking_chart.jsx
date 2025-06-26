import React, { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react'; // Optional: using Lucide icons for styling
import FhChart from "../../common/controls/FhChart.jsx";
import FhProUpgrade from "../../common/controls/FhProUpgrade.jsx";

const ValueOfBookingChart = () => {
    const partner_id = fpserver_settings.partner_post_id;
    const chartGoal = 150;

    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noOrders, setNoOrders] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
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
                const response = await fetch(`${fpserver_settings.base_api_url}/wp-json/frohub/v1/return-order-details`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ partner_id }),
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const orders = await response.json();

                if (!Array.isArray(orders) || orders.length === 0) {
                    setNoOrders(true);
                    setLoading(false);
                    return;
                }

                const currentYear = new Date().getFullYear();
                const newClientsPerMonth = new Array(12).fill(0);
                const returningClientsPerMonth = new Array(12).fill(0);
                const customerOrderCount = {};

                const filteredOrders = orders.filter(order =>
                    ['processing', 'completed'].includes(order.status) &&
                    new Date(order.created_at).getFullYear() === currentYear
                );

                if (filteredOrders.length === 0) {
                    setNoOrders(true);
                    setLoading(false);
                    return;
                }

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
                setNoOrders(true);
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
            ) : noOrders ? (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg p-6">
                    <XCircle className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-lg font-medium text-gray-700">No orders found</p>
                    <p className="text-sm text-gray-500">Your booking data for this year will appear here when available.</p>
                </div>
            ) : (
                <FhChart data={chartData} goal={chartGoal} />
            )}

            <FhProUpgrade
                visible={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onUpgrade={() => console.log('Redirect to upgrade page')}
            />
        </div>
    );
};

export default ValueOfBookingChart;
