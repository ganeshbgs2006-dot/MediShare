import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Camera,
  Square,
  RotateCcw,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Play,
  Pause
} from 'lucide-react';
import Button from '../Button/Button';
import Badge from '../Badge/Badge';
import { mediaService } from '../../../services/mediaService';
import styles from './CameraRecorder.module.css';

export default function CameraRecorder({
  onVideoReady,
  existingVideoUrl = null,
  roleLabel = 'Borrower / Seeker',
  maxDurationSec = 60
}) {
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(existingVideoUrl);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(Boolean(existingVideoUrl));
  const [errorMessage, setErrorMessage] = useState('');
  const [useUploadFallback, setUseUploadFallback] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  // Start WebRTC camera stream
  const startCamera = async () => {
    setErrorMessage('');
    try {
      // Try environment (rear) camera first for equipment inspection, fallback to front
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
      } catch (err) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }

      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('[CameraRecorder] Camera access denied or unsupported:', err);
      setErrorMessage('Unable to access device camera. You can record or choose a video file below instead.');
      setUseUploadFallback(true);
    }
  };

  // Start recording
  const startRecording = () => {
    if (!stream) return;
    setRecordedChunks([]);
    setErrorMessage('');
    setRecordingSeconds(0);

    try {
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const options = selectedMime ? { mimeType: selectedMime } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedMime || 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stopCameraStream();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= maxDurationSec - 1) {
            stopRecording();
            return maxDurationSec;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setErrorMessage(`Failed to start recording: ${err.message}`);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Reset and record again
  const handleReset = () => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    setUploadSuccess(false);
    setErrorMessage('');
    setRecordingSeconds(0);
    startCamera();
  };

  // Upload recorded blob to server
  const handleUploadRecording = async (blobToUpload = recordedBlob) => {
    if (!blobToUpload) return;
    setUploading(true);
    setErrorMessage('');

    try {
      const res = await mediaService.uploadVideo(blobToUpload);
      if (res.success && res.file && res.file.url) {
        setUploadSuccess(true);
        if (onVideoReady) {
          onVideoReady(res.file.url);
        }
      } else {
        throw new Error('Upload succeeded without file URL.');
      }
    } catch (err) {
      setErrorMessage(`Failed to upload recording: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // File upload fallback
  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrorMessage('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('Video file size exceeds maximum 100MB limit.');
      return;
    }

    setRecordedBlob(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    await handleUploadRecording(file);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      {/* Header instructions */}
      <div className={styles.guidanceBanner}>
        <div className={styles.guidanceIcon}>
          <Video size={20} />
        </div>
        <div>
          <h4 className={styles.guidanceTitle}>Dual Return Video Recording — {roleLabel}</h4>
          <p className={styles.guidanceText}>
            Capture a clear 360-degree walkthrough of the medical equipment before handover/return. Highlight frame integrity, wheel operation, brake locks, clean upholstery, and any pre-existing cosmetic markings.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className={styles.errorBanner}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Viewfinder / Preview Container */}
      <div className={styles.viewportWrapper}>
        {previewUrl ? (
          <div className={styles.previewContainer}>
            <video
              src={previewUrl}
              controls
              playsInline
              className={styles.videoPlayer}
            />
            {uploadSuccess && (
              <div className={styles.uploadBadge}>
                <CheckCircle2 size={16} />
                <span>Video Evidence Uploaded & Verified</span>
              </div>
            )}
          </div>
        ) : isCameraActive ? (
          <div className={styles.cameraLiveContainer}>
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={styles.liveVideo}
            />
            {isRecording && (
              <div className={styles.recordingOverlay}>
                <span className={styles.pulsingDot} />
                <span className={styles.timerText}>
                  REC {formatTime(recordingSeconds)} / {formatTime(maxDurationSec)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.idlePlaceholder}>
            <Camera size={48} className={styles.placeholderIcon} />
            <p className={styles.placeholderText}>Camera is currently inactive</p>
            <div className={styles.actionGroup}>
              <Button variant="primary" icon={<Camera size={18} />} onClick={startCamera}>
                Open Camera Viewfinder
              </Button>
              <Button
                variant="outline"
                icon={<Upload size={18} />}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                Upload Video File
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input for fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Controls row */}
      <div className={styles.controlsRow}>
        {isCameraActive && !previewUrl && (
          <>
            {!isRecording ? (
              <Button
                variant="accent"
                icon={<Video size={18} />}
                onClick={startRecording}
                className={styles.recordBtn}
              >
                Start Recording (Max {maxDurationSec}s)
              </Button>
            ) : (
              <Button
                variant="danger"
                icon={<Square size={18} />}
                onClick={stopRecording}
                className={styles.stopBtn}
              >
                Stop Recording ({formatTime(recordingSeconds)})
              </Button>
            )}
            <Button variant="outline" onClick={stopCameraStream}>
              Cancel Camera
            </Button>
          </>
        )}

        {previewUrl && (
          <div className={styles.reviewActions}>
            <Button
              variant="outline"
              icon={<RotateCcw size={16} />}
              onClick={handleReset}
              disabled={uploading}
            >
              Re-record Video
            </Button>

            {!uploadSuccess && (
              <Button
                variant="primary"
                icon={<Upload size={16} />}
                onClick={() => handleUploadRecording()}
                isLoading={uploading}
                disabled={uploading || !recordedBlob}
              >
                Upload & Confirm Video
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

