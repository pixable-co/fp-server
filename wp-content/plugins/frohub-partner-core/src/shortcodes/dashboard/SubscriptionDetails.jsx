import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Radio, Button, message, Spin } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { fetchData } from '../../services/fetchData';
import swal from 'sweetalert';

const formId = 16;

const SubscriptionDetails = () => {
    const productIds = {annual: 4154, monthly: 4153};
    const [billingCycle, setBillingCycle] = useState('annual');
    const [showDowngradeForm, setShowDowngradeForm] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [formSchema, setFormSchema] = useState(null);
    const [loadingForm, setLoadingForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const [radioValues, setRadioValues] = useState({});


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
                handleDowngrade(); // delegate success handling
            } else {
                message.error(res.data?.message || 'Submission failed.');
                setSubmitting(false);
            }
        }, payload, 'POST');
    };

    const handleDowngrade = () => {
        fetchData('fpserver/set_pending_cancellation', (res) => {
            setSubmitting(false); // stop loader
            closeModal();         // close modal first

            if (res.success) {
                swal('Success', 'Your subscription has been marked for cancellation!', 'success')
                    .then(() => window.location.reload());
            } else {
                swal('Error', res.data?.message || 'Failed to set pending cancellation.', 'error')
            }
        }, {}, 'POST');
    };

    const renderField = (field) => {
        const name = `input_${field.id}`;
        const rules = field.isRequired ? [{ required: true, message: `${field.label} is required` }] : [];

        switch (field.type) {
            case 'textarea': {
                const relatedRadioValue = radioValues[field.id]; // link to matching radio field by ID
                const isOtherSelected = relatedRadioValue === 'Other'; // adapt to your choice value

                return (
                    <Form.Item
                        key={field.id}
                        label={null}
                        name={name}
                        rules={isOtherSelected ? rules : []}
                        className="custom-textarea"
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Please share more context..."
                            disabled={!isOtherSelected}
                        />
                    </Form.Item>
                );
            }

            case 'radio': {
                return (
                    <div className="custom-radio-group" key={field.id}>
                        <p className="font-semibold text-base mb-4">{field.label}</p>
                        <Form.Item name={name} rules={rules} className="mb-0">
                            <Radio.Group
                                onChange={(e) =>
                                    setRadioValues((prev) => ({
                                        ...prev,
                                        [field.id]: e.target.value,
                                    }))
                                }
                            >
                                <div className="flex flex-col gap-3">
                                    {field.choices?.map((choice) => (
                                        <Radio
                                            key={choice.value}
                                            value={choice.value}
                                            className="border border-gray-300 rounded-md px-4 py-2 hover:border-black transition"
                                        >
                                            {choice.text}
                                        </Radio>
                                    ))}
                                </div>
                            </Radio.Group>
                        </Form.Item>
                    </div>
                );
            }

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

    const handleUpgrade = (productId) => {
        const upgradeUrl = `/upgrade-subscription?upgrade_sub=yes&new_product_id=${productId}`;
        window.location.href = upgradeUrl;
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

                    <div className="subscription-card pro-offer mt-6">
                        <h3>FroHub Pro</h3>
                        <p className="text-sm mb-4">Advanced features to support serious professionals ready to grow their business.</p>
                        <ul className="features list-disc list-inside text-sm mb-4">
                            <li>✔ Everything in Lite</li>
                            <li>✔ Sync your calendar for real-time availability</li>
                            <li>✔ FroHub Mobile app for quick and easy access</li>
                            <li>✔ In-depth client insights</li>
                            <li>✔ Client marketing tools</li>
                            <li>✔ Advanced reporting and analytics</li>
                            <li>✔ Set and track growth goals</li>
                            <li>✔ Verified Partner Badge for boosted trust and visibility</li>
                        </ul>

                        <div className="flex items-center justify-between gap-6 mb-4">
                            <div className="flex gap-4 items-center text-sm">
                                <label>
                                    <input
                                        type="radio"
                                        name="billing"
                                        value="annual"
                                        checked={billingCycle === 'annual'}
                                        onChange={() => setBillingCycle('annual')}
                                    />{' '}
                                    Pay Annually
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="billing"
                                        value="monthly"
                                        checked={billingCycle === 'monthly'}
                                        onChange={() => setBillingCycle('monthly')}
                                    />{' '}
                                    Pay Monthly
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            {billingCycle === 'annual' ? (
                                <>
                                    <p className="text-lg font-bold">£16 <span className="text-sm text-gray-600">/month + 7% per booking</span></p>
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs inline-block mt-1">Save 20%</span>
                                </>
                            ) : (
                                <p className="text-lg font-bold">£20 <span className="text-sm text-gray-600">/month + 7% per booking</span></p>
                            )}
                        </div>

                        <button
                            onClick={() => handleUpgrade(productIds[billingCycle])}
                            className="upgrade-button bg-yellow-400 hover:bg-orange-500 text-black px-6 py-2 rounded"
                        >
                            Upgrade
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="subscription-card pro">
                        <div className="header">
                            <h3>{currentPlan.includes('yearly') ? 'FroHub Pro Yearly' : 'FroHub Pro Monthly'}</h3>
                            <div>
                            <span className="current-plan-badge">
                                ✔ Your Current Plan
                                {window.fpserver_settings?.has_pending_cancellation === '1' && ' (Pending Cancel)'}
                            </span>
                                {window.fpserver_settings?.has_pending_cancellation === '1' &&
                                    window.fpserver_settings.billing_history?.[0]?.end_date && (
                                        <p className="text-yellow-600 text-sm mt-2">
                                            You will be moved to FroHub Lite on{' '}
                                            {new Date(window.fpserver_settings.billing_history[0].end_date).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    )}
                            </div>
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
                                        <span>{entry.start_date.split(' ')[0]}</span>
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
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`mt-6 font-semibold text-white px-6 py-2 rounded ${
                                    submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                                }`}
                            >
                                {submitting ? 'Submitting...' : 'Confirm Downgrade'}
                            </button>
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    );
};

export default SubscriptionDetails;
