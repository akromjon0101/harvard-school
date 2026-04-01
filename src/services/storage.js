import { BASE_URL } from './api';

/**
 * Global Storage Service
 * Handles uploading media to either local server or Cloud (S3/Firebase)
 */
const StorageService = {
    /**
     * Uploads a file and returns the public URL
     * @param {File|Blob} file 
     * @param {string} fileName Optional custom filename
     */
    async upload(file, fileName = null) {
        const formData = new FormData();

        // If it's a dataURL (from PDF crop), convert to Blob first
        if (typeof file === 'string' && file.startsWith('data:')) {
            const response = await fetch(file);
            file = await response.blob();
        }

        formData.append('file', file, fileName || 'upload.webp');

        try {
            const response = await fetch(`${BASE_URL}/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            return data.url; // Returns fully qualified URL
        } catch (error) {
            console.error('StorageService Error:', error);
            throw error;
        }
    },

    // Placeholder for future S3 integration
    async uploadToS3(_file) {
        throw new Error('S3 integration not yet configured.')
    }
};

export default StorageService;
