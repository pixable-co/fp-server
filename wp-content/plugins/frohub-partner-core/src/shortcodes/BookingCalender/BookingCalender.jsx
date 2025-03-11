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
        
                console.log("Order API Response:", response.data);

                if (!response.data || !Array.isArray(response.data)) {
                    console.error("Order API returned unexpected response:", response.data);
                    return [];
                }
        
                return response.data.map(order => {
                    const lineItem = order.line_items?.[0] ?? {};
                    const meta = lineItem.meta ?? {};
        
                    return {
                        id: `order-${order.id}`,
                        title: lineItem.product_name ?? 'No Title',
                        date: meta.booking_date ? meta.booking_date.split(", ")[1] : 'Unknown Date',
                        time: meta.booking_time ?? 'Unknown Time',
                        customer: `${order.billing.first_name} ${order.billing.last_name}`,
                        email: order.billing.email ?? 'No Email',
                        phone: order.billing.phone ?? 'No Phone',
                        service: meta.service_type ?? 'Unknown Service',
                    };
                });
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
                console.log("Google Calendar API Response:", response.data);

        
                if (!response.data || !response.data.events) {
                    console.error("Google Calendar API returned unexpected response:", response.data);
                    return [];
                }
        
                return response.data.events.map(event => ({
                    id: `calendar-${event.id}`,
                    title: event.title ?? 'Google Calendar Event',
                    date: event.start ? event.start.split("T")[0] : 'Unknown Date',
                    time: event.start && event.start.includes("T") ? event.start.split("T")[1] : 'All Day',
                    end: event.end ?? 'Unknown End Time',
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
