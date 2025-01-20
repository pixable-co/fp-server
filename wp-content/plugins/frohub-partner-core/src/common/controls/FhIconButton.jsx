import { useState, useEffect } from "react";
import { House, Store, Car, CircleCheckBig } from 'lucide-react';
import useMediaStore from "./mediaStore.js";

const FhIconButton = ({ options, name, form }) => {
    const [selectedOptions, setSelectedOptions] = useState([]);
    const { setServiceTypes, serviceTypes } = useMediaStore();

    // Initialize from store or form values
    useEffect(() => {
        if (serviceTypes.length > 0) {
            setSelectedOptions(serviceTypes);
            form?.setFieldValue(name, serviceTypes);
        } else {
            const formValues = form?.getFieldValue(name);
            if (formValues) {
                setSelectedOptions(formValues);
                setServiceTypes(formValues);
            }
        }
    }, [form, name]);

    const toggleSelect = (type) => {
        const newSelected = selectedOptions.includes(type)
            ? selectedOptions.filter((item) => item !== type)
            : [...selectedOptions, type];

        setSelectedOptions(newSelected);

        // Update form field
        if (form && name) {
            form.setFieldValue(name, newSelected);
        }

        // Save to mediaStore
        setServiceTypes(newSelected);
    };

    // Function to get the appropriate icon based on type
    const getIcon = (type) => {
        switch (type.toLowerCase()) {
            case 'home':
                return <House className="w-8 h-8 text-gray-400" />;
            case 'salon':
                return <Store className="w-8 h-8 text-gray-400" />;
            case 'mobile':
                return <Car className="w-8 h-8 text-gray-400" />;
            default:
                return <House className="w-8 h-8 text-gray-400" />;
        }
    };

    return (
        <div className="flex gap-3 mt-8 mb-8">
            {options.map((option) => (
                <div
                    key={option.type}
                    onClick={() => toggleSelect(option.type)}
                    className={`fhicon__button relative p-4 cursor-pointer transition-colors ${
                        selectedOptions.includes(option.type)
                            ? "bg-gray-100 border-gray-400"
                            : "bg-white border-gray-200"
                    }`}
                >
                    {/* Header with Icon */}
                    <div className="flex items-center gap-4">
                        {getIcon(option.type)}
                        {selectedOptions.includes(option.type) && (
                            <CircleCheckBig className="absolute top-4 right-4 w-6 h-6 text-gray-500" />
                        )}

                        <div>
                            <div className="font-semibold mb-2">
                                {option.title}
                            </div>

                            <p className="text-sm text-gray-500">
                                {option.description}
                            </p>
                        </div>
                    </div>

                    {/* Hidden Checkbox (for accessibility) */}
                    <input
                        type="checkbox"
                        checked={selectedOptions.includes(option.type)}
                        onChange={() => toggleSelect(option.type)}
                        className="absolute top-4 right-4 opacity-0"
                        aria-label={`Select ${option.title}`}
                    />
                </div>
            ))}
        </div>
    );
};

export default FhIconButton;
