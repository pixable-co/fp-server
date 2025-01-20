import { useState } from "react";
import { Input, Tooltip, Form } from "antd";
import { InfoCircleOutlined, EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import './style.css';

const FhInput = ({
                     type = "text",
                     name,
                     label,
                     value,
                     onChange,
                     placeholder,
                     maxLength,
                     helptext,
                     required,
                     successmsg,
                     errormsg,
                     disabled = false
                 }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const renderInput = () => {
        switch (type) {
            case "number":
                return (
                    <Input
                        className="fhinput__input"
                        type="number"
                        placeholder={placeholder || `Enter ${label ? label.toLowerCase() : ""}`}
                        maxLength={maxLength}
                        disabled={disabled}
                        value={value}
                        onChange={onChange}
                    />
                );
            case "phone":
                return (
                    <Input
                        className="fhinput__input"
                        type="tel"
                        placeholder={placeholder || `Enter ${label ? label.toLowerCase() : ""}`}
                        maxLength={maxLength}
                        disabled={disabled}
                        value={value}
                        onChange={onChange}
                    />
                );
            case "url":
                return (
                    <Input
                        className="fhinput__input"
                        type="url"
                        placeholder={placeholder || `Enter ${label ? label.toLowerCase() : ""}`}
                        maxLength={maxLength}
                        disabled={disabled}
                        value={value}
                        onChange={onChange}
                    />
                );
            case "password":
                return (
                    <div className="fhinput__password-container">
                        <Input.Password
                            className="fhinput__input"
                            placeholder={placeholder || `Enter ${label ? label.toLowerCase() : ""}`}
                            maxLength={maxLength}
                            disabled={disabled}
                            value={value}
                            onChange={onChange}
                            iconRender={(visible) =>
                                visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                            }
                        />
                    </div>
                );
            case "text":
            default:
                return (
                    <Input
                        className="fhinput__input"
                        type="text"
                        placeholder={placeholder || `Enter ${label ? label.toLowerCase() : ""}`}
                        maxLength={maxLength}
                        disabled={disabled}
                        value={value}
                        onChange={onChange}
                    />
                );
        }
    };

    return (
        <div className="fhinput">
            {label && (
                <div className="fhinput__label">
                    {label}
                    {helptext && (
                        <Tooltip title={helptext}>
                            <InfoCircleOutlined className="fhinput__input-helpicon" />
                        </Tooltip>
                    )}
                </div>
            )}
            <Form.Item
                name={name}
                rules={[
                    {
                        required: required,
                        message: errormsg || `Please enter ${label}`,
                    },
                ]}
            >
                {renderInput()}
                {successmsg && <div className="fhinput__success">{successmsg}</div>}
            </Form.Item>
        </div>
    );
};

export default FhInput;