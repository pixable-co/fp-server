import { useState } from 'react';
import { Form, Select } from "antd";

function FhSelect({ label, placeholder, name, value, options = [], onChange }) {
    const [selectedValue, setSelectedValue] = useState(value);

    const handleChange = (newValue) => {
        setSelectedValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <div className="fh-select">
            {label && (
                <label className="fh-select__label">
                    {label}
                </label>
            )}

            <Form.Item name={name}>
                <Select
                    value={selectedValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="fh-select__dropdown"
                >
                    {options.map((option, index) => (
                        <Select.Option key={index} value={option.value}>
                            {option.label}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>
        </div>
    );
}

export default FhSelect;