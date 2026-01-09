/**
 * DASHBOARD COMPONENT
 * 
 * This is the main component shown after user logs in.
 * It displays:
 * - Statistics cards (total assets, active, maintenance)
 * - Table of all assets
 * - Add asset button
 * - Edit and Delete functionality for each asset
 * 
 * This component demonstrates:
 * - Fetching data from API
 * - Managing component state
 * - Conditional rendering
 * - Event handling
 * - React Hooks (useState, useEffect)
 * - CRUD operations (Create, Read, Update, Delete)
 */

// Import React Hooks
// useEffect - runs code after component renders (like componentDidMount)
// useState - manages component state
import { useEffect, useState } from 'react';

// Import configured API client
import api from '../api/axios';

// Import child components (modals for adding and editing assets)
import AddAssetModal from './AddAssetModal';
import EditAssetModal from './EditAssetModal';

/**
 * DASHBOARD COMPONENT FUNCTION
 * 
 * This is a functional component that uses React Hooks.
 * No class component needed - modern React style!
 */
const Dashboard = () => {
  /**
   * COMPONENT STATE MANAGEMENT
   * 
   * useState() creates state variables that trigger re-renders when changed.
   * 
   * State variables:
   * 1. assets - array of asset objects from API
   * 2. loading - boolean, true while fetching data
   * 3. isModalOpen - boolean, controls AddAssetModal visibility
   * 
   * State updates cause React to re-render the component automatically!
   */
  const [assets, setAssets] = useState([]); // Start with empty array
  const [loading, setLoading] = useState(true); // Start with loading = true
  const [isModalOpen, setIsModalOpen] = useState(false); // Add modal starts closed
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Edit modal starts closed
  const [selectedAsset, setSelectedAsset] = useState(null); // Asset to edit (null when not editing)

  /**
   * FETCH ASSETS FROM API
   * 
   * This function makes an API call to get all assets.
   * It's async because API calls are asynchronous (take time).
   * 
   * Flow:
   * 1. Make GET request to /api/assets
   * 2. Backend returns assets for user's organization
   * 3. Update assets state with the data
   * 4. Set loading to false (data loaded)
   * 
   * This function is called:
   * - On component mount (useEffect)
   * - After adding new asset (onRefresh callback)
   * - After deleting asset (handleDelete)
   */
  const fetchAssets = async () => {
    try {
      /**
       * API GET REQUEST
       * 
       * api.get('/assets') sends GET request to http://localhost:5000/api/assets
       * Axios interceptor automatically adds Authorization header with token.
       * 
       * await waits for the promise to resolve (get the response).
       * 
       * Destructuring: const { data } = response
       * Extracts the data property (the actual assets array).
       */
      const { data } = await api.get('/assets');

      /**
       * UPDATE STATE
       * 
       * setAssets(data) updates the assets state variable.
       * This triggers React to re-render the component with new data.
       * 
       * setLoading(false) indicates data has loaded.
       * This hides the loading message.
       */
      setAssets(data);
      setLoading(false);
    } catch (err) {
      /**
       * ERROR HANDLING
       * 
       * If API call fails (network error, 401, 500, etc.):
       * - Log error to console for debugging
       * - Set loading to false (so UI doesn't stay in loading state)
       * - User sees empty table (assets array is still empty)
       */
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  /**
   * EDIT ASSET HANDLER
   * 
   * This function handles opening the edit modal when user clicks Edit button.
   * 
   * @param {Object} asset - The asset object to edit
   * 
   * Flow:
   * 1. Set the selected asset (the one to edit)
   * 2. Open the edit modal
   */
  const handleEdit = (asset) => {
    setSelectedAsset(asset); // Store the asset to edit
    setIsEditModalOpen(true); // Open the edit modal
  };

  /**
   * DELETE ASSET HANDLER
   * 
   * This function handles deleting an asset when user clicks Delete button.
   * 
   * @param {string} id - The ID of the asset to delete
   * 
   * Flow:
   * 1. Show confirmation dialog
   * 2. If confirmed, send DELETE request to API
   * 3. Refresh assets list to show updated data
   */
  const handleDelete = async (id) => {
    /**
     * CONFIRMATION DIALOG
     * 
     * window.confirm() shows browser's native confirmation dialog.
     * Returns true if user clicks OK, false if Cancel.
     * 
     * If user cancels, return early (don't delete).
     * This prevents accidental deletions.
     */
    if (!window.confirm("Are you sure you want to delete this asset?")) return;

    try {
      /**
       * DELETE API REQUEST
       * 
       * api.delete(`/assets/${id}`) sends DELETE request.
       * Template literal (backticks) inserts id into URL.
       * Example: id = "123" -> DELETE /api/assets/123
       */
      await api.delete(`/assets/${id}`);

      /**
       * REFRESH ASSETS LIST
       * 
       * After successful deletion, fetch assets again.
       * This updates the UI to show the asset is gone.
       * 
       * We could also update state directly (remove from array),
       * but fetching ensures we have the latest data from server.
       */
      await fetchAssets();
    } catch (err) {
      /**
       * ERROR HANDLING
       * 
       * If deletion fails, show error message to user.
       * err.response?.data?.error gets error message from backend.
       */
      console.error("Delete failed:", err);
      alert(err.response?.data?.error || "Failed to delete asset");
    }
  };

  /**
   * USE EFFECT HOOK - COMPONENT LIFECYCLE
   * 
   * useEffect() runs code after component renders.
   * 
   * Syntax: useEffect(() => { code }, [dependencies])
   * 
   * Empty dependency array [] means:
   * - Run only once, after first render
   * - Like componentDidMount in class components
   * 
   * IIFE (Immediately Invoked Function Expression):
   * (async () => { await fetchAssets(); })()
   * - Wraps async function so we can use await
   * - Executes immediately
   * 
   * This fetches assets when component first loads.
   */
  useEffect(() => {
    (async () => {
      await fetchAssets();
    })();
  }, []); // Empty array = run once on mount

  /**
   * LOADING STATE - EARLY RETURN
   * 
   * If still loading, show loading message and return early.
   * This prevents trying to render data that doesn't exist yet.
   * 
   * Early return pattern: if (condition) return <Component />;
   * This is cleaner than nested if/else statements.
   */
  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Loading assets...</div>;

  /**
   * CALCULATE STATISTICS
   * 
   * Compute statistics from assets array:
   * - Total: length of array
   * - Active: filter assets with status 'active', get length
   * - Maintenance: filter assets with status 'maintenance', get length
   * 
   * Array.filter() creates new array with items matching condition.
   * .length gets the count.
   * 
   * This runs on every render, but it's fast (just counting).
   * For large datasets, you might want to memoize this with useMemo().
   */
  const stats = [
    { name: 'Total Assets', value: assets.length },
    { name: 'Active', value: assets.filter(a => a.status === 'active').length },
    { name: 'Maintenance', value: assets.filter(a => a.status === 'maintenance').length },
  ];

  /**
   * JSX RENDER
   * 
   * Returns the dashboard UI with statistics and asset table.
   */
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* HEADER SECTION */}
      <div className="sm:flex sm:items-center">
        {/* Title and Organization Badge */}
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          {/* Organization Name Badge */}
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Org: {localStorage.getItem('orgName') || 'N/A'}
            </span>
          </div>
        </div>
        
        {/* Add Asset Button */}
        {/* 
          onClick={() => setIsModalOpen(true)}
          - Arrow function that updates state
          - When clicked, sets isModalOpen to true
          - This opens the AddAssetModal component
        */}
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
          >
            + Add asset
          </button>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      {/* 
        Grid layout: 1 column on mobile, 3 columns on larger screens (sm:grid-cols-3)
        Responsive design using Tailwind's breakpoint prefixes
      */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/**
         * MAP OVER STATS ARRAY
         * 
         * .map() creates a new array by transforming each item.
         * For each stat item, we create a card div.
         * 
         * key={item.name} - React requires unique keys for list items.
         * This helps React efficiently update the DOM when list changes.
         */}
        {stats.map((item) => (
          <div key={item.name} className="bg-white px-4 py-5 shadow-sm ring-1 ring-gray-200 rounded-lg">
            {/* Stat Label */}
            <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
            {/* Stat Value */}
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{item.value}</dd>
          </div>
        ))}
      </div>

      {/* ASSETS TABLE */}
      <div className="mt-8 bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Table Header */}
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Name</th>
              <th className="px-6 py-4 text-left font-semibold">Status</th>
              <th className="px-6 py-4 text-left font-semibold">Serial Number</th>
              <th className="px-6 py-4 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 bg-white">
            {/**
             * CONDITIONAL RENDERING - EMPTY STATE
             * 
             * If assets array is empty, show "No assets found" message.
             * Otherwise, map over assets and create table rows.
             * 
             * Ternary operator: condition ? valueIfTrue : valueIfFalse
             */}
            {assets.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-gray-400 italic">
                  No assets found for this tenant.
                </td>
              </tr>
            ) : (
              /**
               * MAP OVER ASSETS ARRAY
               * 
               * For each asset, create a table row.
               * key={asset.id} - unique identifier for React
               */
              assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50 transition">
                  {/* Asset Name */}
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{asset.name}</td>
                  
                  {/* Status Badge */}
                  {/* 
                    Conditional className using template literal and ternary operator.
                    If status is 'active', use green colors, otherwise red.
                    
                    Template literal: `string ${expression} string`
                    Ternary: condition ? valueIfTrue : valueIfFalse
                  */}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      asset.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  
                  {/* Serial Number */}
                  {/* font-mono = monospace font (good for codes/IDs) */}
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{asset.serialNumber}</td>
                  
                  {/* Actions Column - Edit and Delete Buttons */}
                  {/* 
                    This column contains action buttons for each asset row.
                    We use flexbox to display buttons side by side with spacing.
                  */}
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex gap-2">
                      {/* Edit Button */}
                      {/* 
                        onClick={() => handleEdit(asset)}
                        - Arrow function passes the entire asset object to handleEdit
                        - This opens the edit modal with the asset's current data pre-filled
                      */}
                      <button
                        onClick={() => handleEdit(asset)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition duration-200"
                      >
                        Edit
                      </button>
                      
                      {/* Delete Button */}
                      {/* 
                        onClick={() => handleDelete(asset.id)}
                        - Arrow function passes asset.id to handleDelete
                        - Wrapped in arrow function so it doesn't execute immediately
                        - Only runs when button is clicked
                      */}
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD ASSET MODAL */}
      {/* 
        This is a child component that shows a modal dialog for adding assets.
        
        Props passed to AddAssetModal:
        - isOpen: Controls whether modal is visible (true/false)
        - onClose: Callback function to close the modal
        - onRefresh: Callback function to refresh assets list after adding
        
        Component communication pattern:
        - Parent (Dashboard) controls modal visibility with state
        - Child (AddAssetModal) notifies parent when to close/refresh
        - This is the "lift state up" pattern in React
      */}
      <AddAssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchAssets} 
      />

      {/* EDIT ASSET MODAL */}
      {/* 
        This is a child component that shows a modal dialog for editing assets.
        
        Props passed to EditAssetModal:
        - isOpen: Controls whether modal is visible (true/false)
        - onClose: Callback function to close the modal (also clears selectedAsset)
        - onRefresh: Callback function to refresh assets list after updating
        - asset: The asset object to edit (contains current data to pre-fill form)
        
        Component communication pattern:
        - Parent (Dashboard) controls modal visibility and selected asset with state
        - Child (EditAssetModal) notifies parent when to close/refresh
        - When modal closes, we clear selectedAsset to reset state
      */}
      <EditAssetModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAsset(null); // Clear selected asset when closing
        }} 
        onRefresh={fetchAssets}
        asset={selectedAsset}
      />
    </div>
  );
};

export default Dashboard;