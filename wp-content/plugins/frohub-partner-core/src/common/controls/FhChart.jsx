import React, { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import Chart from 'chart.js/auto';

// Register Chart.js components and plugins
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, annotationPlugin);

const FhChart = ({ data, goal }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        // Destroy old instance if re-rendering
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        // Default fallbacks if data is missing
        const chartData = data || {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Bookings',
                    data: [100, 150, 200, 170, 180, 140],
                    backgroundColor: 'rgb(59, 93, 201)',
                    barPercentage: 0.6,
                },
            ],
        };

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            display: true,
                            drawBorder: false,
                            color: 'rgba(211, 211, 211, 0.3)',
                        },
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                            display: true,
                            drawBorder: false,
                            color: 'rgba(211, 211, 211, 0.3)',
                        },
                        ticks: {
                            stepSize: 50,
                        },
                    },
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'center',
                        labels: {
                            boxWidth: 15,
                            padding: 20,
                        },
                        onClick: () => null,
                    },
                    // Add annotation plugin if goal is provided
                    annotation: {
                        annotations: goal
                            ? {
                                goalLine: {
                                    type: 'line',
                                    yMin: goal,
                                    yMax: goal,
                                    borderColor: 'black',
                                    borderWidth: 2,
                                    borderDash: [6, 6],
                                    label: {
                                        enabled: true,
                                        content: `Goal: £${goal.toLocaleString()}`,
                                        position: 'end',
                                        backgroundColor: '#fff',
                                        color: '#000',
                                        font: {
                                            size: 12,
                                            weight: 'bold',
                                        },
                                        padding: 6,
                                    },
                                },
                            }
                            : {},
                    },
                },
            },
        });

        // Cleanup chart on component unmount
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data, goal]);

    return (
        <div style={{ width: '100%', height: '400px' }}>
            <canvas ref={chartRef} />
        </div>
    );
};

export default FhChart;