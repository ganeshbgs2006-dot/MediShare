import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PackagePlus,
  Upload,
  Image,
  Video,
  Film,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  X,
  FileText,
  Tag,
  MapPin,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { equipmentService, getCategories } from '../../services/equipmentService';
import { mediaService } from '../../services/mediaService';
import Button from '../../components/common/Button/Button';
import Card, { CardBody } from '../../components/common/Card/Card';
import styles from './AddEquipment.module.css';

export default function AddEquipment() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isPending = user?.approvalStatus === 'pending' || user?.approval_status === 'pending';
  const videoFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Wheelchairs',
    serviceArea: user?.serviceArea || user?.service_area || '',
    sharingType: 'free',
    pricePerDay: 0,
    conditionGrade: 'Good',
    conditionDetails: '',
    knownDamage: '',
    description: '',
    imageUrl: '',
    videoUrl: ''
  });

  const [galleryUrls, setGalleryUrls] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoMeta, setVideoMeta] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const categories = getCategories().filter((c) => c !== 'All Categories');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    setError('');

    try {
      if (files.length === 1) {
        const res = await mediaService.uploadPhoto(files[0]);
        if (res.success && res.file) {
          setFormData((prev) => ({
            ...prev,
            imageUrl: prev.imageUrl || res.file.url
          }));
          setGalleryUrls((prev) => [...prev, res.file.url]);
        }
      } else {
        const res = await mediaService.uploadPhotos(files);
        if (res.success && res.files) {
          const newUrls = res.files.map((f) => f.url);
          setFormData((prev) => ({
            ...prev,
            imageUrl: prev.imageUrl || newUrls[0]
          }));
          setGalleryUrls((prev) => [...prev, ...newUrls]);
        }
      }
    } catch (err) {
      setError(err.message || 'Image upload failed. You can provide an image URL instead.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeGalleryImage = (index) => {
    setGalleryUrls((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (formData.imageUrl === prev[index]) {
        setFormData((f) => ({ ...f, imageUrl: next[0] || '' }));
      }
      return next;
    });
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video size (max 100MB)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`Video file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed video size is 100MB.`);
      return;
    }

    // Validate video format
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validExts = ['.mp4', '.webm', '.mov'];
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setError('Invalid video format. Allowed formats: MP4, WebM, QuickTime (.mov).');
      return;
    }

    setError('');
    setSelectedVideoFile(file);
    setVideoMeta({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type || ext
    });

    // Create local object URL for instant preview
    const preview = URL.createObjectURL(file);
    setVideoPreviewUrl(preview);

    // Upload to backend media endpoint
    setUploadingVideo(true);
    try {
      const res = await mediaService.uploadVideo(file, file.name);
      if (res.success && res.file) {
        setFormData((prev) => ({
          ...prev,
          videoUrl: res.file.url
        }));
      }
    } catch (uploadErr) {
      setError(uploadErr.message || 'Video upload failed. You can enter an external video URL instead.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeVideo = () => {
    if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedVideoFile(null);
    setVideoPreviewUrl('');
    setVideoMeta(null);
    setFormData((prev) => ({ ...prev, videoUrl: '' }));
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (uploadingVideo) {
      setError('Please wait for the equipment demonstration video upload to complete before publishing.');
      return;
    }

    if (isPending) {
      setError('Your partner account is pending admin verification. You cannot publish equipment listings until approved.');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please provide equipment name.');
      return;
    }
    if (!formData.serviceArea.trim()) {
      setError('Please provide service area / location.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please provide a detailed equipment description.');
      return;
    }
    if (formData.sharingType === 'rental' && (!formData.pricePerDay || Number(formData.pricePerDay) <= 0)) {
      setError('Please specify a positive daily rental fee for rental equipment.');
      return;
    }

    setSubmitting(true);
    try {
      let finalVideoUrl = formData.videoUrl;
      // If a video file was selected but not uploaded yet, ensure upload finishes
      if (selectedVideoFile && !finalVideoUrl) {
        setUploadingVideo(true);
        const res = await mediaService.uploadVideo(selectedVideoFile, selectedVideoFile.name);
        if (res.success && res.file) {
          finalVideoUrl = res.file.url;
        }
        setUploadingVideo(false);
      }

      await equipmentService.createEquipment({
        ...formData,
        videoUrl: finalVideoUrl,
        gallery: galleryUrls.length > 0 ? galleryUrls : (formData.imageUrl ? [formData.imageUrl] : [])
      });

      setSuccessMsg('Equipment listing created and published successfully!');
      setTimeout(() => {
        navigate('/owner/inventory');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to publish equipment listing.');
    } finally {
      setSubmitting(false);
      setUploadingVideo(false);
    }
  };

  return (
    <div className={styles.addPage}>
      <div className="container">
        <div className={styles.header}>
          <Link to="/owner/inventory" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Equipment Inventory
          </Link>
          <h1 className={styles.title}>Publish New Medical Equipment</h1>
          <p className={styles.subtitle}>
            Provide transparent condition notes, service areas, and multi-angle photos to assist borrowers in need.
          </p>
        </div>

        {isPending && (
          <div className={styles.pendingAlert}>
            <Clock size={20} />
            <div>
              <strong>Account Pending Administrator Verification</strong>
              <p>Your owner account is under review. Listing submission is temporarily disabled until approved.</p>
            </div>
          </div>
        )}

        {error && (
          <div className={styles.errorAlert}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className={styles.successAlert}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <Card className={styles.formCard}>
          <CardBody>
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Section 1: Basic Information */}
              <div className={styles.section}>
                <h3 className={styles.sectionHeading}>1. Equipment Details</h3>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Equipment Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Drive Medical Lightweight Folding Wheelchair"
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={styles.select}
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Service Area / Pickup Location *</label>
                    <input
                      type="text"
                      name="serviceArea"
                      value={formData.serviceArea}
                      onChange={handleChange}
                      placeholder="e.g. Central Metro, South Suburbs, District Hospital Zone"
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Sharing Arrangement *</label>
                    <select
                      name="sharingType"
                      value={formData.sharingType}
                      onChange={handleChange}
                      className={styles.select}
                      required
                    >
                      <option value="free">Free Community Lending</option>
                      <option value="rental">Affordable Paid Rental</option>
                      <option value="donation">Permanent Donation</option>
                    </select>
                  </div>
                </div>

                {formData.sharingType === 'rental' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Daily Rental Rate (₹ / Day) *</label>
                    <input
                      type="number"
                      name="pricePerDay"
                      min="1"
                      step="1"
                      value={formData.pricePerDay}
                      onChange={handleChange}
                      className={styles.input}
                      required={formData.sharingType === 'rental'}
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Detailed Description & Specs *</label>
                  <textarea
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe equipment dimensions, weight capacity, seat width, accessories included, and recommended usage..."
                    className={styles.textarea}
                    required
                  />
                </div>
              </div>

              {/* Section 2: Physical Condition & Safety */}
              <div className={styles.section}>
                <h3 className={styles.sectionHeading}>2. Transparent Physical Condition Check</h3>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Condition Grade *</label>
                  <div className={styles.conditionRadioGroup}>
                    {[
                      { val: 'Good', desc: 'Fully operational, no damage, fully sanitized' },
                      { val: 'Fair', desc: 'Operational with minor superficial scuffs or cosmetic wear' },
                      { val: 'Needs Inspection', desc: 'Requires borrower check or minor tune-up' }
                    ].map(({ val, desc }) => (
                      <label
                        key={val}
                        className={`${styles.conditionCard} ${formData.conditionGrade === val ? styles.conditionSelected : ''}`}
                      >
                        <input
                          type="radio"
                          name="conditionGrade"
                          value={val}
                          checked={formData.conditionGrade === val}
                          onChange={handleChange}
                        />
                        <div>
                          <strong>{val}</strong>
                          <p>{desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Physical Inspection Notes</label>
                    <textarea
                      rows={2}
                      name="conditionDetails"
                      value={formData.conditionDetails}
                      onChange={handleChange}
                      placeholder="e.g. Frame structurally sound. Push rims aligned. Brakes hold firmly."
                      className={styles.textarea}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Known Cosmetic Markings / Blemishes</label>
                    <textarea
                      rows={2}
                      name="knownDamage"
                      value={formData.knownDamage}
                      onChange={handleChange}
                      placeholder="e.g. Light scratch on left armrest; does not affect functionality."
                      className={styles.textarea}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Photos & Visual Verification */}
              <div className={styles.section}>
                <h3 className={styles.sectionHeading}>3. Equipment Photos (Multi-angle)</h3>

                <div className={styles.uploadArea}>
                  <Upload size={32} className={styles.uploadIcon} />
                  <p className={styles.uploadText}>
                    Upload clear multi-angle photos of the equipment (Front, Side, Brakes, Seat/Upholstery)
                  </p>
                  <label className={styles.uploadBtn}>
                    {uploadingMedia ? 'Uploading...' : 'Choose Photos (Max 5, up to 10MB each)'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploadingMedia}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {/* Direct Image URL input option */}
                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                  <label className={styles.label}>Or enter Primary Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/... or uploaded photo link"
                    className={styles.input}
                  />
                </div>

                {/* Gallery preview thumbnails */}
                {galleryUrls.length > 0 && (
                  <div className={styles.galleryPreview}>
                    {galleryUrls.map((url, idx) => (
                      <div key={idx} className={styles.thumbnailWrapper}>
                        <img src={url} alt={`Preview ${idx + 1}`} className={styles.thumbnail} />
                        <button
                          type="button"
                          className={styles.removeThumbnail}
                          onClick={() => removeGalleryImage(idx)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Equipment Video */}
              <div className={styles.section}>
                <h3 className={styles.sectionHeading}>4. Equipment Video (Operational Demo & Physical Walkthrough)</h3>
                <p className={styles.videoHelpText}>
                  Provide an optional walkthrough video showing the equipment folding/unfolding, moving parts, brakes, and motor/battery operation (if applicable).
                </p>

                <input
                  type="file"
                  ref={videoFileInputRef}
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoSelect}
                  disabled={uploadingVideo}
                  style={{ display: 'none' }}
                />

                {!videoPreviewUrl && !formData.videoUrl ? (
                  <div className={styles.uploadArea}>
                    <Video size={36} className={styles.uploadIcon} />
                    <p className={styles.uploadText}>
                      Upload an equipment demonstration video (MP4, WebM, MOV &bull; Max 100MB)
                    </p>
                    <label className={styles.uploadBtn}>
                      {uploadingVideo ? 'Uploading Video...' : 'Choose Equipment Video'}
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleVideoSelect}
                        disabled={uploadingVideo}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                ) : (
                  <div className={styles.videoPreviewCard}>
                    <video
                      src={videoPreviewUrl || formData.videoUrl}
                      controls
                      preload="metadata"
                      className={styles.videoPlayer}
                    />
                    <div className={styles.videoMetaRow}>
                      <div className={styles.videoInfo}>
                        <Film size={16} />
                        <span><strong>{videoMeta?.name || 'Equipment Video File'}</strong></span>
                        {videoMeta?.size && <span className={styles.videoBadge}>{videoMeta.size}</span>}
                        {uploadingVideo && <span className={styles.videoBadge}>Uploading to server...</span>}
                      </div>
                      <div className={styles.videoActions}>
                        <button
                          type="button"
                          className={styles.videoActionBtn}
                          onClick={() => videoFileInputRef.current?.click()}
                          disabled={uploadingVideo}
                        >
                          <RefreshCw size={14} /> Replace Video
                        </button>
                        <button
                          type="button"
                          className={`${styles.videoActionBtn} ${styles.videoActionBtnDanger}`}
                          onClick={removeVideo}
                          disabled={uploadingVideo}
                        >
                          <Trash2 size={14} /> Remove Video
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Video URL input option */}
                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                  <label className={styles.label}>Or enter Equipment Video URL</label>
                  <input
                    type="url"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => {
                      handleChange(e);
                      if (!selectedVideoFile) {
                        setVideoPreviewUrl(e.target.value);
                      }
                    }}
                    placeholder="https://... or uploaded video link (/uploads/videos/...)"
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className={styles.submitRow}>
                <Button variant="outline" type="button" onClick={() => navigate('/owner/inventory')}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  icon={<PackagePlus size={18} />}
                  isLoading={submitting || uploadingVideo}
                  disabled={submitting || isPending || uploadingVideo}
                >
                  {uploadingVideo ? 'Uploading Video...' : 'Publish Equipment Listing'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

