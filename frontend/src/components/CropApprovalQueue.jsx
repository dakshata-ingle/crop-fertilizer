import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchPendingCrops, updateCropStatus } from '../utils/api';

export default function CropApprovalQueue() {
  const { token } = useContext(AuthContext);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadPendingCrops = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPendingCrops(token);
      setCrops(data.crops || []);
    } catch (err) {
      setError(err.message || 'Unable to load pending crops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPendingCrops();
    }
  }, [token]);

  const handleDecision = async (cropId, status) => {
    setBusyId(cropId);
    try {
      await updateCropStatus(token, cropId, status);
      setCrops((prev) => prev.filter((crop) => crop._id !== cropId));
    } catch (err) {
      setError(err.message || 'Unable to update crop status.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Crop approval queue</h1>
            <p className="text-sm text-slate-600">Review crops submitted by client admins and approve or reject them before they appear in the calculator catalog.</p>
          </div>
          <Link to="/admin" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Back to dashboard
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-slate-500">Loading pending crops...</div>
          ) : crops.length === 0 ? (
            <div className="py-16 text-center text-slate-500">No pending crops to review.</div>
          ) : (
            <div className="space-y-4">
              {crops.map((crop) => (
                <div key={crop._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-slate-900">{crop.name}</h2>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                          Pending
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{crop.botanicalName || 'No botanical name provided.'}</p>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <div><span className="font-semibold text-slate-700">Client:</span> {crop.clientName} ({crop.clientCode})</div>
                        <div><span className="font-semibold text-slate-700">Submitted by:</span> {crop.createdByName}</div>
                        <div><span className="font-semibold text-slate-700">Crop code:</span> {crop.cropId}</div>
                        <div><span className="font-semibold text-slate-700">NPK:</span> {crop.npk?.n || 0}/{crop.npk?.p || 0}/{crop.npk?.k || 0}</div>
                      </div>
                      {crop.description ? <p className="mt-3 text-sm text-slate-600">{crop.description}</p> : null}
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleDecision(crop._id, 'approved')}
                        disabled={busyId === crop._id}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        {busyId === crop._id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(crop._id, 'rejected')}
                        disabled={busyId === crop._id}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-rose-300"
                      >
                        {busyId === crop._id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
