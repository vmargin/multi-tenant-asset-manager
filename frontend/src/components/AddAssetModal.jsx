/**
 * ADD ASSET MODAL COMPONENT
 * 
 * This component displays a modal dialog for adding new assets.
 * 
 * Features:
 * - Form with name, serial number, and status fields
 * - Controlled form inputs (React state)
 * - API call to create asset
 * - Loading state during submission
 * - Closes and refreshes parent on success
 * 
 * Modal Pattern:
 * - Overlay (backdrop) that closes modal when clicked
 * - Modal content in center
 * - Close button (X) in header
 */

import { useState } from 'react';
import api from '../api/axios';

/**
 * ADD ASSET MODAL COMPONENT
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onRefresh - Callback to refresh assets list
 * 
 * Props are passed from parent component (Dashboard).
 */
const AddAssetModal = ({ isOpen, onClose, onRefresh }) => {
  /**
   * FORM STATE MANAGEMENT
   * 
   * Single state object containing all form fields.
   * This is cleaner than separate state for each field.
   * 
   * Initial values:
   * - name: empty string
   * - status: 'active' (default value)
   * - serialNumber: empty string
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
   * - Show "Saving..." text instead of "Save Asset"
   * - Prevent double submissions
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * FORM SUBMISSION HANDLER
   * 
   * Handles form submission when user clicks "Save Asset".
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
     * SET LOADING STATE
     * 
     * Indicates form is being submitted.
     * This disables the submit button and shows loading text.
     */
    setIsSubmitting(true);

    try {
      /**
       * CREATE ASSET API CALL
       * 
       * POST request to /api/assets with form data.
       * Backend validates and creates the asset.
       * 
       * await waits for the request to complete.
       */
      await api.post('/assets', formData);

      /**
       * SUCCESS ACTIONS
       * 
       * After successful creation:
       * 1. onRefresh() - Tell parent to refresh assets list
       * 2. onClose() - Close the modal
       * 3. Reset form - Clear all fields for next use
       */
      onRefresh();
      onClose();
      setFormData({ name: '', status: 'active', serialNumber: '' });
    } catch (err) {
      /**
       * ERROR HANDLING
       * 
       * If API call fails, show error message.
       * Form stays open so user can try again.
       */
      console.error("Submission error:", err);
      alert("Failed to add asset.");
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
  if (!isOpen) return null;

  /**
   * MODAL JSX RENDER
   * 
   * Returns the modal UI with form.
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
          <h2 className="text-xl font-bold text-gray-800">New Asset</h2>
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
              - value={formData.name} - shows current state value
              - onChange updates state with new value
              - required - HTML5 validation (browser shows error if empty)
              
              Spread operator (...formData):
              - Keeps existing formData properties
              - Only updates the 'name' property
              - Example: {name: 'New', status: 'active', serialNumber: '123'}
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
              - value={formData.status} - controlled component
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
              - Shows "Saving..." while submitting
              - Shows "Save Asset" normally
            */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssetModal;