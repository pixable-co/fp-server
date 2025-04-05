import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, Circle, useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { Spin } from "antd";

const containerStyle = {
    width: "100%",
    height: "400px",
};

const defaultCenter = {
    lat: 51.5074,
    lng: -0.1278,
};

const MobileService = () => {
    const partnerId = fpserver_settings.partner_post_id ? Number(fpserver_settings.partner_post_id) : null;
    const [position, setPosition] = useState(defaultCenter);
    const [travelFees, setTravelFees] = useState([]); // ✅ Travel fees from API
    const [address, setAddress] = useState(""); // ✅ Address from API
    const [loading, setLoading] = useState(true); // ✅ Show while fetching data
    const [saving, setSaving] = useState(false); // ✅ Show while saving data
    const autocompleteRef = useRef(null);

    // Load Google Maps API
    const { isLoaded: isMapLoaded } = useJsApiLoader({
        googleMapsApiKey: "AIzaSyDfCq6qG1IOH2aJtp44RPif8QeO6Samnzc",
        libraries: ["places"],
    });

    // Fetch partner data on mount
    useEffect(() => {
        if (partnerId) {
            fetch("https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/get-partner-data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ partner_post_id: partnerId }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.streetAddress) {
                        setAddress(data.streetAddress + ',' + data.city + ',' + data.postcode); // ✅ Set address from API
                    }

                    // if (data.mobileServiceFee && Array.isArray(data.mobileServiceFee)) {
                    //     setTravelFees(
                    //         data.mobileServiceFee.map((fee) => ({
                    //             miles: parseFloat(fee.radius) || 0,
                    //             fee: parseFloat(fee.price) || 0,
                    //         }))
                    //     );
                    // }

                    if (data.mobileServiceFee && Array.isArray(data.mobileServiceFee) && data.mobileServiceFee.length > 0) {
                        setTravelFees(
                            data.mobileServiceFee.map((fee) => ({
                                miles: parseFloat(fee.radius) || 0,
                                fee: parseFloat(fee.price) || 0,
                            }))
                        );
                    } else {
                        // Ensure at least one empty row is shown if no fees exist
                        setTravelFees([{ miles: "", fee: "" }]);
                    }

                    setPosition({
                        lat: parseFloat(data.latitude) || defaultCenter.lat,
                        lng: parseFloat(data.longitude) || defaultCenter.lng,
                    });

                    setLoading(false); // ✅ Hide loader after data fetch
                })
                .catch((error) => {
                    console.error("Error fetching partner data:", error);
                    setLoading(false);
                });
        }
    }, [partnerId]);

    // Add new travel fee entry
    const addTravelFee = () => {
        setTravelFees([...travelFees, { miles: "", fee: "" }]);
    };

    // Remove a travel fee entry
    const removeTravelFee = (index) => {
        const updatedFees = travelFees.filter((_, i) => i !== index);
        setTravelFees(updatedFees);
    };

    // Update miles or fee for a specific entry
    const handleInputChange = (index, field, value) => {
        const updatedFees = [...travelFees];
        updatedFees[index][field] = field === "fee" ? parseFloat(value) : parseInt(value, 10);
        setTravelFees(updatedFees);
    };

    // Save the data to the API
    const saveLocationData = async () => {
        if (!partnerId) {
            alert("Invalid partner ID. Data cannot be saved.");
            return;
        }

        setSaving(true);

        const payload = {
            partner_id: partnerId,
            latitude: position.lat.toString(),
            longitude: position.lng.toString(),
            address: address,
            radius_fees: travelFees.map((fee) => ({
                radius: fee.miles.toString(),
                price: fee.fee.toString(),
            })),
        };

        try {
            const response = await fetch(
                "https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/update-location-data",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();
            if (data.success) {
                alert("Location data saved successfully!");
            } else {
                alert("Failed to save location data.");
            }
        } catch (error) {
            console.error("Error saving data:", error);
            alert("An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    if (!isMapLoaded || loading)
        return <Spin size="large" style={{ display: "block", margin: "50px auto" }} />;

    return (
        <div>
            <h2>Your Address</h2>

            {/* Address Field (Disabled) */}
            <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)}>
                <input
                    type="text"
                    value={address}
                    disabled // ✅ Field is now disabled
                    placeholder="Loading address..."
                    style={{
                        padding: "10px",
                        width: "300px",
                        marginRight: "10px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                    }}
                />
            </Autocomplete>
            <p class="mt-4">To change your address go to <a href="/partner-profile">Partner Profile</a> Settings</p>

            {/* Google Map */}
            <div style={{ marginTop: "20px" }}>
                <GoogleMap mapContainerStyle={containerStyle} center={position} zoom={13}>
                    <Marker position={position} />
                    {travelFees.length > 0 &&
                        travelFees.map((item, index) => (
                            <Circle
                                key={index}
                                center={position}
                                radius={item.miles * 1609.34}
                                options={{
                                    fillColor: "red",
                                    fillOpacity: 0.2 + index * 0.1,
                                    strokeColor: "red",
                                }}
                            />
                        ))}
                </GoogleMap>
            </div>

            {/* Travel Radius and Fees */}
            <div style={{ marginTop: "30px" }}>
                <h3>Travel Radius and Fees</h3>
                <p style={{ color: "#666" }}>Add the distances you are willing to travel and the corresponding fees.</p>

                {travelFees.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto 1fr auto auto auto",
                            gap: "10px",
                            marginBottom: "12px",
                            alignItems: "center",
                            maxWidth: "600px",
                        }}
                    >
                        <input
                            type="number"
                            value={item.miles || ""}
                            onChange={(e) => handleInputChange(index, "miles", e.target.value)}
                            placeholder="Distance (miles)"
                            style={{
                                padding: "8px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                width: "100%",
                            }}
                        />
                        <span style={{ whiteSpace: "nowrap" }}>miles</span>

                        <input
                            type="number"
                            value={item.fee || ""}
                            onChange={(e) => handleInputChange(index, "fee", e.target.value)}
                            placeholder="Fee"
                            style={{
                                padding: "8px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                width: "100%",
                            }}
                        />
                        <span style={{ whiteSpace: "nowrap" }}>£</span>

                        <button
                            onClick={addTravelFee}
                            style={{
                                padding: "4px 10px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                background: "#f0f0f0",
                                cursor: "pointer",
                            }}
                        >
                            +
                        </button>
                        <button
                            onClick={() => removeTravelFee(index)}
                            disabled={travelFees.length === 1}
                            style={{
                                padding: "4px 10px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                background: travelFees.length === 1 ? "#eee" : "#f0f0f0",
                                color: travelFees.length === 1 ? "#aaa" : "#000",
                                cursor: travelFees.length === 1 ? "not-allowed" : "pointer",
                            }}
                        >
                            -
                        </button>
                    </div>
                ))}

            </div>

            {/* Save Button with Loading */}
            <button onClick={saveLocationData} disabled={saving} style={{ marginTop: "20px" }}>
                {saving ? <Spin size="small" /> : "Save"}
            </button>
        </div>
    );
};

export default MobileService;
