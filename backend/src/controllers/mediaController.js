export const mediaController = {
  /**
   * Upload a single equipment or profile photo
   */
  uploadPhoto(req, res) {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file was provided for upload.'
      });
    }

    const fileUrl = `/uploads/photos/${req.file.filename}`;
    return res.status(201).json({
      success: true,
      file: {
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      message: 'Image uploaded successfully.'
    });
  },

  /**
   * Upload multiple photos (gallery, up to 5)
   */
  uploadMultiplePhotos(req, res) {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files were provided for upload.'
      });
    }

    const files = req.files.map(file => ({
      url: `/uploads/photos/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size
    }));

    return res.status(201).json({
      success: true,
      files,
      message: `${files.length} images uploaded successfully.`
    });
  },

  /**
   * Upload a condition return video (seeker or owner handover/return recording)
   */
  uploadVideo(req, res) {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video recording file was provided for upload.'
      });
    }

    const fileUrl = `/uploads/videos/${req.file.filename}`;
    return res.status(201).json({
      success: true,
      file: {
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      message: 'Video uploaded successfully.'
    });
  }
};

export default mediaController;

