import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Dropdown, Space } from 'antd';
import './style.css';

const FhCalender = ({ type, events }) => {
    const isDayView = type === 'day';

    const handleEventClick = (clickInfo) => {
        clickInfo.jsEvent.preventDefault();
    };

    const getEventContent = (event) => {
        const formatTime = (date) => {
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        };

        return {
            items: [
                {
                    key: '1',
                    label: (
                        <div className="event-details-dropdown">
                            <h6>{event.title}</h6>
                            <p>Time: {formatTime(event.start)} - {formatTime(event.end)}</p>
                            <p>Customer: {event._def.extendedProps.customer}</p>
                            <p>Email: {event._def.extendedProps.email}</p>
                            <p>Phone: {event._def.extendedProps.phone}</p>
                            <p>Service: {event._def.extendedProps.service}</p>
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
                events={events}
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
                                    padding: '2px 4px',
                                    borderRadius: '2px',
                                    width: '100%',
                                    height: '100%'
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
                slotMinTime="09:00:00"
                slotMaxTime="18:00:00"
                height="auto"
            />
        </div>
    );
};

export default FhCalender;
