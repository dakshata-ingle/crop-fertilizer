import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchClients, fetchFertilizerById, fetchFertilizerPriceHistory } from '../utils/api';

export default function SuperAdminFertilizerPriceHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const [fertilizer, setFertilizer] = useState(null);
  const [client, setClient] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
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
        setError(err.message || 'Unable to load fertilizer price history');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadData();
    }
  }, [token, id]);

  const chronologicalHistory = useMemo(() => {
    return [...priceHistory].sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0));
  }, [priceHistory]);

  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-2 text-sm text-slate-600">Only super administrators can view fertilizer price history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fertilizer price history</h1>
            <p className="text-sm text-slate-600">Review the full price timeline for a fertilizer in chronological order.</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/admin/fertilizers')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Back to catalog</button>
            <Link to="/admin" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading price history...</div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
        ) : fertilizer ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Current record</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{fertilizer.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">Code: {fertilizer.fertilizerId || 'N/A'}</p>
                  <p className="mt-1 text-sm text-slate-600">Client: {client ? `${client.name} (${client.code || client.email || 'client'})` : fertilizer.clientId || 'System'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current price</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">₹{fertilizer.price ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Price timeline</h3>
                <span className="text-sm text-slate-500">{chronologicalHistory.length} entries</span>
              </div>

              {chronologicalHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No price history has been recorded for this fertilizer yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {chronologicalHistory.map((entry) => (
                    <div key={entry._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : 'N/A'}</p>
                        <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{entry.updatedBy?.name || entry.updatedBy?.email || 'System'}</span>
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
        ) : null}
      </div>
    </div>
  );
}
