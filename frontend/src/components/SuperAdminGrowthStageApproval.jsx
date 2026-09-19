import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchPendingGrowthStages, updateGrowthStageStatus } from '../utils/api';

export default function SuperAdminGrowthStageApproval() {
  const { token } = useContext(AuthContext);
  
  const [pendingStages, setPendingStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPendingStages();
  }, [token]);

  const loadPendingStages = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchPendingGrowthStages(token, { limit: 100 });
      if (!res.ok) throw new Error(res.error || 'Failed to load pending stages');
      
      setPendingStages(res.data || []);
    } catch (err) {
      console.error('Load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (stageId) => {
    try {
      setActionLoading(stageId);
      const res = await updateGrowthStageStatus(token, stageId, 'approved');
      if (!res.ok) throw new Error(res.error || 'Failed to approve stage');

      setPendingStages(prev => prev.filter(s => s._id !== stageId));
      setSuccessMessage('Growth stage approved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (stageId) => {
    try {
      setActionLoading(stageId);
      const res = await updateGrowthStageStatus(token, stageId, 'rejected');
      if (!res.ok) throw new Error(res.error || 'Failed to reject stage');

      setPendingStages(prev => prev.filter(s => s._id !== stageId));
      setSuccessMessage('Growth stage rejected');
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
            Growth Stage Approvals
          </h1>
          <p className="text-gray-600">
            Review and approve pending growth stages submitted by Client Admins
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
            {pendingStages.length} Pending Approval
          </span>
        </div>

        {/* Stages Grid */}
        <div className="grid gap-4">
          {pendingStages.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600 text-lg">No pending growth stages to review</p>
            </div>
          ) : (
            pendingStages.map(stage => (
              <div key={stage._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="grid md:grid-cols-3 gap-6 mb-4">
                  {/* Main Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-700 font-bold text-lg">{stage.stageNumber}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">{stage.stageName}</h3>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        Pending
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">
                      <strong>Duration:</strong> {stage.durationDays} days
                    </p>

                    {stage.description && (
                      <p className="text-gray-700 text-sm mb-3">{stage.description}</p>
                    )}

                    {/* Fertilizer Info */}
                    {stage.fertilizerRecommendation && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Fertilizer Recommendation:</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>N: <span className="font-bold">{stage.fertilizerRecommendation.n || 0}</span> kg/ha</div>
                          <div>P: <span className="font-bold">{stage.fertilizerRecommendation.p || 0}</span> kg/ha</div>
                          <div>K: <span className="font-bold">{stage.fertilizerRecommendation.k || 0}</span> kg/ha</div>
                        </div>
                        {stage.fertilizerRecommendation.notes && (
                          <p className="text-sm text-blue-800 mt-2">{stage.fertilizerRecommendation.notes}</p>
                        )}
                      </div>
                    )}

                    {/* Irrigation Info */}
                    {stage.irrigationNotes && Object.values(stage.irrigationNotes).some(v => v) && (
                      <div className="p-3 bg-cyan-50 rounded-lg">
                        <p className="text-sm font-semibold text-cyan-900 mb-2">Irrigation Notes:</p>
                        <div className="text-sm space-y-1">
                          {stage.irrigationNotes.frequency && <p>Frequency: {stage.irrigationNotes.frequency}</p>}
                          {stage.irrigationNotes.duration && <p>Duration: {stage.irrigationNotes.duration}</p>}
                          {stage.irrigationNotes.method && <p>Method: {stage.irrigationNotes.method}</p>}
                          {stage.irrigationNotes.notes && <p className="text-cyan-800 mt-2">{stage.irrigationNotes.notes}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Submitted By</p>
                      <p className="text-gray-800 font-semibold text-sm">{stage.createdByName || 'Unknown'}</p>
                      <p className="text-gray-600 text-xs">{stage.createdByEmail}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Crop</p>
                      <p className="text-gray-800 font-semibold text-sm">{stage.cropId?.name || 'N/A'}</p>
                    </div>

                    {stage.cropVarietyId && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Variety</p>
                        <p className="text-gray-800 font-semibold text-sm">{stage.cropVarietyId?.name || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pest Management if present */}
                {stage.pestManagement && (stage.pestManagement.commonPests?.length > 0 || stage.pestManagement.controlMeasures) && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-semibold text-purple-900 mb-2">Pest Management:</p>
                    {stage.pestManagement.commonPests?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-purple-800 font-semibold">Common Pests:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {stage.pestManagement.commonPests.map((pest, idx) => (
                            <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              {pest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {stage.pestManagement.controlMeasures && (
                      <p className="text-sm text-purple-800">{stage.pestManagement.controlMeasures}</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(stage._id)}
                    disabled={actionLoading === stage._id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 font-semibold"
                  >
                    {actionLoading === stage._id ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(stage._id)}
                    disabled={actionLoading === stage._id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 font-semibold"
                  >
                    {actionLoading === stage._id ? 'Processing...' : '✗ Reject'}
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
