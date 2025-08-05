import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar } from '@fullcalendar/core';
import enGbLocale from '@fullcalendar/core/locales/en-gb';
import axios from 'axios';
import { Dropdown, Skeleton, Switch } from 'antd';
import FhModal from './FhModal'; // Adjust path if needed
import CustomMobileCalendar from './CustomMobileCalendar';
import swal from 'sweetalert';
import MobileCalendarGrid from "./CustomMobileCalendar";

const FhCalender = ({ type, events, setEvents, fetchData }) => {
    const partner_id = fpserver_settings.partner_post_id;
    const isDayView = type === 'day';
    const [loading, setLoading] = useState(true);
    const [modifyingEventIds, setModifyingEventIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [eventTitle, setEventTitle] = useState("");
    const [isAllDay, setIsAllDay] = useState(false);
    const [customTitle, setCustomTitle] = useState("");
    const isMobile = window.innerWidth < 768;

    const formatUKDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const handleDatesSet = (arg) => {
        const start = arg.start;
        const end = new Date(arg.end.getTime() - 1); // subtract 1ms to get correct end date

        const startStr = formatUKDate(start);
        const endStr = formatUKDate(end);

        if (startStr === endStr) {
            setCustomTitle(startStr);
        } else {
            setCustomTitle(`${startStr} – ${endStr}`);
        }
    };

    useEffect(() => {
        if (events.length > 0) {
            setLoading(false);
        } else {
            // Set a 10-second timeout to stop loading even if no events
            const timeout = setTimeout(() => {
                setLoading(false);
                // swal({
                //     title: "No Events Found",
                //     text: "No upcoming bookings or events found. Please add some and try again.",
                //     icon: "info",
                //     button: "OK"
                // });
            }, 10000); // 10 seconds

            // Cleanup timeout if component unmounts or events arrive
            return () => clearTimeout(timeout);
        }
    }, [events]);

    const parseDateString = (dateStr, timeStr = "00:00") => {
        if (!dateStr) return null;

        // Check for format like "29 Jul 2025"
        const textMonthMatch = dateStr.match(/^(\d{1,2}) (\w{3,}) (\d{4})$/);
        if (textMonthMatch) {
            const [_, day, monthText, year] = textMonthMatch;
            const month = getMonthIndex(monthText); // from earlier helper
            const formatted = `${year}-${padZero(month)}-${padZero(day)}T${timeStr}:00`;
            if (!isNaN(new Date(formatted).getTime())) return formatted;
            return null;
        }

        // Fallback for "DD/MM/YYYY HH:mm am/pm"
        const dateTimeParts = dateStr.split(" ");
        if (dateTimeParts.length < 3) return null;

        const [datePart, timePart, amPm] = dateTimeParts;
        const dateParts = datePart.split("/");
        if (dateParts.length !== 3) return null;

        const [day, month, year] = dateParts;
        let [hours, minutes] = timePart.split(":");
        hours = hours.padStart(2, "0");
        minutes = (minutes || "00").padStart(2, "0");

        if (amPm.toLowerCase() === "pm" && parseInt(hours) < 12) {
            hours = (parseInt(hours) + 12).toString();
        } else if (amPm.toLowerCase() === "am" && parseInt(hours) === 12) {
            hours = "00";
        }

        const formatted = `${year}-${month}-${day}T${hours}:${minutes}:00`;
        if (!isNaN(new Date(formatted).getTime())) return formatted;
        return null;
    };

    const padZero = (n) => String(n).padStart(2, "0");
    const getMonthIndex = (monthText) => {
        const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
        return months.findIndex(m => m === monthText.toLowerCase().slice(0,3)) + 1;
    };

    // const parseDateString = (dateStr, timeStr = "00:00") => {
    //     if (!dateStr) {
    //         console.error("❌ Missing date string:", dateStr);
    //         return null;
    //     }
    //
    //     // ✅ Handle API format: "YYYY-MM-DD"
    //     if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    //         return `${dateStr}T${timeStr}:00`; // Ensure "HH:MM" format
    //     }
    //
    //     // ✅ Handle ACF format: "21/03/2025 3:54 pm"
    //     const dateTimeParts = dateStr.split(" ");
    //     if (dateTimeParts.length < 3) {
    //         console.error("❌ Invalid date format, missing time:", dateStr);
    //         return null;
    //     }
    //
    //     const [datePart, timePart, amPm] = dateTimeParts;
    //     const dateParts = datePart.split("/");
    //
    //     if (dateParts.length !== 3) {
    //         console.error("❌ Invalid date format:", dateStr);
    //         return null;
    //     }
    //
    //     const [day, month, year] = dateParts;
    //     let [hours, minutes] = timePart.split(":");
    //
    //     // ✅ Convert hours and minutes to two-digit format
    //     hours = hours.padStart(2, "0");
    //     minutes = (minutes || "00").padStart(2, "0");
    //
    //     // ✅ Convert 12-hour AM/PM format to 24-hour format
    //     if (amPm.toLowerCase() === "pm" && parseInt(hours, 10) < 12) {
    //         hours = (parseInt(hours, 10) + 12).toString();
    //     }
    //     if (amPm.toLowerCase() === "am" && parseInt(hours, 10) === 12) {
    //         hours = "00"; // 12 AM should be 00 in 24-hour format
    //     }
    //
    //     // ✅ Ensure valid ISO 8601 format
    //     const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:00`;
    //
    //     if (isNaN(new Date(formattedDate).getTime())) {
    //         console.error("❌ Invalid formatted date:", formattedDate);
    //         return null;
    //     }
    //
    //     return formattedDate;
    // };

    const parseDurationString = (durationStr) => {
        if (!durationStr || typeof durationStr !== "string") return 60;

        // Normalize and simplify
        const cleanStr = durationStr.toLowerCase().replace(/\s+/g, '');

        let totalMinutes = 0;

        // Match patterns like "2hr", "2hrs", "1h"
        const hrMatch = cleanStr.match(/(\d+)(?:h|hr|hrs)/);
        if (hrMatch) {
            totalMinutes += parseInt(hrMatch[1], 10) * 60;
        }

        // Match patterns like "30min", "30mins", "90m"
        const minMatch = cleanStr.match(/(\d+)(?:m|min|mins)/);
        if (minMatch) {
            totalMinutes += parseInt(minMatch[1], 10);
        }

        // Final fallback
        return totalMinutes > 0 ? totalMinutes : 60;
    };

    function normalizeToLocalISOString(isoStr) {
        const date = new Date(isoStr);
        if (isNaN(date.getTime())) return null;

        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, "0");
        const day = `${date.getDate()}`.padStart(2, "0");
        const hours = `${date.getHours()}`.padStart(2, "0");
        const minutes = `${date.getMinutes()}`.padStart(2, "0");
        const seconds = `${date.getSeconds()}`.padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`; // ⚠️ No Z
    }


    function normalizeGoogleISOtoUK(isoString) {
        if (!isoString) return null;
        const utcDate = new Date(isoString);
        // Remove the Z and reformat without timezone offset
        const year = utcDate.getFullYear();
        const month = String(utcDate.getMonth() + 1).padStart(2, '0');
        const day = String(utcDate.getDate()).padStart(2, '0');
        const hour = String(utcDate.getHours()).padStart(2, '0');
        const minute = String(utcDate.getMinutes()).padStart(2, '0');
        const second = String(utcDate.getSeconds()).padStart(2, '0');

        // Output a string that FullCalendar interprets as local UK time
        return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }

    const transformedEvents = events.map(event => {
        if (!event.date) {
            console.error("Invalid event date:", event);
            return null;
        }

        // Handle Google Calendar events directly
        if (event.eventType === 'google-calendar') {
            const rawStart = event.date.includes('T')
                ? event.date
                : `${event.date}T${event.time || '00:00:00'}`;

            const rawEnd = event.end || rawStart;

            const start = normalizeGoogleISOtoUK(rawStart);
            const end = normalizeGoogleISOtoUK(rawEnd);

            return {
                id: event.id,
                title: event.title,
                start,
                end,
                allDay: false,
                backgroundColor: '#34a853',
                borderColor: '#34a853',
                textColor: '#fff',
                extendedProps: {
                    eventType: 'google-calendar',
                }
            };
        }

        // if (event.eventType === 'google-calendar') {
        //     const start = event.date.includes('T') ? event.date : `${event.date}T${event.time || '00:00'}`;
        //     const end = event.end || start;
        //
        //     return {
        //         id: event.id,
        //         title: event.title,
        //         start,
        //         end,
        //         allDay: false,
        //         backgroundColor: '#34a853',
        //         borderColor: '#34a853',
        //         textColor: '#fff',
        //         extendedProps: {
        //             eventType: 'google-calendar'
        //         }
        //     };
        // }

        // Unavailable event logic stays the same
        if (event.eventType === 'unavailable') {
            const startISO = parseDateString(event.date);
            const endISO = event.end ? parseDateString(event.end) : null;

            if (!startISO) {
                console.error("❌ Invalid start date:", event);
                return null;
            }

            let finalEnd = endISO;
            if (!endISO || startISO.split("T")[0] === endISO.split("T")[0]) {
                const startDateObj = new Date(startISO);
                const endDateObj = new Date(startDateObj);
                endDateObj.setHours(startDateObj.getHours() + 1);
                finalEnd = endDateObj.toISOString();
            }

            return {
                id: event.id,
                title: event.title,
                start: startISO,
                end: finalEnd,
                allDay: false,
                backgroundColor: '#7D8793',
                borderColor: '#7D8793',
                textColor: '#fff',
                extendedProps: {
                    eventType: event.eventType,
                    booking_time: event.time,
                    customer: event.customer,
                    email: event.email,
                    phone: event.phone,
                    service: event.service,
                    eventIndex: event.event_index,
                }
            };
        }

        // Regular "order" events
        const formattedStart = parseDateString(event.date, event.time || "00:00");
        if (!formattedStart) {
            console.error("Skipping event due to invalid date format:", event);
            return null;
        }

        const startDateObj = new Date(formattedStart);
        const durationInMinutes = parseDurationString(event.duration);
        const endDateObj = new Date(startDateObj);
        endDateObj.setMinutes(endDateObj.getMinutes() + durationInMinutes);

        return {
            id: event.id,
            title: event.title,
            start: startDateObj.toISOString(),
            end: endDateObj.toISOString(),
            allDay: false,
            backgroundColor: '#4285f4',
            borderColor: '#4285f4',
            textColor: '#fff',
            extendedProps: {
                eventType: event.eventType,
                booking_time: event.time,
                customer: event.customer,
                email: event.email,
                phone: event.phone,
                service: event.service,
                eventIndex: event.event_index,
                duration: event.duration,
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
        const eventId = event.id; // Add this line to define eventId

        if (eventType === 'google-calendar') {
            return null; // Google Calendar events are not interactive
        }

        if (eventType === 'unavailable') {
            const eventIndex = event.extendedProps.eventIndex; // Get the event index

            const handleDelete = async () => {
                setModifyingEventIds(prev => [...prev, eventId]);
                try {
                    const response = await axios.post(
                        `${fpserver_settings.base_api_url}/wp-json/frohub/v1/custom-events/delete`,
                        { partner_id: partner_id.toString(), event_index: eventIndex }
                    );

                    if (response.data.success) {
                        await fetchData(); // Use await to ensure it compl
                        setTimeout(() => {
                            setModifyingEventIds(prev => prev.filter(id => id !== eventId));
                        }, 1000); // 1 second delay after fetch completes
                    }
                } catch (error) {
                    console.error("❌ Error deleting event:", error.response?.data || error.message);
                    setModifyingEventIds(prev => prev.filter(id => id !== eventId));
                }
            };

            const formatDateTime = (input) => {
                const date = new Date(input);
                if (isNaN(date.getTime())) return 'N/A';
                return date.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                });
            };


            return {
                items: [
                    {
                        key: 'details',
                        label: (
                            <div>
                                <h6>{event.title}</h6>
                                <p><strong>Start:</strong> {formatDateTime(event.start)}</p>
                                <p><strong>End:</strong> {formatDateTime(event.end)}</p>
                                {/*<p><strong>Start:</strong> {formatDateTime(event.start)}</p>*/}
                                {/*<p><strong>End:</strong> {formatDateTime(event.end)}</p>*/}
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
        // const eventDate = event.start ? event.start.toISOString().split('T')[0] : event.date || 'N/A';
        const eventDateObj = event.start ? new Date(event.start) : new Date(event.date);
        const eventDate = isNaN(eventDateObj.getTime()) ? 'N/A' : `${String(eventDateObj.getDate()).padStart(2, '0')}-${String(eventDateObj.getMonth() + 1).padStart(2, '0')}-${eventDateObj.getFullYear()}`;
        return {
            items: [
                {
                    key: 'details',
                    label: (
                        <div>
                            <h6>{event.title}</h6>
                            <p><strong>Date:</strong> {eventDate}</p>
                            <p><strong>Time:</strong> {event.extendedProps.booking_time}</p>
                            <p><strong>Client:</strong> {event.extendedProps.customer}</p>
                            {/*<p><strong>Email:</strong> {event.extendedProps.email}</p>*/}
                            <p><strong>Phone:</strong> {event.extendedProps.phone || 'N/A'}</p>
                            <p><strong>Service Type:</strong> {event.extendedProps.service || 'N/A'}</p>
                        </div>
                    ),
                },
            ],
        };
    };

    const convertTo24Hour = (time12h) => {
        if (!time12h) return "00:00";

        const [time, modifier] = time12h.split(" ");
        let [hours, minutes] = time.split(":");

        hours = parseInt(hours, 10);
        minutes = minutes || "00";

        if (modifier === "PM" && hours < 12) {
            hours += 12;
        }
        if (modifier === "AM" && hours === 12) {
            hours = 0;
        }

        return `${hours.toString().padStart(2, "0")}:${minutes}`;
    };

    function combineDateAndTimeUK(dateStr, timeStr = "00:00") {
        if (!dateStr || !timeStr) {
            console.error("❌ Missing date or time in combineDateAndTimeUK()");
            return null;
        }

        // Combine date and time directly without converting to UTC
        // Output format: "YYYY-MM-DDTHH:mm:ss" (local time)
        const combined = `${dateStr}T${timeStr}:00`;
        const testDate = new Date(combined);

        if (isNaN(testDate.getTime())) {
            console.error("❌ Invalid local datetime:", combined);
            return null;
        }

        return combined;
    }

    const handleSaveEvent = async () => {
        if (!eventTitle || !selectedSlot.start) {
            console.error("❌ Missing required fields.");
            return;
        }

        const tempId = `temp-${Date.now()}`;
        const tempEvent = {
            id: tempId,
            title: eventTitle,
            start: selectedSlot.start,
            end: selectedSlot.end || selectedSlot.start,
            allDay: isAllDay,
            backgroundColor: '#FF0000',
            borderColor: '#FF0000',
            textColor: '#fff',
            extendedProps: {
                eventType: 'unavailable',
                isPlaceholder: true
            }
        };

        setEvents(prev => [...prev, tempEvent]);
        setModifyingEventIds(prev => [...prev, tempId]);
        handleModalClose();

        const startDate = selectedSlot.start;
        const startTime = convertTo24Hour(selectedSlot.startTime || "00:00");
        const endDate = selectedSlot.end || selectedSlot.start;
        const endTime = convertTo24Hour(selectedSlot.endTime || "23:59");

        const formattedStart = combineDateAndTimeUK(startDate, startTime);
        const formattedEnd = combineDateAndTimeUK(endDate, endTime);

        if (!formattedStart || !formattedEnd) {
            console.error("❌ Error formatting event start/end dates.");
            return;
        }

        const payload = {
            partner_id: partner_id.toString(),
            event_title: eventTitle,
            start_date: formattedStart,
            end_date: formattedEnd
        };

        try {
            const response = await axios.post(
                `${fpserver_settings.base_api_url}/wp-json/frohub/v1/custom-events/create`,
                payload
            );

            if (response.data.success) {
                await fetchData();
                setTimeout(() => {
                    setEvents(prev => prev.filter(e => e.id !== tempId));
                    setModifyingEventIds(prev => prev.filter(id => id !== tempId));
                }, 1000);
            }

            handleModalClose();
        } catch (error) {
            console.error("❌ Error creating unavailable event:", error);
            setEvents(prev => prev.filter(e => e.id !== tempId));
            setModifyingEventIds(prev => prev.filter(id => id !== tempId));
        }
    };


    const renderEventContent = (arg) => {
        // Show skeleton for global loading or for specific events being modified
        if (loading ||
            arg.event.extendedProps.isPlaceholder ||
            modifyingEventIds.includes(arg.event.id)) {
            return (
                <div style={{
                    width: '100%',
                    height: '100%',
                    padding: '4px 6px',
                }}>
                    <Skeleton.Button
                        active
                        size="small"
                        style={{
                            width: '150px',
                            height: '100%',
                            minHeight: '20px',
                            margin: 0
                        }}
                    />
                </div>
            );
        }

        // Your existing event content logic
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
    };

    // Add this function before your return statement
    const generatePlaceholderEvents = () => {
        // Get current date
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const placeholderEvents = [];

        // Generate random placeholder events throughout the month
        for (let i = 0; i < 15; i++) {
            // Random day between start and end of month
            const randomDay = Math.floor(Math.random() * (endOfMonth.getDate() - 1)) + 1;
            const eventDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), randomDay);

            // Random duration between 1-3 hours
            const durationHours = Math.floor(Math.random() * 3) + 1;

            // Random start hour between 9 AM and 5 PM
            const startHour = Math.floor(Math.random() * 8) + 9;

            const start = new Date(eventDate);
            start.setHours(startHour, 0, 0);

            const end = new Date(start);
            end.setHours(start.getHours() + durationHours);

            placeholderEvents.push({
                id: `placeholder-${i}`,
                title: '',
                start: start.toISOString(),
                end: end.toISOString(),
                allDay: false,
                backgroundColor: '#f0f0f0',
                borderColor: '#e0e0e0',
                textColor: 'transparent',
                extendedProps: {
                    isPlaceholder: true,
                    eventType: 'skeleton'
                }
            });
        }

        return placeholderEvents;
    };

    // Add this after your transformedEvents definition
    const displayEvents = loading
        ? generatePlaceholderEvents()
        : [...transformedEvents,
            ...events.filter(event =>
                event.extendedProps?.isPlaceholder ||
                modifyingEventIds.includes(event.id)
            )];

  return (
      <div>
          {isMobile ? (
              <MobileCalendarGrid
                  events={displayEvents}
                  loading={loading}
                  select={handleSelect} // ✅ Ensure this is passed!
                  fetchData={fetchData}
                  partner_id={partner_id}
              />
          ) : (
              <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={isDayView ? 'dayGridMonth' : 'timeGridWeek'}
                  headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  locale={enGbLocale}
                  weekends={true}
                  events={displayEvents}
                  selectable={!loading}
                  selectMirror={!loading}
                  select={handleSelect}
                  eventClick={loading ? undefined : handleEventClick}
                  selectLongPressDelay={100}
                  eventContent={renderEventContent}
                  eventTimeFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      meridiem: false
                  }}
                  height="auto"
              />
          )}

          {/* ✅ Universal Modal (shared across both views) */}
          <FhModal
              actionType="create"
              name="Event"
              isOpen={isModalOpen}
              isClose={handleModalClose}
              width={500}
          >
              <div className="p-4">
                  <h2 className="text-lg font-semibold mb-2">Block Out Time</h2>
                  <p className="text-gray-500 text-sm mb-4">Clients won't be able to book during this time.</p>

                  {/* Event Title Input */}
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                      type="text"
                      className="w-full border-gray-300 rounded-md p-2 mb-4"
                      placeholder="(e.g. personal appointment, vacation, etc.)"
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
                          min={new Date().toISOString().split("T")[0]}
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
      </div>

  );
};

export default FhCalender;
