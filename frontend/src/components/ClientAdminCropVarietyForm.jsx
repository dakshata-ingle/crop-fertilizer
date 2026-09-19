import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  fetchCropVarietyById,
  createCropVariety,
  updateCropVariety,
  fetchClientCropById
} from '../utils/api';

export default function ClientAdminCropVarietyForm() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const cropId = searchParams.get('cropId');
  
  const isEditing = !!id;
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    maturityDays: '',
    yieldPerHectare: '',
    resistances: []
  });

  const [resistanceInput, setResistanceInput] = useState('');

  useEffect(() => {
    if (!cropId) {
      setError('Crop ID is required');
      return;
    }

    loadCrop();
    if (isEditing) loadVariety();
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

  const loadVariety = async () => {
    try {
      setLoading(true);
      const res = await fetchCropVarietyById(token, id);
      if (!res.ok) throw new Error(res.error || 'Failed to load variety');
      
      const variety = res.data;
      setFormData({
        name: variety.name || '',
        code: variety.code || '',
        description: variety.description || '',
        maturityDays: variety.maturityDays || '',
        yieldPerHectare: variety.yieldPerHectare || '',
        resistances: variety.resistances || []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddResistance = () => {
    if (resistanceInput.trim()) {
      setFormData(prev => ({
        ...prev,
        resistances: [...prev.resistances, resistanceInput.trim()]
      }));
      setResistanceInput('');
    }
  };

  const handleRemoveResistance = (index) => {
    setFormData(prev => ({
      ...prev,
      resistances: prev.resistances.filter((_, i) => i !== index)
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
        maturityDays: parseInt(formData.maturityDays, 10),
        yieldPerHectare: parseFloat(formData.yieldPerHectare)
      };

      let result;
      if (isEditing) {
        result = await updateCropVariety(token, id, submitData);
      } else {
        result = await createCropVariety(token, submitData);
      }

      if (!result.ok) {
        throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} variety`);
      }

      setSuccessMessage(`Variety ${isEditing ? 'updated' : 'created'} successfully!`);
      setTimeout(() => {
        navigate(`/client-admin/crop-varieties?cropId=${cropId}`);
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {isEditing ? 'Edit' : 'Create'} Crop Variety
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

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Name */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Variety Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., High Yield V1"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
          </div>

          {/* Code */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Variety Code *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="e.g., HY-V1"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the variety"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
          </div>

          {/* Maturity Days */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Maturity Days *
            </label>
            <input
              type="number"
              name="maturityDays"
              value={formData.maturityDays}
              onChange={handleInputChange}
              placeholder="e.g., 120"
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
          </div>

          {/* Yield Per Hectare */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Yield Per Hectare (tonnes) *
            </label>
            <input
              type="number"
              name="yieldPerHectare"
              value={formData.yieldPerHectare}
              onChange={handleInputChange}
              placeholder="e.g., 50.5"
              required
              step="0.1"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
          </div>

          {/* Resistances */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Disease Resistances
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={resistanceInput}
                onChange={(e) => setResistanceInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddResistance())}
                placeholder="e.g., Blast"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
              <button
                type="button"
                onClick={handleAddResistance}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Add
              </button>
            </div>

            {formData.resistances.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.resistances.map((resistance, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {resistance}
                    <button
                      type="button"
                      onClick={() => handleRemoveResistance(idx)}
                      className="ml-1 font-bold hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {submitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/client-admin/crop-varieties?cropId=${cropId}`)}
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
