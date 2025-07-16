import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, Circle, useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { Spin, Skeleton } from "antd";
import swal from "sweetalert";

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
        googleMapsApiKey: fpserver_settings.google_api_key,
        libraries: ["places"],
    });

    // Fetch partner data on mount
    useEffect(() => {
        if (partnerId) {
            fetch(`${fpserver_settings.base_api_url}/wp-json/frohub/v1/get-partner-data`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ partner_post_id: partnerId }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data) {
                        const addressParts = [
                            data.streetAddress,
                            data.city,
                            data.countyDistrict,
                            data.postcode,
                        ].filter(Boolean); // removes undefined, null, or empty string

                        setAddress(addressParts.join(', ')); // Join with commas
                    }

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
        updatedFees[index][field] = value; // Don't parse here to allow empty strings in UI
        setTravelFees(updatedFees);
    };

    // Save the data to the API
    const saveLocationData = async () => {
        if (!partnerId) {
            swal("Oops", "Invalid partner ID. Data cannot be saved.", "error");
            return;
        }

        // 🔍 Validate all travel fee prices
        const hasInvalidFee = travelFees.some(fee => {
            const parsedFee = parseFloat(fee.fee);
            return isNaN(parsedFee) || parsedFee <= 0;
        });

        if (hasInvalidFee) {
            swal("Required", "Please set a minimum price (greater than £0) for all travel fees.", "warning");
            return;
        }

        setSaving(true);

        // Make sure to parse values before sending to API
        const parsedFees = travelFees.map(fee => ({
            miles: parseFloat(fee.miles) || 0,
            fee: parseFloat(fee.fee) || 0
        }));

        const payload = {
            partner_id: partnerId,
            latitude: position.lat.toString(),
            longitude: position.lng.toString(),
            address: address,
            radius_fees: parsedFees.map((fee) => ({
                radius: fee.miles.toString(),
                price: fee.fee.toString(),
            })),
        };

        try {
            const response = await fetch(
                `${fpserver_settings.base_api_url}/wp-json/frohub/v1/update-location-data`,
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
                swal("Success", "Location data saved successfully!", "success");
            } else {
                swal("Oops", "Failed to save location data.", "error");
            }
        } catch (error) {
            console.error("Error saving data:", error);
            swal("Oops", "Something went wrong!", "error");
        } finally {
            setSaving(false);
        }
    };

    if (!isMapLoaded || loading)
        return <Skeleton active paragraph={{ rows: 6 }} style={{ margin: "50px auto", maxWidth: "800px" }} />;

    return (
        <div>
            <h2>Your Address</h2>

            {/* Address Field (Disabled) */}
            <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)}>
                <input
                    type="text"
                    value={address}
                    disabled // ✅ Field is now disabled
                    placeholder="No Address Set"
                    style={{
                        padding: "10px",
                        maxWidth: "600px",
                        marginRight: "10px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                    }}
                />
            </Autocomplete>
            <p className="mt-4">To change your address go to <a href="/partner-profile">Partner Profile</a> Settings</p>

            {/* Google Map */}
            <div style={{ marginTop: "20px" }}>
                <GoogleMap mapContainerStyle={containerStyle} center={position} zoom={13}>
                    <Marker position={position} />
                    {travelFees.length > 0 &&
                        travelFees.map((item, index) => {
                            const miles = parseFloat(item.miles);
                            return miles > 0 ? (
                                <Circle
                                    key={index}
                                    center={position}
                                    radius={miles * 1609.34}
                                    options={{
                                        fillColor: "red",
                                        fillOpacity: 0.2 + index * 0.1,
                                        strokeColor: "red",
                                    }}
                                />
                            ) : null;
                        })}
                </GoogleMap>
            </div>

            {/* Travel Radius and Fees */}
            <div style={{ marginTop: "30px" }}>
                <h3>Travel Radius and Fees</h3>
                <p style={{ color: "#666" }}>
                    Set your travel radius and fees to define how far you'll travel for mobile appointments. Adjust fees based on distance to ensure fair compensation for your time and travel.
                </p>

                <p>Tip: Clients are usually attracted to lower travel fees, so stylists who set a higher service price but a lower travel fee usually get more bookings.</p>

                {travelFees.map((item, index) => (
                    <div className="fee-row" key={index}>
                        {/* Miles input with suffix */}
                        <div className="input-wrapper suffix">
                            <input
                                type="number"
                                min="0"
                                value={item.miles}
                                onChange={(e) => handleInputChange(index, "miles", e.target.value)}
                                className="input-field"
                            />
                            <span className="suffix-text">miles</span>
                        </div>

                        {/* Fee input with prefix */}
                        <div className="input-wrapper prefix">
                            <span className="prefix-text">£</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.fee}
                                onChange={(e) => handleInputChange(index, "fee", e.target.value)}
                                className="input-field fee-field"
                            />
                        </div>

                        {/* Action buttons for adding and removing rows */}
                        <div className="action-buttons">
                            <button
                                type="button"
                                className="action-btn"
                                onClick={addTravelFee}
                            >
                                +
                            </button>
                            <button
                                type="button"
                                className="action-btn"
                                onClick={() => removeTravelFee(index)}
                                disabled={travelFees.length === 1}
                            >
                                −
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Save Button with Loading */}
            <button
                onClick={saveLocationData}
                disabled={saving}
                style={{
                    marginTop: "20px",
                    padding: "8px 16px",
                    borderRadius: "5px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    cursor: saving ? "not-allowed" : "pointer"
                }}
            >
                {saving ? "Saving..." : "Save"}
            </button>
        </div>
    );
};

export default MobileService;