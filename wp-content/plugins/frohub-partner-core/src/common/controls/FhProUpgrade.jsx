import React, { useState } from 'react';
import { Modal } from 'antd';
import './style.css';

const features = [
    'Sync your calendar for real-time availability',
    'FroHub Mobile app for quick and easy access',
    'In-depth client insights',
    'Client marketing tools',
    'Advanced reporting and analytics',
    'Set and track growth goals',
    'Verified Partner Badge for boosted trust and visibility',
];

const FhProUpgrade = ({ visible }) => {
    const [billingType, setBillingType] = useState('annual');

    const handleClose = () => {
        window.location.href = '/';
    };

    const handleUpgrade = () => {
        const productId = billingType === 'annual' ? 4154 : 4153;
        window.location.href = `/checkout/?clear-cart&add-to-cart=${productId}`;
    };

    const isAnnual = billingType === 'annual';

    return (
        <Modal
            open={visible}
            onCancel={handleClose}
            footer={null}
            centered
            width={500}
            closeIcon={<span className="text-xl text-gray-500 hover:text-black">&times;</span>}
            rootClassName="fhpro-modal"
        >
            <div className="p-1">
                <h2 className="text-xl font-semibold mb-2">Upgrade to Pro</h2>
                <p className="text-gray-600 mb-4">
                    Advanced features to support serious professionals ready to grow their business.
                </p>

                <ul className="space-y-2 mb-4">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✔️</span>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>

                <div className="flex space-x-4 mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="billing"
                            value="annual"
                            checked={isAnnual}
                            onChange={() => setBillingType('annual')}
                            className="accent-black"
                        />
                        <span>Pay Annually</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="billing"
                            value="monthly"
                            checked={!isAnnual}
                            onChange={() => setBillingType('monthly')}
                            className="accent-black"
                        />
                        <span>Pay Monthly</span>
                    </label>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-bold">
                        £{isAnnual ? '16' : '20'} <span className="text-gray-500 text-base">/month + 7% per booking</span>
                    </h3>
                    {isAnnual && (
                        <p className="text-green-600 text-sm">Save 20% (£192/year)</p>
                    )}
                </div>

                <div className="text-right">
                    <button
                        onClick={handleUpgrade}
                        className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
                    >
                        Upgrade
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FhProUpgrade;
