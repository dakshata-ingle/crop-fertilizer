import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createClientCrop, fetchClientCrops, softDeleteClientCrop, updateClientCrop } from '../utils/api';

const initialFormState = {
  cropId: '',
  name: '',
  botanicalName: '',
  npk: { n: '', p: '', k: '' },
  customDose: { n: '', p: '', k: '' },
  varieties: '',
  growthStages: '',
  growthPeriodDays: '',
  description: '',
};

export default function ClientAdminCrops() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [formState, setFormState] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const loadCrops = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClientCrops(token, { search, status: statusFilter, sortBy, sortOrder, isActive: true, page, limit: pageSize });
        setCrops(data.crops || []);
        setPagination(data.pagination || { page: 1, limit: pageSize, totalItems: data.count || 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
      } catch (err) {
        setError(err.message || 'Unable to fetch crops');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadCrops();
    }
  }, [token, search, statusFilter, sortBy, sortOrder, page, pageSize]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('npk.')) {
      const key = name.split('.')[1];
      setFormState((prev) => ({ ...prev, npk: { ...prev.npk, [key]: value } }));
      return;
    }
    if (name.startsWith('customDose.')) {
      const key = name.split('.')[1];
      setFormState((prev) => ({ ...prev, customDose: { ...prev.customDose, [key]: value } }));
      return;
    }
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setImageFile(null);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const payload = new FormData();
      payload.append('cropId', formState.cropId);
      payload.append('name', formState.name);
      payload.append('botanicalName', formState.botanicalName);
      payload.append('npk', JSON.stringify({
        n: Number(formState.npk.n) || 0,
        p: Number(formState.npk.p) || 0,
        k: Number(formState.npk.k) || 0,
      }));
      payload.append('customDose', JSON.stringify({
        n: Number(formState.customDose.n) || 0,
        p: Number(formState.customDose.p) || 0,
        k: Number(formState.customDose.k) || 0,
      }));
      payload.append('varieties', formState.varieties);
      payload.append('growthStages', formState.growthStages);
      payload.append('growthPeriodDays', String(Number(formState.growthPeriodDays) || 0));
      payload.append('description', formState.description);
      if (imageFile) {
        payload.append('image', imageFile);
      }

      if (editingId) {
        const data = await updateClientCrop(token, editingId, payload);
        setCrops((prev) => prev.map((item) => (item._id === editingId ? data.crop : item)));
        setSuccess(data.message || 'Crop updated successfully.');
      } else {
        const data = await createClientCrop(token, payload);
        setCrops((prev) => [data.crop, ...prev]);
        setSuccess(data.message || 'Crop created successfully.');
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save crop');
    }
  };

  const handleEdit = (crop) => {
    setEditingId(crop._id);
    setFormState({
      cropId: crop.cropId || '',
      name: crop.name || '',
      botanicalName: crop.botanicalName || '',
      npk: {
        n: crop.npk?.n ?? '',
        p: crop.npk?.p ?? '',
        k: crop.npk?.k ?? '',
      },
      customDose: {
        n: crop.customDose?.n ?? '',
        p: crop.customDose?.p ?? '',
        k: crop.customDose?.k ?? '',
      },
      varieties: Array.isArray(crop.varieties) ? crop.varieties.join(', ') : '',
      growthStages: Array.isArray(crop.growthStages) ? crop.growthStages.join(', ') : '',
      growthPeriodDays: crop.growthPeriodDays ?? '',
      description: crop.description || '',
    });
  };

  const handleSoftDelete = async (cropId) => {
    setError(null);
    setSuccess(null);
    try {
      const data = await softDeleteClientCrop(token, cropId);
      setCrops((prev) => prev.filter((item) => item._id !== cropId));
      setSuccess(data.message || 'Crop deleted successfully.');
    } catch (err) {
      setError(err.message || 'Unable to delete crop');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Crop Management</h1>
            <p className="text-sm text-slate-600">Create, update, and manage crops for your assigned client. New crops start as pending.</p>
          </div>
          <Link to="/client-admin" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Back to Dashboard
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">New crop</p>
              <h2 className="text-2xl font-bold text-slate-900">{editingId ? 'Edit crop' : 'Create crop'}</h2>
            </div>
            {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{success}</div>}
            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">{error}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input name="name" value={formState.name} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Code</label>
                <input name="cropId" value={formState.cropId} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Botanical name</label>
                <input name="botanicalName" value={formState.botanicalName} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">N</label>
                  <input name="npk.n" type="number" value={formState.npk.n} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">P</label>
                  <input name="npk.p" type="number" value={formState.npk.p} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">K</label>
                  <input name="npk.k" type="number" value={formState.npk.k} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Dose N</label>
                  <input name="customDose.n" type="number" value={formState.customDose.n} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Dose P</label>
                  <input name="customDose.p" type="number" value={formState.customDose.p} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Dose K</label>
                  <input name="customDose.k" type="number" value={formState.customDose.k} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Varieties</label>
                <input name="varieties" value={formState.varieties} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Growth stages</label>
                <input name="growthStages" value={formState.growthStages} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Growth period (days)</label>
                <input name="growthPeriodDays" type="number" value={formState.growthPeriodDays} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Crop image</label>
                <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea name="description" value={formState.description} onChange={handleChange} rows="3" className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="rounded-xl bg-slate-900 px-4 py-3 text-white font-semibold hover:bg-slate-800 transition">
                  {editingId ? 'Save changes' : 'Create crop'}
                </button>
                {editingId ? (
                  <button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 px-4 py-3 text-slate-700 font-semibold">
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Your crops</p>
                <h2 className="text-2xl font-bold text-slate-900">Client crop list</h2>
              </div>
              <span className="text-sm font-medium text-slate-500">{crops.length}</span>
            </div>            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search crop" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="flex gap-2">
                <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                  <option value="createdAt">Created</option>
                  <option value="name">Name</option>
                  <option value="cropId">Code</option>
                  <option value="growthPeriodDays">Growth period</option>
                </select>
                <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                  <option value="desc">↓</option>
                  <option value="asc">↑</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="py-16 text-center text-slate-500">Loading crops...</div>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>
            ) : crops.length === 0 ? (
              <div className="py-16 text-center text-slate-500">No crops created yet.</div>
            ) : (
              <div className="space-y-3">
                {crops.map((crop) => (
                  <div key={crop._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{crop.name}</h3>
                        <p className="text-sm text-slate-600">Code: {crop.cropId}</p>
                        <p className="text-sm text-slate-600">N-P-K: {crop.npk?.n}/{crop.npk?.p}/{crop.npk?.k}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${crop.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {crop.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                        <div className="mt-3 flex flex-col gap-2">
                          <button type="button" onClick={() => navigate(`/client-admin/crop-varieties?cropId=${crop._id}`)} className="text-sm font-semibold text-blue-600 underline-offset-2 hover:underline">
                            View Varieties
                          </button>
                          <button type="button" onClick={() => navigate(`/client-admin/growth-stages?cropId=${crop._id}`)} className="text-sm font-semibold text-green-600 underline-offset-2 hover:underline">
                            Growth Stages
                          </button>
                          <button type="button" onClick={() => handleEdit(crop)} className="text-sm font-semibold text-slate-700 underline-offset-2 hover:underline">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleSoftDelete(crop._id)} className="text-sm font-semibold text-rose-600 underline-offset-2 hover:underline">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                Showing {crops.length} of {pagination.totalItems || crops.length} crops
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                  <option value="5">5 / page</option>
                  <option value="10">10 / page</option>
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                </select>
                <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={!pagination.hasPrevPage} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                  Previous
                </button>
                <span className="text-sm font-medium text-slate-700">Page {pagination.page} / {pagination.totalPages}</span>
                <button type="button" onClick={() => setPage((prev) => prev + 1)} disabled={!pagination.hasNextPage} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
