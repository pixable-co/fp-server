import React, { useEffect, useState } from 'react';
import FhCalender from "../../common/controls/FhCalender.jsx";
import axios from 'axios';

export default function BookingCalender() {
    const partner_id = fpserver_settings.partner_post_id;
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await axios.post(
                    'https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/return-order-details',
                    { partner_id }
                );

                return response.data.map(order => ({
                    id: `order-${order.id}`,
                    title: order.line_items[0]?.product_name ?? 'No Title',
                    date: order.acf_fields.booking_day,
                    time: order.acf_fields.booking_start_time_slot,
                    customer: `${order.billing.first_name} ${order.billing.last_name}`,
                    email: order.billing.email,
                    phone: order.billing.phone,
                    service: order.acf_fields.service_type,
                }));
            } catch (error) {
                console.error("Error fetching order details:", error);
                return [];
            }
        };

        const fetchAllCalendarEvents = async () => {
            try {
                const response = await axios.get(
                    '/wp-json/fpserver/v1/google-calendar-all-events',
                    { params: { partner_id } }
                );

                return response.data.events.map(event => ({
                    id: `calendar-${event.id}`,
                    title: event.title ?? 'Google Calendar Event',
                    date: event.start.split("T")[0],
                    time: event.start.includes("T") ? event.start.split("T")[1] : 'All Day',
                    end: event.end,
                }));
            } catch (error) {
                console.error("Error fetching all Google Calendar events:", error);
                return [];
            }
        };

        const fetchData = async () => {
            const [orderEvents, allCalendarEvents] = await Promise.all([
                fetchOrderDetails(),
                fetchAllCalendarEvents()
            ]);

            setEvents([...orderEvents, ...allCalendarEvents]);
        };

        fetchData();
    }, []);

    return (
        <div>
            <FhCalender type="day" events={events} />
        </div>
    );
}
