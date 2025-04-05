import React, { useEffect, useState } from "react";
import FhChart from "../../common/controls/FhChart.jsx";

const BookingChart = () => {
    const partner_id = fpserver_settings.partner_post_id;
    const [chartData, setChartData] = useState({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Total Service Amount (£)',
                data: new Array(12).fill(0), // Initialize with zero values
                backgroundColor: 'rgb(59, 93, 201)',
                barPercentage: 0.6,
            },
        ],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await fetch("https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/return-order-details", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ partner_id: partner_id }),
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const orders = await response.json();

                // Only keep orders with status "processing" or "completed"
                const filteredOrders = orders.filter(order =>
                    order.status === "processing" || order.status === "completed"
                );

                console.log("Filtered Orders:", filteredOrders);

                // Process data: extract deposits and due amounts, then group by month
                const currentYear = new Date().getFullYear();
                const monthlyTotals = new Array(12).fill(0);

                filteredOrders.forEach(order => {
                    if (!order.line_items || order.line_items.length === 0) return;

                    order.line_items.forEach(item => {
                        // Extract deposit amount from the string (remove '£' and convert to number)
                        const depositHtml = item.meta.deposit_due || "£0";
                        const depositMatch = depositHtml.match(/[\d,.]+/);
                        const deposit = depositMatch ? parseFloat(depositMatch[0]) : 0;
                        

                        // Get the total due amount
                        const totalDue = parseFloat(item.total || 0);

                        // Calculate total service amount
                        const totalServiceAmount = deposit + totalDue;

                        // Get the order date and extract month
                        const orderDate = new Date(order.created_at);
                        const year = orderDate.getFullYear();
                        const month = orderDate.getMonth(); // 0-indexed (Jan = 0)

                        if (year === currentYear) {
                            monthlyTotals[month] += totalServiceAmount;
                        }
                    });
                });

                // Round to 2 decimal places for display
                const roundedTotals = monthlyTotals.map(value => parseFloat(value.toFixed(2)));

                console.log("Monthly totals:", roundedTotals);

                setChartData(prevData => ({
                    ...prevData,
                    datasets: [{
                        ...prevData.datasets[0],
                        data: roundedTotals
                    }]
                }));

                setLoading(false);
            } catch (error) {
                console.error("Error fetching orders:", error);
                setLoading(false);
            }
        };
        // const fetchOrders = async () => {
        //     try {
        //         setLoading(true);
        //         const response = await fetch("https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/return-order-details", {
        //             method: "POST",
        //             headers: {
        //                 "Content-Type": "application/json",
        //             },
        //             body: JSON.stringify({ partner_id: partner_id }),
        //         });
        //
        //         if (!response.ok) {
        //             throw new Error(`Error: ${response.statusText}`);
        //         }
        //
        //         const orders = await response.json();
        //         console.log("Orders received:", orders);
        //
        //         // Process data: extract deposits and due amounts, then group by month
        //         const currentYear = new Date().getFullYear();
        //         const monthlyTotals = new Array(12).fill(0);
        //
        //         orders.forEach(order => {
        //             if (!order.line_items || order.line_items.length === 0) return;
        //
        //             order.line_items.forEach(item => {
        //                 // Extract deposit amount from the string (remove '£' and convert to number)
        //                 const depositString = item.meta.deposit_due || "£0";
        //                 const deposit = parseFloat(depositString.replace('£', '')) || 0;
        //
        //                 // Get the total due amount
        //                 const totalDue = parseFloat(item.total || 0);
        //
        //                 // Calculate total service amount
        //                 const totalServiceAmount = deposit + totalDue;
        //
        //                 // Get the order date and extract month
        //                 const orderDate = new Date(order.created_at);
        //                 const year = orderDate.getFullYear();
        //                 const month = orderDate.getMonth(); // 0-indexed (Jan = 0)
        //
        //                 if (year === currentYear) {
        //                     monthlyTotals[month] += totalServiceAmount;
        //                 }
        //             });
        //         });
        //
        //         // Round to 2 decimal places for display
        //         const roundedTotals = monthlyTotals.map(value => parseFloat(value.toFixed(2)));
        //
        //         console.log("Monthly totals:", roundedTotals);
        //
        //         setChartData(prevData => ({
        //             ...prevData,
        //             datasets: [{
        //                 ...prevData.datasets[0],
        //                 data: roundedTotals
        //             }]
        //         }));
        //
        //         setLoading(false);
        //     } catch (error) {
        //         console.error("Error fetching orders:", error);
        //         setLoading(false);
        //     }
        // };

        if (partner_id) {
            fetchOrders();
        }
    }, [partner_id]);

    return (
        <div>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <p>Loading booking data...</p>
                </div>
            ) : (
                <FhChart data={chartData} />
            )}
        </div>
    );
};

export default BookingChart;