import React, { useState } from 'react';

const ChatInput = ({ onSendMessage, isLoading = false, disabled = false }) => {
    const [message, setMessage] = useState('');
    const handleSubmit = async () => {
        if (message.trim() && !isLoading && !disabled) {
            await onSendMessage(message);
            setMessage('');
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };
    return (
        <div className="border-t bg-white p-4">
            <div className="flex items-center space-x-2">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm resize-none"
                    rows="2"
                    disabled={disabled}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!message.trim() || isLoading || disabled}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
