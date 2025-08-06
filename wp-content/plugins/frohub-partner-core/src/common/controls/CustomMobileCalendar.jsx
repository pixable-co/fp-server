import React, { useState } from "react";
import { Skeleton, Modal } from "antd";
import axios from "axios";

const MobileCalendarGrid = ({ events = [], loading, select, fetchData, partner_id }) => {
    const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [viewType, setViewType] = useState('month'); // 'month', 'week', 'day'
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
    const [currentDayOffset, setCurrentDayOffset] = useState(0);

    // Helper function to parse dates without timezone conversion
    const parseAsLocalDate = (dateString) => {
        if (!dateString) return null;

        // Handle different date formats
        let cleanDateString = dateString;

        // If it has 'Z' at the end, remove it to prevent UTC conversion
        if (cleanDateString.endsWith('Z')) {
            cleanDateString = cleanDateString.slice(0, -1);
        }

        // If it's just a date-time string without timezone info, parse it as local
        // This prevents JavaScript from assuming UTC
        const parts = cleanDateString.split('T');
        if (parts.length === 2) {
            const [datePart, timePart] = parts;
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart.split(':').map(Number);

            // Create date in local timezone
            return new Date(year, month - 1, day, hour, minute, second || 0);
        }

        // Fallback to regular parsing
        return new Date(cleanDateString);
    };

    // Helper to get date key in local timezone
    const getLocalDateKey = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const groupedEvents = events.reduce((acc, event) => {
        if (!event || !event.start || !event.end) return acc;

        const start = parseAsLocalDate(event.start);
        const end = parseAsLocalDate(event.end);

        if (!start || !end) return acc;

        // Use local date for grouping
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = getLocalDateKey(d);
            if (!acc[key]) acc[key] = [];
            if (!acc[key].some(e => e.id === event.id)) {
                acc[key].push(event);
            }
        }
        return acc;
    }, {});

    // Month view logic
    const allDatesInRange = () => {
        const dates = [];
        const today = new Date();
        const targetMonth = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1);

        const start = currentMonthOffset === 0
            ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
            : new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);

        const end = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }
        return dates;
    };

    // Week view logic
    const getWeekDates = () => {
        const today = new Date();
        const targetDate = new Date(today.getTime() + (currentWeekOffset * 7 * 24 * 60 * 60 * 1000));
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - targetDate.getDay()); // Start from Sunday

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    // Day view logic
    const getDayDate = () => {
        const today = new Date();
        const targetDate = new Date(today.getTime() + (currentDayOffset * 24 * 60 * 60 * 1000));
        return [targetDate];
    };

    const getCurrentPeriodLabel = () => {
        const today = new Date();

        if (viewType === 'month') {
            const targetMonth = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1);
            return targetMonth.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
            });
        } else if (viewType === 'week') {
            const weekDates = getWeekDates();
            const start = weekDates[0];
            const end = weekDates[6];
            return `${start.toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}`;
        } else if (viewType === 'day') {
            const dayDate = getDayDate()[0];
            return dayDate.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });
        }
    };

    const handlePrevious = () => {
        if (viewType === 'month') {
            setCurrentMonthOffset(prev => prev - 1);
        } else if (viewType === 'week') {
            setCurrentWeekOffset(prev => prev - 1);
        } else if (viewType === 'day') {
            setCurrentDayOffset(prev => prev - 1);
        }
    };

    const handleNext = () => {
        if (viewType === 'month') {
            setCurrentMonthOffset(prev => prev + 1);
        } else if (viewType === 'week') {
            setCurrentWeekOffset(prev => prev + 1);
        } else if (viewType === 'day') {
            setCurrentDayOffset(prev => prev + 1);
        }
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setModalVisible(true);
    };

    const handleDeleteEvent = async () => {
        try {
            const response = await axios.post(`${fpserver_settings.base_api_url}/wp-json/frohub/v1/custom-events/delete`, {
                partner_id,
                event_index: selectedEvent.extendedProps?.eventIndex
            });
            if (response.data.success) {
                fetchData?.();
                setModalVisible(false);
            }
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const renderEventCard = (event, dateKey) => {
        if (!event || !event.start || !event.end) return null;

        const start = parseAsLocalDate(event.start);
        const end = parseAsLocalDate(event.end);

        if (!start || !end) return null;

        const isGoogle = event.extendedProps?.eventType === 'google-calendar';
        const isUnavailable = event.extendedProps?.eventType === 'unavailable';
        const isPlaceholder = event.extendedProps?.isPlaceholder;

        const bgColor = isGoogle ? 'bg-green-500' : isUnavailable ? 'bg-gray-500' : isPlaceholder ? 'bg-gray-300 animate-pulse' : 'bg-orange-400';

        if (isPlaceholder) {
            return <div key={event.id} className="p-2"><Skeleton.Button active size="small" style={{ width: '100%', height: 48, borderRadius: 8 }} /></div>;
        }

        return (
            <div
                key={event.id + dateKey}
                className={`${bgColor} text-white px-4 py-2 rounded-md shadow-sm cursor-pointer mb-2`}
                onClick={() => handleEventClick(event)}
            >
                <div className="text-sm font-medium">{event.title || 'Untitled Event'}</div>
                <div className="text-xs text-blue-100 mt-0.5">
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} – {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    {start.toDateString() !== end.toDateString() ? ' (Multi-day)' : ''}
                </div>
            </div>
        );
    };

    const renderMonthView = () => {
        const sortedDates = allDatesInRange();

        return (
            <div className="space-y-6">
                {sortedDates.map(date => {
                    const dateKey = getLocalDateKey(date);
                    const dayEvents = groupedEvents[dateKey] || [];
                    const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
                    const dayNum = date.getDate();
                    const month = date.toLocaleDateString("en-GB", { month: "short" });

                    return (
                        <div key={dateKey} className="flex items-start gap-4">
                            <div className="w-14 text-center">
                                <div className="text-sm text-gray-500 font-medium">{weekday}</div>
                                <div className="text-2xl font-bold text-orange-600">{dayNum}</div>
                                <div className="text-xs text-gray-400 -mt-1">{month}</div>
                            </div>

                            <div className="flex-1 space-y-3">
                                {loading ? (
                                    <div className="space-y-2">
                                        <Skeleton.Button active size="small" style={{ width: '100%', height: 48, borderRadius: 8 }} />
                                        <Skeleton.Button active size="small" style={{ width: '80%', height: 48, borderRadius: 8 }} />
                                    </div>
                                ) : (
                                    <>
                                        {dayEvents.length === 0 && <div className="text-sm text-gray-400 italic">No events</div>}
                                        {dayEvents.map(event => renderEventCard(event, dateKey))}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderWeekView = () => {
        const weekDates = getWeekDates();

        return (
            <div className="space-y-4">
                {weekDates.map(date => {
                    const dateKey = getLocalDateKey(date);
                    const dayEvents = groupedEvents[dateKey] || [];
                    const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
                    const dayNum = date.getDate();
                    const month = date.toLocaleDateString("en-GB", { month: "short" });
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                        <div key={dateKey} className="border-l-4 border-blue-200 pl-4">
                            <div className={`flex items-center gap-2 mb-2 ${isToday ? 'bg-blue-50 p-2 rounded' : ''}`}>
                                <div className={`text-lg font-semibold ${isToday ? 'text-orange-600' : 'text-gray-700'}`}>
                                    {weekday}, {dayNum} {month}
                                </div>
                                {isToday && <span className="text-xs fh__brand_button text-white px-2 py-1 rounded">Today</span>}
                            </div>

                            <div className="ml-4">
                                {loading ? (
                                    <div className="space-y-2">
                                        <Skeleton.Button active size="small" style={{ width: '100%', height: 48, borderRadius: 8 }} />
                                    </div>
                                ) : (
                                    <>
                                        {dayEvents.length === 0 && <div className="text-sm text-gray-400 italic mb-4">No events</div>}
                                        {dayEvents.map(event => renderEventCard(event, dateKey))}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDayView = () => {
        const dayDate = getDayDate()[0];
        const dateKey = getLocalDateKey(dayDate);
        const dayEvents = groupedEvents[dateKey] || [];
        const isToday = dayDate.toDateString() === new Date().toDateString();

        // Group events by hour for better day view layout
        const hourlyEvents = {};
        dayEvents.forEach(event => {
            if (!event || !event.start || !event.end) return;

            const eventStart = parseAsLocalDate(event.start);
            const eventEnd = parseAsLocalDate(event.end);

            if (!eventStart || !eventEnd) return;

            // Ensure it's valid for this day
            if (eventStart.toDateString() !== dayDate.toDateString() && eventEnd.toDateString() !== dayDate.toDateString()) {
                return;
            }

            const startHour = eventStart.toDateString() === dayDate.toDateString() ? eventStart.getHours() : 0;
            const endHour = eventEnd.toDateString() === dayDate.toDateString() ? eventEnd.getHours() : 23;

            for (let hour = startHour; hour <= endHour; hour++) {
                if (!hourlyEvents[hour]) hourlyEvents[hour] = [];
                if (!hourlyEvents[hour].some(e => e.id === event.id)) {
                    hourlyEvents[hour].push(event);
                }
            }
        });

        const allHours = Array.from({ length: 24 }, (_, i) => i);
        const currentHour = new Date().getHours();

        const formatHour = (hour) => {
            if (hour === 0) return { display: 12, period: 'AM' };
            if (hour === 12) return { display: 12, period: 'PM' };
            if (hour > 12) return { display: hour - 12, period: 'PM' };
            return { display: hour, period: 'AM' };
        };

        return (
            <div className="space-y-4">
                <div className={`p-4 rounded-lg ${isToday ? 'bg-blue-50 border-l-4 border-orange-500' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {dayDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                        </h2>
                        {isToday && <span className="text-xs fh__brand_button text-white px-2 py-1 rounded">Today</span>}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-2">
                        <Skeleton.Button active size="small" style={{ width: '100%', height: 48, borderRadius: 8 }} />
                        <Skeleton.Button active size="small" style={{ width: '80%', height: 48, borderRadius: 8 }} />
                    </div>
                ) : (
                    <div className="space-y-1">
                        {allHours.map(hour => {
                            const hourEvents = hourlyEvents[hour] || [];
                            const { display, period } = formatHour(hour);
                            const isCurrentHour = isToday && hour === currentHour;

                            return (
                                <div key={hour} className="flex">
                                    {/* Hour label */}
                                    <div className="w-16 flex-shrink-0 text-right pr-3 pt-1">
                                        <div className={`text-xs font-medium ${isCurrentHour ? 'text-orange-500' : 'text-gray-500'}`}>
                                            {display}:00
                                        </div>
                                        <div className={`text-xs ${isCurrentHour ? 'text-orange-600' : 'text-gray-400'}`}>
                                            {period}
                                        </div>
                                    </div>

                                    {/* Hour content */}
                                    <div className="flex-1 border-l-2 border-gray-100 pl-4 min-h-[50px] relative">
                                        {isCurrentHour && isToday && (
                                            <div className="absolute top-0 left-0 w-full h-0.5 fh__brand_button z-10"></div>
                                        )}

                                        {hourEvents.length > 0 ? (
                                            <div className="space-y-1 pt-1">
                                                {hourEvents.map(event => (
                                                    <div key={event.id + dateKey + hour} className="transform scale-95 origin-left">
                                                        {renderEventCard(event, dateKey)}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-12 flex items-center">
                                                <div className="w-full h-px bg-gray-50"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {dayEvents.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <div className="text-lg">No events scheduled</div>
                                <div className="text-sm">Tap the + button to add an event</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        switch (viewType) {
            case 'week':
                return renderWeekView();
            case 'day':
                return renderDayView();
            default:
                return renderMonthView();
        }
    };

    return (
        <div className="relative bg-[#f4fbff] min-h-screen pb-24 pt-4 px-4">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <button onClick={handlePrevious} className="w-8 h-8 rounded-full fh__brand_button text-white flex items-center justify-center shadow-sm hover:bg-orange-600">←</button>
                    <button onClick={handleNext} className="w-8 h-8 rounded-full fh__brand_button text-white flex items-center justify-center shadow-sm hover:bg-orange-600">→</button>
                    <span className="text-lg font-semibold text-gray-700 ml-2 flex-1">{getCurrentPeriodLabel()}</span>
                </div>

                {/* View Selection - Now on separate line */}
                <div className="flex bg-white rounded-lg shadow-sm border overflow-hidden w-full">
                    <button
                        onClick={() => setViewType('month')}
                        className={`flex-1 px-3 py-2 text-sm font-medium ${viewType === 'month' ? 'fh__brand_button text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Month
                    </button>
                    <button
                        onClick={() => setViewType('week')}
                        className={`flex-1 px-3 py-2 text-sm font-medium ${viewType === 'week' ? 'fh__brand_button text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => setViewType('day')}
                        className={`flex-1 px-3 py-2 text-sm font-medium ${viewType === 'day' ? 'fh__brand_button text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Day
                    </button>
                </div>
            </div>

            {renderContent()}

            <button
                onClick={() => {
                    const now = new Date();
                    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
                    const pad = (n) => n.toString().padStart(2, '0');

                    const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
                    const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
                    const endTime = `${pad(oneHourLater.getHours())}:${pad(oneHourLater.getMinutes())}`;

                    select?.({
                        startStr: dateStr,
                        endStr: dateStr,
                        startTime,
                        endTime,
                        allDay: false
                    });
                }}
                className="fixed bottom-5 right-5  fh__brand_button w-14 h-14 rounded-full text-white text-3xl shadow-md flex items-center justify-center hover:bg-green-600"
            >
                +
            </button>

            <Modal
                title={selectedEvent?.title || "Event Details"}
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                {selectedEvent && (
                    <div className="space-y-2 text-sm">
                        <p><strong>Start:</strong> {parseAsLocalDate(selectedEvent.start)?.toLocaleString()}</p>
                        <p><strong>End:</strong> {parseAsLocalDate(selectedEvent.end)?.toLocaleString()}</p>
                        {selectedEvent.extendedProps?.eventType === 'unavailable' && (
                            <button
                                onClick={handleDeleteEvent}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Delete Event
                            </button>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MobileCalendarGrid;