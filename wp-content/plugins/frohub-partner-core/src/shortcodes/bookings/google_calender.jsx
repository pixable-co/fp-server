import React, { useEffect, useState } from "react";
import { fetchData } from "../../services/fetchData.js"; // Import your existing AJAX function
import {toastNotification} from "../../utils/toastNotification.js";

const GoogleCalendar = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [calendars, setCalendars] = useState([]);
    const [selectedCalendar, setSelectedCalendar] = useState("");
    const [savedCalendar, setSavedCalendar] = useState("");

    // ✅ Check if user is authenticated with Google Calendar & token status
    useEffect(() => {
        fetchData("fpserver/check_google_auth_status", (response) => {
            console.log("Auth Status Response:", response);
            if (response.data.authenticated === false) {
                console.log("Token expired, attempting refresh...");
                refreshGoogleToken();
            }
            if (response.success) {
                setIsConnected(response.data.authenticated);
                setIsExpired(response.data.expired);

                if (response.data.authenticated) {
                    if (response.data.expired) {
                        console.log("Token expired, attempting refresh...");
                        refreshGoogleToken();
                    } else {
                        fetchAvailableCalendars();
                        fetchSavedCalendar();
                    }
                }
            }
        });
    }, []);

    // ✅ Function to refresh token if expired
    const refreshGoogleToken = () => {
        fetchData("fpserver/refresh_google_token", (response) => {
            if (response.success) {
                console.log("Token refreshed successfully.");
                setIsExpired(false); // Mark token as valid
                fetchAvailableCalendars();
                fetchSavedCalendar();
            } else {
                console.error("Failed to refresh token:", response.message);
                toastNotification('info', 'Google Calendar Disconnected','Google Calendar session expired. Please reconnect.')
            }
        });
    };

    // ✅ Fetch user's available Google Calendars
    const fetchAvailableCalendars = () => {
        fetchData("fpserver/get_google_calendars", (response) => {
            if (response.success) {
                setCalendars(response.data.calendars);

                if (response.data.saved_calendar_id) {
                    setSelectedCalendar(response.data.saved_calendar_id);
                    setSavedCalendar(response.data.saved_calendar_id);
                }
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
            toastNotification('error', 'Calendar Not Selected','Please select a calendar first.')
            return;
        }

        fetchData("fpserver/save_user_calendar", (response) => {
            if (response.success) {
                setSavedCalendar(selectedCalendar);
                toastNotification('success', 'Success','Calendar saved successfully.')
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
                toastNotification('success', 'Disconnected','Disconnected from Google Calendar.')
            } else {
                console.error("Failed to disconnect:", response.message);
            }
        });
    };

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Google Calendar</h2>
            <p className="text-sm text-gray-600 mb-6">
                Link your calendar to see everything in one place—no more switching tabs or missing appointments.
            </p>
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
                    <div className="flex justify-start gap-6 mt-6">
                        <button onClick={handleSaveCalendar} className="w-btn us-btn-style_1 submit-btn">
                            Save Calendar
                        </button>
                        <button onClick={handleDisconnect} className="w-btn us-btn-style_1 submit-btn">
                            Disconnect Calendar
                        </button>
                    </div>

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
                        <p style={{ color: "red" }}>⚠️ Your Google Calendar access has expired. Attempting to refresh...</p>
                    )}
                    {!isConnected && (
                        <div className="mt-8">
                            <div className="bg-gray-100 p-6 rounded-md flex justify-between gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Connect with Google</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Log in with your existing Google account, or create a new one to see your google events in the FroHub Partner Calendar.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <button onClick={handleConnect} className="w-btn us-btn-style_1 submit-btn">
                                        Connect Google Calendar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GoogleCalendar;
