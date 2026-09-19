import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { TranslationContext } from '../context/TranslationContext';
import { fetchClientFertilizers, fetchClients } from '../utils/api';

export default function ClientAdminDashboard() {
  const { token, user } = useContext(AuthContext);
  const { t } = useContext(TranslationContext);
  const [client, setClient] = useState(null);
  const [fertilizers, setFertilizers] = useState([]);
  const [stats, setStats] = useState({ farmers: 0, crops: 0, fertilizers: 0, pendingSubmissions: 0, approvedRecords: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!token) {
        setError('Authentication token missing. Please login again.');
        setLoading(false);
        return;
      }

      try {
        const [clientsData, fertilizersData, statsRes] = await Promise.all([
          fetchClients(token),
          fetchClientFertilizers(token),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/client-admin/dashboard-stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const assignedClient = (clientsData.clients || [])[0] || null;
        const statsData = await statsRes.json();
        setClient(assignedClient);
        setFertilizers(fertilizersData.fertilizers || []);
        if (statsRes.ok && statsData.success) {
          setStats(statsData.stats || { farmers: 0, crops: 0, fertilizers: 0, pendingSubmissions: 0, approvedRecords: 0 });
        }
      } catch (err) {
        setError(err.message || 'Unable to load your client dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [token]);

  const summary = useMemo(() => {
    const approved = fertilizers.filter((item) => item.status === 'approved').length;
    const pending = fertilizers.filter((item) => item.status !== 'approved').length;
    const active = fertilizers.filter((item) => item.isActive !== false).length;

    return {
      total: fertilizers.length,
      approved,
      pending,
      active,
    };
  }, [fertilizers]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('client_admin_dashboard_title')}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{t('client_admin_dashboard_welcome', { name: user?.name || 'Admin' })}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {t('client_admin_dashboard_intro')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/client-admin/crops" className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              {t('client_admin_dashboard_manage_crops')}
            </Link>
            <Link to="/client-admin/fertilizers" className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              {t('client_admin_dashboard_manage_fertilizers')}
            </Link>
            <Link to="/" className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              {t('client_admin_dashboard_open_calculator')}
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('client_admin_dashboard_assigned_client')}</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{client?.name || t('client_admin_dashboard_your_client')}</h2>
              </div>
              {client?.code ? <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{client.code}</span> : null}
            </div>

            {loading ? (
              <div className="mt-6 text-sm text-slate-500">Loading client details...</div>
            ) : client ? (
              <div className="mt-6 space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t('client_admin_dashboard_client_details')}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-semibold text-slate-900">{client.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('client_admin_dashboard_status')}</p>
                      <p className="font-semibold text-slate-900">{client.status || 'active'}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                  {t('client_admin_dashboard_access_message')}
                </div>
              </div>
            ) : (
              <div className="mt-6 text-sm text-slate-500">{t('client_admin_dashboard_no_assigned_client') || 'No assigned client was found for your account.'}</div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('client_admin_dashboard_snapshot')}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{t('client_admin_dashboard_total_farmers')}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.farmers}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{t('client_admin_dashboard_crops')}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.crops}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{t('client_admin_dashboard_fertilizers')}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.fertilizers}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{t('client_admin_dashboard_pending_submissions')}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.pendingSubmissions}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                <p className="text-sm text-slate-500">{t('client_admin_dashboard_approved_records')}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.approvedRecords}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('client_admin_dashboard_recent_fertilizers')}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{t('client_admin_dashboard_records')}</h2>
            </div>
            <Link to="/client-admin/fertilizers" className="text-sm font-semibold text-slate-700 underline-offset-2 hover:underline">
              {t('client_admin_dashboard_view_all')}
            </Link>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500">{t('client_admin_dashboard_loading_fertilizers')}</div>
          ) : fertilizers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              {t('client_admin_dashboard_no_fertilizers')}
            </div>
          ) : (
            <div className="space-y-3">
              {fertilizers.slice(0, 6).map((fertilizer) => (
                <div key={fertilizer._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{fertilizer.name}</p>
                    <p className="text-sm text-slate-600">Code: {fertilizer.fertilizerId || '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${fertilizer.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {fertilizer.status === 'approved' ? (t('client_admin_dashboard_approved_badge') || 'Approved') : (t('client_admin_dashboard_pending_badge') || 'Pending')}
                    </span>
                    <span className="text-sm text-slate-600">N-P-K: {fertilizer.n}/{fertilizer.p}/{fertilizer.k}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
