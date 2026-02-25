import React, { useState } from 'react';
import './LoadingOverlay.css';

interface LoadingOverlayProps {
  message?: string;
  progress?: number;
  total?: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = '处理中...',
  progress,
  total,
}) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        
        <p className="loading-message">{message}</p>
        
        {progress !== undefined && total !== undefined && (
          <div className="loading-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(progress / total) * 100}%` }}
              />
            </div>
            <span className="progress-text">
              {progress} / {total}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
