import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateCropVarietyStatus, fetchCropVarieties } from '../utils/api';

export default function SuperAdminCropVarietyApproval() {
  const { token } = useContext(AuthContext);
  
  const [pendingVarieties, setPendingVarieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterCrop, setFilterCrop] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPendingVarieties();
  }, [token]);

  const loadPendingVarieties = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all pending varieties (would ideally use a dedicated endpoint)
      // For now, we'll fetch from all crops and filter
      const res = await fetch('http://localhost:3001/api/crop-varieties/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load pending varieties');
      
      setPendingVarieties(data || []);
    } catch (err) {
      console.error('Load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (varietyId) => {
    try {
      setActionLoading(varietyId);
      const res = await fetch(`http://localhost:3001/api/crop-varieties/${varietyId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve variety');

      setPendingVarieties(prev => prev.filter(v => v._id !== varietyId));
      setSuccessMessage('Variety approved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (varietyId) => {
    try {
      setActionLoading(varietyId);
      const res = await fetch(`http://localhost:3001/api/crop-varieties/${varietyId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject variety');

      setPendingVarieties(prev => prev.filter(v => v._id !== varietyId));
      setSuccessMessage('Variety rejected');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Crop Variety Approvals
          </h1>
          <p className="text-gray-600">
            Review and approve pending crop varieties submitted by Client Admins
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Pending Count Badge */}
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
            {pendingVarieties.length} Pending Approval
          </span>
        </div>

        {/* Varieties Grid */}
        <div className="grid gap-4">
          {pendingVarieties.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600 text-lg">No pending varieties to review</p>
            </div>
          ) : (
            pendingVarieties.map(variety => (
              <div key={variety._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="grid md:grid-cols-3 gap-6 mb-4">
                  {/* Main Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{variety.name}</h3>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        Pending
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">
                      <strong>Code:</strong> <span className="font-mono">{variety.code}</span>
                    </p>

                    {variety.description && (
                      <p className="text-gray-600 text-sm mb-3">
                        <strong>Description:</strong> {variety.description}
                      </p>
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

                  {/* Metadata */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Submitted By</p>
                      <p className="text-gray-800 font-semibold text-sm">{variety.createdByName || 'Unknown'}</p>
                      <p className="text-gray-600 text-xs">{variety.createdByEmail}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Crop</p>
                      <p className="text-gray-800 font-semibold text-sm">{variety.cropName || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Client</p>
                      <p className="text-gray-800 font-semibold text-sm">{variety.clientName || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(variety._id)}
                    disabled={actionLoading === variety._id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 font-semibold"
                  >
                    {actionLoading === variety._id ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(variety._id)}
                    disabled={actionLoading === variety._id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 font-semibold"
                  >
                    {actionLoading === variety._id ? 'Processing...' : '✗ Reject'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
