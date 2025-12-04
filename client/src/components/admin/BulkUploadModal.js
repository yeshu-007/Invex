import React, { useState, useRef } from 'react';
import './BulkUploadModal.css';
import Icon from '../Icon';
import { 
  useUploadCSVMutation, 
  useBulkCreateComponentsMutation,
  useEnrichComponentsMutation
} from '../../store/api/adminApi';

const BulkUploadModal = ({ onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analyzedComponents, setAnalyzedComponents] = useState(null);
  const [isEnriched, setIsEnriched] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // RTK Query mutations
  const [uploadCSV, { isLoading: uploading }] = useUploadCSVMutation();
  const [bulkCreate, { isLoading: creating }] = useBulkCreateComponentsMutation();
  const [enrichComponents, { isLoading: enriching }] = useEnrichComponentsMutation();

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        setError('Please select a CSV file');
        return;
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setError('');
      setAnalyzedComponents(null);
      setIsEnriched(false);
    }
  };

  // Handle CSV upload and analysis
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file first');
      return;
    }

    setError('');
    setAnalyzing(true);
    setAnalysisStep('Reading CSV file...');

    try {
      // Upload CSV and get extracted components (no AI yet)
      setAnalysisStep('Extracting data from CSV...');
      const result = await uploadCSV(selectedFile).unwrap();

      if (result.success && result.components) {
        setAnalyzedComponents(result.components);
        setIsEnriched(false);
        setAnalysisStep('');
        setAnalyzing(false);
      } else {
        throw new Error('Failed to analyze CSV file');
      }
    } catch (err) {
      console.error('CSV analysis error:', err);
      setError(err?.data?.message || 'Failed to analyze CSV file. Please check the file format.');
      setAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Handle optional AI enrichment
  const handleEnrich = async () => {
    if (!analyzedComponents || analyzedComponents.length === 0) {
      setError('No components to enrich');
      return;
    }

    setError('');
    setAnalyzing(true);
    setAnalysisStep('Enriching components with AI...');

    try {
      const result = await enrichComponents(analyzedComponents).unwrap();

      if (result.success && result.components) {
        setAnalyzedComponents(result.components);
        setIsEnriched(true);
        setAnalysisStep('');
        setAnalyzing(false);
      } else {
        throw new Error('Failed to enrich components');
      }
    } catch (err) {
      console.error('Enrich components error:', err);
      setError(err?.data?.message || 'Failed to enrich components. Please try again.');
      setAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Handle bulk create
  const handleCreate = async () => {
    if (!analyzedComponents || analyzedComponents.length === 0) {
      setError('No components to create');
      return;
    }

    setError('');
    setAnalyzing(true);
    setAnalysisStep('Creating components...');

    try {
      const result = await bulkCreate(analyzedComponents).unwrap();

      if (result.success) {
        // Show success message
        alert(`Successfully created ${result.created} component(s)${result.failed > 0 ? `. ${result.failed} failed.` : ''}`);
        
        if (onSuccess) {
          onSuccess(result);
        }
        onClose();
      } else {
        throw new Error('Failed to create components');
      }
    } catch (err) {
      console.error('Bulk create error:', err);
      setError(err?.data?.message || 'Failed to create components. Please try again.');
      setAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Reset and close
  const handleClose = () => {
    setSelectedFile(null);
    setAnalyzedComponents(null);
    setIsEnriched(false);
    setError('');
    setAnalyzing(false);
    setAnalysisStep('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content bulk-upload-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          <Icon name="x" size={24} />
        </button>
        <h2 className="modal-title">Bulk Upload Components</h2>

        {/* File Selection */}
        {!analyzedComponents && (
          <div className="upload-section">
            <div className="file-input-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={analyzing || uploading}
                className="file-input"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="file-input-label">
                <Icon name="upload" size={24} />
                <span>{selectedFile ? selectedFile.name : 'Choose CSV File'}</span>
              </label>
            </div>

            {selectedFile && (
              <div className="file-info">
                <p>File: {selectedFile.name}</p>
                <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="modal-buttons">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={handleClose}
                disabled={analyzing || uploading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-confirm" 
                onClick={handleAnalyze}
                disabled={!selectedFile || analyzing || uploading}
              >
                {uploading ? (
                  <>
                    <Icon name="loader-2" size={18} className="spinning" style={{ marginRight: '8px' }} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Icon name="search" size={18} style={{ marginRight: '8px' }} />
                    Analyze CSV
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {analyzing && analysisStep && (
          <div className="analyzing-section">
            <Icon name="loader-2" size={48} className="spinning analyzing-icon" />
            <p className="analyzing-text">{analysisStep}</p>
          </div>
        )}

        {/* Preview Section */}
        {analyzedComponents && !analyzing && (
          <div className="preview-section">
            <h3 className="preview-title">
              Preview ({isEnriched ? 'Enriched' : 'Extracted'} data) - {analyzedComponents.length} component{analyzedComponents.length !== 1 ? 's' : ''}
            </h3>
            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {analyzedComponents.slice(0, 10).map((comp, index) => (
                    <tr key={index}>
                      <td>{comp.name}</td>
                      <td>{comp.category}</td>
                      <td>{comp.totalQuantity}</td>
                      <td>
                        {Array.isArray(comp.tags) && comp.tags.length > 0 
                          ? comp.tags.join(', ') 
                          : 'No tags'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analyzedComponents.length > 10 && (
                <p className="preview-more">
                  ... and {analyzedComponents.length - 10} more component{analyzedComponents.length - 10 !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-buttons">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => {
                  setAnalyzedComponents(null);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={creating}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleEnrich}
                disabled={creating || enriching || isEnriched}
              >
                {enriching ? (
                  <>
                    <Icon name="loader-2" size={18} className="spinning" style={{ marginRight: '8px' }} />
                    Enriching...
                  </>
                ) : (
                  <>
                    <Icon name="sparkles" size={18} style={{ marginRight: '8px' }} />
                    {isEnriched ? 'Enriched' : 'Enrich with AI'}
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn-confirm" 
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Icon name="loader-2" size={18} className="spinning" style={{ marginRight: '8px' }} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Icon name="check-circle" size={18} style={{ marginRight: '8px' }} />
                    Create {analyzedComponents.length} Component{analyzedComponents.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadModal;

