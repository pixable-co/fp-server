import React, { useEffect, useState } from "react";
import axios from "axios";
import FhTable from "../../common/controls/FhTable.jsx";

const FpBookingTable = () => {
    const partner_id =  fpserver_settings.partner_post_id;
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Start loading state
            try {
                const response = await axios.post(
                    "https://frohubecomm.mystagingwebsite.com/wp-json/custom/v1/orders",
                    {
                        partner_id: partner_id
                    }
                );

                // Transform the API data into the format expected by FhTable
                const transformedData = response.data.map((order) => ({
                    key: order.id.toString(),
                    date: order.acf_fields.booking_day, // Convert YYYYMMDD to YYYY-MM-DD
                    ref: `#${order.id}`,
                    time: order.acf_fields.booking_start_time_slot,
                    duration: calculateDuration(
                        order.acf_fields.booking_start_time_slot,
                        order.acf_fields.booking_end_time_slot
                    ),
                    service: order.acf_fields.service_type || "N/A",
                    deposit: `$${order.total || "0.00"}`, // Display order total
                    depositNote: `Remaining: $${calculateRemaining(order.total)}`, // Remaining amount placeholder
                    client: `${order.billing.first_name || "Unknown"} ${order.billing.last_name || "Unknown"}`,
                    status: formatStatus(order.status),
                }));

                setTableData(transformedData);
            } catch (error) {
                console.error("Error fetching data: ", error);
                setTableData([]); // Clear data on error
            } finally {
                setLoading(false); // End loading state
            }
        };

        fetchData();
    }, []);

    const formatDate = (date) => {
        if (!date) return "N/A";
        // Format YYYYMMDD to YYYY-MM-DD
        return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`;
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return "N/A";
        const startDate = new Date(`1970-01-01T${start}`);
        const endDate = new Date(`1970-01-01T${end}`);
        const diffMs = endDate - startDate; // Difference in milliseconds
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffHours} hr ${diffMinutes} mins`;
    };

    const calculateRemaining = (total) => {
        if (!total || parseFloat(total) === 0) return "0.00";
        return parseFloat(total).toFixed(2); // Remaining balance calculation placeholder
    };

    const formatStatus = (status) => {
        // Capitalize the first letter of each word in the status
        return status
            ? status
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
            : "Unknown";
    };

    return (
        <div>
            {loading ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>Loading data...</div>
            ) : (
                <FhTable data={tableData} />
            )}
        </div>
    );
};

export default FpBookingTable;
