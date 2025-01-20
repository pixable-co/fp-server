import { useState } from 'react';
import { Popover, Button } from "antd";
import { ClockIcon } from "@heroicons/react/24/outline";

const FhTime = ({ label }) => {
    const [selectedTime, setSelectedTime] = useState("09:00");

    // Example time options
    const timeOptions = [
        "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"
    ];

    const handleTimeSelect = (time) => {
        setSelectedTime(time);
    };

    const content = (
        <div className="flex flex-col space-y-2">
            {timeOptions.map((time, index) => (
                <Button
                    key={index}
                    type="text"
                    className="w-full text-left"
                    onClick={() => handleTimeSelect(time)}
                >
                    {time}
                </Button>
            ))}
        </div>
    );

    return (
        <div className="fh-time">
            {label && <label className="fh-time__label">{label}</label>}
            <Popover
                content={content}
                trigger="click"
                overlayClassName="fh-time__popover"
            >
                <Button
                    className="flex items-center justify-between w-24 border rounded-md"
                >
                    <span>{selectedTime}</span>
                    <ClockIcon className="w-5 h-5 text-gray-500" />
                </Button>
            </Popover>
        </div>
    );
};

export default FhTime;