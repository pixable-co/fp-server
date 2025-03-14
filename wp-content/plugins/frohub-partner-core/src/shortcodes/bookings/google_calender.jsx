import React, { useEffect, useState } from "react";
import { fetchData } from "../../services/fetchData.js"; // Import your existing AJAX function

const GoogleCalendar = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [calendars, setCalendars] = useState([]);
    const [selectedCalendar, setSelectedCalendar] = useState("");
    const [savedCalendar, setSavedCalendar] = useState("");

    // ✅ Check if user is authenticated with Google Calendar & token status
    useEffect(() => {
        fetchData("fpserver/check_google_auth_status", (response) => {
            if (response.success) {
                setIsConnected(response.data.authenticated);
                setIsExpired(response.data.expired);

                if (response.data.authenticated && !response.data.expired) {
                    fetchAvailableCalendars();
                    fetchSavedCalendar();
                }
            }
        });
    }, []);

    // ✅ Fetch user's available Google Calendars
    const fetchAvailableCalendars = () => {
        fetchData("fpserver/get_google_calendars", (response) => {
            if (response.success) {
                setCalendars(response.data.calendars);
            } else {
                console.error("Failed to fetch calendars:", response.message);
            }
        });
    };

    // ✅ Fetch the saved calendar for the user
    const fetchSavedCalendar = () => {
        fetchData("fpserver/get_user_calendar_events", (response) => {
            if (response.success) {
                setSavedCalendar(response.data.events);
            } else {
                console.error("Failed to fetch saved calendar:", response.message);
            }
        });
    };

    // ✅ Handle calendar selection change
    const handleCalendarChange = (event) => {
        setSelectedCalendar(event.target.value);
    };

    // ✅ Save the selected calendar
    const handleSaveCalendar = () => {
        if (!selectedCalendar) {
            alert("Please select a calendar first.");
            return;
        }

        fetchData("fpserver/save_user_calendar", (response) => {
            if (response.success) {
                setSavedCalendar(selectedCalendar);
                alert("Calendar saved successfully.");
            } else {
                console.error("Failed to save calendar:", response.message);
            }
        }, { calendar_id: selectedCalendar });
    };

    // ✅ Handle Google OAuth connection
    const handleConnect = () => {
        fetchData("fpserver/get_google_auth_url", (response) => {
            if (response.success) {
                window.location.href = response.data.auth_url;
            }
        });
    };

    // ✅ Handle Google Calendar Disconnection
    const handleDisconnect = () => {
        fetchData("fpserver/disconnect_google_calendar", (response) => {
            if (response.success) {
                setIsConnected(false);
                setCalendars([]);
                setSavedCalendar("");
                alert("Disconnected from Google Calendar.");
            } else {
                console.error("Failed to disconnect:", response.message);
            }
        });
    };

    return (
        <div>
            <h1>Google Calendar Integration</h1>
            {isConnected && !isExpired ? (
                <>
                    <h2>Select a Calendar</h2>
                    <select onChange={handleCalendarChange} value={selectedCalendar}>
                        <option value="">-- Select a Calendar --</option>
                        {calendars.map((calendar) => (
                            <option key={calendar.id} value={calendar.id}>
                                {calendar.name}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleSaveCalendar} className="btn btn-primary" style={{ marginLeft: "10px" }}>
                        Save Calendar
                    </button>
                    <button onClick={handleDisconnect} className="btn btn-danger" style={{ marginLeft: "10px" }}>
                        Disconnect Calender
                    </button>

                    {/* Show saved calendar info */}
                    {savedCalendar && (
                        <p style={{ color: "blue", marginTop: "10px" }}>
                            ✅ Saved Calendar: {savedCalendar}
                        </p>
                    )}
                </>
            ) : (
                <div>
                    {isExpired && (
                        <p style={{ color: "red" }}>⚠️ Your Google Calendar access has expired. Please reconnect.</p>
                    )}
                    <button onClick={handleConnect} className="btn btn-primary">
                        Connect Google Calendar
                    </button>
                </div>
            )}
        </div>
    );
};

export default GoogleCalendar;
