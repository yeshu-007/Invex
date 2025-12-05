import React, { useState, useRef } from 'react';
import './ImageScanModal.css';
import Icon from './Icon';
import { useIdentifyComponentFromImageMutation } from '../store/api/studentApi';

const ImageScanModal = ({ onClose, onComponentSelect }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [matchedComponents, setMatchedComponents] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [identifyComponent, { isLoading: identifying }] = useIdentifyComponentFromImageMutation();

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }
      setSelectedImage(file);
      setError('');
      setMatchedComponents(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image identification
  const handleIdentify = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setError('');

    try {
      const result = await identifyComponent(selectedImage).unwrap();

      if (result.success && result.matches) {
        setMatchedComponents(result.matches);
        if (result.matches.length === 0) {
          setError(result.message || 'Could not identify component. Please try a clearer photo.');
        }
      } else {
        throw new Error(result.message || 'Failed to identify component');
      }
    } catch (err) {
      console.error('Image identification error:', err);
      setError(err?.data?.message || 'Failed to identify component. Please try again.');
    }
  };

  // Handle component selection
  const handleSelectComponent = (component) => {
    if (onComponentSelect) {
      onComponentSelect(component);
    }
    onClose();
  };

  // Reset and close
  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setMatchedComponents(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content image-scan-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          <Icon name="x" size={24} />
        </button>
        <h2 className="modal-title">Scan Component</h2>
        <p className="modal-subtitle">Take a photo or upload an image to identify the component</p>

        {/* Image Upload Section */}
        {!matchedComponents && (
          <div className="scan-section">
            {/* Image Preview */}
            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="image-preview" />
                <button
                  className="remove-image-btn"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    if (cameraInputRef.current) cameraInputRef.current.value = '';
                  }}
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
            )}

            {/* File Inputs */}
            {!imagePreview && (
              <div className="image-input-options">
                <div className="image-input-wrapper">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    disabled={identifying}
                    className="file-input"
                    id="camera-input"
                  />
                  <label htmlFor="camera-input" className="image-input-label camera">
                    <Icon name="camera" size={32} />
                    <span>Take Photo</span>
                  </label>
                </div>

                <div className="image-input-wrapper">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={identifying}
                    className="file-input"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="image-input-label upload">
                    <Icon name="upload" size={32} />
                    <span>Upload Image</span>
                  </label>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="modal-buttons">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={handleClose}
                disabled={identifying}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-confirm" 
                onClick={handleIdentify}
                disabled={!selectedImage || identifying}
              >
                {identifying ? (
                  <>
                    <Icon name="loader-2" size={18} className="spinning" style={{ marginRight: '8px' }} />
                    Identifying...
                  </>
                ) : (
                  <>
                    <Icon name="search" size={18} style={{ marginRight: '8px' }} />
                    Identify Component
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Identifying State */}
        {identifying && !matchedComponents && (
          <div className="identifying-section">
            <Icon name="loader-2" size={48} className="spinning identifying-icon" />
            <p className="identifying-text">Analyzing image...</p>
          </div>
        )}

        {/* Matched Components Section */}
        {matchedComponents && matchedComponents.length > 0 && (
          <div className="matches-section">
            <h3 className="matches-title">
              Found {matchedComponents.length} match{matchedComponents.length !== 1 ? 'es' : ''}
            </h3>
            <div className="matches-list">
              {matchedComponents.map((component, index) => (
                <div key={component.componentId || index} className="match-card">
                  <div className="match-header">
                    <h4 className="match-name">{component.name}</h4>
                    {component.matchConfidence && (
                      <span className="match-confidence">
                        {component.matchConfidence}% match
                      </span>
                    )}
                  </div>
                  {component.matchReason && (
                    <p className="match-reason">{component.matchReason}</p>
                  )}
                  <div className="match-details">
                    <span className="match-category">{component.category}</span>
                    <span className="match-stock">
                      {component.availableQuantity || 0} available
                    </span>
                  </div>
                  {component.description && (
                    <p className="match-description">{component.description}</p>
                  )}
                  <button
                    className="match-select-btn"
                    onClick={() => handleSelectComponent(component)}
                  >
                    <Icon name="check-circle" size={18} style={{ marginRight: '8px' }} />
                    Select & Borrow
                  </button>
                </div>
              ))}
            </div>

            <div className="modal-buttons">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => {
                  setMatchedComponents(null);
                  setSelectedImage(null);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  if (cameraInputRef.current) cameraInputRef.current.value = '';
                }}
              >
                Scan Another
              </button>
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* No Matches Found */}
        {matchedComponents && matchedComponents.length === 0 && !identifying && (
          <div className="no-matches-section">
            <Icon name="alert-circle" size={48} className="no-matches-icon" />
            <p className="no-matches-text">
              Could not identify component from this image.
            </p>
            <p className="no-matches-hint">
              Try taking a clearer photo with good lighting, or search manually.
            </p>
            <div className="modal-buttons">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => {
                  setMatchedComponents(null);
                  setSelectedImage(null);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  if (cameraInputRef.current) cameraInputRef.current.value = '';
                }}
              >
                Try Again
              </button>
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageScanModal;

