import { useState, useEffect } from 'react';
import FhSelectInput from "./repeterControls/FhSelectInput.jsx";
import FhSelectTime from "./repeterControls/FhSelectTime.jsx";
import { MinusOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons'; // Using Ant Design icons
import { Tooltip } from "antd"; // Using Ant Design Tooltip

const FhRepeater = ({ form, label, fieldName, defaultValues = [], required, fieldNames = [], controlSupport, helptext }) => {
    const [repeaterData, setRepeaterData] = useState(defaultValues);

    useEffect(() => {
        const initialData = defaultValues;
        setRepeaterData(initialData);
    }, [form, fieldName, defaultValues]);

    useEffect(() => {
        form.setFieldsValue({ [fieldName]: repeaterData });
    }, [form, fieldName, repeaterData]);

    const handleChange = (index, name, value) => {
        const updatedData = [...repeaterData];
        updatedData[index] = { ...updatedData[index], [name]: value };
        setRepeaterData(updatedData);
    };

    const handleAddField = () => {
        const newField = {
            ...(controlSupport ? { [controlSupport.name]: '' } : {}),
            ...fieldNames.reduce((acc, key) => ({ ...acc, [key]: '' }), {}),
        };
        setRepeaterData([...repeaterData, newField]);
    };

    const handleRemoveField = (index) => {
        const updatedData = repeaterData.filter((_, i) => i !== index);
        setRepeaterData(updatedData);
        console.log(updatedData);
    };

    const renderDynamicComponent = (field, index) => {
        if (!controlSupport) {
            return (
                <FhSelectInput
                    field={field}
                    index={index}
                    onChange={handleChange}
                />
            );
        }

        switch (controlSupport.type) {
            case 'select':
                return (
                    <FhSelectTime
                        field={field}
                        index={index}
                        onChange={handleChange}
                        controlSupport={controlSupport}
                    />
                );
            default:
                return (
                    <FhSelectInput
                        field={field}
                        index={index}
                        onChange={handleChange}
                    />
                );
        }
    };

    return (
        <div className="mb-4">
            <div className="flex items-center">
                <label>{label}</label>
                {helptext && (
                    <Tooltip title={helptext}>
                        <InfoCircleOutlined className="h-5 w-5 text-gray-500 cursor-pointer ml-2" />
                    </Tooltip>
                )}
            </div>
            {required && (
                <p className="text-red-500 text-xs mb-2">
                    Please input at least one {label}!
                </p>
            )}
            <div>
                {repeaterData.map((field, index) => (
                    <div key={index} className="flex justify-between gap-2 mb-2">
                        {renderDynamicComponent(field, index)}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleAddField}
                                className="p-1 border rounded-md"
                            >
                                <PlusOutlined className="fhrepeter__plusicon" />
                            </button>

                            <button
                                onClick={() => handleRemoveField(index)}
                                className="p-1 bg-black text-white rounded-full"
                            >
                                <MinusOutlined className="fhrepeter__minusicon" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FhRepeater;