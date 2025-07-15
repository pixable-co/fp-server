import React, { useState } from "react";
import { Skeleton, Modal } from "antd";
import axios from "axios";

const MobileCalendarGrid = ({ events = [], loading, select, fetchData, partner_id }) => {
    const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const groupedEvents = events.reduce((acc, event) => {
        if (!event || !event.start || !event.end) return acc;
        const start = new Date(event.start);
        const end = new Date(event.end);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split("T")[0];
            if (!acc[key]) acc[key] = [];
            if (!acc[key].some(e => e.id === event.id)) {
                acc[key].push(event);
            }
        }
        return acc;
    }, {});

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

    const sortedDates = allDatesInRange();

    const getCurrentMonthYear = () => {
        const today = new Date();
        const targetMonth = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1);
        return targetMonth.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
        });
    };

    const handlePrevious = () => setCurrentMonthOffset(prev => prev - 1);
    const handleNext = () => setCurrentMonthOffset(prev => prev + 1);

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

    return (
        <div className="relative bg-[#f4fbff] min-h-screen pb-24 pt-4 px-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevious} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm hover:bg-blue-600">←</button>
                    <button onClick={handleNext} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm hover:bg-blue-600">→</button>
                    <span className="text-lg font-semibold text-gray-700 ml-2">{getCurrentMonthYear()}</span>
                </div>
            </div>

            <div className="space-y-6">
                {sortedDates.map(date => {
                    const dateKey = date.toISOString().split("T")[0];
                    const dayEvents = groupedEvents[dateKey] || [];
                    const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
                    const dayNum = date.getDate();
                    const month = date.toLocaleDateString("en-GB", { month: "short" });

                    return (
                        <div key={dateKey} className="flex items-start gap-4">
                            <div className="w-14 text-center">
                                <div className="text-sm text-gray-500 font-medium">{weekday}</div>
                                <div className="text-2xl font-bold text-blue-600">{dayNum}</div>
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

                                        {dayEvents.map(event => {
                                            if (!event || !event.start || !event.end) return null;
                                            const start = new Date(event.start);
                                            const end = new Date(event.end);
                                            const isGoogle = event.extendedProps?.eventType === 'google-calendar';
                                            const isUnavailable = event.extendedProps?.eventType === 'unavailable';
                                            const isPlaceholder = event.extendedProps?.isPlaceholder;

                                            const bgColor = isGoogle ? 'bg-green-500' : isUnavailable ? 'bg-gray-500' : isPlaceholder ? 'bg-gray-300 animate-pulse' : 'bg-blue-500';

                                            if (isPlaceholder) {
                                                return <div key={event.id} className="p-2"><Skeleton.Button active size="small" style={{ width: '100%', height: 48, borderRadius: 8 }} /></div>;
                                            }

                                            return (
                                                <div
                                                    key={event.id + dateKey} // different key to allow repetition on multiple days
                                                    className={`${bgColor} text-white px-4 py-2 rounded-md shadow-sm cursor-pointer`}
                                                    onClick={() => handleEventClick(event)}
                                                >
                                                    <div className="text-sm font-medium">{event.title || 'Untitled Event'}</div>
                                                    <div className="text-xs text-blue-100 mt-0.5">
                                                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} – {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        {start.toDateString() !== end.toDateString() ? ' (Multi-day)' : ''}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

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
                className="fixed bottom-5 right-5 bg-green-500 w-14 h-14 rounded-full text-white text-3xl shadow-md flex items-center justify-center"
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
                        <p><strong>Start:</strong> {new Date(selectedEvent.start).toLocaleString()}</p>
                        <p><strong>End:</strong> {new Date(selectedEvent.end).toLocaleString()}</p>
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
