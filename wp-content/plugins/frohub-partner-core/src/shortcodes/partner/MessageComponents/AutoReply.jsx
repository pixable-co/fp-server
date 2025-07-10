import React from 'react';

const AutoReply = ({ enabled = false }) => {
    if (!enabled) return null;

    return (
        <div className="auto-reply-banner">
            <span>Auto-reply <strong>ON</strong>.</span>
        </div>
    );
};

export default AutoReply;