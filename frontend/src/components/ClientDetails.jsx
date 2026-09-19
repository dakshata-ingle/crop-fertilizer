import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchClientById } from '../utils/api';

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadClient = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClientById(token, id);
        setClient(data.client || data?.data?.client || null);
      } catch (err) {
        setError(err.message || 'Unable to load client.');
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      loadClient();
    }
  }, [id, token]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Client Details</h1>
            <p className="text-sm text-slate-600">Review and confirm the client record from the backend.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/clients" className="text-sm font-semibold text-slate-900 bg-white border border-slate-300 px-4 py-2 rounded-lg">
              Back to Clients
            </Link>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="text-sm font-semibold text-white bg-slate-900 px-4 py-2 rounded-lg"
            >
              Dashboard
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          {loading ? (
            <div className="py-16 text-center text-slate-500">Loading client details...</div>
          ) : error ? (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700">{error}</div>
          ) : !client ? (
            <div className="py-16 text-center text-slate-500">No client details were found.</div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">Client record</p>
                <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold mb-2">Code</p>
                  <p className="text-lg font-semibold text-slate-900">{client.code}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold mb-2">Email</p>
                  <p className="text-lg font-semibold text-slate-900">{client.email}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold mb-2">Phone</p>
                  <p className="text-lg font-semibold text-slate-900">{client.phone || 'N/A'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold mb-2">Created</p>
                  <p className="text-lg font-semibold text-slate-900">{new Date(client.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {client.address && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold mb-2">Address</p>
                  <p className="text-slate-700">{client.address}</p>
                </div>
              )}
              {client.createdBy && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold mb-2">Created by</p>
                  <p className="text-slate-700">{client.createdBy.name} • {client.createdBy.email}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
