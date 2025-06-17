import React, { useState, useRef } from 'react';
import { uploadImageDirect } from "../../../services/uploadImage.js";

const ChatInput = ({ onSendMessage, isLoading = false, disabled = false }) => {
    const [message, setMessage] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleSubmit = async () => {
        if ((!message.trim() && !imageFile) || isLoading || disabled) {
            return;
        }

        let imageUrl = '';

        if (imageFile) {
            setIsUploading(true);
            try {
                imageUrl = await uploadImageDirect(imageFile);
            } catch (error) {
                console.error('Image upload failed:', error);
                alert(error.message || 'Image upload failed');
            } finally {
                setIsUploading(false);
                setImageFile(null);
                setImagePreview(null);
            }
        }

        if (message.trim() || imageUrl) {
            await onSendMessage(message, imageUrl);
            setMessage('');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="bg-white border-t p-3 sticky bottom-0">
            <div className="flex items-center">
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />

                <button
                    onClick={triggerFileInput}
                    type="button"
                    className="mr-2 text-gray-500 p-2"
                    disabled={disabled || isUploading}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>

                <div className="flex-1 relative">
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={disabled || isUploading}
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={(!message.trim() && !imageFile) || isLoading || disabled || isUploading}
                    className="send-button ml-2 text-white rounded-l flex items-center justify-center hover:bg-orange-600 disabled:opacity-50"
                >
                    <span className="hidden sm:inline">Send Message</span>
                    <i className="fas fa-paper-plane sm:hidden"></i>
                </button>
            </div>

            {imagePreview && (
                <div className="mt-2">
                    <div className="relative inline-block">
                        <img src={imagePreview} alt="Preview" className="max-h-32 rounded" />
                        <button
                            onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                            }}
                            className="absolute top-1 right-1 bg-gray-800 bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {isUploading && (
                <div className="text-xs text-blue-500 mt-1">
                    Uploading image...
                </div>
            )}
        </div>
    );
};

export default ChatInput;