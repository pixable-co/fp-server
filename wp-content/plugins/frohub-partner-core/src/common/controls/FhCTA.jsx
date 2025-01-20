import { Alert } from "antd";
import {
    InfoCircleOutlined,
    ExclamationCircleOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import './style.css';

const FhCTA = ({ type, children }) => {
    const renderIcon = () => {
        switch (type) {
            case "warning":
                return <ExclamationCircleOutlined className="fhcta__icon fhcta__icon--warning" />;
            case "success":
                return <CheckCircleOutlined className="fhcta__icon fhcta__icon--success" />;
            case "info":
            default:
                return <InfoCircleOutlined className="fhcta__icon fhcta__icon--info" />;
        }
    };

    return (
        <Alert
            className={`fhcta fhcta--${type}`}
            message={children}
            type={type}
            icon={renderIcon()}
            showIcon
        />
    );
};

export default FhCTA;