import React from 'react';
import FhChart from "../../common/controls/FhChart.jsx";

const BookingChart = ({ dataKey }) => {
    console.log('Booking Chart Loaded')
    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
            {
                label: 'Bookings',
                data: [15, 18, 20, 25, 27, 23, 25],
                backgroundColor: 'rgb(59, 93, 201)', // Blue color from your chart
                barPercentage: 0.6,
            },
            {
                label: 'Appointments',
                data: [25, 18, 15, 17, 20, 30, 35],
                backgroundColor: 'rgb(255, 99, 97)', // Red/coral color from your chart
                barPercentage: 0.6,
            },
        ],
    };

    return (
        <div>
            <FhChart data={chartData} />
        </div>
    );
};

export default BookingChart;