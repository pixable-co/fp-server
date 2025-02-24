import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Dropdown } from 'antd';
import './style.css';

const FhCalender = ({ type, events }) => {

    const isDayView = type === 'day';

    // Convert API response to FullCalendar format
    const transformedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        date: new Date(event.date),
        backgroundColor: '#4285f4',
        borderColor: '#4285f4',
        textColor: '#fff',
        extendedProps: {
            booking_time: event.time, // Store booking time separately
            customer: event.customer,
            email: event.email,
            phone: event.phone,
            service: event.service
        }
    }));

    const handleEventClick = (clickInfo) => {
        clickInfo.jsEvent.preventDefault();
    };

    const getEventContent = (event) => {
        const eventDate = event.start ? event.start.toISOString().split('T')[0] : event.date || 'N/A';
        return {
            items: [
                {
                    key: '1',
                    label: (
                        <div className="event-details-dropdown">
                            <h6>{event.title}</h6>
                            <p><strong>Date:</strong> {eventDate}</p>
                            <p><strong>Time:</strong> {event.extendedProps.booking_time}</p>
                            <p><strong>Customer:</strong> {event.extendedProps.customer}</p>
                            <p><strong>Email:</strong> {event.extendedProps.email}</p>
                            <p><strong>Phone:</strong> {event.extendedProps.phone || 'N/A'}</p>
                            <p><strong>Service:</strong> {event.extendedProps.service || 'N/A'}</p>
                        </div>
                    ),
                }
            ]
        };
    };

    return (
        <div className="calendar-container">
            <FullCalendar
                plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    interactionPlugin
                ]}
                initialView={isDayView ? 'dayGridMonth' : 'timeGridWeek'}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                weekends={false}
                events={transformedEvents} // Use transformed events
                eventContent={(arg) => {
                    return (
                        <Dropdown
                            menu={getEventContent(arg.event)}
                            trigger={['click']}
                            placement="bottomLeft"
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    backgroundColor: arg.event.backgroundColor || '#4285f4',
                                    color: '#fff',
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    width: '100%',
                                    height: '100%',
                                    cursor: 'pointer'
                                }}
                            >
                                {arg.event.title}
                            </div>
                        </Dropdown>
                    );
                }}
                eventClick={handleEventClick}
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    meridiem: false
                }}
                height="auto"
            />
        </div>
    );
};

export default FhCalender;
