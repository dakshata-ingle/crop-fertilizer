import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  fetchGrowthStagesByCrop,
  fetchGrowthStagesByVariety,
  fetchClientCropById,
  softDeleteGrowthStage
} from '../utils/api';

export default function ClientAdminGrowthStages() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cropId = searchParams.get('cropId');
  const varietyId = searchParams.get('varietyId');
  
  const [crop, setCrop] = useState(null);
  const [variety, setVariety] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!cropId && !varietyId) {
      setError('Crop ID or Variety ID is required');
      return;
    }
    
    loadData();
  }, [cropId, varietyId, token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch crop/variety details
      if (varietyId) {
        // For variety, we'd need a fetchCropVarietyById function
        // For now, just fetch stages
      } else if (cropId) {
        const cropRes = await fetchClientCropById(token, cropId);
        if (!cropRes.ok) throw new Error(cropRes.error || 'Failed to load crop');
        setCrop(cropRes.data);
      }

      // Fetch stages
      const stagesRes = varietyId 
        ? await fetchGrowthStagesByVariety(token, varietyId, { limit: 100 })
        : await fetchGrowthStagesByCrop(token, cropId, { limit: 100 });
        
      if (!stagesRes.ok) throw new Error(stagesRes.error || 'Failed to load stages');
      setStages(stagesRes.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stageId) => {
    try {
      setActionLoading(stageId);
      const result = await softDeleteGrowthStage(token, stageId);
      if (!result.ok) throw new Error(result.error || 'Failed to delete stage');
      
      setStages(prev => prev.filter(s => s._id !== stageId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditClick = (stage) => {
    navigate(`/client-admin/growth-stages/${stage._id}?cropId=${cropId}${varietyId ? `&varietyId=${varietyId}` : ''}`);
  };

  const sortedStages = [...stages].sort((a, b) => a.stageNumber - b.stageNumber);

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
                {crop?.name} - Growth Stages
              </h1>
              <p className="text-gray-600 mt-2">
                {varietyId ? 'Define and manage crop variety growth stages' : 'Define and manage crop growth stages'}
              </p>
            </div>
            <button
              onClick={() => navigate(`/client-admin/growth-stages/new?cropId=${cropId}${varietyId ? `&varietyId=${varietyId}` : ''}`)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Add Growth Stage
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Growth Stages Timeline */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {sortedStages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No growth stages defined yet</p>
              <button
                onClick={() => navigate(`/client-admin/growth-stages/new?cropId=${cropId}${varietyId ? `&varietyId=${varietyId}` : ''}`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Create First Stage
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedStages.map((stage, idx) => (
                <div key={stage._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-bold text-lg">{stage.stageNumber}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{stage.stageName}</h3>
                        <p className="text-gray-600 text-sm">
                          Duration: <span className="font-semibold">{stage.durationDays} days</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        stage.status === 'approved' ? 'bg-green-100 text-green-800' :
                        stage.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stage.status?.charAt(0).toUpperCase() + stage.status?.slice(1)}
                      </span>
                    </div>
                  </div>

                  {stage.description && (
                    <p className="text-gray-700 text-sm mb-3">{stage.description}</p>
                  )}

                  {/* NPK Recommendation */}
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

                  {/* Irrigation Notes */}
                  {stage.irrigationNotes && Object.values(stage.irrigationNotes).some(v => v) && (
                    <div className="mb-3 p-3 bg-cyan-50 rounded-lg">
                      <p className="text-sm font-semibold text-cyan-900 mb-2">Irrigation Notes:</p>
                      <div className="text-sm space-y-1">
                        {stage.irrigationNotes.frequency && <p>Frequency: {stage.irrigationNotes.frequency}</p>}
                        {stage.irrigationNotes.duration && <p>Duration: {stage.irrigationNotes.duration}</p>}
                        {stage.irrigationNotes.method && <p>Method: {stage.irrigationNotes.method}</p>}
                        {stage.irrigationNotes.notes && <p className="text-cyan-800 mt-2">{stage.irrigationNotes.notes}</p>}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() => handleEditClick(stage)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(stage._id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                      disabled={actionLoading === stage._id}
                    >
                      {actionLoading === stage._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>

                  {/* Delete Confirmation */}
                  {showDeleteConfirm === stage._id && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
                      <p className="text-red-800 text-sm">Delete this growth stage?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(stage._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate(varietyId ? '/client-admin/crop-varieties?cropId=' + cropId : '/client-admin/crops')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
