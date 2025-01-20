import { Button } from "antd";
import './style.css';

const FhButton = ({ id, prefix, label, onClick, disable, htmlType = "button" }) => {
    return (
        <Button
            id={id}
            className="fhbutton fhbutton--primary"
            onClick={onClick}
            type={htmlType}
            disabled={disable}
        >
            {prefix} {label}
        </Button>
    );
};

export default FhButton;