import React, { useState, useRef } from 'react';
import './ImageUploader.css';

interface ImageUploaderProps {
  onUpload: (imageBase64: string, file: File) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUpload,
  accept = 'image/*',
  multiple = false,
  label = '点击上传图片',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onUpload(result, file);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="image-uploader">
      {!preview ? (
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div className="upload-icon">📷</div>
          <p className="upload-text">{label}</p>
          <p className="upload-hint">支持拖拽上传</p>
        </div>
      ) : (
        <div className="preview-area">
          <img src={preview} alt="Preview" className="preview-image" />
          <button className="clear-btn" onClick={clearPreview}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
