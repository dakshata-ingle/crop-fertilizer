import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createClientCrop, fetchClients, fetchClientCrops, updateClientCrop, updateCropActiveStatus } from '../utils/api';

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
  clientId: '',
};

export default function SuperAdminCrops() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [clientLookup, setClientLookup] = useState({});
  const [formState, setFormState] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState(null);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await fetchClients(token, { page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
        const lookup = {};
        (data.clients || []).forEach((client) => {
          const id = client._id || client.id;
          lookup[id] = client;
        });
        setClientLookup(lookup);
      } catch (err) {
        console.error('Unable to load clients for crop catalog', err);
      }
    };

    const loadCrops = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { search, status: statusFilter, sortBy, sortOrder, page, limit: pageSize };
        if (clientFilter) params.clientId = clientFilter;
        if (activeFilter === 'active') params.isActive = true;
        if (activeFilter === 'inactive') params.isActive = false;

        const data = await fetchClientCrops(token, params);
        setCrops(data.crops || []);
        setPagination(data.pagination || { page: 1, limit: pageSize, totalItems: data.count || 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
      } catch (err) {
        setError(err.message || 'Unable to fetch crops');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadClients();
      loadCrops();
    }
  }, [token, search, statusFilter, activeFilter, clientFilter, sortBy, sortOrder, page, pageSize]);

  const canManage = useMemo(() => user?.role === 'super_admin', [user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
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
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = new FormData();
      payload.append('cropId', formState.cropId);
      payload.append('name', formState.name);
      payload.append('botanicalName', formState.botanicalName);
      payload.append('npk', JSON.stringify({ n: Number(formState.npk.n) || 0, p: Number(formState.npk.p) || 0, k: Number(formState.npk.k) || 0 }));
      payload.append('customDose', JSON.stringify({ n: Number(formState.customDose.n) || 0, p: Number(formState.customDose.p) || 0, k: Number(formState.customDose.k) || 0 }));
      payload.append('varieties', formState.varieties);
      payload.append('growthStages', formState.growthStages);
      payload.append('growthPeriodDays', String(Number(formState.growthPeriodDays) || 0));
      payload.append('description', formState.description);
      payload.append('clientId', formState.clientId);
      if (imageFile) payload.append('image', imageFile);

      let data;
      if (editingId) {
        data = await updateClientCrop(token, editingId, payload);
        setCrops((prev) => prev.map((item) => (item._id === editingId ? data.crop : item)));
        setSuccess(data.message || 'Crop updated successfully.');
      } else {
        data = await createClientCrop(token, payload);
        setCrops((prev) => [data.crop, ...prev]);
        setSuccess(data.message || 'Crop created successfully.');
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save crop');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (crop) => {
    setEditingId(crop._id);
    setFormState({
      cropId: crop.cropId || '',
      name: crop.name || '',
      botanicalName: crop.botanicalName || '',
      npk: { n: crop.npk?.n ?? '', p: crop.npk?.p ?? '', k: crop.npk?.k ?? '' },
      customDose: { n: crop.customDose?.n ?? '', p: crop.customDose?.p ?? '', k: crop.customDose?.k ?? '' },
      varieties: Array.isArray(crop.varieties) ? crop.varieties.join(', ') : '',
      growthStages: Array.isArray(crop.growthStages) ? crop.growthStages.join(', ') : '',
      growthPeriodDays: crop.growthPeriodDays ?? '',
      description: crop.description || '',
      clientId: crop.clientId || '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleStatusToggle = async (crop) => {
    setTogglingStatusId(crop._id);
    setError(null);
    setSuccess(null);
    try {
      const nextState = !crop.isActive;
      const data = await updateCropActiveStatus(token, crop._id, nextState);
      setCrops((prev) => {
        const nextItems = prev.map((item) => (item._id === crop._id ? { ...item, ...data.crop } : item));
        if (activeFilter === 'active') return nextItems.filter((item) => item.isActive !== false);
        if (activeFilter === 'inactive') return nextItems.filter((item) => item.isActive === false);
        return nextItems;
      });
      setSuccess(data.message || 'Crop status updated successfully.');
    } catch (err) {
      setError(err.message || 'Unable to update crop status');
    } finally {
      setTogglingStatusId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-2 text-sm text-slate-600">Only super administrators can manage the system crop catalog.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Super Admin Crop Management</h1>
            <p className="text-sm text-slate-600">Create, edit, and manage crops across all clients from the system catalog.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</Link>
            <button type="button" onClick={() => navigate('/admin/crops/pending')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Review pending</button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Catalog form</p>
              <h2 className="text-2xl font-bold text-slate-900">{editingId ? 'Edit crop' : 'Create crop'}</h2>
            </div>
            {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{success}</div>}
            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">{error}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700">Client</label>
                <select name="clientId" value={formState.clientId} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" required>
                  <option value="">Select client</option>
                  {Object.entries(clientLookup).map(([id, client]) => (
                    <option key={id} value={id}>{client.name || client.email || id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input name="name" value={formState.name} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" required />
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
                <div><label className="text-sm font-medium text-slate-700">N</label><input name="npk.n" type="number" value={formState.npk.n} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
                <div><label className="text-sm font-medium text-slate-700">P</label><input name="npk.p" type="number" value={formState.npk.p} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
                <div><label className="text-sm font-medium text-slate-700">K</label><input name="npk.k" type="number" value={formState.npk.k} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><label className="text-sm font-medium text-slate-700">Dose N</label><input name="customDose.n" type="number" value={formState.customDose.n} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
                <div><label className="text-sm font-medium text-slate-700">Dose P</label><input name="customDose.p" type="number" value={formState.customDose.p} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
                <div><label className="text-sm font-medium text-slate-700">Dose K</label><input name="customDose.k" type="number" value={formState.customDose.k} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
              </div>
              <div><label className="text-sm font-medium text-slate-700">Varieties</label><input name="varieties" value={formState.varieties} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
              <div><label className="text-sm font-medium text-slate-700">Growth stages</label><input name="growthStages" value={formState.growthStages} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
              <div><label className="text-sm font-medium text-slate-700">Growth period (days)</label><input name="growthPeriodDays" type="number" value={formState.growthPeriodDays} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
              <div><label className="text-sm font-medium text-slate-700">Crop image</label><input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
              <div><label className="text-sm font-medium text-slate-700">Description</label><textarea name="description" value={formState.description} onChange={handleChange} rows="3" className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="rounded-xl bg-slate-900 px-4 py-3 text-white font-semibold disabled:cursor-not-allowed disabled:opacity-70">{submitting ? 'Saving...' : editingId ? 'Save changes' : 'Create crop'}</button>
                {editingId ? <button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 px-4 py-3 text-slate-700 font-semibold">Cancel</button> : null}
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Catalog</p>
                <h2 className="text-2xl font-bold text-slate-900">System crop list</h2>
              </div>
              <span className="text-sm font-medium text-slate-500">{crops.length}</span>
            </div>
            <div className="mb-6 grid gap-3">
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search crop" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select value={clientFilter} onChange={(event) => { setClientFilter(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                <option value="">All clients</option>
                {Object.entries(clientLookup).map(([id, client]) => (
                  <option key={id} value={id}>{client.name || client.email || id}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                  <option value="createdAt">Created</option>
                  <option value="name">Name</option>
                  <option value="cropId">Code</option>
                  <option value="growthPeriodDays">Growth period</option>
                  <option value="client">Client</option>
                </select>
                <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                  <option value="desc">↓</option>
                  <option value="asc">↑</option>
                </select>
              </div>
            </div>

            {loading ? <div className="py-12 text-center text-slate-500">Loading crops...</div> : error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">{error}</div> : crops.length === 0 ? <div className="py-12 text-center text-slate-500">No crops found.</div> : (
              <div className="space-y-3">
                {crops.map((crop) => {
                  const client = clientLookup[crop.clientId] || null;
                  const clientLabel = client ? `${client.name} (${client.code || client.email || 'client'})` : crop.clientId || 'System';
                  return (
                    <div key={crop._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{crop.name}</h3>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${crop.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{crop.status === 'approved' ? 'Approved' : crop.status || 'Pending'}</span>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${crop.isActive === false ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>{crop.isActive === false ? 'Inactive' : 'Active'}</span>
                          </div>
                          <p className="text-sm text-slate-600">Code: {crop.cropId}</p>
                          <p className="text-sm text-slate-600">Client: {clientLabel}</p>
                          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                            <span className="rounded-full bg-white px-3 py-1">NPK {crop.npk?.n ?? 0}/{crop.npk?.p ?? 0}/{crop.npk?.k ?? 0}</span>
                            <span className="rounded-full bg-white px-3 py-1">Growth {crop.growthPeriodDays ?? 0} days</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mt-3 flex flex-col gap-2">
                            <button type="button" onClick={() => handleEdit(crop)} className="text-sm font-semibold text-slate-700 hover:underline">Edit</button>
                            <button type="button" onClick={() => handleStatusToggle(crop)} disabled={togglingStatusId === crop._id} className="text-sm font-semibold text-emerald-600 hover:underline disabled:cursor-not-allowed disabled:opacity-70">{togglingStatusId === crop._id ? 'Updating...' : crop.isActive ? 'Deactivate' : 'Activate'}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">Showing {crops.length} of {pagination.totalItems || crops.length} crops</div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                  <option value="5">5 / page</option>
                  <option value="10">10 / page</option>
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                </select>
                <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={!pagination.hasPrevPage} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                <span className="text-sm font-medium text-slate-700">Page {pagination.page} / {pagination.totalPages}</span>
                <button type="button" onClick={() => setPage((prev) => prev + 1)} disabled={!pagination.hasNextPage} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
