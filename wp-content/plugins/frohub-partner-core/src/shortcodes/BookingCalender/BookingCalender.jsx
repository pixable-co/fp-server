import React, { useEffect, useState } from 'react';
import FhCalender from "../../common/controls/FhCalender.jsx";
import axios from 'axios'; // or use fetch

export default function BookingCalender() {
    const partner_id =  fpserver_settings.partner_post_id;
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.post(
                    'https://frohubecomm.mystagingwebsite.com/wp-json/custom/v1/orders',
                    {
                        partner_id: "465"
                    }
                );

                // Transform the API data into the format expected by FhCalender
                const transformedEvents = response.data.map(order => ({
                    id: order.id.toString(),
                    title: order.line_items[0]?.product_name ?? 'No Title',
                    start: `${order.acf_fields.booking_day}T${order.acf_fields.booking_start_time_slot}`,
                    end: `${order.acf_fields.booking_day}T${order.acf_fields.booking_end_time_slot}`,
                    customer: `${order.billing.first_name} ${order.billing.last_name}`,
                    email: order.billing.email,
                    phone: order.billing.phone,
                    service: order.acf_fields.service_type,
                }));

                setEvents(transformedEvents);
            } catch (error) {
                console.error("Error fetching data: ", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <FhCalender type="day" events={events} />
        </div>
    );
}