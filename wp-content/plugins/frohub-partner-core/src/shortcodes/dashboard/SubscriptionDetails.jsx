import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Radio, Button, message, Spin } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { fetchData } from '../../services/fetchData';

const formId = 16;

const SubscriptionDetails = () => {
    const [showDowngradeForm, setShowDowngradeForm] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [formSchema, setFormSchema] = useState(null);
    const [loadingForm, setLoadingForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = 'h2 { display: none !important; }';
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const openModal = () => {
        setShowDowngradeForm(true);
        setModalVisible(true);
        if (!formSchema) {
            loadFormSchema();
        }
    };

    const closeModal = () => {
        setModalVisible(false);
        setShowDowngradeForm(false);
        setFormSchema(null);
        form.resetFields();
    };

    const loadFormSchema = async () => {
        setLoadingForm(true);
        fetchData('fpserver/load_gf_form_schema', (res) => {
            if (res.success && res.data.fields.length) {
                setFormSchema(res.data.fields);
            } else {
                message.error('Failed to load form fields');
            }
            setLoadingForm(false);
        });
    };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        const payload = {};
        formSchema.forEach(field => {
            const key = `input_${field.id}`;
            payload[key] = values[key] || '';
        });

        fetchData('fpserver/submit_gf_form', (res) => {
            if (res.success) {
                message.success('Form submitted. Downgrading...');
                handleDowngrade();
                closeModal();
            } else {
                message.error(res.data?.message || 'Submission failed.');
            }
            setSubmitting(false);
        }, payload, 'POST');
    };

    const handleDowngrade = () => {
        fetchData('fpserver/set_pending_cancellation', (res) => {
            if (res.success) {
                alert('Your subscription has been marked for cancellation.');
                window.location.reload();
            } else {
                alert(res.data?.message || 'Failed to set pending cancellation.');
            }
        }, {}, 'POST');
    };

    const renderField = (field) => {
        const name = `input_${field.id}`;
        const rules = field.isRequired ? [{ required: true, message: `${field.label} is required` }] : [];

        switch (field.type) {
            case 'textarea':
                return (
                    <Form.Item key={field.id} label={null} name={name} rules={rules} className="custom-textarea">
                        <Input.TextArea rows={4} placeholder="Please share more context..." />
                    </Form.Item>
                );
            case 'select':
                return (
                    <Form.Item key={field.id} label={field.label} name={name} rules={rules} className="custom-select">
                        <Select>
                            {field.choices?.map(choice => (
                                <Select.Option key={choice.value} value={choice.value}>
                                    {choice.text}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                );
            case 'radio':
                return (
                    <div className="custom-radio-group" key={field.id}>
                        <p className="font-medium text-base mb-3">{field.label}</p>
                        <Form.Item name={name} rules={rules} className="mb-0">
                            <Radio.Group className="flex flex-col gap-3 text-sm text-black">
                                {field.choices?.map(choice => (
                                    <Radio key={choice.value} value={choice.value}>{choice.text}</Radio>
                                ))}
                            </Radio.Group>
                        </Form.Item>
                    </div>
                );
            default:
                return (
                    <Form.Item key={field.id} label={field.label} name={name} rules={rules} className="custom-input">
                        <Input />
                    </Form.Item>
                );
        }
    };

    const hasActiveSubscription = window.fpserver_settings?.has_active_subscription;
    const subscriptionData = window.fpserver_settings?.subscription_data || {};
    const billingHistory = window.fpserver_settings?.billing_history || [];

    const isLitePlan = !hasActiveSubscription || hasActiveSubscription === '';
    const currentPlan = billingHistory[0]?.plan_name?.toLowerCase() || '';

    const handleUpgrade = () => {
        window.location.href = `/product/frohub/?switch-subscription=5479&item=659`;
    };

    return (
        <div className="frohub-subscription-wrapper">
            {isLitePlan ? (
                <>
                    <div className="subscription-card lite">
                        <div className="header">
                            <h3>FroHub Lite</h3>
                            <span className="current-plan-badge">✔ Your Current Plan</span>
                        </div>
                        <p>All the essentials you need to provide great service to your clients.</p>
                        <p>£0/month + 7% booking fee</p>
                    </div>

                    <div className="subscription-card pro-offer">
                        <h3>FroHub Pro</h3>
                        <p>Advanced features to support serious professionals ready to grow their business.</p>
                        <ul className="features">
                            <li>✅ Everything in Lite</li>
                            <li>✅ Sync your calendar for real-time availability</li>
                            <li>✅ FroHub Mobile app for quick access</li>
                            <li>✅ In-depth client insights</li>
                            <li>✅ Client marketing tools</li>
                            <li>✅ Advanced reporting and analytics</li>
                            <li>✅ Set and track growth goals</li>
                            <li>✅ Verified Partner Badge</li>
                        </ul>
                        <div className="pricing">
                            <p><strong>£16/month + 7% per booking</strong></p>
                            <p>Save 20% when paid annually</p>
                        </div>
                        <button onClick={handleUpgrade} className="mt-4 upgrade-button">Upgrade</button>
                    </div>
                </>
            ) : (
                <>
                    <div className="subscription-card pro">
                        <div className="header">
                            <h3>{currentPlan.includes('yearly') ? 'FroHub Pro Yearly' : 'FroHub Pro Monthly'}</h3>
                            <span className="current-plan-badge">✔ Your Current Plan</span>
                        </div>

                        <p>{currentPlan.includes('yearly') ? '£192/year + 7% booking fee' : '£20/month + 7% booking fee'}</p>
                        {subscriptionData.renewal_date && (
                            <p>{currentPlan.includes('yearly') ? 'Automatically renews on' : 'Renews monthly on'}: {subscriptionData.renewal_date}</p>
                        )}
                    </div>

                    <div className="billing-history mt-6">
                        <h3 className="text-lg font-semibold mb-2">Billing History</h3>
                        <div className="w-3/6 text-sm">
                            <div className="grid grid-cols-3 gap-0 font-semibold border-b border-gray-300 py-2">
                                <span>Date</span>
                                <span>Total</span>
                                <span>Status</span>
                            </div>

                            {billingHistory.length > 0 ? (
                                billingHistory.map((entry, index) => (
                                    <div key={index} className="grid grid-cols-3 border-b border-gray-200 py-3 text-sm items-center">
                                        <span>{entry.start_date}</span>
                                        <span>{entry.total}</span>
                                        <span>
                                            {entry.status.toLowerCase() === 'failed' ? (
                                                <button className="text-gray-400 bg-gray-300 px-4 py-1 rounded cursor-not-allowed" disabled>
                                                    Pay
                                                </button>
                                            ) : (
                                                <span className="text-green-700">{entry.status}</span>
                                            )}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="py-3 text-gray-500">No billing history found.</div>
                            )}
                        </div>

                        {!subscriptionData.pending_cancellation ? (
                            <div className="mt-8">
                                <button onClick={openModal} className="text-black underline hover:text-gray-700 text-sm bg-transparent p-0">
                                    Downgrade to FroHub Lite
                                </button>
                            </div>
                        ) : (
                            <p className="text-yellow-600 text-sm mt-4">
                                Your subscription is pending cancellation. It will not renew after: {subscriptionData.renewal_date}
                            </p>
                        )}
                    </div>
                </>
            )}

            <Modal
                open={modalVisible}
                onCancel={closeModal}
                footer={null}
                destroyOnClose={true}
                maskClosable={false}
                width={600}
                title={
                    <div className="flex items-center gap-2">
                        <ExclamationCircleOutlined className="text-lg text-yellow-500" />
                        <span className="font-medium text-lg">Downgrade to FroHub Lite</span>
                    </div>
                }
            >
                {loadingForm ? (
                    <Spin className="block text-center">Loading form...</Spin>
                ) : (
                    <Form layout="vertical" onFinish={handleSubmit} form={form} className="gf-downgrade-form">
                        {formSchema?.map(renderField)}
                        <div className="text-sm text-gray-500 bg-gray-100 rounded-md p-3 mt-4">
                            You’ll keep access until the end of your current billing period, after which you’ll automatically be downgraded.
                        </div>
                        <Form.Item className="text-right mt-6">
                            <Button type="link" htmlType="submit" loading={submitting} className="font-semibold text-black">
                                Confirm Downgrade
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    );
};

export default SubscriptionDetails;
