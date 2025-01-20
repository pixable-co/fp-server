import FhSelect from "../FhSelect.jsx";
import FhTime from "../FhTime.jsx";

function FhSelectTime({ field, index, onChange, controlSupport }) {
    const { name, options = [], placeholder } = controlSupport;

    const timeFields = Object.entries(field).filter(([key]) => key !== name);

    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-grow mt-1">
                <FhSelect
                    value={field[name] || ''}
                    placeholder={placeholder}
                    options={options}
                    onChange={(val) => onChange(index, name, val)}
                    className="rounded-md px-2 py-1 w-full"
                />
            </div>
            {timeFields.map(([key, value], timeIndex) => (
                <div key={`${index}-${key}`} className="flex items-center gap-2 -mt-3">
                    <div className="flex-grow">
                        <FhTime
                            selectedTime={value || ''}
                            onChange={(time) => onChange(index, key, time)}
                            className="border border-gray-300 rounded-md px-2 py-1 w-full"
                        />
                    </div>
                    {timeIndex === 0 && (
                        <span className="mx-2 font-semibold">to</span>
                    )}
                </div>
            ))}
        </div>
    );
}

export default FhSelectTime;