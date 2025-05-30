import React, { useState, useEffect } from 'react';
import {fetchData} from "../../services/fetchData.js";

// Avatar Component
const Avatar = ({ name, size = 'md' }) => {
    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
    };

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };

    return (
        <div className={`${sizeClasses[size]} bg-gray-400 rounded-full flex items-center justify-center text-white font-medium`}>
            {getInitials(name)}
        </div>
    );
};

// Contact Item Component
const ContactItem = ({ conversation, isActive, onClick, isLoading = false }) => (
    <div
        className={`flex items-center p-3 cursor-pointer transition-colors ${
            isActive ? 'bg-blue-50 border-r-2 border-blue-500' : 'hover:bg-gray-50'
        } ${isLoading ? 'opacity-50' : ''}`}
        onClick={() => !isLoading && onClick(conversation)}
    >
        <Avatar name={conversation.customer_name || 'Customer'} />
        <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                    {conversation.customer_name || `Client #${conversation.client_id}`}
                </h3>
                {!conversation.read_by_partner && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
            </div>
            <p className="text-sm text-gray-500">{conversation.last_activity || 'No recent activity'}</p>
            {conversation.last_message && (
                <p className="text-sm text-gray-400 truncate">{conversation.last_message}</p>
            )}
        </div>
    </div>
);

// Message Component
const Message = ({ comment, userPartnerId }) => {
    const isPartnerMessage = comment.partner_id == userPartnerId;
    const formatTimestamp = (date) => new Date(date).toLocaleString('en-GB', {
        hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', year: 'numeric'
    });
    const createMarkup = (htmlContent) => ({ __html: htmlContent });

    return (
        <div className={`flex items-start mb-4 ${isPartnerMessage ? 'justify-end' : ''}`}>
            {!isPartnerMessage && <Avatar name={comment.author} size="sm" />}
            <div className={`${!isPartnerMessage ? 'ml-3' : 'mr-3'} flex flex-col`}>
                <div className={`p-3 rounded-lg max-w-xs break-words ${
                    isPartnerMessage ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-100 text-gray-900'
                }`}>
                    <div className="font-medium text-sm mb-1">{isPartnerMessage ? 'You' : comment.author}:</div>
                    <div dangerouslySetInnerHTML={createMarkup(comment.content)} className="prose prose-sm max-w-none" />
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${isPartnerMessage ? 'text-right' : ''}`}>
                    {formatTimestamp(comment.date)}
                </div>
            </div>
            {isPartnerMessage && <Avatar name="You" size="sm" />}
        </div>
    );
};

// Chat Input Component
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

// Main PartnerMessage Component
const PartnerMessage = ({ dataKey, currentUserPartnerPostId, initialConversationId = null }) => {
    const [conversations, setConversations] = useState([]);
    const [comments, setComments] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [userPartnerId, setUserPartnerId] = useState(currentUserPartnerPostId);
    const [loading, setLoading] = useState({ conversations: false, comments: false, sending: false });
    const [error, setError] = useState(null);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (initialConversationId && conversations.length > 0) {
            const conversation = conversations.find(c => c.client_id == initialConversationId);
            if (conversation) setActiveConversation(conversation);
        }
    }, [initialConversationId, conversations]);

    useEffect(() => {
        if (activeConversation) {
            loadComments(activeConversation.client_id);
        }
    }, [activeConversation]);

    useEffect(() => {
        const chatContainer = document.getElementById('chat-messages-container');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }, [comments]);

    const loadConversations = async () => {
        setLoading(prev => ({ ...prev, conversations: true }));
        setError(null);

        fetchData('fpserver/partner_conversations', (response) => {
            if (response.success) {
                const data = response.data || [];
                setConversations(Array.isArray(data) ? data : []);
                if (data.length > 0 && !activeConversation) {
                    setActiveConversation(data[0]);
                }
            } else {
                setError('Failed to load conversations: ' + (response.message || 'Unknown error'));
                setConversations([]);
            }
            setLoading(prev => ({ ...prev, conversations: false }));
        });
    };

    const loadComments = (conversationPostId) => {
        setLoading(prev => ({ ...prev, comments: true }));
        setError(null);

        fetchData('fpserver/get_conversation_comments', (response) => {
            console.log(response)
            if (response.success) {
                const data = response.data || {};
                const commentsData = data.comments || [];
                const partnerIdFromResponse = data.user_partner_id;

                setComments(Array.isArray(commentsData) ? commentsData : []);

                // Update user partner ID if we got it from the response
                if (partnerIdFromResponse) {
                    setUserPartnerId(partnerIdFromResponse);
                }

                // Mark conversation as read in the UI
                setConversations(prev => prev.map(conv =>
                    conv.client_id === conversationPostId
                        ? { ...conv, read_by_partner: true }
                        : conv
                ));
            } else {
                setError('Failed to load comments: ' + (response.data?.message || 'Unknown error'));
                setComments([]);
            }
            setLoading(prev => ({ ...prev, comments: false }));
        }, {
            post_id: conversationPostId
        });
    };

    const handleConversationSelect = (conversation) => {
        setActiveConversation(conversation);
        setComments([]);
    };

    const handleSendMessage = async (content) => {
        if (!activeConversation || !content.trim()) return;

        setLoading(prev => ({ ...prev, sending: true }));
        setError(null);

        fetchData('fpserver/send_partner_message', (response) => {
            if (response.success) {
                // Reload comments to show the new message
                loadComments(activeConversation.client_id);

                // Update the conversation list with the new last message
                setConversations(prev => prev.map(conv =>
                    conv.client_id === activeConversation.client_id
                        ? {
                            ...conv,
                            last_message: content,
                            last_activity: new Date().toISOString(),
                            read_by_partner: true
                        }
                        : conv
                ));
            } else {
                setError('Failed to send message: ' + (response.message || 'Unknown error'));
            }
            setLoading(prev => ({ ...prev, sending: false }));
        }, {
            client_id: activeConversation.client_id,
            content: content
        });
    };

    const refreshComments = () => {
        if (activeConversation) {
            loadComments(activeConversation.client_id);
        }
    };

    const refreshConversations = () => {
        loadConversations();
    };

    // Auto-refresh comments every 30 seconds
    // useEffect(() => {
    //     if (!activeConversation) return;
    //
    //     const interval = setInterval(() => {
    //         loadComments(activeConversation.client_id);
    //     }, 30000);
    //
    //     return () => clearInterval(interval);
    // }, [activeConversation]);

    // Auto-refresh conversations every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            loadConversations();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Conversations Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Conversations</h2>
                        <button
                            onClick={refreshConversations}
                            disabled={loading.conversations}
                            className="p-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                            title="Refresh conversations"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    {loading.conversations && <div className="text-sm text-gray-500 mt-1">Loading conversations...</div>}
                </div>
                <div className="overflow-y-auto">
                    {conversations.map((conversation) => (
                        <ContactItem
                            key={conversation.client_id}
                            conversation={conversation}
                            isActive={activeConversation?.client_id === conversation.client_id}
                            onClick={handleConversationSelect}
                            isLoading={loading.conversations}
                        />
                    ))}
                    {conversations.length === 0 && !loading.conversations && (
                        <div className="p-4 text-center text-gray-500">No conversations found</div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white border-b border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Avatar name={activeConversation.customer_name || 'Customer'} />
                                    <div className="ml-3">
                                        <h3 className="font-medium text-gray-900">
                                            {activeConversation.customer_name || `Client #${activeConversation.client_id}`}
                                        </h3>
                                        <p className="text-sm text-gray-500">{activeConversation.status || 'Active conversation'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={refreshComments}
                                    disabled={loading.comments}
                                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                                    title="Refresh messages"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Messages Container */}
                        <div id="chat-messages-container" className="flex-1 overflow-y-auto p-4">
                            {loading.comments ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="text-gray-500">Loading messages...</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {comments.map(comment => (
                                        <Message
                                            key={comment.comment_id}
                                            comment={comment}
                                            userPartnerId={userPartnerId}
                                        />
                                    ))}
                                    {comments.length === 0 && (
                                        <div className="text-center text-gray-500 mt-8">
                                            No messages yet. Start a conversation!
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Chat Input */}
                        <ChatInput
                            onSendMessage={handleSendMessage}
                            isLoading={loading.sending}
                            disabled={loading.comments}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                            <p>Choose a conversation from the sidebar to start messaging</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Toast */}
            {error && (
                <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 max-w-md">
                    <div className="flex items-start">
                        <div className="flex-1">
                            <strong className="font-medium">Error:</strong>
                            <div className="mt-1 text-sm">{error}</div>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="ml-2 text-red-700 hover:text-red-900 flex-shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerMessage;