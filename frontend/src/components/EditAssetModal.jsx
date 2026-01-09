/**
 * EDIT ASSET MODAL COMPONENT
 * 
 * This component displays a modal dialog for editing existing assets.
 * 
 * Features:
 * - Form with name, serial number, and status fields (pre-filled with current data)
 * - Controlled form inputs (React state)
 * - API call to update asset
 * - Loading state during submission
 * - Closes and refreshes parent on success
 * 
 * Modal Pattern:
 * - Overlay (backdrop) that closes modal when clicked
 * - Modal content in center
 * - Close button (X) in header
 */

import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * EDIT ASSET MODAL COMPONENT
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onRefresh - Callback to refresh assets list
 * @param {Object} props.asset - The asset object to edit (contains id, name, serialNumber, status)
 * 
 * Props are passed from parent component (Dashboard).
 */
const EditAssetModal = ({ isOpen, onClose, onRefresh, asset }) => {
  /**
   * FORM STATE MANAGEMENT
   * 
   * Single state object containing all form fields.
   * Initial values are set from the asset prop when modal opens.
   * 
   * useEffect hook updates formData when asset prop changes.
   * This ensures form is pre-filled with current asset data.
   */
  const [formData, setFormData] = useState({ 
    name: '', 
    status: 'active', 
    serialNumber: '' 
  });

  /**
   * SUBMISSION LOADING STATE
   * 
   * Tracks whether form is currently being submitted.
   * Used to:
   * - Disable submit button during submission
   * - Show "Updating..." text instead of "Update Asset"
   * - Prevent double submissions
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * EFFECT HOOK - PRE-FILL FORM WHEN ASSET CHANGES
   * 
   * useEffect runs when component mounts or when dependencies change.
   * 
   * When asset prop is provided (modal opens with asset data):
   * - Update formData with asset's current values
   * - This pre-fills the form so user can see/edit current data
   * 
   * Dependencies: [asset, isOpen]
   * - Runs when asset object changes
   * - Runs when isOpen changes (modal opens/closes)
   */
  useEffect(() => {
    if (asset && isOpen) {
      setFormData({
        name: asset.name || '',
        status: asset.status || 'active',
        serialNumber: asset.serialNumber || ''
      });
    }
  }, [asset, isOpen]);

  /**
   * FORM SUBMISSION HANDLER
   * 
   * Handles form submission when user clicks "Update Asset".
   * 
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    /**
     * PREVENT DEFAULT FORM BEHAVIOR
     * 
     * Stops browser from reloading page on form submit.
     * We handle submission with JavaScript instead.
     */
    e.preventDefault();

    /**
     * VALIDATION
     * 
     * Ensure required fields are filled before submitting.
     */
    if (!formData.name || !formData.serialNumber) {
      alert("Name and serial number are required");
      return;
    }

    /**
     * SET LOADING STATE
     * 
     * Indicates form is being submitted.
     * This disables the submit button and shows loading text.
     */
    setIsSubmitting(true);

    try {
      /**
       * UPDATE ASSET API CALL
       * 
       * PATCH request to /api/assets/:id with updated form data.
       * Backend validates and updates the asset.
       * 
       * await waits for the request to complete.
       * 
       * Template literal: `/assets/${asset.id}`
       * Inserts asset.id into the URL path.
       * Example: asset.id = "123" -> PATCH /api/assets/123
       */
      await api.patch(`/assets/${asset.id}`, formData);

      /**
       * SUCCESS ACTIONS
       * 
       * After successful update:
       * 1. onRefresh() - Tell parent to refresh assets list
       * 2. onClose() - Close the modal
       */
      onRefresh();
      onClose();
    } catch (err) {
      /**
       * ERROR HANDLING
       * 
       * If API call fails, show error message.
       * Form stays open so user can try again.
       * 
       * err.response?.data?.error gets error message from backend.
       * || "..." provides fallback message if backend error doesn't exist.
       */
      console.error("Update error:", err);
      const errorMessage = err.response?.data?.error || "Failed to update asset.";
      alert(errorMessage);
    } finally {
      /**
       * FINALLY BLOCK
       * 
       * Always runs, whether success or error.
       * Resets loading state so button is enabled again.
       * 
       * This is important - without it, button stays disabled on error!
       */
      setIsSubmitting(false);
    }
  };

  /**
   * CONDITIONAL RENDERING - EARLY RETURN
   * 
   * If modal is not open, don't render anything.
   * This is more efficient than rendering and hiding with CSS.
   * 
   * Early return pattern: if (!condition) return null;
   */
  if (!isOpen || !asset) return null;

  /**
   * MODAL JSX RENDER
   * 
   * Returns the modal UI with form pre-filled with asset data.
   */
  return (
    /**
     * MODAL CONTAINER
     * 
     * fixed inset-0 = covers entire screen (fixed position, full viewport)
     * z-50 = high z-index (appears above other content)
     * flex items-center justify-center = centers content vertically and horizontally
     */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* MODAL BACKDROP/OVERLAY */}
      {/* 
        Semi-transparent dark overlay behind modal.
        Clicking it closes the modal (onClick={onClose}).
        
        bg-gray-900/60 = dark gray with 60% opacity
        backdrop-blur-sm = slight blur effect (modern look)
      */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* MODAL CONTENT */}
      {/* 
        relative = positioning context for absolute children
        bg-white = white background
        max-w-md = maximum width (medium size)
        rounded-2xl = rounded corners
        shadow-2xl = large shadow (makes it "pop" above backdrop)
      */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Edit Asset</h2>
          {/* Close Button (X) */}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl cursor-pointer">
            &times;
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Asset Name Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Asset Name</label>
            {/* 
              Controlled input:
              - value={formData.name} - shows current state value (pre-filled from asset)
              - onChange updates state with new value
              - required - HTML5 validation (browser shows error if empty)
              
              Spread operator (...formData):
              - Keeps existing formData properties
              - Only updates the 'name' property
            */}
            <input 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          {/* Serial Number Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Serial Number</label>
            <input 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.serialNumber}
              onChange={e => setFormData({...formData, serialNumber: e.target.value})}
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
            {/* 
              Select dropdown:
              - value={formData.status} - controlled component (pre-filled from asset)
              - onChange updates status in state
              - Options: active, maintenance, retired
            */}
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          {/* Form Buttons */}
          <div className="flex gap-3 pt-4">
            {/* Cancel Button */}
            {/* 
              type="button" - prevents form submission
              onClick={onClose} - closes modal without saving
            */}
            <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              Cancel
            </button>
            
            {/* Submit Button */}
            {/* 
              type="submit" - submits the form (triggers handleSubmit)
              disabled={isSubmitting} - disables during submission
              - Prevents double submissions
              - Visual feedback (opacity-50 when disabled)
              
              Conditional text:
              - Shows "Updating..." while submitting
              - Shows "Update Asset" normally
            */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssetModal;
