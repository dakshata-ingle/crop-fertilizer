import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  fetchGrowthStageById,
  createGrowthStage,
  updateGrowthStage,
  fetchClientCropById
} from '../utils/api';

export default function ClientAdminGrowthStageForm() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const cropId = searchParams.get('cropId');
  const varietyId = searchParams.get('varietyId');
  
  const isEditing = !!id;
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    stageName: '',
    stageNumber: '',
    durationDays: '',
    description: '',
    fertilizerRecommendation: {
      n: '',
      p: '',
      k: '',
      notes: '',
    },
    irrigationNotes: {
      frequency: '',
      duration: '',
      method: '',
      notes: '',
    },
    pestManagement: {
      commonPests: [],
      controlMeasures: '',
      recommendedProducts: [],
    },
  });

  const [pestInput, setPestInput] = useState('');
  const [productInput, setProductInput] = useState('');

  useEffect(() => {
    if (!cropId) {
      setError('Crop ID is required');
      return;
    }

    loadCrop();
    if (isEditing) loadStage();
  }, [cropId, id, token]);

  const loadCrop = async () => {
    try {
      const res = await fetchClientCropById(token, cropId);
      if (!res.ok) throw new Error(res.error || 'Failed to load crop');
      setCrop(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadStage = async () => {
    try {
      setLoading(true);
      const res = await fetchGrowthStageById(token, id);
      if (!res.ok) throw new Error(res.error || 'Failed to load stage');
      
      const stage = res.data;
      setFormData({
        stageName: stage.stageName || '',
        stageNumber: stage.stageNumber || '',
        durationDays: stage.durationDays || '',
        description: stage.description || '',
        fertilizerRecommendation: stage.fertilizerRecommendation || { n: '', p: '', k: '', notes: '' },
        irrigationNotes: stage.irrigationNotes || { frequency: '', duration: '', method: '', notes: '' },
        pestManagement: stage.pestManagement || { commonPests: [], controlMeasures: '', recommendedProducts: [] },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const addPest = () => {
    if (pestInput.trim()) {
      setFormData(prev => ({
        ...prev,
        pestManagement: {
          ...prev.pestManagement,
          commonPests: [...prev.pestManagement.commonPests, pestInput.trim()],
        },
      }));
      setPestInput('');
    }
  };

  const removePest = (index) => {
    setFormData(prev => ({
      ...prev,
      pestManagement: {
        ...prev.pestManagement,
        commonPests: prev.pestManagement.commonPests.filter((_, i) => i !== index),
      },
    }));
  };

  const addProduct = () => {
    if (productInput.trim()) {
      setFormData(prev => ({
        ...prev,
        pestManagement: {
          ...prev.pestManagement,
          recommendedProducts: [...prev.pestManagement.recommendedProducts, productInput.trim()],
        },
      }));
      setProductInput('');
    }
  };

  const removeProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      pestManagement: {
        ...prev.pestManagement,
        recommendedProducts: prev.pestManagement.recommendedProducts.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);

      const submitData = {
        ...formData,
        cropId,
        cropVarietyId: varietyId || null,
        stageNumber: parseInt(formData.stageNumber, 10),
        durationDays: parseInt(formData.durationDays, 10),
        fertilizerRecommendation: {
          n: parseInt(formData.fertilizerRecommendation.n, 10) || 0,
          p: parseInt(formData.fertilizerRecommendation.p, 10) || 0,
          k: parseInt(formData.fertilizerRecommendation.k, 10) || 0,
          notes: formData.fertilizerRecommendation.notes,
        },
      };

      let result;
      if (isEditing) {
        result = await updateGrowthStage(token, id, submitData);
      } else {
        result = await createGrowthStage(token, submitData);
      }

      if (!result.ok) {
        throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} stage`);
      }

      setSuccessMessage(`Growth stage ${isEditing ? 'updated' : 'created'} successfully!`);
      setTimeout(() => {
        navigate(`/client-admin/growth-stages?cropId=${cropId}${varietyId ? `&varietyId=${varietyId}` : ''}`);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {isEditing ? 'Edit' : 'Create'} Growth Stage
        </h1>
        {crop && (
          <p className="text-gray-600 mb-6">
            For crop: <span className="font-semibold">{crop.name}</span>
          </p>
        )}

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

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Basic Info Section */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Stage Name *
                </label>
                <input
                  type="text"
                  name="stageName"
                  value={formData.stageName}
                  onChange={handleInputChange}
                  placeholder="e.g., Vegetative Growth"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Stage Number *
                </label>
                <input
                  type="number"
                  name="stageNumber"
                  value={formData.stageNumber}
                  onChange={handleInputChange}
                  placeholder="1, 2, 3..."
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Duration (Days) *
              </label>
              <input
                type="number"
                name="durationDays"
                value={formData.durationDays}
                onChange={handleInputChange}
                placeholder="e.g., 30"
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe this growth stage..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
          </div>

          {/* Fertilizer Recommendation Section */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Fertilizer Recommendation</h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Nitrogen (kg/ha)
                </label>
                <input
                  type="number"
                  name="fertilizerRecommendation.n"
                  value={formData.fertilizerRecommendation.n}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Phosphorus (kg/ha)
                </label>
                <input
                  type="number"
                  name="fertilizerRecommendation.p"
                  value={formData.fertilizerRecommendation.p}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Potassium (kg/ha)
                </label>
                <input
                  type="number"
                  name="fertilizerRecommendation.k"
                  value={formData.fertilizerRecommendation.k}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Fertilizer Notes
              </label>
              <textarea
                name="fertilizerRecommendation.notes"
                value={formData.fertilizerRecommendation.notes}
                onChange={handleInputChange}
                placeholder="Additional fertilizer recommendations for this stage..."
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
          </div>

          {/* Irrigation Section */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Irrigation Guidelines</h2>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Frequency
                </label>
                <input
                  type="text"
                  name="irrigationNotes.frequency"
                  value={formData.irrigationNotes.frequency}
                  onChange={handleInputChange}
                  placeholder="e.g., every 5 days"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  name="irrigationNotes.duration"
                  value={formData.irrigationNotes.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 1-2 hours"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Method
                </label>
                <input
                  type="text"
                  name="irrigationNotes.method"
                  value={formData.irrigationNotes.method}
                  onChange={handleInputChange}
                  placeholder="e.g., drip, flood, sprinkler"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Irrigation Notes
              </label>
              <textarea
                name="irrigationNotes.notes"
                value={formData.irrigationNotes.notes}
                onChange={handleInputChange}
                placeholder="Additional irrigation recommendations..."
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
          </div>

          {/* Pest Management Section */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Pest Management</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Common Pests
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={pestInput}
                  onChange={(e) => setPestInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPest())}
                  placeholder="e.g., Armyworm"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
                <button
                  type="button"
                  onClick={addPest}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Add
                </button>
              </div>
              {formData.pestManagement.commonPests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.pestManagement.commonPests.map((pest, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                    >
                      {pest}
                      <button
                        type="button"
                        onClick={() => removePest(idx)}
                        className="ml-1 font-bold hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Control Measures
              </label>
              <textarea
                value={formData.pestManagement.controlMeasures}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pestManagement: { ...prev.pestManagement, controlMeasures: e.target.value }
                }))}
                placeholder="Describe pest control measures..."
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Recommended Products
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
                  placeholder="e.g., Pesticide Brand"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
                <button
                  type="button"
                  onClick={addProduct}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Add
                </button>
              </div>
              {formData.pestManagement.recommendedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.pestManagement.recommendedProducts.map((product, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {product}
                      <button
                        type="button"
                        onClick={() => removeProduct(idx)}
                        className="ml-1 font-bold hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {submitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/client-admin/growth-stages?cropId=${cropId}${varietyId ? `&varietyId=${varietyId}` : ''}`)}
              className="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
