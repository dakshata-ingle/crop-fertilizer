import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createClientFertilizer, fetchClientFertilizers, fetchClients, fetchFertilizerPriceHistory, softDeleteClientFertilizer, updateClientFertilizer, updateFertilizerActiveStatus } from '../utils/api';
import SuperAdminFertilizerForm from './SuperAdminFertilizerForm';

export default function SuperAdminFertilizers() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [fertilizers, setFertilizers] = useState([]);
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
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [quickEditId, setQuickEditId] = useState(null);
  const [quickEditValues, setQuickEditValues] = useState({ price: '', bagWeight: '', description: '' });
  const [updatingQuickFields, setUpdatingQuickFields] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [latestPriceHistory, setLatestPriceHistory] = useState({});

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
        console.error('Unable to load clients for fertilizer catalog', err);
      }
    };

    const loadFertilizers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { search, status: statusFilter, sortBy, sortOrder, page, limit: pageSize };
        if (clientFilter) {
          params.clientId = clientFilter;
        }
        if (activeFilter === 'active') {
          params.isActive = true;
        } else if (activeFilter === 'inactive') {
          params.isActive = false;
        }

        const data = await fetchClientFertilizers(token, params);
        setFertilizers(data.fertilizers || []);
        setPagination(data.pagination || { page: 1, limit: pageSize, totalItems: data.count || 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });

        const historyMap = {};
        for (const fert of (data.fertilizers || [])) {
          try {
            const histData = await fetchFertilizerPriceHistory(token, fert._id);
            if (histData.history && histData.history.length > 0) {
              const sorted = [...histData.history].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
              historyMap[fert._id] = sorted[0];
            }
          } catch (err) {
            console.error(`Unable to fetch price history for ${fert._id}`, err);
          }
        }
        setLatestPriceHistory(historyMap);
      } catch (err) {
        setError(err.message || 'Unable to fetch fertilizers');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadClients();
      loadFertilizers();
    }
  }, [token, search, statusFilter, activeFilter, clientFilter, sortBy, sortOrder, page, pageSize]);

  const canManage = useMemo(() => user?.role === 'super_admin', [user?.role]);
  const displayedFertilizers = useMemo(() => {
    const list = [...fertilizers];

    if (sortBy === 'client') {
      list.sort((a, b) => {
        const aLabel = clientLookup[a.clientId]?.name || a.clientId || 'System';
        const bLabel = clientLookup[b.clientId]?.name || b.clientId || 'System';
        return aLabel.localeCompare(bLabel);
      });
    }

    return list;
  }, [fertilizers, sortBy, clientLookup]);

  const resetForm = () => {
    setEditingId(null);
    setEditData(null);
    setSuccess(null);
    setError(null);
  };

  const handleQuickEditOpen = (fertilizer) => {
    setQuickEditId(fertilizer._id);
    setQuickEditValues({
      price: fertilizer.price ?? '',
      bagWeight: fertilizer.bagWeight ?? '',
      description: fertilizer.description || '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleQuickEditChange = (event) => {
    const { name, value } = event.target;
    setQuickEditValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuickUpdateSubmit = async (fertilizerId) => {
    setUpdatingQuickFields(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        price: quickEditValues.price === '' ? 0 : Number(quickEditValues.price),
        bagWeight: quickEditValues.bagWeight === '' ? 0 : Number(quickEditValues.bagWeight),
        description: quickEditValues.description,
      };

      const data = await updateClientFertilizer(token, fertilizerId, payload);
      setFertilizers((prev) => prev.map((item) => (item._id === fertilizerId ? { ...item, ...data.fertilizer } : item)));
      setSuccess(data.message || 'Fertilizer updated successfully.');
      setQuickEditId(null);
      setQuickEditValues({ price: '', bagWeight: '', description: '' });
    } catch (err) {
      setError(err.message || 'Unable to update fertilizer');
    } finally {
      setUpdatingQuickFields(false);
    }
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let data;
      if (editingId) {
        data = await updateClientFertilizer(token, editingId, payload);
        setFertilizers((prev) => prev.map((item) => (item._id === editingId ? data.fertilizer : item)));
        setSuccess(data.message || 'Fertilizer updated successfully.');
      } else {
        data = await createClientFertilizer(token, payload);
        setFertilizers((prev) => [data.fertilizer, ...prev]);
        setSuccess(data.message || 'Fertilizer created successfully.');
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save fertilizer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (fertilizer) => {
    setEditingId(fertilizer._id);
    setEditData({
      name: fertilizer.name || '',
      fertilizerId: fertilizer.fertilizerId || '',
      n: fertilizer.n ?? '',
      p: fertilizer.p ?? '',
      k: fertilizer.k ?? '',
      bagWeight: fertilizer.bagWeight ?? '',
      price: fertilizer.price ?? '',
      description: fertilizer.description || '',
      clientId: fertilizer.clientId || '',
      sulfur: fertilizer.micronutrients?.sulfur ?? '',
      zinc: fertilizer.micronutrients?.zinc ?? '',
      boron: fertilizer.micronutrients?.boron ?? '',
      iron: fertilizer.micronutrients?.iron ?? '',
      manganese: fertilizer.micronutrients?.manganese ?? '',
      copper: fertilizer.micronutrients?.copper ?? '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleStatusToggle = async (fertilizer) => {
    setTogglingStatusId(fertilizer._id);
    setError(null);
    setSuccess(null);

    try {
      const nextState = !fertilizer.isActive;
      const data = await updateFertilizerActiveStatus(token, fertilizer._id, nextState);
      setFertilizers((prev) => {
        const nextItems = prev.map((item) => (item._id === fertilizer._id ? { ...item, ...data.fertilizer } : item));
        if (activeFilter === 'active') {
          return nextItems.filter((item) => item.isActive !== false);
        }
        if (activeFilter === 'inactive') {
          return nextItems.filter((item) => item.isActive === false);
        }
        return nextItems;
      });
      setSuccess(data.message || 'Fertilizer status updated successfully.');
    } catch (err) {
      setError(err.message || 'Unable to update fertilizer status');
    } finally {
      setTogglingStatusId(null);
    }
  };

  const handleSoftDelete = async (fertilizer) => {
    setDeletingId(fertilizer._id);
    setError(null);
    setSuccess(null);

    try {
      const data = await softDeleteClientFertilizer(token, fertilizer._id);
      setFertilizers((prev) => prev.filter((item) => item._id !== fertilizer._id));
      setSuccess(data.message || 'Fertilizer deleted successfully.');
    } catch (err) {
      setError(err.message || 'Unable to delete fertilizer');
    } finally {
      setDeletingId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-2 text-sm text-slate-600">Only super administrators can manage the system fertilizer catalog.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Super Admin Fertilizer Management</h1>
            <p className="text-sm text-slate-600">Create, edit, and manage fertilizers across all clients from the system catalog.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</Link>
            <button type="button" onClick={() => navigate('/admin/fertilizers/view')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">View catalog</button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <SuperAdminFertilizerForm
              mode={editingId ? 'edit' : 'create'}
              initialData={editData}
              onSubmit={handleSubmit}
              submitLabel={editingId ? 'Save changes' : 'Create fertilizer'}
              cancelLabel="Cancel"
              onCancel={resetForm}
              submitting={submitting}
              error={error}
              success={success}
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Catalog</p>
                <h2 className="text-2xl font-bold text-slate-900">System fertilizer list</h2>
              </div>
              <span className="text-sm font-medium text-slate-500">{fertilizers.length}</span>
            </div>

            <div className="mb-6 grid gap-3">
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search fertilizer" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
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
                  <option value="fertilizerId">Code</option>
                  <option value="price">Price</option>
                  <option value="client">Client</option>
                </select>
                <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                  <option value="desc">↓</option>
                  <option value="asc">↑</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500">Loading fertilizers...</div>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">{error}</div>
            ) : fertilizers.length === 0 ? (
              <div className="py-12 text-center text-slate-500">No fertilizers found.</div>
            ) : (
              <div className="space-y-3">
                {displayedFertilizers.map((fertilizer) => {
                  const client = clientLookup[fertilizer.clientId] || null;
                  const clientLabel = client ? `${client.name} (${client.code || client.email || 'client'})` : fertilizer.clientId || 'System';
                  return (
                    <div key={fertilizer._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{fertilizer.name}</h3>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${fertilizer.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {fertilizer.status === 'approved' ? 'Approved' : fertilizer.status || 'Pending'}
                            </span>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${fertilizer.isActive === false ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                              {fertilizer.isActive === false ? 'Inactive' : 'Active'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">Code: {fertilizer.fertilizerId}</p>
                          <p className="text-sm text-slate-600">Client: {clientLabel}</p>
                          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                            <span className="rounded-full bg-white px-3 py-1">NPK {fertilizer.n ?? 0}/{fertilizer.p ?? 0}/{fertilizer.k ?? 0}</span>
                            <span className="rounded-full bg-white px-3 py-1">₹{fertilizer.price ?? 0}</span>
                            <span className="rounded-full bg-white px-3 py-1">{fertilizer.bagWeight ?? 0} kg</span>
                          </div>
                          {latestPriceHistory[fertilizer._id] && (
                            <p className="mt-2 text-xs text-slate-500">
                              <span className="font-semibold">Last update:</span> {new Date(latestPriceHistory[fertilizer._id].updatedAt).toLocaleDateString()} — Price: ₹{latestPriceHistory[fertilizer._id].previousPrice ?? 0} → ₹{latestPriceHistory[fertilizer._id].newPrice ?? 0}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="mt-3 flex flex-col gap-2">
                            <button type="button" onClick={() => navigate(`/admin/fertilizers/view/${fertilizer._id}`)} className="text-sm font-semibold text-slate-700 hover:underline">View</button>
                            <button type="button" onClick={() => navigate(`/admin/fertilizers/history/${fertilizer._id}`)} className="text-sm font-semibold text-indigo-600 hover:underline">Price history</button>
                            <button type="button" onClick={() => navigate(`/admin/fertilizers/changes/${fertilizer._id}`)} className="text-sm font-semibold text-amber-600 hover:underline">All changes</button>
                            <button type="button" onClick={() => handleEdit(fertilizer)} className="text-sm font-semibold text-slate-700 hover:underline">Edit</button>
                            <button type="button" onClick={() => handleQuickEditOpen(fertilizer)} className="text-sm font-semibold text-indigo-600 hover:underline">Quick update</button>
                            <button type="button" onClick={() => handleStatusToggle(fertilizer)} disabled={togglingStatusId === fertilizer._id} className="text-sm font-semibold text-emerald-600 hover:underline disabled:cursor-not-allowed disabled:opacity-70">
                              {togglingStatusId === fertilizer._id ? 'Updating...' : fertilizer.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button type="button" onClick={() => handleSoftDelete(fertilizer)} disabled={deletingId === fertilizer._id} className="text-sm font-semibold text-rose-600 hover:underline disabled:cursor-not-allowed disabled:opacity-70">
                              {deletingId === fertilizer._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {quickEditId === fertilizer._id ? (
                        <div className="mt-4 rounded-2xl border border-indigo-200 bg-white p-4">
                          <p className="mb-3 text-sm font-semibold text-slate-900">Update price, bag weight, and description</p>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div>
                              <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Price</label>
                              <input name="price" type="number" value={quickEditValues.price} onChange={handleQuickEditChange} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
                            </div>
                            <div>
                              <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Bag weight</label>
                              <input name="bagWeight" type="number" value={quickEditValues.bagWeight} onChange={handleQuickEditChange} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
                            </div>
                            <div>
                              <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Description</label>
                              <input name="description" value={quickEditValues.description} onChange={handleQuickEditChange} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => handleQuickUpdateSubmit(fertilizer._id)} disabled={updatingQuickFields} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
                              {updatingQuickFields ? 'Saving...' : 'Save changes'}
                            </button>
                            <button type="button" onClick={() => { setQuickEditId(null); setQuickEditValues({ price: '', bagWeight: '', description: '' }); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">Showing {fertilizers.length} of {pagination.totalItems || fertilizers.length} fertilizers</div>
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
