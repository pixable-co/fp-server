import React from "react";
import { Table, Tag, Button } from "antd";
import './style.css';

const FhTable = () => {
    // Example data
    const data = [
        {
            key: "1",
            ref: "#12345",
            time: "15:00",
            duration: "1 hr 30 mins",
            service: "Service Name",
            deposit: "£30.00",
            depositNote: "Due on the day: £100.00",
            client: "Roger Bennett",
            status: "Pending",
            action: "Confirm",
            reschedule: true,
        },
        {
            key: "2",
            ref: "#12345",
            time: "16:00",
            duration: "1 hr 30 mins",
            service: "Service Name",
            deposit: "£30.00",
            depositNote: "Due on the day: £100.00",
            client: "Roger Bennett",
            status: "Confirmed",
            action: null,
            reschedule: false,
        },
        {
            key: "3",
            ref: "#12345",
            time: "17:00",
            duration: "1 hr 30 mins",
            service: "Service Name",
            deposit: "£30.00",
            depositNote: "Due on the day: £100.00",
            client: "Roger Bennett",
            status: "Early Cancel by Client",
            action: null,
            reschedule: false,
        },
    ];

    // Columns configuration
    const columns = [
        {
            title: "Ref",
            dataIndex: "ref",
            key: "ref",
            render: (text) => (
                <a style={{ color: "#1E90FF", fontWeight: "bold", fontSize: "14px" }}>{text}</a>
            ),
        },
        {
            title: "Time",
            dataIndex: "time",
            key: "time",
        },
        {
            title: "Duration",
            dataIndex: "duration",
            key: "duration",
        },
        {
            title: "Service",
            dataIndex: "service",
            key: "service",
        },
        {
            title: "Deposit Collected",
            dataIndex: "deposit",
            key: "deposit",
            render: (text, record) => (
                <div>
                    <div style={{ color: "#333", fontWeight: "bold" }}>{text}</div>
                    <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                        {record.depositNote}
                    </div>
                </div>
            ),
        },
        {
            title: "Client",
            dataIndex: "client",
            key: "client",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => {
                let backgroundColor = "#d9d9d9";
                let color = "#000";
                if (status === "Pending") {
                    backgroundColor = "#FFF4E5"; // Light orange background
                    color = "#FA8C16"; // Orange text
                }
                if (status === "Confirmed") {
                    backgroundColor = "#E6F7E9"; // Light green background
                    color = "#52C41A"; // Green text
                }
                if (status === "Early Cancel by Client") {
                    backgroundColor = "#FFF1F0"; // Light red background
                    color = "#F5222D"; // Red text
                }

                return (
                    <Tag
                        style={{
                            backgroundColor,
                            color,
                            fontWeight: "bold",
                            padding: "5px 10px",
                            borderRadius: "15px",
                            border: "1px solid transparent",
                        }}
                    >
                        {status}
                    </Tag>
                );
            },
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <div style={{ display: "flex", gap: "10px" }}>
                    {record.reschedule && (
                        <Button
                            type="link"
                            style={{
                                padding: 0,
                                color: "#1E90FF",
                                fontWeight: "bold",
                                textDecoration: "underline",
                            }}
                        >
                            Reschedule
                        </Button>
                    )}
                    {record.action && (
                        <Button
                            type="primary"
                            size="small"
                            style={{
                                backgroundColor: "#52C41A",
                                borderColor: "#52C41A",
                                fontWeight: "bold",
                            }}
                        >
                            {record.action}
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    // Row group configuration
    const groupedData = [
        { date: "Thu, 19 July 2024", data: data },
        { date: "Fri, 20 July 2024", data: data },
        { date: "Sat, 21 July 2024", data: data },
    ];

    return (
        <div className="fh-table-container">
            {groupedData.map((group, index) => (
                <div key={index} style={{ marginBottom: "20px" }}>
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
                        {group.date}
                    </div>
                    <Table
                        dataSource={group.data}
                        columns={columns}
                        pagination={false}
                        bordered
                        style={{
                            borderRadius: "0 0 5px 5px",
                            border: "1px solid #d9d9d9",
                            marginTop: "-1px", // Merge border with header
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

export default FhTable;
