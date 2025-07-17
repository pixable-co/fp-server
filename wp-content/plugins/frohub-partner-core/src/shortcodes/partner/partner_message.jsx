import React, { useState, useEffect, useRef } from 'react';
import { Skeleton } from "antd";
import { fetchData } from '../../services/fetchData';
import ContactItem from "./MessageComponents/ContactItem.jsx";
import ChatInput from './MessageComponents/ChatInput';
import Message from './MessageComponents/Message';
import Avatar from './MessageComponents/Avatar';
import AutoReply from "./MessageComponents/AutoReply.jsx";

const PartnerMessage = ({ dataKey, currentUserPartnerPostId, initialConversationId = null }) => {
    const [conversations, setConversations] = useState([]);
    const [comments, setComments] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [userPartnerId, setUserPartnerId] = useState(currentUserPartnerPostId);
    const [loading, setLoading] = useState({ conversations: false, comments: false, sending: false });
    const [error, setError] = useState(null);
    const autoReplyMessage = "Thanks, we’ll get back to you shortly."; // Set to null/'' to disable
    const [autoReplySent, setAutoReplySent] = useState(false);
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
        const chatContainer = document.getElementById('chat-messages-container');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
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
                setUnreadConversation(data.unread_count_partner);

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

                            // ✅ Auto-reply check for new incoming message from customer
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
            image_url: imageUrl  // <-- make sure to include this
        });
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <div className="message-conversations w-80bg-white overflow-scroll">
                <div className="overflow-y-auto">
                    {loading.conversations ? (
                        <div className="text-sm text-gray-500 mt-1 flex flex-col space-y-4">
                            <div className="contact-list-avatar p-4 flex space-x-2 justify-around">
                                <Skeleton.Avatar size={"large"} active />
                                <Skeleton.Input  size={"large"} active />
                            </div>

                            <div className="contact-list-avatar p-4 flex space-x-2 justify-around">
                                <Skeleton.Avatar size={"large"} active />
                                <Skeleton.Input  size={"large"} active />
                            </div>

                            <div className="contact-list-avatar p-4 flex space-x-2 justify-around">
                                <Skeleton.Avatar size={"large"} active />
                                <Skeleton.Input  size={"large"} active />
                            </div>

                            <div className="contact-list-avatar p-4 flex space-x-2 justify-around">
                                <Skeleton.Avatar size={"large"} active />
                                <Skeleton.Input  size={"large"} active />
                            </div>
                        </div>
                    ) : (
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
                    )}
                    {!loading.conversations && conversations.length === 0 && (
                        <div>
                            <p className="text-gray-600 text-base text-center max-w-xl mx-auto">No Conversation Found</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="conversation-details flex-1 flex flex-col">
                {activeConversation ? (
                    <>
                        <div className="top-avatar bg-white p-4 flex items-center">
                            <Avatar name={activeConversation.customer_name || 'Customer'} image={activeConversation.customer_image} />
                            <div className="ml-3">
                                <h3 className="font-medium text-gray-900">{activeConversation.customer_name || `Client #${activeConversation.client_id}`}</h3>

                            </div>
                        </div>

                        {activeConversation && (
                            <AutoReply enabled={!!activeConversation.auto_message} />
                        )}

                        <div id="chat-messages-container" className="flex-1 overflow-y-auto p-4">
                            {loading.comments ? (
                                <div className="flex justify-center items-center h-full text-gray-500">Loading messages...</div>
                            ) : (
                                <div className="space-y-4">
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
                                        <div className="text-center text-gray-500 mt-8">No messages yet. Start a conversation!</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <ChatInput onSendMessage={handleSendMessage} isLoading={loading.sending} disabled={loading.comments} />
                    </>
                ) : (
                    <div className="flex-1 flex items-start justify-center text-gray-500">
                        <div className="text-center p-16 mt-8">
                            <h3 className="text-2xl font-bold mb-3 text-gray-800">👋🏾 Welcome to your inbox!</h3>
                            <p className="text-gray-600 text-base text-center max-w-xl mx-auto">When a client books or sends an enquiry, their messages will appear here for you to respond to. Need to share anything ahead of the appointment? Send them a quick message here.</p>
                        </div>
                    </div>
                )}
            </div>

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

export default PartnerMessage;