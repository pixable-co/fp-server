import React from 'react';
import Avatar from './Avatar';

const Message = ({ comment }) => {
    const sentFrom = comment?.meta_data?.sent_from?.[0] || '';
    const isPartnerMessage = sentFrom === 'partner';

    const formatTimestamp = (date) => new Date(date).toLocaleString('en-GB', {
        hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', year: 'numeric'
    });

    const createMarkup = (htmlContent) => ({ __html: htmlContent });
    const isPending = comment.status === 'pending';
    const isFailed = comment.status === 'failed';

    return (
        <div className={`flex mb-4 ${isPartnerMessage ? 'justify-end' : 'justify-start'}`}>
            {!isPartnerMessage && <Avatar name={comment.author || 'User'} size="sm" />}
            <div className={`flex flex-col ${isPartnerMessage ? 'items-end' : 'items-start'} max-w-xs`}>
                <div className={`p-3 rounded-lg break-words ${
                    isPartnerMessage
                        ? isPending
                            ? 'bg-gray-400 text-white opacity-70'
                            : isFailed
                                ? 'bg-red-500 text-white'
                                : 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                }`}>
                    <div className="font-medium text-sm mb-1">
                        {isPartnerMessage ? 'You' : (comment.author || 'User')}
                        {isPending && <span className="ml-1 text-xs">(Sending...)</span>}
                        {isFailed && <span className="ml-1 text-xs">(Failed)</span>}
                    </div>
                    <div dangerouslySetInnerHTML={createMarkup(comment.content)} className="prose prose-sm max-w-none" />
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${isPartnerMessage ? 'text-right' : ''}`}>
                    {isPending ? 'Sending...' : isFailed ? 'Failed to send' : formatTimestamp(comment.date)}
                </div>
            </div>
            {isPartnerMessage && <Avatar name="You" size="sm" />}
        </div>
    );
};

export default Message;