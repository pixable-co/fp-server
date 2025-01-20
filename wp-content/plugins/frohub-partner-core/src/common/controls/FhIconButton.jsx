import { useState } from "react";
import { House, Store, Car, CircleCheckBig } from 'lucide-react';

const FhIconButton = ({ options }) => {
    const [selectedOptions, setSelectedOptions] = useState([]);

    const toggleSelect = (type) => {
        setSelectedOptions((prevSelected) =>
            prevSelected.includes(type)
                ? prevSelected.filter((item) => item !== type)
                : [...prevSelected, type]
        );
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

                    {/* Hidden Checkbox (for accessibility, can be styled with opacity-0) */}
                    <input
                        type="checkbox"
                        checked={selectedOptions.includes(option.type)}
                        onChange={() => toggleSelect(option.type)}
                        className="absolute top-4 right-4 opacity-0"
                    />
                </div>
            ))}
        </div>
    );
};

export default FhIconButton;