import React, { useState, useEffect, useRef } from 'react';
import { Skeleton } from "antd";
import { fetchData } from '../../services/fetchData';
import ContactItem from "./MessageComponents/ContactItem.jsx";
import ChatInput from './MessageComponents/ChatInput';
import Message from './MessageComponents/Message';
import Avatar from './MessageComponents/Avatar';

const PartnerMessageMobile = ({ dataKey, currentUserPartnerPostId, initialConversationId = null }) => {
    const [conversations, setConversations] = useState([]);
    const [comments, setComments] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [userPartnerId, setUserPartnerId] = useState(currentUserPartnerPostId);
    const [loading, setLoading] = useState({ conversations: false, comments: false, sending: false });
    const [error, setError] = useState(null);
    const autoReplyMessage = "Thanks, we'll get back to you shortly."; // Set to null/'' to disable
    const [autoReplySent, setAutoReplySent] = useState(true);

    // Mobile specific state
    const [showConversations, setShowConversations] = useState(true);

    const urlCustomerId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('customer_id')
        : null;

    const conversationIntervalRef = useRef(null);
    const lastCommentTimestampRef = useRef(null);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (initialConversationId && conversations.length > 0) {
            const conversation = conversations.find(c => c.client_id == initialConversationId);
            if (conversation) {
                setActiveConversation(conversation);
                setActiveConversationId(conversation.conversation_id);
            }
        }
    }, [initialConversationId, conversations]);

    useEffect(() => {
        if (activeConversation) {
            loadComments(activeConversation.client_id, true);
            startConversationPolling();
        } else {
            stopConversationPolling();
        }

        return () => stopConversationPolling();
    }, [activeConversation]);

    useEffect(() => {
        const chatContainer = document.getElementById('mobile-chat-messages-container');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }, [comments]);

    useEffect(() => {
        if (!autoReplyMessage || autoReplySent || comments.length === 0) return;

        const lastComment = comments[comments.length - 1];
        const sentFrom = lastComment?.meta_data?.sent_from?.[0] || '';

        if (sentFrom !== 'partner') {
            setAutoReplySent(true);
            handleSendMessage(autoReplyMessage);
        }
    }, [comments]);

    const startConversationPolling = () => {
        stopConversationPolling();
        conversationIntervalRef.current = setInterval(() => {
            if (activeConversation) {
                loadComments(activeConversation.client_id, false);
            }
        }, 5000);
    };

    const stopConversationPolling = () => {
        if (conversationIntervalRef.current) {
            clearInterval(conversationIntervalRef.current);
            conversationIntervalRef.current = null;
        }
    };

    const loadConversations = () => {
        setLoading(prev => ({ ...prev, conversations: true }));
        setError(null);

        fetchData('fpserver/partner_conversations', (response) => {
            if (response.success) {
                const data = response.data || [];
                setConversations(Array.isArray(data) ? data : []);

                if (data.length > 0) {
                    let selected = null;

                    if (urlCustomerId) {
                        selected = data.find(c => String(c.customer_id) === String(urlCustomerId));
                    }

                    if (!selected && !activeConversation) {
                        selected = data[0];
                    }

                    if (selected) {
                        setActiveConversation(selected);
                        setActiveConversationId(selected.conversation_id);
                    }
                }
            } else {
                setError('Failed to load conversations: ' + (response.message || 'Unknown error'));
                setConversations([]);
            }
            setLoading(prev => ({ ...prev, conversations: false }));
        });
    };

    const loadComments = (conversationPostId, showLoading = true) => {
        if (showLoading) setLoading(prev => ({ ...prev, comments: true }));
        setError(null);

        const postId = activeConversationId || conversationPostId;

        fetchData('fpserver/get_conversation_comments', (response) => {
            if (response.success) {
                const data = response.data || {};
                const commentsData = data.comments || [];
                const partnerIdFromResponse = data.user_partner_id;

                if (Array.isArray(commentsData)) {
                    if (showLoading || comments.length === 0) {
                        setComments(commentsData);
                        if (commentsData.length > 0) {
                            const latestComment = commentsData[commentsData.length - 1];
                            lastCommentTimestampRef.current = new Date(latestComment.date).getTime();
                        }
                    } else {
                        const lastTimestamp = lastCommentTimestampRef.current;
                        const newComments = commentsData.filter(comment => {
                            const commentTimestamp = new Date(comment.date).getTime();
                            return !lastTimestamp || commentTimestamp > lastTimestamp;
                        });

                        if (newComments.length > 0) {
                            const latestNew = newComments[newComments.length - 1];
                            lastCommentTimestampRef.current = new Date(latestNew.date).getTime();

                            setComments(prevComments => {
                                const cleanedComments = prevComments.filter(c =>
                                    !c.comment_id.toString().startsWith('temp_') || c.status === 'failed'
                                );
                                const existingIds = new Set(cleanedComments.map(c => c.comment_id));
                                const uniqueNewComments = newComments.filter(c => !existingIds.has(c.comment_id));
                                return [...cleanedComments, ...uniqueNewComments];
                            });

                            // Auto-reply check for new incoming message from customer
                            const newIncoming = newComments.find(c =>
                                c?.meta_data?.sent_from?.[0] !== 'partner'
                            );

                            if (newIncoming && autoReplyMessage && !autoReplySent) {
                                setAutoReplySent(true);
                                handleSendMessage(autoReplyMessage);
                            }
                        }
                    }
                }

                if (partnerIdFromResponse) setUserPartnerId(partnerIdFromResponse);
                setConversations(prev => prev.map(conv =>
                    conv.client_id === conversationPostId
                        ? { ...conv, read_by_partner: true }
                        : conv
                ));
            } else {
                if (showLoading) {
                    setError('Failed to load comments: ' + (response.data?.message || 'Unknown error'));
                    setComments([]);
                }
            }

            if (showLoading) setLoading(prev => ({ ...prev, comments: false }));
        }, { post_id: postId });
    };

    const handleConversationSelect = (conversation, conversationId) => {
        setActiveConversation(conversation);
        setActiveConversationId(conversationId);
        setComments([]);
        setAutoReplySent(false);
        lastCommentTimestampRef.current = null;
        // Switch to chat view on mobile
        setShowConversations(false);
    };

    const handleBackToConversations = () => {
        setShowConversations(true);
    };

    const handleSendMessage = async (content, imageUrl = '') => {
        if (!activeConversation || (!content.trim() && !imageUrl)) return;

        const tempMessage = {
            comment_id: `temp_${Date.now()}`,
            content,
            author: 'You',
            partner_id: currentUserPartnerPostId,
            date: new Date().toISOString(),
            image_url: imageUrl,
            status: 'pending'
        };

        setComments(prev => [...prev, tempMessage]);
        setLoading(prev => ({ ...prev, sending: true }));
        setError(null);

        const postId = activeConversationId || activeConversation.client_id;

        fetchData('fpserver/send_partner_message', (response) => {
            if (response.success) {
                setComments(prev => prev.filter(comment => comment.comment_id !== tempMessage.comment_id));
                loadComments(activeConversation.client_id, false);
                setConversations(prev => prev.map(conv =>
                    conv.client_id === activeConversation.client_id
                        ? { ...conv, last_message: content, last_activity: new Date().toISOString(), read_by_partner: true }
                        : conv
                ));
            } else {
                setComments(prev => prev.map(comment =>
                    comment.comment_id === tempMessage.comment_id
                        ? { ...comment, status: 'failed' }
                        : comment
                ));
                setError('Failed to send message: ' + (response.message || 'Unknown error'));
            }
            setLoading(prev => ({ ...prev, sending: false }));
        }, {
            post_id: postId,
            conversation_id: activeConversationId,
            partner_id: currentUserPartnerPostId,
            comment: content,
            image_url: imageUrl
        });
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 w-full max-w-full overflow-hidden">
            {showConversations ? (
                // Mobile Conversations List View
                <div className="flex flex-col h-full w-full bg-white">
                    <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading.conversations ? (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center space-x-3 p-3">
                                        <Skeleton.Avatar size={48} active />
                                        <div className="flex-1">
                                            <Skeleton.Input style={{ width: '70%', height: '16px' }} active />
                                            <Skeleton.Input style={{ width: '50%', height: '14px', marginTop: '8px' }} active />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {conversations.map(conversation => (
                                    <ContactItem
                                        key={conversation.client_id}
                                        conversation={conversation}
                                        isActive={activeConversation?.client_id === conversation.client_id}
                                        onClick={handleConversationSelect}
                                    />
                                ))}
                            </div>
                        )}
                        {!loading.conversations && conversations.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-lg font-medium">No conversations yet</p>
                                <p className="text-sm text-gray-400 mt-1">Start messaging with your partners</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Mobile Chat View
                <div className="flex flex-col h-full w-full">
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
                                <div className="flex items-center">
                                    <button
                                        onClick={handleBackToConversations}
                                        className="mr-3 p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                    >
                                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <Avatar name={activeConversation.customer_name || 'Customer'} />
                                    <div className="ml-3 flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {activeConversation.customer_name || `Client #${activeConversation.client_id}`}
                                        </h3>
                                        <p className="text-sm text-gray-500">Active now</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div id="mobile-chat-messages-container" className="flex-1 overflow-y-auto bg-gray-50 px-4 py-3">
                                {loading.comments ? (
                                    <div className="flex justify-center items-center h-full">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                            <p className="text-gray-500">Loading messages...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {comments.map(comment => (
                                            <Message key={comment.comment_id} comment={comment} />
                                        ))}
                                        {comments.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                <p className="text-lg font-medium">No messages yet</p>
                                                <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Chat Input - Fixed at bottom */}
                            <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3 pb-4">
                                <div className="flex items-end space-x-3">
                                    {/* Image/Attachment Button */}
                                    <button className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                    </button>

                                    {/* Message Input */}
                                    <div className="flex-1 relative">
                                        <textarea
                                            placeholder="Type a message..."
                                            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-5 max-h-32"
                                            rows="1"
                                            style={{ minHeight: '44px' }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (e.target.value.trim()) {
                                                        handleSendMessage(e.target.value.trim());
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                            onChange={(e) => {
                                                // Auto-resize textarea
                                                e.target.style.height = '44px';
                                                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                                            }}
                                            disabled={loading.comments || loading.sending}
                                        />
                                    </div>

                                    {/* Send Button */}
                                    <button
                                        onClick={() => {
                                            const input = document.querySelector('textarea');
                                            if (input && input.value.trim()) {
                                                handleSendMessage(input.value.trim());
                                                input.value = '';
                                                input.style.height = '44px';
                                            }
                                        }}
                                        disabled={loading.sending || loading.comments}
                                        className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading.sending ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                        ) : (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Loading indicator */}
                                {loading.sending && (
                                    <div className="mt-2 text-xs text-gray-500 text-center">
                                        Sending message...
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-white">
                            <div className="text-center px-4">
                                <svg className="w-20 h-20 mb-4 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
                                <p className="text-gray-500">Choose a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 max-w-md">
                    <div className="flex items-start">
                        <div className="flex-1">
                            <strong className="font-medium">Error:</strong>
                            <div className="mt-1 text-sm">{error}</div>
                        </div>
                        <button onClick={() => setError(null)} className="ml-2 text-red-700 hover:text-red-900">
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

export default PartnerMessageMobile;