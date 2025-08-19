import React from 'react';
import Avatar from './Avatar';

const ContactItem = ({ conversation, unreadConversation, customerImage, isActive, onClick, isLoading = false }) => {
    const handleClick = (event) => {
        if (!isLoading) {
            const hiddenInput = event.currentTarget.querySelector('input[type="hidden"]');
            const conversationId = hiddenInput ? hiddenInput.value : null;
            onClick(conversation, conversationId);
        }
    };

    const formatTimestamp = (timestamp) => {
        try {
            return new Date(timestamp).toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch {
            return '';
        }
    };

    return (
        <div
            className={`contact-list-avatar flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                isActive ? 'border-b-4 border-gray-200' : 'hover:bg-gray-100'
            } ${isLoading ? 'opacity-50' : ''}`}
            onClick={handleClick}
        >
            <div className="flex items-center gap-3">
                <Avatar name={conversation.customer_name || 'Customer'} image={customerImage} />
                <div className="flex flex-col">
                    <h3 className="font-semibold text-gray-900 leading-tight flex items-center gap-2">
                        {conversation.customer_name || `Client #${conversation.client_id}`}

                        {unreadConversation > 0 && (
                            <span className="ml-2 mr-4 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {unreadConversation}
                            </span>
                        )}
                    </h3>
                </div>
            </div>

            <div className="flex flex-col items-end text-xs text-gray-500">
                <span>{formatTimestamp(conversation.last_message_date)}</span>
            </div>

            <input type="hidden" value={conversation.conversation_id} />
            <input type="hidden" value={conversation.customer_id} />
        </div>
    );
};

export default ContactItem;
