import React, { useState } from "react";
import { Table, Tag, Select, DatePicker } from "antd";
import "./style.css";

const { RangePicker } = DatePicker;

const FhTable = ({data}) => {
    const [filteredData, setFilteredData] = useState(null); // Initially null to show all data
    const [statusFilter, setStatusFilter] = useState([]);
    const [dateFilter, setDateFilter] = useState([]);


    const columns = [
        {
            title: "Ref",
            dataIndex: "ref",
            key: "ref",
            render: (text) => <a style={{ color: "#1E90FF", fontWeight: "bold" }}>{text}</a>,
        },
        { title: "Time", dataIndex: "time", key: "time" },
        { title: "Duration", dataIndex: "duration", key: "duration" },
        { title: "Service", dataIndex: "service", key: "service" },
        {
            title: "Deposit Collected",
            dataIndex: "deposit",
            key: "deposit",
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: "bold" }}>{text}</div>
                    <div style={{ fontSize: "12px", color: "#999" }}>{record.depositNote}</div>
                </div>
            ),
        },
        { title: "Client", dataIndex: "client", key: "client" },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => {
                let color = "#000";
                if (status === "Processing") color = "#FA8C16";
                if (status === "Completed") color = "#52C41A";
                if (status === "Cancelled") color = "#F5222D";

                return (
                    <Tag color={color} style={{ fontWeight: "bold" }}>
                        {status}
                    </Tag>
                );
            },
        },
    ];

    const handleStatusChange = (values) => {
        setStatusFilter(values);
        applyFilters(values, dateFilter);
    };

    const handleDateChange = (dates) => {
        if (dates) {
            const startDate = new Date(dates[0]);
            const endDate = new Date(dates[1]);
            setDateFilter([startDate, endDate]);
            applyFilters(statusFilter, [startDate, endDate]);
        } else {
            setDateFilter([]);
            applyFilters(statusFilter, []);
        }
    };

    const applyFilters = (statusFilter, dateFilter) => {
        // If no filters are applied, reset to show all data
        if (statusFilter.length === 0 && dateFilter.length === 0) {
            setFilteredData(null); // null means show all data
            return;
        }

        let filtered = [...data];

        // Apply status filter
        if (statusFilter.length > 0) {
            filtered = filtered.filter((item) => statusFilter.includes(item.status));
        }

        // Apply date filter
        if (dateFilter.length === 2) {
            const [startDate, endDate] = dateFilter;

            filtered = filtered.filter((item) => {
                const itemDate = new Date(item.date);

                const itemDateWithoutTime = new Date(itemDate);
                itemDateWithoutTime.setHours(0, 0, 0, 0);

                const startDateWithoutTime = new Date(startDate);
                startDateWithoutTime.setHours(0, 0, 0, 0);

                const endDateWithoutTime = new Date(endDate);
                endDateWithoutTime.setHours(23, 59, 59, 999);

                return (
                    itemDateWithoutTime >= startDateWithoutTime &&
                    itemDateWithoutTime <= endDateWithoutTime
                );
            });
        }

        setFilteredData(filtered);
    };

    const groupedData = () => {
        const dataToDisplay = filteredData === null ? data : filteredData; // Show all data if no filters are applied

        if (dataToDisplay.length === 0) {
            return [];
        }

        const grouped = dataToDisplay.reduce((acc, item) => {
            if (!acc[item.date]) {
                acc[item.date] = [];
            }
            acc[item.date].push(item);
            return acc;
        }, {});

        return Object.entries(grouped).map(([date, items]) => ({ date, items }));
    };

    return (
        <div className="fh-table-container">
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
                <RangePicker onChange={handleDateChange} />
                <Select
                    mode="multiple"
                    placeholder="Filter by Status"
                    style={{ minWidth: "200px" }}
                    onChange={handleStatusChange}
                    allowClear
                >
                    <Select.Option value="Processing">Processing</Select.Option>
                    <Select.Option value="Completed">Confirmed</Select.Option>
                    <Select.Option value="Cancelled">Cancelled by Client</Select.Option>
                    <Select.Option value="Awaiting Deposit Payout">Awaiting Deposit Payout</Select.Option>
                </Select>
            </div>
            {groupedData().length > 0 ? (
                groupedData().map((group) => (
                    <div key={group.date} style={{ marginBottom: "20px" }}>
                        <div
                            style={{
                                backgroundColor: "#F5F5F5",
                                padding: "10px",
                                fontWeight: "bold",
                                fontSize: "14px",
                                borderTop: "1px solid #d9d9d9",
                                borderLeft: "1px solid #d9d9d9",
                                borderRight: "1px solid #d9d9d9",
                                borderRadius: "5px 5px 0 0",
                            }}
                        >
                            {new Date(group.date).toLocaleDateString("en-GB", {
                                weekday: "short",
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            })}
                        </div>
                        <Table
                            dataSource={group.items}
                            columns={columns}
                            pagination={false}
                            bordered
                            style={{
                                borderRadius: "0 0 5px 5px",
                                border: "1px solid #d9d9d9",
                                marginTop: "-1px",
                            }}
                        />
                    </div>
                ))
            ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                    No bookings found for the selected filters.
                </div>
            )}
        </div>
    );
};

export default FhTable;
