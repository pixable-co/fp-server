import React, { useEffect, useState } from 'react';
import FhCalender from "../../common/controls/FhCalender.jsx";
import NotificationBar from "../../common/controls/NotificationBar.jsx";
import axios from 'axios';

export default function BookingCalender() {
    const partner_id = fpserver_settings.partner_post_id;
    const [events, setEvents] = useState([]);

    // Define fetchData outside useEffect
    const fetchData = async () => {
        try {
            const [orderEvents, allCalendarEvents, unavailableDates] = await Promise.all([
                fetchOrderDetails(),
                fetchAllCalendarEvents(),
                fetchUnavailableDates()
            ]);

            const merged = [...orderEvents, ...allCalendarEvents, ...unavailableDates];
            console.log(merged);

// ✅ Sanitize merged event list to prevent invalid dates
            const sanitized = merged.filter(event => {
                if (!event || !event.date || !event.time) return false;
                const startDate = new Date(`${event.date}T${event.time || '00:00'}`);
                return !isNaN(startDate.getTime());
            });

            setEvents(merged);

            // setEvents([...orderEvents, ...allCalendarEvents, ...unavailableDates]);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    // Fetch order details
    const fetchOrderDetails = async () => {
        try {
            const response = await fetch(`${fpserver_settings.base_api_url}/wp-json/frohub/v1/return-order-details`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ partner_id }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const result = await response.json();

            // ✅ result is already the array of orders
            const orders = Array.isArray(result) ? result : [];  // safer check

            // Filter orders with status "processing" or "completed"
            const filteredOrders = orders.filter(order =>
                order.status === "processing" || order.status === "on-hold" || order.status === "completed"
            );

            // Map the filtered orders
            return filteredOrders.map(order => {
                const lineItem = order.line_items?.[0] ?? {};
                const meta = lineItem.meta ?? {};

                const bookingDateTime = meta.booking_date ? meta.booking_date.split(", ") : [];
                const extractedTime = bookingDateTime.length > 0 ? bookingDateTime[0] : 'Unknown Time';
                const extractedDate = bookingDateTime.length > 1 ? bookingDateTime[1] : 'Unknown Date';

                return {
                    id: `order-${order.id}`,
                    title: lineItem.product_name ?? 'No Title',
                    date: extractedDate,
                    time: extractedTime,
                    customer: `${order.billing.first_name} ${order.billing.last_name}`,
                    email: order.billing.email ?? 'No Email',
                    phone: order.billing.phone ?? 'No Phone',
                    service: meta.service_type ?? 'Unknown Service',
                    eventType: 'order',
                    duration: meta.duration
                };
            });
        } catch (error) {
            console.error("Error fetching order details:", error);
            return [];
        }
    };

    // Fetch Google Calendar events
    const fetchAllCalendarEvents = async () => {
        try {
            const response = await axios.get(
                '/wp-json/fpserver/v1/google-calendar-all-events',
                { params: { partner_id } }
            );

            if (!response.data || !response.data.events) {
                console.error("Google Calendar API returned unexpected response:", response.data);
                return [];
            }

            return response.data.events.map(event => {
                const startDateTime = event.start?.includes("T") ? event.start : `${event.start}T00:00:00`;
                const endDateTime = event.end?.includes("T") ? event.end : `${event.end}T23:59:59`;

                let formattedDate = 'Unknown Date';
                let formattedTime = 'All Day';
                let formattedEnd = 'Unknown End Time';

                try {
                    const startDateObj = new Date(startDateTime);
                    formattedDate = startDateObj.toISOString().split("T")[0];
                    formattedTime = startDateObj.toISOString().split("T")[1].split(".")[0];

                    if (event.end) {
                        const endDateObj = new Date(endDateTime);
                        formattedEnd = endDateObj.toISOString();
                    }
                } catch (error) {
                    console.error("Error parsing Google Calendar event dates:", error, event);
                }

                return {
                    id: `calendar-${event.id}`,
                    title: event.title ?? 'Google Calendar Event',
                    date: formattedDate,
                    time: formattedTime,
                    end: formattedEnd,
                    eventType: 'google-calendar',
                };
            });
        } catch (error) {
            console.error("Error fetching all Google Calendar events:", error);
            return [];
        }
    };

    // Fetch unavailable dates
    const fetchUnavailableDates = async () => {
        try {
            const response = await axios.post(
                `${fpserver_settings.base_api_url}/wp-json/frohub/v1/custom-events/fetch`,
                { partner_id }
            );

            if (!response.data.success || !Array.isArray(response.data.data)) {
                console.error("Unavailable Dates API returned unexpected response:", response.data);
                return [];
            }

            return response.data.data.map(event => {
                const startDateTime = event.start_date.includes("T")
                    ? event.start_date
                    : `${event.start_date}T00:00:00`;

                const endDateTime = event.end_date.includes("T")
                    ? event.end_date
                    : `${event.end_date}T23:59:59`;

                return {
                    id: `unavailable-${event.event_title}`,
                    title: event.event_title,
                    date: startDateTime.split("T")[0],
                    time: startDateTime.split("T")[1].split(":").slice(0, 2).join(":"),
                    end: endDateTime,
                    eventType: 'unavailable',
                    event_index: event.event_index // Include the event index here
                };
            });
        } catch (error) {
            console.error("Error fetching unavailable dates:", error);
            return [];
        }
    };

    // Use fetchData inside useEffect for initial data load
    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div>
            <NotificationBar message={"Need to block out availability? Click anywhere on the calendar to add an event, or drag to select multiple days."} />
            <FhCalender
                type="day"
                events={events}
                setEvents={setEvents}
                fetchData={fetchData} // Pass fetchData to the child component
            />
        </div>
    );
}