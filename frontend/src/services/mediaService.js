/**
 * MediShare Media Upload Service
 * Handles multipart file uploads to /api/media for equipment photos and condition inspection videos.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const mediaService = {
  /**
   * Upload single photo (e.g. equipment primary image)
   * @param {File|Blob} file
   */
  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);

    const token = localStorage.getItem('medishare_token');
    try {
      const response = await fetch(`${API_BASE_URL}/media/upload/photo`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image.');
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
        throw new Error('Unable to connect to MediShare backend server on port 5000. Please ensure the backend is running.');
      }
      throw err;
    }
  },

  /**
   * Upload multiple photos (e.g. equipment gallery)
   * @param {FileList|File[]} files
   */
  async uploadPhotos(files) {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('photos', file));

    const token = localStorage.getItem('medishare_token');
    try {
      const response = await fetch(`${API_BASE_URL}/media/upload/photos`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload images.');
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
        throw new Error('Unable to connect to MediShare backend server on port 5000. Please ensure the backend is running.');
      }
      throw err;
    }
  },

  /**
   * Upload return condition or equipment listing video
   * @param {File|Blob} videoBlobOrFile
   * @param {string} filename
   */
  async uploadVideo(videoBlobOrFile, filename = 'video.webm') {
    const formData = new FormData();
    const effectiveFilename = videoBlobOrFile.name || filename;
    formData.append('video', videoBlobOrFile, effectiveFilename);

    const token = localStorage.getItem('medishare_token');
    try {
      const response = await fetch(`${API_BASE_URL}/media/upload/video`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload video.');
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
        throw new Error('Unable to connect to MediShare backend server on port 5000. Please ensure the backend is running.');
      }
      throw err;
    }
  }
};

export default mediaService;

