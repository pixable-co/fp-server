import React, { useState, useEffect, useRef } from 'react';
import { Skeleton } from "antd";
import { fetchData } from '../../services/fetchData';
import ContactItem from "./MessageComponents/ContactItem.jsx";
import ChatInput from './MessageComponents/ChatInput';
import Message from './MessageComponents/Message';
import Avatar from './MessageComponents/Avatar';
import AutoReply from "./MessageComponents/AutoReply.jsx";

const PartnerMessageMobile = ({ dataKey, currentUserPartnerPostId, initialConversationId = null }) => {
    const [conversations, setConversations] = useState([]);
    const [comments, setComments] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [userPartnerId, setUserPartnerId] = useState(currentUserPartnerPostId);
    const [loading, setLoading] = useState({ conversations: false, comments: false, sending: false });
    const [error, setError] = useState(null);
    const autoReplyMessage = "Thanks, we'll get back to you shortly."; // Set to null/'' to disable
    const [autoReplySent, setAutoReplySent] = useState(false);
    const [showConversationList, setShowConversationList] = useState(true);
    const [unreadConversation, setUnreadConversation] = useState(0);

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
                setShowConversationList(false);
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
        const chatContainer = document.getElementById('chat-messages-container-mobile');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }, [comments]);

    // useEffect(() => {
    //     if (!autoReplyMessage || autoReplySent || comments.length === 0) return;
    //
    //     const lastComment = comments[comments.length - 1];
    //     const sentFrom = lastComment?.meta_data?.sent_from?.[0] || '';
    //
    //     if (sentFrom !== 'partner') {
    //         setAutoReplySent(true);
    //         handleSendMessage(autoReplyMessage);
    //     }
    // }, [comments]);

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
                        if (selected) {
                            setActiveConversation(selected);
                            setActiveConversationId(selected.conversation_id);
                            setShowConversationList(false);
                        }
                    }
                    // Don't auto-select first conversation - let user choose
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
        setShowConversationList(false);
    };

    const handleBackToConversations = () => {
        setShowConversationList(true);
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
        <div className="flex flex-col h-screen bg-white">
            {/* Conversation List View */}
            {showConversationList && (
                <div className="flex flex-col h-full">
                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading.conversations ? (
                            <div className="flex flex-col space-y-4 p-4">
                                {[...Array(4)].map((_, index) => (
                                    <div key={index} className="flex items-center space-x-3 p-3">
                                        <Skeleton.Avatar size="large" active />
                                        <div className="flex-1">
                                            <Skeleton.Input size="small" active style={{ width: '60%' }} />
                                            <div className="mt-2">
                                                <Skeleton.Input size="small" active style={{ width: '80%' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {
                                    conversations.map(conversation => (
                                        <ContactItem
                                            key={conversation.client_id}
                                            conversation={conversation}
                                            // unreadConversation={unreadConversation}
                                            unreadConversation={conversation.unread_count_partner}
                                            customerImage={conversation.customer_image}
                                            isActive={activeConversation?.client_id === conversation.client_id}
                                            onClick={handleConversationSelect}
                                        />
                                    ))
                                }
                                {!loading.conversations && conversations.length === 0 && (
                                    <div className="p-4 text-center text-gray-500">No conversations found</div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Chat View */}
            {!showConversationList && activeConversation && (
                <div className="flex flex-col h-full">
                    {/* Back Button */}
                    <div className="flex items-center p-4 border-b border-gray-200 bg-white">
                        <button
                            onClick={handleBackToConversations}
                            className="p-1 text-gray-600 hover:text-gray-800"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="ml-3 text-gray-900 font-medium">Back to Messages</span>
                    </div>

                    {activeConversation && (
                        <AutoReply enabled={!!activeConversation.auto_message} />
                    )}

                    {/* Messages */}
                    <div id="chat-messages-container-mobile" className="flex-1 overflow-y-auto p-4 bg-gray-50">
                        {loading.comments ? (
                            <div className="flex justify-center items-center h-full text-gray-500">
                                Loading messages...
                            </div>
                        ) : (
                            <>
                                {comments.map((comment, index) => (
                                    <Message
                                        key={comment.comment_id}
                                        comment={comment}
                                        conversationId={activeConversation?.conversation_id}
                                        isLastCustomerMessage={
                                            comment?.meta_data?.sent_from?.[0] !== 'partner' &&
                                            index === comments.length - 1
                                        }
                                        customerImage={activeConversation?.customer_image}
                                        partnerImage={activeConversation?.partner_image}
                                    />
                                ))}
                                {comments.length === 0 && (
                                    <div className="text-center text-gray-500 mt-8">
                                        No messages yet. Start a conversation!
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Chat Input */}
                    <ChatInput
                        onSendMessage={handleSendMessage}
                        isLoading={loading.sending}
                        disabled={loading.comments}
                        isMobile={true}
                    />
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div className="fixed top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
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