import React, { useState, useMemo } from 'react';
import './Inventory.css';
import Icon from '../Icon';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';
import BulkUploadModal from './BulkUploadModal';
import { 
  useGetComponentsQuery, 
  useDeleteComponentMutation 
} from '../../store/api/adminApi';

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);

  // RTK Query hook - automatically caches and manages loading/error states
  const { 
    data: componentsData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useGetComponentsQuery();

  // Delete mutation hook
  const [deleteComponent, { isLoading: isDeleting }] = useDeleteComponentMutation();

  // Transform API data to component format
  const components = useMemo(() => {
    if (!componentsData) return [];
    
    const componentsArray = Array.isArray(componentsData) ? componentsData : [];
    return componentsArray.map(comp => ({
      _id: comp._id || comp.componentId,
      componentId: comp.componentId,
      name: comp.name || '',
      description: comp.description || '',
      category: comp.category || '',
      tags: Array.isArray(comp.tags) ? comp.tags : [],
      stock: comp.availableQuantity || 0,
      totalStock: comp.totalQuantity || 0
    }));
  }, [componentsData]);

  // Filter components based on search query
  const filteredComponents = useMemo(() => {
    if (!Array.isArray(components)) return [];
    
    return components.filter(comp =>
      comp && comp.name && (
        comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(comp.tags) && comp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    );
  }, [components, searchQuery]);

  const handleDelete = async (component) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${component.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      // Use RTK Query mutation - cache is automatically invalidated
      await deleteComponent(component.componentId).unwrap();
      
      // Success - cache is already invalidated, so the list will refetch automatically
      alert(`Component "${component.name}" has been deleted successfully.`);
    } catch (error) {
      console.error('Delete component error:', error);
      alert(error?.data?.message || 'Failed to delete component. Please try again.');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="inventory">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Icon name="loader-2" size={32} className="spinning" />
          <p style={{ marginTop: '20px', color: '#666' }}>Loading components...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="inventory">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#e74c3c', marginBottom: '20px' }}>
            Error loading components: {error?.data?.message || 'Unknown error'}
          </p>
          <button className="btn-primary" onClick={() => refetch()}>
            <Icon name="refresh-cw" size={18} style={{ marginRight: '8px' }} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory">
      <div className="inventory-header">
        <div>
          <h1 className="inventory-title">Inventory Management</h1>
          <p className="inventory-subtitle">Manage and track all IoT components</p>
        </div>
      </div>

      <div className="inventory-toolbar">
        <div className="search-bar">
          <Icon name="search" size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="toolbar-actions">
          <button className="btn-secondary" onClick={() => setShowBulkUploadModal(true)}>
            <Icon name="upload" size={18} style={{ marginRight: '8px' }} />
            Bulk Upload CSV
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Icon name="plus" size={18} style={{ marginRight: '8px' }} />
            Add Item
          </button>
        </div>
      </div>

      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComponents.length > 0 ? (
              filteredComponents.map(component => (
                <tr key={component._id || component.componentId}>
                  <td>
                    <div className="item-name">{component.name || 'N/A'}</div>
                    <div className="item-description">{component.description || ''}</div>
                  </td>
                  <td>
                    <span className="category-tag">{component.category || 'N/A'}</span>
                  </td>
                  <td>
                    <span className={`stock-value ${(component.stock || 0) < 10 ? 'low' : ''}`}>
                      {component.stock || 0}/{component.totalStock || 0}
                    </span>
                  </td>
                  <td>
                    <div className="tags-list">
                      {Array.isArray(component.tags) && component.tags.length > 0 ? (
                        component.tags.map((tag, idx) => (
                          <span key={idx} className="tag">{tag}</span>
                        ))
                      ) : (
                        <span className="tag">No tags</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn edit" 
                        onClick={() => setEditingComponent(component)}
                        title="Edit component"
                      >
                        <Icon name="pencil" size={16} />
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(component)}
                        disabled={isDeleting}
                        title="Delete component"
                      >
                        <Icon name="trash-2" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  {searchQuery ? 'No components found matching your search' : 'No components found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(data) => {
            // Cache is automatically invalidated by the mutation, no need to refetch
            setShowAddModal(false);
          }}
        />
      )}

      {editingComponent && (
        <EditItemModal
          component={editingComponent}
          onClose={() => setEditingComponent(null)}
          onSuccess={(data) => {
            // Cache is automatically invalidated by the mutation, no need to refetch
            setEditingComponent(null);
          }}
        />
      )}

      {showBulkUploadModal && (
        <BulkUploadModal
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={(data) => {
            // Cache is automatically invalidated by the mutation, no need to refetch
            setShowBulkUploadModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Inventory;
