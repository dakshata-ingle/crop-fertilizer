import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createClientFertilizer, fetchClientFertilizers, softDeleteClientFertilizer, updateClientFertilizer } from '../utils/api';

const initialFormState = {
  name: '',
  fertilizerId: '',
  n: '',
  p: '',
  k: '',
  bagWeight: '',
  price: '',
  description: '',
};

export default function ClientAdminFertilizers() {
  const { token, user } = useContext(AuthContext);
  const [fertilizers, setFertilizers] = useState([]);
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
    const loadFertilizers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClientFertilizers(token, { search, status: statusFilter, sortBy, sortOrder, isActive: true, page, limit: pageSize });
        setFertilizers(data.fertilizers || []);
        setPagination(data.pagination || { page: 1, limit: pageSize, totalItems: data.count || 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
      } catch (err) {
        setError(err.message || 'Unable to fetch fertilizers');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadFertilizers();
    }
  }, [token, search, statusFilter, sortBy, sortOrder, page, pageSize]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
      payload.append('name', formState.name);
      payload.append('fertilizerId', formState.fertilizerId);
      payload.append('n', String(formState.n));
      payload.append('p', String(formState.p));
      payload.append('k', String(formState.k));
      payload.append('bagWeight', String(formState.bagWeight));
      payload.append('price', String(formState.price));
      payload.append('description', formState.description);
      if (imageFile) {
        payload.append('image', imageFile);
      }

      if (editingId) {
        const data = await updateClientFertilizer(token, editingId, payload);
        setFertilizers((prev) => prev.map((item) => (item._id === editingId ? data.fertilizer : item)));
        setSuccess(data.message || 'Fertilizer updated successfully.');
      } else {
        const data = await createClientFertilizer(token, payload);
        setFertilizers((prev) => [data.fertilizer, ...prev]);
        setSuccess(data.message || 'Fertilizer created successfully.');
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save fertilizer');
    }
  };

  const handleEdit = (fertilizer) => {
    setEditingId(fertilizer._id);
    setFormState({
      name: fertilizer.name || '',
      fertilizerId: fertilizer.fertilizerId || '',
      n: fertilizer.n ?? '',
      p: fertilizer.p ?? '',
      k: fertilizer.k ?? '',
      bagWeight: fertilizer.bagWeight ?? '',
      price: fertilizer.price ?? '',
      description: fertilizer.description || '',
    });
  };

  const handleSoftDelete = async (fertilizerId) => {
    setError(null);
    setSuccess(null);

    try {
      const data = await softDeleteClientFertilizer(token, fertilizerId);
      setFertilizers((prev) => prev.filter((item) => item._id !== fertilizerId));
      setSuccess(data.message || 'Fertilizer deleted successfully.');
    } catch (err) {
      setError(err.message || 'Unable to delete fertilizer');
    }
  };

  if (user && user.role !== 'client_admin') {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-2 text-sm text-slate-600">Only client administrators can manage fertilizers for their assigned client.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fertilizer Management</h1>
            <p className="text-sm text-slate-600">Create and update fertilizers for your assigned client. New entries stay pending approval.</p>
          </div>
          <Link to="/" className="text-sm font-semibold text-white bg-slate-900 px-4 py-2 rounded-lg">
            Back to Home
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">New fertilizer</p>
              <h2 className="text-2xl font-bold text-slate-900">{editingId ? 'Edit fertilizer' : 'Create fertilizer'}</h2>
            </div>
            {success && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-700">{success}</div>}
            {error && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700">{error}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input name="name" value={formState.name} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Code</label>
                <input name="fertilizerId" value={formState.fertilizerId} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">N</label>
                  <input name="n" type="number" value={formState.n} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">P</label>
                  <input name="p" type="number" value={formState.p} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">K</label>
                  <input name="k" type="number" value={formState.k} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Bag weight</label>
                  <input name="bagWeight" type="number" value={formState.bagWeight} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Price</label>
                  <input name="price" type="number" value={formState.price} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Fertilizer image</label>
                <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea name="description" value={formState.description} onChange={handleChange} rows="3" className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="rounded-xl bg-slate-900 px-4 py-3 text-white font-semibold hover:bg-slate-800 transition">
                  {editingId ? 'Save changes' : 'Create fertilizer'}
                </button>
                {editingId ? (
                  <button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 px-4 py-3 text-slate-700 font-semibold">
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">Your fertilizers</p>
                <h2 className="text-2xl font-bold text-slate-900">Client fertilizer list</h2>
              </div>
              <span className="text-sm font-medium text-slate-500">{fertilizers.length}</span>
            </div>
            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search fertilizer" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
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
                  <option value="fertilizerId">Code</option>
                  <option value="price">Price</option>
                </select>
                <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                  <option value="desc">↓</option>
                  <option value="asc">↑</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-500">Loading fertilizers...</div>
            ) : error ? (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700">{error}</div>
            ) : fertilizers.length === 0 ? (
              <div className="py-16 text-center text-slate-500">No fertilizers created yet.</div>
            ) : (
              <div className="space-y-3">
                {fertilizers.map((fertilizer) => (
                  <div key={fertilizer._id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{fertilizer.name}</h3>
                        <p className="text-sm text-slate-600">Code: {fertilizer.fertilizerId}</p>
                        <p className="text-sm text-slate-600">N-P-K: {fertilizer.n}/{fertilizer.p}/{fertilizer.k}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${fertilizer.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {fertilizer.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                        <div className="mt-3 flex flex-col gap-2">
                          <button type="button" onClick={() => handleEdit(fertilizer)} className="text-sm font-semibold text-slate-700 underline-offset-2 hover:underline">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleSoftDelete(fertilizer._id)} className="text-sm font-semibold text-rose-600 underline-offset-2 hover:underline">
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
                Showing {fertilizers.length} of {pagination.totalItems || fertilizers.length} fertilizers
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
