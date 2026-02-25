import React, { useState, useRef, useCallback } from 'react';
import './CameraCapture.css';

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('无法访问摄像头:', error);
      alert('无法访问摄像头，请确保已授予摄像头权限');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageBase64);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  const toggleCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(startCamera, 100);
  }, [stopCamera, startCamera]);

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="camera-capture">
      <div className="camera-header">
        <button className="close-btn" onClick={onClose}>✕</button>
        <h3>拍照识别</h3>
        <button className="switch-btn" onClick={toggleCamera}>🔄</button>
      </div>

      <div className="camera-preview">
        {!capturedImage ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
          />
        ) : (
          <img src={capturedImage} alt="Captured" className="captured-image" />
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div className="camera-controls">
        {!capturedImage ? (
          <button className="capture-btn" onClick={capturePhoto}>
            <div className="capture-btn-inner" />
          </button>
        ) : (
          <div className="confirm-controls">
            <button className="retake-btn" onClick={retakePhoto}>
              重拍
            </button>
            <button className="confirm-btn" onClick={confirmPhoto}>
              确认
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
