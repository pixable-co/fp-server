import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const FhChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        // If no data is provided, use default data
        const chartData = data || {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [
                {
                    label: 'Bookings',
                    data: [15, 18, 20, 25, 27, 23, 25],
                    backgroundColor: 'rgb(59, 93, 201)',
                    barPercentage: 0.6,
                },
                {
                    label: 'Appointments',
                    data: [25, 18, 15, 17, 20, 30, 35],
                    backgroundColor: 'rgb(255, 99, 97)',
                    barPercentage: 0.6,
                },
            ],
        };

        // Destroy existing chart if it exists
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        // Create the chart
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: true,
                            drawBorder: false,
                            color: 'rgba(211, 211, 211, 0.3)',
                        },
                    },
                    y: {
                        grid: {
                            display: true,
                            drawBorder: false,
                            color: 'rgba(211, 211, 211, 0.3)',
                        },
                        ticks: {
                            stepSize: 5,
                        },
                        suggestedMin: 15,
                        suggestedMax: 35,
                    },
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'center',
                        labels: {
                            boxWidth: 15,
                            usePointStyle: false,
                            padding: 20,
                        },
                        onClick: () => null, // ✅ Disable clicking on legend
                    },
                },
            },
        });

        // Cleanup function
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    return (
        <div style={{ width: '100%', height: '400px' }}>
            <canvas ref={chartRef} />
        </div>
    );
};

export default FhChart;