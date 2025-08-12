import React, { useMemo } from 'react';
import { Skeleton } from 'antd';

const BookingStatCardsPro = ({ orders, loading }) => {
    const {
        totalBookings,
        totalValue,
        averageBookingValue,
        newClientsValue,
        returningClientsValue,
        topServices
    } = useMemo(() => {
        if (!orders || !Array.isArray(orders)) {
            return {
                totalBookings: 0,
                totalValue: 0,
                averageBookingValue: 0,
                newClientsValue: 0,
                returningClientsValue: 0,
                topServices: []
            };
        }

        const customerOrders = {};
        const serviceCounts = {};
        let totalValue = 0;
        let totalDeposits = 0;

        orders.forEach(order => {
            const email = order.billing?.email || 'unknown';
            customerOrders[email] = (customerOrders[email] || 0) + 1;

            order.line_items?.forEach(item => {
                const deposit = parseFloat(item.meta?.deposit_due?.replace('£', '') || '0') || 0;
                const totalDue = parseFloat(item.total || '0') || 0;
                const total = deposit + totalDue;

                totalValue += total;
                totalDeposits += deposit;

                const serviceName = item.product_name || 'Unknown Service';
                serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
            });
        });

        const totalBookings = orders.length;
        const averageBookingValue = totalBookings > 0 ? totalValue / totalBookings : 0;

        let newClientsValue = 0;
        let returningClientsValue = 0;

        orders.forEach(order => {
            const email = order.billing?.email || 'unknown';
            const isNew = customerOrders[email] === 1;

            order.line_items?.forEach(item => {
                const deposit = parseFloat(item.meta?.deposit_due?.replace('£', '') || '0') || 0;
                const totalDue = parseFloat(item.total || '0') || 0;
                const amount = deposit + totalDue;

                if (isNew) newClientsValue += amount;
                else returningClientsValue += amount;
            });
        });

        const sortedServices = Object.entries(serviceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => name);

        return {
            totalBookings,
            totalValue,
            averageBookingValue,
            newClientsValue,
            returningClientsValue,
            topServices: sortedServices
        };
    }, [orders]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded shadow">
                        <Skeleton active paragraph={{ rows: 2 }} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total value of bookings */}
            <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Total value of bookings</div>
                <div className="text-2xl font-semibold text-gray-800">£{totalValue.toFixed(2)}</div>
            </div>

            {/* New vs Returning Clients */}
            <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">New vs Returning Clients</div>
                <div className="flex justify-between mt-2 text-sm">
                    <span>New</span><span className="font-semibold">£{newClientsValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-1 text-sm">
                    <span>Returning</span><span className="font-semibold">£{returningClientsValue.toFixed(2)}</span>
                </div>
            </div>

            {/* Total bookings */}
            <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Total number of bookings</div>
                <div className="text-2xl font-semibold text-gray-800 mt-2">{totalBookings}</div>
            </div>

            {/* Average Booking Value */}
            <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Average Booking Value</div>
                <div className="text-2xl font-semibold text-gray-800 mt-2">£{averageBookingValue.toFixed(2)}</div>
            </div>
        </div>

        {/* Top Booked Services */}
        <div className="bg-white p-4 rounded shadow col-span-full lg:col-span-2">
            <div className="text-sm text-gray-500 mb-2">Top booked services</div>
            {topServices.length === 0 ? (
                <p className="text-gray-400 text-sm">No services booked yet.</p>
            ) : (
                <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
                    {topServices.map((service, i) => (
                        <li key={i}>{service}</li>
                    ))}
                </ol>
            )}
        </div>
        </>
    );
};

export default BookingStatCardsPro;
