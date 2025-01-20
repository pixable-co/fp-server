const ajax_url = fpserver_settings.ajax_url;

export const uploadMedia = async ({ file, onProgress }) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append('action', 'fp/media/upload');
        formData.append('file', file);

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                const percent = Math.round((event.loaded * 100) / event.total);
                onProgress(percent);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.response);
                    if (response.success) {
                        resolve({
                            success: true,
                            url: response.data.url,
                            id: response.data.id,
                            type: response.data.type
                        });
                    } else {
                        reject(new Error(response.data?.message || 'Upload failed'));
                    }
                } catch (error) {
                    reject(new Error('Invalid response format'));
                }
            } else {
                reject(new Error(`HTTP error! status: ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error'));
        });

        xhr.open('POST', ajax_url);
        xhr.send(formData);
    });
};


export const deleteMedia = async (attachmentId) => {
    try {
        const formData = new FormData();
        formData.append('action', 'fp/media/delete');
        formData.append('attachment_id', attachmentId);

        const response = await fetch(fpserver_settings.ajax_url, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
        });

        const data = await response.json();

        if (data.success) {
            return {
                success: true
            };
        } else {
            throw new Error(data.data.message || 'Delete failed');
        }
    } catch (error) {
        console.error('Delete error:', error);
        return {
            success: false,
            error: error.message || 'Delete failed'
        };
    }
};
