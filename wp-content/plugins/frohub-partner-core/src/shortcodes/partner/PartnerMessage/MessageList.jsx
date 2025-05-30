import BookingRequest from "./BookingRequest.jsx";
import MessageBubble from "./MessageBubble.jsx";
// import AutoReply from "./AutoReply.jsx";

const MessageList = ({ dataKey }) => {
    const messages = [
        { id: 1, type: 'booking', date: '23rd June 2024 at 15:00', service: 'Service Name' },
        { id: 2, type: 'text', content: 'Ok!', date: '23rd May 2024' },
        { id: 3, type: 'auto-reply', content: 'The auto-reply message set in the Partner Settings area', date: '23rd May 2024' },
        { id: 4, type: 'text', content: 'Varius dui...', date: '23rd May 2024' },
    ];

    return (
        <div className="messages">
            {messages.map(msg => {
                switch (msg.type) {
                    case 'booking':
                        return <BookingRequest key={msg.id} date={msg.date} service={msg.service} />;
                    // case 'auto-reply':
                    //     return <AutoReply key={msg.id} content={msg.content} date={msg.date} />;
                    // case 'text':
                    default:
                        return <MessageBubble key={msg.id} content={msg.content} date={msg.date} />;
                }
            })}
        </div>
    );
};

export default MessageList;
