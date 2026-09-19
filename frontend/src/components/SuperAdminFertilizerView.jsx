import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchClients, fetchFertilizerById, fetchFertilizerPriceHistory } from '../utils/api';

export default function SuperAdminFertilizerView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const [fertilizer, setFertilizer] = useState(null);
  const [client, setClient] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFertilizer = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFertilizerById(token, id);
        setFertilizer(data.fertilizer || null);

        if (data.fertilizer?.clientId) {
          const clientData = await fetchClients(token, { page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
          const matchedClient = (clientData.clients || []).find((item) => (item._id || item.id) === data.fertilizer.clientId);
          setClient(matchedClient || null);
        }

        const historyData = await fetchFertilizerPriceHistory(token, id);
        setPriceHistory(historyData.history || []);
      } catch (err) {
        setError(err.message || 'Unable to load fertilizer');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadFertilizer();
    }
  }, [token, id]);

  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-2 text-sm text-slate-600">Only super administrators can view the system fertilizer catalog.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fertilizer details</h1>
            <p className="text-sm text-slate-600">Inspect a fertilizer record from the shared system catalog.</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/admin/fertilizers')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Back to list</button>
            <button type="button" onClick={() => navigate(`/admin/fertilizers/history/${id}`)} className="rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">Price history</button>
            <button type="button" onClick={() => navigate(`/admin/fertilizers/changes/${id}`)} className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">All changes</button>
            <Link to="/admin" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading fertilizer...</div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
        ) : fertilizer ? (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${fertilizer.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {fertilizer.status || 'Pending'}
                </span>
                <span className="text-sm text-slate-500">{fertilizer.fertilizerId}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{fertilizer.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{fertilizer.description || 'No description provided.'}</p>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-900">Assigned client:</span> {client ? `${client.name} (${client.code || client.email || 'client'})` : fertilizer.clientId || 'System'}</p>
                <p className="mt-2"><span className="font-semibold text-slate-900">Approval status:</span> {fertilizer.status || 'Pending'}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">N</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{fertilizer.n ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">P</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{fertilizer.p ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">K</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{fertilizer.k ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Price</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">₹{fertilizer.price ?? 0}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-900">Bag weight:</span> {fertilizer.bagWeight ?? 'N/A'} kg</p>
                <p><span className="font-semibold text-slate-900">Client ID:</span> {fertilizer.clientId || 'System'}</p>
                <p><span className="font-semibold text-slate-900">Created:</span> {fertilizer.createdAt ? new Date(fertilizer.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-900">Price history</h3>
                {priceHistory.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">No price changes recorded yet.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {priceHistory.map((entry) => (
                      <div key={entry._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">Effective: {entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : 'N/A'}</p>
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{entry.updatedBy?.name || 'System'}</span>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
                          <div><span className="font-semibold text-slate-900">Previous price:</span> ₹{entry.previousPrice ?? 0}</div>
                          <div><span className="font-semibold text-slate-900">New price:</span> ₹{entry.newPrice ?? 0}</div>
                          <div><span className="font-semibold text-slate-900">Updated by:</span> {entry.updatedBy?.name || entry.updatedBy?.email || 'System'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
