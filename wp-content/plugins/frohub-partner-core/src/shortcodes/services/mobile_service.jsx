import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, Circle, useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '400px',
};

const defaultCenter = {
    lat: 51.5074, // Default to London
    lng: -0.1278,
};

const MobileService = () => {
    const partnerId =  Number(fpserver_settings.partner_post_id);
    const [position, setPosition] = useState(defaultCenter);
    const [isLoaded, setIsLoaded] = useState(false);
    const [travelFees, setTravelFees] = useState([
        { miles: 3, fee: 0.00 },
        { miles: 5, fee: 5.00 },
        { miles: 10, fee: 7.00 }
    ]);
    const autocompleteRef = useRef(null);

    // Load the Google Maps JavaScript API and Places Library
    const { isLoaded: isMapLoaded } = useJsApiLoader({
        googleMapsApiKey: 'AIzaSyDfCq6qG1IOH2aJtp44RPif8QeO6Samnzc',
        libraries: ['places'],
    });

    // Fetch existing location data on mount
    useEffect(() => {
        if (partnerId) {
            fetch(`http://localhost:10013/wp-json/frohub/v1/get-location-data/${partnerId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.data) {
                        setPosition({
                            lat: parseFloat(data.data.latitude) || defaultCenter.lat,
                            lng: parseFloat(data.data.longitude) || defaultCenter.lng
                        });
                        setTravelFees(data.data.radius_fees.map(fee => ({
                            miles: parseFloat(fee.radius),
                            fee: parseFloat(fee.price)
                        })));
                    }
                })
                .catch(error => console.error('Error fetching data:', error));
        }
    }, [partnerId]);

    // Handle Place Selection from Autocomplete
    const handlePlaceChanged = () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setPosition({ lat, lng });
            setIsLoaded(true);
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

    // Update miles or fee for a specific entry and sync radius
    const handleInputChange = (index, field, value) => {
        const updatedFees = [...travelFees];
        updatedFees[index][field] = field === 'fee' ? parseFloat(value) : parseInt(value, 10);
        setTravelFees(updatedFees);
    };

    // Save the data to the API
    const saveLocationData = async () => {
        const payload = {
            partner_id: partnerId,
            latitude: position.lat.toString(),
            longitude: position.lng.toString(),
            radius_fees: travelFees.map(fee => ({
                radius: fee.miles.toString(),
                price: fee.fee.toString()
            }))
        };

        try {
            const response = await fetch('http://localhost:10013/wp-json/frohub/v1/update-location-data', {
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
        }
    };

    if (!isMapLoaded) return <div>Loading Map...</div>;

    return (
        <div>
            <h2>Your address</h2>
            <Autocomplete
                onLoad={(ref) => (autocompleteRef.current = ref)}
                onPlaceChanged={handlePlaceChanged}
                options={{
                    componentRestrictions: { country: 'uk' }, // Restrict to UK
                }}
            >
                <input
                    type="text"
                    placeholder="30 Churchill Place, London, E14 5RE"
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
                    {isLoaded && (
                        <>
                            <Marker position={position} />
                            {travelFees.map((item, index) => (
                                <Circle
                                    key={index}
                                    center={position}
                                    radius={item.miles * 1609.34} // Convert miles to meters
                                    options={{
                                        fillColor: 'red',
                                        fillOpacity: 0.2 + (index * 0.1), // Varying opacity for visibility
                                        strokeColor: 'red',
                                    }}
                                />
                            ))}
                        </>
                    )}
                </GoogleMap>
            </div>

            {/* Travel Radius and Fees Repeater */}
            <div style={{ marginTop: '30px' }}>
                <h3>Travel Radius and Fees</h3>
                <p style={{ color: '#666' }}>
                    Add the distances you are willing to travel and the corresponding fees.
                </p>

                {travelFees.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        {/* Miles Input */}
                        <input
                            type="number"
                            value={item.miles}
                            onChange={(e) => handleInputChange(index, 'miles', e.target.value)}
                            placeholder="Miles"
                            style={{
                                width: '100px',
                                padding: '10px',
                                marginRight: '10px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                            }}
                        />
                        <span style={{ marginRight: '10px' }}>miles</span>

                        {/* Fee Input */}
                        <input
                            type="number"
                            value={item.fee}
                            onChange={(e) => handleInputChange(index, 'fee', e.target.value)}
                            placeholder="Fee"
                            style={{
                                width: '100px',
                                padding: '10px',
                                marginRight: '10px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                            }}
                        />
                        <span style={{ marginRight: '10px' }}>£</span>

                        {/* Add New Entry Button */}
                        <button onClick={addTravelFee} style={{
                            padding: '10px',
                            backgroundColor: '#4CAF50',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginRight: '5px'
                        }}>
                            +
                        </button>

                        {/* Remove Entry Button */}
                        <button
                            onClick={() => removeTravelFee(index)}
                            disabled={travelFees.length === 1} // Disable if only one entry remains
                            style={{
                                padding: '10px',
                                backgroundColor: travelFees.length === 1 ? '#ccc' : '#F44336',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: travelFees.length === 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            -
                        </button>
                    </div>
                ))}
            </div>

            {/* Save Button */}
            <button onClick={saveLocationData} style={{ marginTop: '20px', padding: '10px', backgroundColor: '#007bff', color: '#fff', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>
                Save
            </button>
        </div>
    );
};

export default MobileService;
