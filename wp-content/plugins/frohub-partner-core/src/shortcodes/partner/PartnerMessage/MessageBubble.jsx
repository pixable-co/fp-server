import React from 'react';

const MessageBubble = ({ content, date }) => (
    <div className="message bubble">
        <p>{content}</p>
        <small>{date}</small>
    </div>
);

export default MessageBubble;
