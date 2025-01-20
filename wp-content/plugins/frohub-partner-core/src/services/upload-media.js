import axios from "axios";

export const uploadMedia = async ({ file, onProgress }) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(
            'https://frohubecomm.mystagingwebsite.com/wp-json/custom/v1/upload-image',
            formData,
            {
                headers: {
                    Authorization: `Basic ${btoa('Abir@pixable.co:UYoJ OSTu PlCq jByV vpjw VZyw')}`
                },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if (onProgress) onProgress(percent);
                }
            }
        );

        return {
            success: true,
            url: response.data.url,
            id: response.data.id
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || 'Upload failed'
        };
    }
};

export const deleteMedia = async (id) => {
    try {
        const response = await axios.delete(
            `https://frohubecomm.mystagingwebsite.com/wp-json/custom/v1/delete-media/${id}`,
            {
                headers: {
                    Authorization: `Basic ${btoa('Abir@pixable.co:UYoJ OSTu PlCq jByV vpjw VZyw')}`
                }
            }
        );

        if (response.data.success) {
            return { success: true };
        } else {
            throw new Error(response.data.message || 'Delete failed');
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Delete failed'
        };
    }
};