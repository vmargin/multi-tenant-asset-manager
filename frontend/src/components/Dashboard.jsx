import { useEffect, useState } from 'react';
import api from '../api/axios';
import AddAssetModal from './AddAssetModal'; // Ensure this exists

const Dashboard = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAssets = async () => {
    try {
      const { data } = await api.get('/assets');
      setAssets(data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchAssets();
    })();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Loading assets...</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <div className="flex gap-2 mt-1">
             <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono">Org: {localStorage.getItem('orgId')}</span>
          </div>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
          >
            + Add asset
          </button>
        </div>
      </div>

      <div className="mt-8 bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Name</th>
              <th className="px-6 py-4 text-left font-semibold">Status</th>
              <th className="px-6 py-4 text-left font-semibold">Serial Number</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {assets.length === 0 ? (
              <tr><td colSpan="3" className="py-12 text-center text-gray-400 italic">No assets found for this tenant.</td></tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{asset.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${asset.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{asset.serialNumber}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddAssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchAssets} 
      />
    </div>
  );
};

export default Dashboard;