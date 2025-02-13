import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, Circle, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Spin } from 'antd';

const containerStyle = {
    width: '100%',
    height: '400px',
};

const defaultCenter = {
    lat: 51.5074,
    lng: -0.1278,
};

const MobileService = () => {
    const partnerId = fpserver_settings.partner_post_id ? Number(fpserver_settings.partner_post_id) : null;
    const [position, setPosition] = useState(defaultCenter);
    const [travelFees, setTravelFees] = useState([
        { miles: 3, fee: 0.00 },
        { miles: 5, fee: 5.00 },
        { miles: 10, fee: 7.00 }
    ]);
    const [address, setAddress] = useState(""); // Address for search box
    const [loading, setLoading] = useState(true); // Show while fetching data
    const [saving, setSaving] = useState(false); // Show while saving data
    const autocompleteRef = useRef(null);

    // Load Google Maps API
    const { isLoaded: isMapLoaded } = useJsApiLoader({
        googleMapsApiKey: 'AIzaSyDfCq6qG1IOH2aJtp44RPif8QeO6Samnzc',
        libraries: ['places'],
    });

    // Fetch location data on mount
    useEffect(() => {
        if (partnerId) {
            fetch(`https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/get-location-data/${partnerId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.data) {
                        setPosition({
                            lat: parseFloat(data.data.latitude) || defaultCenter.lat,
                            lng: parseFloat(data.data.longitude) || defaultCenter.lng
                        });

                        if (data.data.address) {
                            setAddress(data.data.address); // Set address
                        }

                        if (Array.isArray(data.data.radius_fees) && data.data.radius_fees.length > 0) {
                            setTravelFees(data.data.radius_fees.map(fee => ({
                                miles: parseFloat(fee.radius) || 0,
                                fee: parseFloat(fee.price) || 0
                            })));
                        }
                    }
                    setLoading(false); // Hide loader after data fetch
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                    setLoading(false);
                });
        }
    }, [partnerId]);

    // Handle Place Selection
    const handlePlaceChanged = () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
            setPosition({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            });

            if (place.formatted_address) {
                setAddress(place.formatted_address);
            }
        } else {
            alert('Please select a valid location from suggestions.');
        }
    };

    // Add a new travel fee entry
    const addTravelFee = () => {
        setTravelFees([...travelFees, { miles: '', fee: '' }]);
    };

    // Remove a travel fee entry
    const removeTravelFee = (index) => {
        const updatedFees = travelFees.filter((_, i) => i !== index);
        setTravelFees(updatedFees);
    };

    // Update miles or fee for a specific entry
    const handleInputChange = (index, field, value) => {
        const updatedFees = [...travelFees];
        updatedFees[index][field] = field === 'fee' ? parseFloat(value) : parseInt(value, 10);
        setTravelFees(updatedFees);
    };

    // Save the data to the API
    const saveLocationData = async () => {
        if (!partnerId) {
            alert("Invalid partner ID. Data cannot be saved.");
            return;
        }

        setSaving(true); // Show loader while saving

        const payload = {
            partner_id: partnerId,
            latitude: position.lat.toString(),
            longitude: position.lng.toString(),
            address: address, // Include address in payload
            radius_fees: travelFees.map(fee => ({
                radius: fee.miles.toString(),
                price: fee.fee.toString()
            }))
        };

        try {
            const response = await fetch('https://frohubecomm.mystagingwebsite.com/wp-json/frohub/v1/update-location-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (data.success) {
                alert('Location data saved successfully!');
            } else {
                alert('Failed to save location data.');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert('An error occurred while saving.');
        } finally {
            setSaving(false); // Hide loader after save completes
        }
    };

    if (!isMapLoaded || loading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;

    return (
        <div>
            <h2>Your address</h2>
            <Autocomplete
                onLoad={(ref) => (autocompleteRef.current = ref)}
                onPlaceChanged={handlePlaceChanged}
                options={{ componentRestrictions: { country: 'uk' } }}
            >
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter address..."
                    style={{
                        padding: '10px',
                        width: '300px',
                        marginRight: '10px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                    }}
                />
            </Autocomplete>

            <div style={{ marginTop: '20px' }}>
                <GoogleMap mapContainerStyle={containerStyle} center={position} zoom={13}>
                    <Marker position={position} />
                    {travelFees.length > 0 &&
                        travelFees.map((item, index) => (
                            <Circle
                                key={index}
                                center={position}
                                radius={item.miles * 1609.34}
                                options={{
                                    fillColor: 'red',
                                    fillOpacity: 0.2 + (index * 0.1),
                                    strokeColor: 'red',
                                }}
                            />
                        ))}
                </GoogleMap>
            </div>

            {/* Travel Radius and Fees */}
            <div style={{ marginTop: '30px' }}>
                <h3>Travel Radius and Fees</h3>
                <p style={{ color: '#666' }}>Add the distances you are willing to travel and the corresponding fees.</p>

                {travelFees.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <input
                            type="number"
                            value={item.miles || ''}
                            onChange={(e) => handleInputChange(index, 'miles', e.target.value)}
                            placeholder="Miles"
                        />
                        <span> miles </span>
                        <input
                            type="number"
                            value={item.fee || ''}
                            onChange={(e) => handleInputChange(index, 'fee', e.target.value)}
                            placeholder="Fee"
                        />
                        <span> £ </span>
                        <button onClick={addTravelFee}>+</button>
                        <button onClick={() => removeTravelFee(index)} disabled={travelFees.length === 1}>-</button>
                    </div>
                ))}
            </div>

            {/* Save Button with Loading */}
            <button onClick={saveLocationData} disabled={saving} style={{ marginTop: '20px' }}>
                {saving ? <Spin size="small" /> : "Save"}
            </button>
        </div>
    );
};

export default MobileService;
