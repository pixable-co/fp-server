import React, { useState, useEffect } from 'react';
import { Skeleton } from 'antd';
import {fetchData} from "../../services/fetchData.js";
import DashboardNotification from "./dashboard_notification.jsx";

const BookingStatsCard = () => {
    const [partnerData, setPartnerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch partner data on component mount
    useEffect(() => {
        fetchData('fpserver/get_partner_data', (response) => {
            if (response.success) {
                setPartnerData(response.data);
                setError(null);
            } else {
                setError(response.data?.message || 'Failed to fetch partner data.');
                console.error('Partner data fetch error:', response.data?.message);
            }
            setLoading(false);
        });
    }, []);

    // Calculate average rating
    const calculateAverageRating = (reviews) => {
        if (!reviews || reviews.length === 0) {
            return "No reviews (yet) 👀";
        }

        const validReviews = reviews.filter(review => review.rating);
        if (validReviews.length === 0) {
            return "No Reviews";
        }

        const totalRating = validReviews.reduce((sum, review) => sum + parseFloat(review.rating), 0);
        const average = totalRating / validReviews.length;
        return `${average.toFixed(1)} / 5`;
    };

    // Format date and time for display
    const formatDateTime = (date, time) => {
        return `${date} at ${time}`;
    };

    // Show loading state with Ant Design Skeleton
    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Review Stats Skeleton */}
                <div className="review-stats dashboard-stats">
                    <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 1, width: '40%' }} />
                </div>

                {/* Pending Bookings Skeleton */}
                <div className="pending-bookings dashboard-stats">
                    <Skeleton active title={{ width: '70%' }} paragraph={{ rows: 1, width: '30%' }} />
                </div>

                {/* Upcoming Order Skeleton */}
                <div className="upcoming-order-container dashboard-stats">
                    <Skeleton active title={{ width: '80%' }} paragraph={{ rows: 3, width: ['100%', '80%', '60%'] }} />
                </div>

                {/* Total Reviews Skeleton */}
                <div className="dashboard-stats">
                    <Skeleton active title={{ width: '50%' }} paragraph={{ rows: 1, width: '25%' }} />
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="dashboard-stats">
                    <h2>Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Show data or fallback values
    const reviews = partnerData?.reviews || [];
    const upcomingBookings = partnerData?.upcomingBookings || null;
    const pendingOrdersCount = partnerData?.pendingOrdersCount || 0;
    const isOnVacation = partnerData?.onVacation || false;
    const mobileServiceFee = partnerData?.mobileServiceFee !== undefined ? partnerData?.mobileServiceFee : true;
    const serviceTypes = partnerData?.serviceTypes || [];
    const showStripeWarning = partnerData?.showStripeWarning || false;
    const averageRating = calculateAverageRating(reviews);

    return (
        <div>
            {/* Vacation and Mobile Fee Notifications */}
            <DashboardNotification
                isOnVacation={isOnVacation}
                mobileServiceFee={mobileServiceFee}
                serviceTypes={serviceTypes}
                showStripeWarning={showStripeWarning}
            />

            {/* Dashboard Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Upcoming Order Component */}
                <div className="upcoming-order-container dashboard-stats">
                    <h2>Next Upcoming Booking</h2>

                    {upcomingBookings ? (
                        <div>
                            <div className="booking-date-time">
                                {formatDateTime(upcomingBookings.start_date, upcomingBookings.start_time)}
                            </div>

                            <div className="booking-service">
                                {upcomingBookings.service_name}
                            </div>

                            <div className="booking-client-info">
                                <div className="client-name-email">
                                    <span className="client-name">{upcomingBookings.client_name}</span>
                                    <a
                                        href="#"
                                        className="client-email-icon"
                                        title={`Send a message to ${upcomingBookings.client_name}`}
                                    >
                                        <i className="fas fa-comment-alt"></i>
                                    </a>
                                </div>

                                <div className="client-phone">
                                    <a
                                        href={`tel:${upcomingBookings.client_phone}`}
                                        className="client-phone-link"
                                    >
                                        {upcomingBookings.client_phone}
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>You have no upcoming bookings.</p>
                    )}
                </div>

                {/* Pending Bookings Component */}
                <div className="pending-bookings dashboard-stats">
                    <h2>Pending Bookings</h2>
                    <p className="booking-stats-value">{pendingOrdersCount}</p>
                </div>

                {/* Review Stats Component */}
                <div className="review-stats dashboard-stats">
                    <h2>Your Reviews</h2>
                    <p className="booking-stats-value">{averageRating}</p>
                </div>

                {/* Additional Stats Component */}
                <div className="dashboard-stats">
                    <h2>Total Reviews</h2>
                    <p className="booking-stats-value">{reviews.length}</p>
                </div>

            </div>
        </div>
    );
};

export default BookingStatsCard;