import FhSelect from "../FhSelect.jsx";
import { Input } from "antd";

function FhSelectInput({ field, index, onChange, controlSupport }) {
    const { name, options = [], placeholder } = controlSupport;

    const numberOfFields = Object.keys(field).length;
    const gridColumns = `repeat(${numberOfFields}, minmax(0, 1fr))`;

    return (
        <div className="grid gap-3 w-full items-center" style={{ gridTemplateColumns: gridColumns }}>
            <div>
                <FhSelect
                    value={field[name] || ''}
                    placeholder={placeholder}
                    options={options}
                    onChange={(val) => onChange(index, name, val)}
                    className="max-w-[50%] border"
                />
            </div>
            {Object.entries(field).map(([key, value]) =>
                key !== name ? (
                    <Input
                        key={`${index}-${key}`}
                        name={key}
                        placeholder={`Enter ${key}`}
                        value={value || ''}
                        onChange={(e) => onChange(index, e.target.name, e.target.value)}
                        className="mb-4 border"
                    />
                ) : null
            )}
        </div>
    );
}

export default FhSelectInput;