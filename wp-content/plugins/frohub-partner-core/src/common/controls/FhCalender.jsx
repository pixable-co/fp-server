import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Dropdown, Skeleton } from 'antd';

const FhCalender = ({ type, events }) => {
    const isDayView = type === 'day';
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (events.length > 0) {
            setLoading(false);
        }
    }, [events]);

    const transformedEvents = events.map(event => {
        const eventDate = event.date ? new Date(event.date) : null;
        const eventTime = event.time || '00:00';

        let eventStart = null;
        if (eventDate) {
            const [hours, minutes] = eventTime.split(':');
            eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
            eventStart = eventDate.toISOString();
        }

        return {
            id: event.id,
            title: event.title,
            start: eventStart,
            backgroundColor: '#4285f4',
            borderColor: '#4285f4',
            textColor: '#fff',
            extendedProps: {
                eventType: event.eventType,
                booking_time: event.time,
                customer: event.customer,
                email: event.email,
                phone: event.phone,
                service: event.service
            }
        };
    });

    const handleEventClick = (clickInfo) => {
        if (clickInfo.event.extendedProps.eventType === 'google-calendar') {
            return; // Skip clicks for Google Calendar events
        }
        clickInfo.jsEvent.preventDefault();
    };

    const getEventContent = (event) => {
        if (event.extendedProps.eventType === 'google-calendar') {
            return null; // No dropdown for Google Calendar events
        }

        const eventDate = event.start ? event.start.toISOString().split('T')[0] : event.date || 'N/A';
        return {
            items: [
                {
                    key: '1',
                    label: (
                        <div>
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
        <div>
            {loading ? (
                <>
                    <div className="w-full">
                        <div className="flex justify-between mb-4 gap-2">
                            <Skeleton.Button active size="small" style={{ width: 100 }} />
                            <Skeleton.Button active size="small" style={{ width: 100 }} />
                            <Skeleton.Button active size="small" style={{ width: 100 }} />
                        </div>
                        <Skeleton.Button active size="small" style={{ width: '1150px', height: '500px' }} />
                    </div>
                </>
            ) : (
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
                    events={transformedEvents}
                    eventContent={(arg) => {
                        const isGoogleEvent = arg.event.extendedProps.eventType === 'google-calendar';

                        return isGoogleEvent ? (
                            <div
                                className="google-calendar-event"
                                style={{
                                    backgroundColor: arg.event.backgroundColor || '#4285f4',
                                    color: '#fff',
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    width: '100%',
                                    height: '100%',
                                    cursor: 'default' // Prevents cursor change on hover
                                }}
                            >
                                {arg.event.title}
                            </div>
                        ) : (
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
            )}
        </div>
    );
};

export default FhCalender;
