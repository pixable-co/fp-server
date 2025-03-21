import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { Dropdown, Skeleton ,Switch } from 'antd';
import FhModal from './FhModal'; // Adjust path if needed
import swal from 'sweetalert';

const FhCalender = ({ type, events, setEvents, fetchData }) => {
    const partner_id = fpserver_settings.partner_post_id;
    const isDayView = type === 'day';
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [eventTitle, setEventTitle] = useState("");
    const [isAllDay, setIsAllDay] = useState(false);

    useEffect(() => {
        if (events.length > 0) {
            setLoading(false);
        }
    }, [events]);

    const parseDateString = (dateStr, timeStr = "00:00") => {
        if (!dateStr) {
            console.error("❌ Missing date string:", dateStr);
            return null;
        }

        // ✅ Handle API format: "YYYY-MM-DD"
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return `${dateStr}T${timeStr}:00`; // Ensure "HH:MM" format
        }

        // ✅ Handle ACF format: "21/03/2025 3:54 pm"
        const dateTimeParts = dateStr.split(" ");
        if (dateTimeParts.length < 3) {
            console.error("❌ Invalid date format, missing time:", dateStr);
            return null;
        }

        const [datePart, timePart, amPm] = dateTimeParts;
        const dateParts = datePart.split("/");

        if (dateParts.length !== 3) {
            console.error("❌ Invalid date format:", dateStr);
            return null;
        }

        const [day, month, year] = dateParts;
        let [hours, minutes] = timePart.split(":");

        // ✅ Convert hours and minutes to two-digit format
        hours = hours.padStart(2, "0");
        minutes = (minutes || "00").padStart(2, "0");

        // ✅ Convert 12-hour AM/PM format to 24-hour format
        if (amPm.toLowerCase() === "pm" && parseInt(hours, 10) < 12) {
            hours = (parseInt(hours, 10) + 12).toString();
        }
        if (amPm.toLowerCase() === "am" && parseInt(hours, 10) === 12) {
            hours = "00"; // 12 AM should be 00 in 24-hour format
        }

        // ✅ Ensure valid ISO 8601 format
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:00`;

        if (isNaN(new Date(formattedDate).getTime())) {
            console.error("❌ Invalid formatted date:", formattedDate);
            return null;
        }

        return formattedDate;
    };

    const transformedEvents = events.map(event => {
        if (!event.date) {
            console.error("Invalid event date:", event);
            return null; // Skip invalid events
        }

        let eventStart, eventEnd;
        if (event.eventType === 'unavailable') {
            const parsedStart = parseDateString(event.date, '00:00');
            const parsedEnd = parseDateString(event.end, '23:59');

            if (!parsedStart) {
                console.error("❌ Could not parse start date for unavailable event:", event);
                return null;
            }

            // Add +1 day to parsed end for FullCalendar (because end is exclusive)
            let endDate = parsedStart.split("T")[0]; // fallback
            if (parsedEnd) {
                const endDateObj = new Date(parsedEnd);
                endDateObj.setDate(endDateObj.getDate() + 1);
                endDate = endDateObj.toISOString().split("T")[0];
            }

            eventStart = parsedStart.split("T")[0]; // date-only
            eventEnd = endDate;
        } else {
            // Process other events normally
            const eventDate = new Date(event.date);
            if (isNaN(eventDate.getTime())) {
                console.error("Skipping event due to invalid date format:", event);
                return null;
            }
            const eventTime = event.time || '00:00';
            const [hours, minutes] = eventTime.split(':');
            eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
            eventStart = eventDate.toISOString();
            eventEnd = null; // Other events may not need an explicit end time
        }

        return {
            id: event.id,
            title: event.title,
            start: eventStart,
            end: eventEnd,
            allDay: event.eventType === 'unavailable', // ✅ Show as full-day block
            backgroundColor: event.eventType === 'unavailable' ? '#FF0000' : '#4285f4',
            borderColor: event.eventType === 'unavailable' ? '#FF0000' : '#4285f4',
            textColor: '#fff',
            extendedProps: {
                eventType: event.eventType,
                booking_time: event.time,
                customer: event.customer,
                email: event.email,
                phone: event.phone,
                service: event.service,
                eventIndex: event.event_index // Add event_index here
            }
        };
    }).filter(event => event !== null);

    const handleEventClick = (clickInfo) => {
        if (clickInfo.event.extendedProps.eventType === 'google-calendar') {
            return;
        }
        clickInfo.jsEvent.preventDefault();
    };

    const handleSelect = (info) => {
        setSelectedSlot({
            start: info.startStr,
            end: info.endStr,
            allDay: info.allDay,
        });
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedSlot(null);
        setEventTitle("");
        setIsAllDay(false);
    };

    const generateTimeOptions = () => {
        const times = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute of ["00", "15", "30", "45"]) {
                const amPm = hour < 12 ? "AM" : "PM";
                const displayHour = hour % 12 === 0 ? 12 : hour % 12; // Convert 0 to 12 for 12-hour format
                times.push(`${displayHour}:${minute} ${amPm}`);
            }
        }
        return times;
    };

    const getEventContent = (event) => {
        const eventType = event.extendedProps.eventType;

        if (eventType === 'google-calendar') {
            return null; // Google Calendar events are not interactive
        }

        if (eventType === 'unavailable') {
            const eventIndex = event.extendedProps.eventIndex; // Get the event index

            const handleDelete = async () => {
                try {
                    const response = await axios.post(
                        'https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/custom-events/delete',
                        { partner_id: partner_id.toString(), event_index: eventIndex }
                    );

                    console.log("✅ Delete API Response:", response.data);

                    if (response.data.success) {
                        fetchData(); // Refresh the data in the parent component
                        swal({
                            title: "Success",
                            text: "Event deleted successfully",
                            icon: "success",
                            buttons: false,
                        })
                    }
                } catch (error) {
                    console.error("❌ Error deleting event:", error.response?.data || error.message);
                }
            };

            return {
                items: [
                    {
                        key: 'details',
                        label: (
                            <div>
                                <h6>{event.title}</h6>
                                <p><strong>Start:</strong> {event.start ? event.start.toISOString().split('T')[0] : 'N/A'} {event.start ? event.start.toLocaleTimeString() : ''}</p>
                                <p><strong>End:</strong> {event.end ? event.end.toISOString().split('T')[0] : 'N/A'} {event.end ? event.end.toLocaleTimeString() : ''}</p>
                            </div>
                        ),
                    },
                    {
                        key: 'delete',
                        label: (
                            <button
                                className="text-red-500 hover:text-red-700"
                                onClick={handleDelete}
                            >
                                Delete Event
                            </button>
                        ),
                    },
                ],
            };
        }

        // Handle order events
        const eventDate = event.start ? event.start.toISOString().split('T')[0] : event.date || 'N/A';
        return {
            items: [
                {
                    key: 'details',
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
                },
            ],
        };
    };

    const handleSaveEvent = async () => {
        if (!eventTitle || !selectedSlot.start) {
            console.error("❌ Missing required fields.");
            return;
        }

        // Ensure default values for end_date and end_time
        const defaultEndDate = selectedSlot.start.split('T')[0]; // Same day as start_date
        const endDate = selectedSlot.end || defaultEndDate;
        const endTime = selectedSlot.endTime || "23:59";

        // Format dates properly
        const formattedStart = parseDateString(selectedSlot.start, selectedSlot.startTime || "00:00");
        const formattedEnd = parseDateString(endDate, endTime);

        if (!formattedStart || !formattedEnd) {
            console.error("❌ Error formatting event start/end dates.");
            return;
        }

        // Log the formatted dates for debugging
        console.log("Formatted Start Date:", formattedStart);
        console.log("Formatted End Date:", formattedEnd);

        // Ensure API request payload matches expected format
        const payload = {
            partner_id: partner_id.toString(), // Ensure it's a string
            event_title: eventTitle,
            start_date: formattedStart,
            end_date: formattedEnd
        };

        console.log("📤 Sending API Request:", payload);

        try {
            const response = await axios.post(
                'https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/custom-events/create',
                payload
            );
            console.log("✅ API Response:", response.data);
            if (response.data.success) {
                swal({
                    title: "Success",
                    text: "Event added successfully",
                    icon: "success",
                    buttons: false,
                })
                fetchData(); // Trigger fetchData to refresh the data in the parent
            }
            handleModalClose();
        } catch (error) {
            console.error("❌ Error creating unavailable event:", error);
        }
    };

    return (
        <div>
            {loading ? (
                <div className="w-full">
                    <div className="flex justify-between mb-4 gap-2">
                        <Skeleton.Button active size="small" style={{ width: 100 }} />
                        <Skeleton.Button active size="small" style={{ width: 100 }} />
                        <Skeleton.Button active size="small" style={{ width: 100 }} />
                    </div>
                    <Skeleton.Button active size="small" style={{ width: '1150px', height: '500px' }} />
                </div>
            ) : (
                <>
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView={isDayView ? 'dayGridMonth' : 'timeGridWeek'}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        weekends={false}
                        events={transformedEvents}
                        selectable={true}
                        selectMirror={true}
                        select={handleSelect}
                        eventClick={handleEventClick}
                        eventContent={(arg) => {
                            const isGoogleEvent = arg.event.extendedProps.eventType === 'google-calendar';

                            if (isGoogleEvent) {
                                return (
                                    <div
                                        className="google-calendar-event"
                                        style={{
                                            backgroundColor: arg.event.backgroundColor || '#4285f4',
                                            color: '#fff',
                                            padding: '4px 6px',
                                            borderRadius: '4px',
                                            width: '100%',
                                            height: '100%',
                                            cursor: 'default',
                                        }}
                                    >
                                        {arg.event.title}
                                    </div>
                                );
                            }

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
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {arg.event.title}
                                    </div>
                                </Dropdown>
                            );
                        }}
                        eventTimeFormat={{
                            hour: '2-digit',
                            minute: '2-digit',
                            meridiem: false
                        }}
                        height="auto"
                    />

                    <FhModal
                        actionType="create"
                        name="Event"
                        isOpen={isModalOpen}
                        isClose={handleModalClose}
                        width={500}
                    >
                        <div className="p-4">
                            <h2 className="text-lg font-semibold mb-2">Create Unavailable Event</h2>
                            <p className="text-gray-500 text-sm mb-4">
                                Your services won’t be available for booking during this event.
                            </p>

                            {/* Event Title Input */}
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                            <input
                                type="text"
                                className="w-full border-gray-300 rounded-md p-2 mb-4"
                                placeholder="Enter event title"
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                            />

                            {/* Start Date & Time Selection */}
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                            <div className="flex items-center gap-3 mb-4">
                                <input
                                    type="date"
                                    className="border-gray-300 rounded-md p-2 w-full"
                                    value={selectedSlot?.start?.split("T")[0] || ""}
                                    onChange={(e) => setSelectedSlot({ ...selectedSlot, start: e.target.value })}
                                />
                                <select
                                    className="border-gray-300 rounded-md p-2 w-full"
                                    value={selectedSlot?.startTime || "00:00"}
                                    onChange={(e) => setSelectedSlot({ ...selectedSlot, startTime: e.target.value })}
                                >
                                    {generateTimeOptions().map((time, index) => (
                                        <option key={index} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* End Date & Time Selection */}
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                            <div className="flex items-center gap-3 mb-4">
                                <input
                                    type="date"
                                    className="border-gray-300 rounded-md p-2 w-full"
                                    value={selectedSlot?.end?.split("T")[0] || ""}
                                    onChange={(e) => setSelectedSlot({ ...selectedSlot, end: e.target.value })}
                                />
                                <select
                                    className="border-gray-300 rounded-md p-2 w-full"
                                    value={selectedSlot?.endTime || "23:59"}
                                    onChange={(e) => setSelectedSlot({ ...selectedSlot, endTime: e.target.value })}
                                >
                                    {generateTimeOptions().map((time, index) => (
                                        <option key={index} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Save Button */}
                            <button
                                className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600"
                                onClick={handleSaveEvent}
                            >
                                Save
                            </button>
                        </div>
                    </FhModal>

                </>
            )}
        </div>
    );
};

export default FhCalender;
