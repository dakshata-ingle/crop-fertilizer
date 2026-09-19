import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchClients, fetchFertilizerById, fetchFertilizerChangeHistory } from '../utils/api';

const fieldLabels = {
  name: 'Fertilizer Name',
  fertilizerId: 'Fertilizer Code',
  n: 'Nitrogen (N)',
  p: 'Phosphorus (P)',
  k: 'Potassium (K)',
  bagWeight: 'Bag Weight (kg)',
  price: 'Price (₹)',
  description: 'Description',
  clientId: 'Client',
  'micronutrients.sulfur': 'Sulfur',
  'micronutrients.zinc': 'Zinc',
  'micronutrients.boron': 'Boron',
  'micronutrients.iron': 'Iron',
  'micronutrients.manganese': 'Manganese',
  'micronutrients.copper': 'Copper',
  image: 'Image',
};

const formatValue = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export default function SuperAdminFertilizerChangeHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const [fertilizer, setFertilizer] = useState(null);
  const [client, setClient] = useState(null);
  const [changeHistory, setChangeHistory] = useState([]);
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

        const historyData = await fetchFertilizerChangeHistory(token, id);
        setChangeHistory(historyData.history || []);
      } catch (err) {
        setError(err.message || 'Unable to load fertilizer change history');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadData();
    }
  }, [token, id]);

  const groupedByTimestamp = useMemo(() => {
    const grouped = {};
    changeHistory.forEach((entry) => {
      const timestamp = new Date(entry.updatedAt).toISOString();
      if (!grouped[timestamp]) {
        grouped[timestamp] = [];
      }
      grouped[timestamp].push(entry);
    });
    return grouped;
  }, [changeHistory]);

  const sortedTimestamps = useMemo(() => {
    return Object.keys(groupedByTimestamp).sort((a, b) => new Date(b) - new Date(a));
  }, [groupedByTimestamp]);

  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-2 text-sm text-slate-600">Only super administrators can view fertilizer change history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fertilizer change history</h1>
            <p className="text-sm text-slate-600">Review all modifications made to this fertilizer record.</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/admin/fertilizers')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Back to catalog</button>
            <Link to="/admin" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading change history...</div>
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
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Modification timeline</h3>
                <span className="text-sm text-slate-500">{changeHistory.length} changes</span>
              </div>

              {sortedTimestamps.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No changes have been recorded for this fertilizer yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedTimestamps.map((timestamp) => {
                    const entries = groupedByTimestamp[timestamp];
                    const firstEntry = entries[0];
                    const changeTime = new Date(timestamp);

                    return (
                      <div key={timestamp} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                          <p className="text-sm font-semibold text-slate-900">{changeTime.toLocaleString()}</p>
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{firstEntry.updatedByName || firstEntry.updatedByEmail || 'System'}</span>
                        </div>
                        <div className="space-y-2">
                          {entries.map((entry, idx) => (
                            <div key={`${timestamp}-${idx}`} className="flex flex-col gap-2 rounded-lg bg-white p-3 text-sm">
                              <p className="font-semibold text-slate-900">{fieldLabels[entry.fieldName] || entry.fieldName}</p>
                              <div className="grid gap-2 sm:grid-cols-2 text-slate-600">
                                <div>
                                  <span className="font-medium text-slate-700">Previous:</span>
                                  <p className="mt-1 rounded bg-red-50 px-2 py-1 text-red-700">{formatValue(entry.previousValue)}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-slate-700">New:</span>
                                  <p className="mt-1 rounded bg-green-50 px-2 py-1 text-green-700">{formatValue(entry.newValue)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
