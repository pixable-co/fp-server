import FhButton from "./FhButton.jsx";
import { useState } from "react";
import { InboxOutlined, DeleteOutlined } from "@ant-design/icons";
import { message, Upload, Button } from "antd";
import { uploadMedia } from "../../services/upload-media.js";
import { deleteMedia } from "../../services/upload-media.js";

const { Dragger } = Upload;

const FhMedia = () => {
    const [fileList, setFileList] = useState([]);
    const [featuredImage, setFeaturedImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
        try {
            setUploading(true);

            const result = await uploadMedia({
                file,
                onProgress: (percent) => {
                    onProgress({ percent });
                }
            });

            if (result.success) {
                onSuccess(result);
                setFileList((prev) => [
                    ...prev,
                    {
                        uid: Date.now().toString(),
                        name: file.name,
                        status: 'done',
                        url: result.url,
                        thumbUrl: URL.createObjectURL(file),
                        id: result.id // Store the WordPress attachment ID
                    }
                ]);
                message.success(`${file.name} uploaded successfully`);
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            message.error(`${file.name} upload failed: ${error.message}`);
            onError(error);
        } finally {
            setUploading(false);
        }
    };

    // const handleRemove = (file) => {
    //     const updatedList = fileList.filter((item) => item.uid !== file.uid);
    //     setFileList(updatedList);
    //     if (file.uid === featuredImage) {
    //         setFeaturedImage(null);
    //     }
    //     message.success(`${file.name} removed`);
    // };

    const handleRemove = async (file) => {
        try {
            // Only attempt to delete from server if we have an ID
            if (file.id) {
                const result = await deleteMedia(file.id);
                if (!result.success) {
                    message.error(`Failed to delete ${file.name}: ${result.error}`);
                    return false; // Prevent removal from fileList if server deletion failed
                }
            }

            const updatedList = fileList.filter((item) => item.uid !== file.uid);
            setFileList(updatedList);

            if (file.uid === featuredImage) {
                setFeaturedImage(null);
            }

            message.success(`${file.name} removed`);
            return true;
        } catch (error) {
            console.error('Delete error:', error);
            message.error(`Failed to delete ${file.name}`);
            return false;
        }
    };

    const setAsFeatured = (file) => {
        setFeaturedImage(file.uid);
        message.success(`Set ${file.name} as featured image`);
    };

    const beforeUpload = (file) => {
        // Check if maximum files reached
        if (fileList.length >= 4) {
            message.error('Maximum 4 images allowed');
            return Upload.LIST_IGNORE;
        }

        // Check file type
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
            return Upload.LIST_IGNORE;
        }

        // Check file size (10MB)
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            message.error('Image must be smaller than 10MB!');
            return Upload.LIST_IGNORE;
        }

        return true;
    };

    // Function to get the value for form submission
    const getValue = () => {
        return {
            images: fileList.map(file => ({
                id: file.id,
                url: file.url,
                isFeatured: file.uid === featuredImage
            })),
            featuredImage: fileList.find(file => file.uid === featuredImage)?.id || null
        };
    };

    return (
        <div className="space-y-4">
            <Dragger
                name="file"
                multiple
                customRequest={customRequest}
                beforeUpload={beforeUpload}
                onRemove={handleRemove}
                showUploadList={false}
                accept="image/*"
                disabled={uploading || fileList.length >= 4}
                className="bg-white border-2 rounded-lg p-8"
            >
                <div className="flex flex-col items-center justify-center space-y-4">
                    <p className="text-4xl text-gray-400">
                        <InboxOutlined />
                    </p>
                    <div>
                        <FhButton
                            label={uploading ? "Uploading..." : "Select Files"}
                            disabled={uploading || fileList.length >= 4}
                        />
                    </div>
                    <p className="text-sm text-gray-500">
                        Click or drag files to upload
                    </p>
                    <p className="text-xs text-gray-400">
                        Max: 4 Images (JPG, PNG, GIF up to 10MB each)
                    </p>
                </div>
            </Dragger>

            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                    {`${fileList.length}/4 Images Uploaded`}
                </p>
                {fileList.length > 0 && (
                    <p className="text-sm text-gray-600">
                        {featuredImage ? "Featured image selected" : "Select a featured image"}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {fileList.map((file) => (
                    <div
                        key={file.uid}
                        className={`relative group rounded-lg overflow-hidden shadow-sm
                            ${file.uid === featuredImage ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200'}
                        `}
                    >
                        <div className="aspect-w-16 aspect-h-12">
                            <img
                                src={file.thumbUrl || file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                                <div className="flex justify-between items-center">
                                    <Button
                                        size="small"
                                        type={file.uid === featuredImage ? 'primary' : 'default'}
                                        onClick={() => setAsFeatured(file)}
                                        className="text-xs"
                                    >
                                        {file.uid === featuredImage ? 'Featured' : 'Set Featured'}
                                    </Button>
                                    <Button
                                        size="small"
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemove(file)}
                                        className="text-white hover:text-red-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* File name tooltip */}
                        <div className="absolute top-2 left-2 right-2">
                            <div className="px-2 py-1 bg-black/50 rounded text-white text-xs truncate">
                                {file.name}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty state */}
            {fileList.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                    No images uploaded yet
                </div>
            )}
        </div>
    );
};

export default FhMedia;
