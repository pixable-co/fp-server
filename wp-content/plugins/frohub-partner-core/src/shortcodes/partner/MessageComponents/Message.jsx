import React, { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { fetchData } from '../../../services/fetchData';

const Message = ({ comment, conversationId, isLastCustomerMessage = false }) => {
    console.log(conversationId)
    const sentFrom = comment?.meta_data?.sent_from?.[0] || '';
    const isPartnerMessage = sentFrom === 'partner';
    const [hasMarkedRead, setHasMarkedRead] = useState(false);

    const formatTimestamp = (date) =>
        new Date(date).toLocaleString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    const createMarkup = (htmlContent) => ({ __html: htmlContent });
    const isPending = comment.status === 'pending';
    const isFailed = comment.status === 'failed';

    useEffect(() => {
        if (!hasMarkedRead && isLastCustomerMessage) {
            fetchData(
                'fpserver/read_by_partner',
                (res) => {
                    if (res.success) {
                        setHasMarkedRead(true);
                    } else {
                        console.warn('Failed to mark as read:', res.message);
                    }
                },
                { post_id: conversationId }
            );
        }
    }, [isLastCustomerMessage, conversationId, hasMarkedRead]);

    return (
        <div className={`flex gap-2 mb-4 ${isPartnerMessage ? 'justify-end' : 'justify-start'}`}>
            {!isPartnerMessage && <Avatar name={comment.author || 'User'} size="sm" />}

            <div className={`max-w-sm ${isPartnerMessage ? 'text-right' : 'text-left'}`}>
                <div
                    className={`p-3 rounded-lg text-sm ${
                        isPartnerMessage
                            ? 'bg-white text-gray-900 partner-message'
                            : 'user-message'
                    }`}
                >
                    <div
                        dangerouslySetInnerHTML={createMarkup(comment.content)}
                        className="prose prose-sm max-w-none"
                    />
                </div>
                <div className="text-xs text-gray-500 mt-1 text-right">
                    {isPending
                        ? 'Sending...'
                        : isFailed
                            ? 'Failed to send'
                            : formatTimestamp(comment.date)}
                </div>
            </div>

            {isPartnerMessage && <Avatar name="You" size="sm" />}
        </div>
    );
};

export default Message;
