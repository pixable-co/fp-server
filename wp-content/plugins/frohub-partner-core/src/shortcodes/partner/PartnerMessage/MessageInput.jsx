import React, { useState } from 'react';

const MessageInput = () => {
    const [input, setInput] = useState('');

    const handleSend = () => {
        console.log('Message sent:', input);
        setInput('');
    };

    return (
        <div className="message-input">
            <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <button onClick={handleSend}>Send Message</button>
        </div>
    );
};

export default MessageInput;