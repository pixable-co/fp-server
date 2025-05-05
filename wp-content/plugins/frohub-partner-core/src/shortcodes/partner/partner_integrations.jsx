import React, { useEffect, useState } from "react";
import { fetchData } from "../../services/fetchData.js";
import { toastNotification } from "../../utils/toastNotification.js";

const PartnerIntegrations = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [calendars, setCalendars] = useState([]);
    const [selectedCalendar, setSelectedCalendar] = useState("");
    const [savedCalendar, setSavedCalendar] = useState("");

    useEffect(() => {
        fetchData("fpserver/check_google_auth_status", (response) => {
            if (response.data.authenticated === false) {
                refreshGoogleToken();
            }
            if (response.success) {
                setIsConnected(response.data.authenticated);
                setIsExpired(response.data.expired);

                if (response.data.authenticated) {
                    if (response.data.expired) {
                        refreshGoogleToken();
                    } else {
                        fetchAvailableCalendars();
                        fetchSavedCalendar();
                    }
                }
            }
        });
    }, []);

    const refreshGoogleToken = () => {
        fetchData("fpserver/refresh_google_token", (response) => {
            if (response.success) {
                setIsExpired(false);
                fetchAvailableCalendars();
                fetchSavedCalendar();
            } else {
                toastNotification("info", "Google Calendar Disconnected", "Google Calendar session expired. Please reconnect.");
            }
        });
    };

    const fetchAvailableCalendars = () => {
        fetchData("fpserver/get_google_calendars", (response) => {
            if (response.success) {
                setCalendars(response.data.calendars);
            }
        });
    };

    const fetchSavedCalendar = () => {
        fetchData("fpserver/get_user_calendar_events", (response) => {
            if (response.success) {
                setSavedCalendar(response.data.events);
            }
        });
    };

    const handleCalendarChange = (event) => {
        setSelectedCalendar(event.target.value);
    };

    const handleSaveCalendar = () => {
        if (!selectedCalendar) {
            toastNotification("error", "Calendar Not Selected", "Please select a calendar first.");
            return;
        }

        fetchData("fpserver/save_user_calendar", (response) => {
            if (response.success) {
                setSavedCalendar(selectedCalendar);
                toastNotification("success", "Success", "Calendar saved successfully.");
            }
        }, { calendar_id: selectedCalendar });
    };

    const handleConnect = () => {
        fetchData("fpserver/get_google_auth_url", (response) => {
            if (response.success) {
                window.location.href = response.data.auth_url;
            }
        });
    };

    const handleDisconnect = () => {
        fetchData("fpserver/disconnect_google_calendar", (response) => {
            if (response.success) {
                setIsConnected(false);
                setCalendars([]);
                setSavedCalendar("");
                toastNotification("success", "Disconnected", "Disconnected from Google Calendar.");
            }
        });
    };

    return (
        <div className="space-y-12">
            {/* Calendars */}
            <section>
                <h1 className="text-xl font-bold">Calendars</h1>
                <p className="text-sm text-gray-600 mb-4">
                        Sync your existing calendars to keep your availability accurate for clients. Any events on your personal calendar will automatically block out time on FroHub.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Google Calendar */}
                    <div className={`border rounded-lg p-5 shadow-sm ${isConnected ? "bg-gray-100" : ""}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <img src="https://img.icons8.com/color/48/000000/google-calendar--v2.png" alt="Google" className="w-8 h-8" />
                            <span className="font-semibold">Google Calendar</span>
                            {isConnected && !isExpired && <span className="ml-auto text-green-600 font-bold text-lg">✔</span>}
                        </div>

                        {isConnected && !isExpired ? (
                            <>
                                <label className="block text-sm mb-1">Select a calendar to import into FroHub</label>
                                <select onChange={handleCalendarChange} value={selectedCalendar} className="w-full border p-2 rounded">
                                    <option value="">-- Select --</option>
                                    {calendars.map((calendar) => (
                                        <option key={calendar.id} value={calendar.id}>
                                            {calendar.name}
                                        </option>
                                    ))}
                                </select>

                                <div className="flex gap-3 mt-4">
                                    <button onClick={handleSaveCalendar} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                                        Save
                                    </button>
                                    <button onClick={handleDisconnect} className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600">
                                        Disconnect
                                    </button>
                                </div>

                                {savedCalendar && (
                                    <p className="text-blue-600 mt-3 text-sm">✅ Saved Calendar: {savedCalendar}</p>
                                )}
                            </>
                        ) : (
                            <>
                                {isExpired && (
                                    <p className="text-red-500 text-sm mb-3">⚠️ Google Calendar session expired. Attempting refresh…</p>
                                )}
                                <button onClick={handleConnect} className="w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-800">
                                    Connect
                                </button>
                            </>
                        )}
                    </div>

                    {/* Outlook */}
                    <div className="flex flex-col justify-center gap-6 border rounded-lg p-5 shadow-sm bg-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <img src="https://img.icons8.com/color/48/000000/microsoft-outlook-2019.png" alt="Outlook" className="w-8 h-8" />
                            <span className="font-semibold">Microsoft Outlook</span>
                        </div>
                        <button className="w-full bg-gray-500 text-white py-2 rounded cursor-not-allowed opacity-60">Connect</button>
                    </div>

                    {/* iCloud */}
                    <div className="flex flex-col justify-center gap-6 border rounded-lg p-5 shadow-sm bg-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <img src="https://img.icons8.com/ios-filled/50/000000/mac-os.png" alt="iCloud" className="w-8 h-8" />
                            <span className="font-semibold">iCloud Calendar</span>
                        </div>
                        <button className="w-full bg-gray-500 text-white py-2 rounded cursor-not-allowed opacity-60">Connect</button>
                    </div>
                </div>
            </section>

            {/* Communications */}
            <section>
                <h2 className="text-lg font-semibold">Communications</h2>
                <p className="text-sm text-gray-600 mb-4">Stay on top of your bookings and client messages with real-time updates for seamless communication.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-5 shadow-sm bg-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <img src="https://img.icons8.com/ios-filled/50/25D366/whatsapp--v1.png" alt="WhatsApp" className="w-6 h-6" />
                            <span className="font-semibold">WhatsApp</span>
                        </div>
                        <button className="w-full bg-gray-500 text-white py-2 rounded cursor-not-allowed opacity-60">Connect</button>
                    </div>

                    <div className="border rounded-lg p-5 shadow-sm bg-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <img src="https://img.icons8.com/ios-filled/50/000000/sms.png" alt="SMS" className="w-6 h-6" />
                            <span className="font-semibold">SMS</span>
                        </div>
                        <button className="w-full bg-gray-300 text-gray-700 py-2 rounded cursor-not-allowed">Coming Soon</button>
                    </div>
                </div>
            </section>

            {/* Accounting Software */}
            <section>
                <h2 className="text-lg font-semibold">Accounting Software</h2>
                <p className="text-sm text-gray-600 mb-4">Integrate your accounting software to view key financial insights and track your expenses in real time.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-5 shadow-sm bg-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-black text-xl font-bold">⚠️</span>
                            <span className="font-semibold">Xero</span>
                        </div>
                        <button className="w-full bg-gray-500 text-white py-2 rounded">Connect</button>
                    </div>

                    <div className="border rounded-lg p-5 shadow-sm bg-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-black text-xl font-bold">⚠️</span>
                            <span className="font-semibold">Quickbooks</span>
                        </div>
                        <button className="w-full bg-gray-300 text-gray-700 py-2 rounded cursor-not-allowed">Coming Soon</button>
                    </div>

                    <div className="border rounded-lg p-5 shadow-sm bg-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-black text-xl font-bold">⚠️</span>
                            <span className="font-semibold">Freshbooks</span>
                        </div>
                        <button className="w-full bg-gray-300 text-gray-700 py-2 rounded cursor-not-allowed">Coming Soon</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PartnerIntegrations;
