import React, { useState, useRef } from 'react';
import './BulkUploadModal.css';
import Icon from '../Icon';
import {
  useUploadProcurementCSVMutation,
  useEnrichProcurementRequestsMutation,
  useBulkCreateProcurementRequestsMutation,
} from '../../store/api/adminApi';

const BulkProcurementUploadModal = ({ onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stepText, setStepText] = useState('');
  const [requests, setRequests] = useState(null);
  const [isEnriched, setIsEnriched] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const [uploadCSV, { isLoading: uploading }] = useUploadProcurementCSVMutation();
  const [enrichRequests, { isLoading: enriching }] = useEnrichProcurementRequestsMutation();
  const [bulkCreate, { isLoading: creating }] = useBulkCreateProcurementRequestsMutation();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        setError('Please select a CSV file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setError('');
      setRequests(null);
      setIsEnriched(false);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file first');
      return;
    }

    setError('');
    setProcessing(true);
    setStepText('Reading procurement CSV file...');

    try {
      setStepText('Extracting procurement requests from CSV...');
      const result = await uploadCSV(selectedFile).unwrap();

      if (result.success && result.requests) {
        setRequests(result.requests);
        setIsEnriched(false);
        setStepText('');
        setProcessing(false);
      } else {
        throw new Error('Failed to extract procurement requests from CSV');
      }
    } catch (err) {
      console.error('Procurement CSV extract error:', err);
      setError(
        err?.data?.message ||
          'Failed to extract procurement requests. Please check the CSV format.'
      );
      setProcessing(false);
      setStepText('');
    }
  };

  const handleEnrich = async () => {
    if (!requests || requests.length === 0) {
      setError('No procurement requests to enrich');
      return;
    }

    setError('');
    setProcessing(true);
    setStepText('Enriching procurement requests with AI...');

    try {
      const result = await enrichRequests(requests).unwrap();

      if (result.success && result.requests) {
        setRequests(result.requests);
        setIsEnriched(true);
        setStepText('');
        setProcessing(false);
      } else {
        throw new Error('Failed to enrich procurement requests');
      }
    } catch (err) {
      console.error('Enrich procurement error:', err);
      setError(err?.data?.message || 'Failed to enrich requests. Please try again.');
      setProcessing(false);
      setStepText('');
    }
  };

  const handleCreate = async () => {
    if (!requests || requests.length === 0) {
      setError('No procurement requests to create');
      return;
    }

    setError('');
    setProcessing(true);
    setStepText('Creating procurement requests...');

    try {
      const result = await bulkCreate(requests).unwrap();

      if (result.success) {
        alert(
          `Successfully created ${result.created} request(s)${
            result.failed > 0 ? `. ${result.failed} failed.` : ''
          }`
        );

        if (onSuccess) {
          onSuccess(result);
        }
        handleClose();
      } else {
        throw new Error('Failed to create procurement requests');
      }
    } catch (err) {
      console.error('Bulk procurement create error:', err);
      setError(err?.data?.message || 'Failed to create procurement requests. Please try again.');
      setProcessing(false);
      setStepText('');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setRequests(null);
    setIsEnriched(false);
    setError('');
    setProcessing(false);
    setStepText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content bulk-upload-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={handleClose}>
          <Icon name="x" size={24} />
        </button>
        <h2 className="modal-title">Bulk Upload Procurement Requests</h2>

        {/* File Selection */}
        {!requests && (
          <div className="upload-section">
            <div className="file-input-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={processing || uploading}
                className="file-input"
                id="procurement-csv-file-input"
              />
              <label
                htmlFor="procurement-csv-file-input"
                className="file-input-label"
              >
                <Icon name="upload" size={24} />
                <span>{selectedFile ? selectedFile.name : 'Choose Procurement CSV File'}</span>
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
                disabled={processing || uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm"
                onClick={handleExtract}
                disabled={!selectedFile || processing || uploading}
              >
                {uploading || processing ? (
                  <>
                    <Icon
                      name="loader-2"
                      size={18}
                      className="spinning"
                      style={{ marginRight: '8px' }}
                    />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Icon name="search" size={18} style={{ marginRight: '8px' }} />
                    Extract from CSV
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Processing state */}
        {processing && stepText && (
          <div className="analyzing-section">
            <Icon name="loader-2" size={48} className="spinning analyzing-icon" />
            <p className="analyzing-text">{stepText}</p>
          </div>
        )}

        {/* Preview Section */}
        {requests && !processing && (
          <div className="preview-section">
            <h3 className="preview-title">
              Preview ({isEnriched ? 'Enriched' : 'Extracted'} requests) -{' '}
              {requests.length} request{requests.length !== 1 ? 's' : ''}
            </h3>
            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>Priority</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 10).map((req, index) => (
                    <tr key={index}>
                      <td>{req.itemName}</td>
                      <td>{req.quantity}</td>
                      <td>{req.priority}</td>
                      <td>{req.category || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length > 10 && (
                <p className="preview-more">
                  ... and {requests.length - 10} more request
                  {requests.length - 10 !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-buttons">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setRequests(null);
                  setSelectedFile(null);
                  setIsEnriched(false);
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
                    <Icon
                      name="loader-2"
                      size={18}
                      className="spinning"
                      style={{ marginRight: '8px' }}
                    />
                    Enriching...
                  </>
                ) : (
                  <>
                    <Icon
                      name="sparkles"
                      size={18}
                      style={{ marginRight: '8px' }}
                    />
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
                    <Icon
                      name="loader-2"
                      size={18}
                      className="spinning"
                      style={{ marginRight: '8px' }}
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Icon
                      name="check-circle"
                      size={18}
                      style={{ marginRight: '8px' }}
                    />
                    Create {requests.length} Request
                    {requests.length !== 1 ? 's' : ''}
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

export default BulkProcurementUploadModal;


