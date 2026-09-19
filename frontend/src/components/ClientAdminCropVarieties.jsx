import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  fetchCropVarieties, 
  fetchClientCropById,
  softDeleteCropVariety,
  updateCropVariety 
} from '../utils/api';

export default function ClientAdminCropVarieties() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cropId = searchParams.get('cropId');
  
  const [crop, setCrop] = useState(null);
  const [varieties, setVarieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!cropId) {
      setError('Crop ID is required');
      return;
    }
    
    loadData();
  }, [cropId, token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch crop details
      const cropRes = await fetchClientCropById(token, cropId);
      if (!cropRes.ok) throw new Error(cropRes.error || 'Failed to load crop');
      setCrop(cropRes.data);

      // Fetch varieties
      const varietiesRes = await fetchCropVarieties(token, cropId, { 
        limit: 50,
        status: filterStatus === 'all' ? undefined : filterStatus 
      });
      if (!varietiesRes.ok) throw new Error(varietiesRes.error || 'Failed to load varieties');
      setVarieties(varietiesRes.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (varietyId) => {
    try {
      setActionLoading(varietyId);
      const result = await softDeleteCropVariety(token, varietyId);
      if (!result.ok) throw new Error(result.error || 'Failed to delete variety');
      
      setVarieties(prev => prev.filter(v => v._id !== varietyId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditClick = (variety) => {
    navigate(`/client-admin/crop-varieties/${variety._id}?cropId=${cropId}`);
  };

  const filteredVarieties = varieties.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       v.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {crop?.name} - Crop Varieties
              </h1>
              <p className="text-gray-600 mt-2">
                Manage varieties for {crop?.name}
              </p>
            </div>
            <button
              onClick={() => navigate(`/client-admin/crop-varieties/new?cropId=${cropId}`)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Add Variety
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex-1 min-w-xs">
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                loadData();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Varieties List */}
        <div className="grid gap-4">
          {filteredVarieties.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600">No varieties found</p>
            </div>
          ) : (
            filteredVarieties.map(variety => (
              <div key={variety._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{variety.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        variety.status === 'approved' ? 'bg-green-100 text-green-800' :
                        variety.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {variety.status?.charAt(0).toUpperCase() + variety.status?.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">Code: <span className="font-mono">{variety.code}</span></p>
                    
                    {variety.description && (
                      <p className="text-gray-600 text-sm mb-3">{variety.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Maturity Days:</span>
                        <p className="font-semibold text-gray-800">{variety.maturityDays}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Yield/Hectare:</span>
                        <p className="font-semibold text-gray-800">{variety.yieldPerHectare} tonnes</p>
                      </div>
                    </div>

                    {variety.resistances && variety.resistances.length > 0 && (
                      <div className="mt-3">
                        <span className="text-gray-500 text-sm">Resistances:</span>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {variety.resistances.map((resistance, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {resistance}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(variety)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(variety._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                      disabled={actionLoading === variety._id}
                    >
                      {actionLoading === variety._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === variety._id && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
                    <p className="text-red-800">Are you sure you want to delete this variety?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(variety._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/client-admin/crops')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back to Crops
          </button>
        </div>
      </div>
    </div>
  );
}
