import React from 'react';

const BookingRequest = ({ date, service }) => (
    <div className="message booking-request">
        <div>New Booking Requested</div>
        <div>{date}</div>
        <div>{service}</div>
    </div>
);

export default BookingRequest;
