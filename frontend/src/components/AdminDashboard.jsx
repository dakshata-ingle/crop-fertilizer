import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { TranslationContext } from '../context/TranslationContext'
import { Link } from 'react-router-dom'
import { fetchAuditLogs, fetchUsers } from '../utils/api'

export default function AdminDashboard() {
  const { user, token } = useContext(AuthContext)
  const { t } = useContext(TranslationContext)
  const [users, setUsers] = useState([])
  const [catalog, setCatalog] = useState({ crops: 0, fertilizers: 0, cropsData: [], fertilizersData: [] })
  const [reportStats, setReportStats] = useState({
    clients: 0,
    clientAdmins: 0,
    farmers: 0,
    crops: 0,
    fertilizers: 0,
    pendingApprovals: 0,
    approvedRecords: 0,
  })
  const [serviceStatus, setServiceStatus] = useState('Unknown')
  const [auditLogs, setAuditLogs] = useState([])
  const [calculations, setCalculations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [userSortBy, setUserSortBy] = useState('createdAt')
  const [userSortOrder, setUserSortOrder] = useState('desc')
  const [userPage, setUserPage] = useState(1)
  const [userPageSize, setUserPageSize] = useState(10)
  const [userPagination, setUserPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false })
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
        setError(t('admin_dashboard_auth_error') || 'Authentication token missing. Please login again.')
      }

      try {
        const [usersData, statsRes, healthRes] = await Promise.all([
          fetchUsers(token, { search: userSearch, role: userRoleFilter, sortBy: userSortBy, sortOrder: userSortOrder, page: userPage, limit: userPageSize }),
          fetch(`${API_URL}/api/admin/dashboard-stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/health`),
        ])

        const statsData = await statsRes.json()
        const healthData = await healthRes.json()
        const auditData = await fetchAuditLogs(token)

        if (!statsRes.ok) {
          throw new Error(statsData.message || t('admin_dashboard_stats_error') || 'Failed to load dashboard statistics.')
        }

        setUsers(usersData.users || [])
        setUserPagination(usersData.pagination || { page: userPage, limit: userPageSize, totalItems: usersData.count || 0, totalPages: 1, hasNextPage: false, hasPrevPage: false })
        setAuditLogs(auditData.auditLogs || [])
        const cropsArray = (statsData.cropsData || []).map((crop) => ({
          ...crop,
          id: crop.id || crop._id,
          image: crop.image || '/images/placeholder.svg',
        }))
        const fertilizersArray = (statsData.fertilizersData || []).map((fert) => ({
          ...fert,
          id: fert.id || fert._id,
        }))
        setCatalog({
          crops: statsData.stats?.crops || 0,
          fertilizers: statsData.stats?.fertilizers || 0,
          cropsData: cropsArray,
          fertilizersData: fertilizersArray,
        })
        setReportStats({
          clients: statsData.stats?.clients || 0,
          clientAdmins: statsData.stats?.clientAdmins || 0,
          farmers: statsData.stats?.farmers || 0,
          crops: statsData.stats?.crops || 0,
          fertilizers: statsData.stats?.fertilizers || 0,
          pendingApprovals: statsData.stats?.pendingApprovals || 0,
          approvedRecords: statsData.stats?.approvedRecords || 0,
        })
        setServiceStatus(healthData.status === 'ok' ? (t('admin_dashboard_status_healthy') || 'Healthy') : (t('admin_dashboard_status_degraded') || 'Degraded'))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [token, API_URL, userSearch, userRoleFilter, userSortBy, userSortOrder, userPage, userPageSize])

  const adminCount = users.filter((record) => record.role === 'super_admin').length
  const farmerCount = users.filter((record) => record.role === 'farmer').length

  const getTopCrops = () => {
    return catalog.cropsData
      .sort((a, b) => (b.npk?.n || 0) - (a.npk?.n || 0))
      .slice(0, 6)
      .map((crop) => ({
        name: crop.name,
        npk: crop.npk?.n + crop.npk?.p + crop.npk?.k,
        width: Math.min(100, ((crop.npk?.n + crop.npk?.p + crop.npk?.k) / 2020) * 100),
      }))
  }

  const getTopFertilizers = () => {
    return catalog.fertilizersData
      .sort((a, b) => ((b.n || 0) + (b.p || 0) + (b.k || 0)) - ((a.n || 0) + (a.p || 0) + (a.k || 0)))
      .slice(0, 6)
      .map((fert) => ({
        name: fert.name,
        npk: `${fert.n}-${fert.p}-${fert.k}`,
        width: Math.min(100, (((fert.n || 0) + (fert.p || 0) + (fert.k || 0)) / 100) * 100),
      }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1e2e] via-[#1a3a3a] to-[#0d2b2b] text-slate-100 py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-[#0f2b35]/70 p-8 backdrop-blur-md">
            <div className="flex items-start justify-between gap-4 mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-teal-300">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                {t('admin_dashboard_title')}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-4 leading-tight">
              {t('admin_dashboard_subtitle')}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              {t('admin_dashboard_intro')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100"
              >
                {t('admin_dashboard_open_calculator')}
              </Link>
              <Link
                to="/admin/clients"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
              >
                {t('admin_dashboard_client_management')}
              </Link>
              <Link
                to="/admin/client-admins"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
              >
                {t('admin_dashboard_client_admins')}
              </Link>
              <Link
                to="/admin/crops/pending"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
              >
                {t('admin_dashboard_crop_approvals')}
              </Link>
              <Link
                to="/admin/fertilizers/pending"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                {t('admin_dashboard_fertilizer_approvals')}
              </Link>
              <Link
                to="/admin/crops"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                {t('admin_dashboard_crop_catalog')}
              </Link>
              <Link
                to="/admin/fertilizers"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                {t('admin_dashboard_fertilizer_catalog')}
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-600 bg-slate-950/60 px-6 py-3 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-slate-400"
              >
                {t('admin_dashboard_refresh_metrics')}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-[#0d2b35]/60 p-6 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 mb-3">{t('admin_dashboard_live_status')}</p>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">{t('admin_dashboard_health_endpoint')}</p>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-2xl font-bold text-white">{serviceStatus}</p>
                  <span className="inline-flex rounded-full bg-teal-500/20 px-4 py-2 text-xs font-semibold text-teal-300">OK</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">{t('admin_dashboard_service')}</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-600">{t('admin_dashboard_crops')}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{catalog.crops}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-600">{t('admin_dashboard_fertilizers')}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{catalog.fertilizers}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-white/95 to-slate-50/90 p-6 shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('admin_dashboard_total_clients')}</p>
              <div className="h-1 w-8 rounded-full bg-teal-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{reportStats.clients}</p>
            <p className="text-xs text-slate-600 mt-3">{t('admin_dashboard_clients_summary')}</p>
          </div>

          <div className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-white/95 to-slate-50/90 p-6 shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('admin_dashboard_total_client_admins')}</p>
              <div className="h-1 w-8 rounded-full bg-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{reportStats.clientAdmins}</p>
            <p className="text-xs text-slate-600 mt-3">{t('admin_dashboard_client_admins_summary')}</p>
          </div>

          <div className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-white/95 to-slate-50/90 p-6 shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('admin_dashboard_total_farmers')}</p>
              <div className="h-1 w-8 rounded-full bg-cyan-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{reportStats.farmers}</p>
            <p className="text-xs text-slate-600 mt-3">{t('admin_dashboard_farmers_summary')}</p>
          </div>

          <div className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-white/95 to-slate-50/90 p-6 shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('admin_dashboard_pending_approvals')}</p>
              <div className="h-1 w-8 rounded-full bg-amber-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{reportStats.pendingApprovals}</p>
            <p className="text-xs text-slate-600 mt-3">{t('admin_dashboard_pending_summary')}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-white/95 to-slate-50/90 p-6 shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Crops</p>
              <div className="h-1 w-8 rounded-full bg-teal-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{reportStats.crops}</p>
            <p className="text-xs text-slate-600 mt-3">{t('admin_dashboard_crops_summary')}</p>
          </div>

          <div className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-white/95 to-slate-50/90 p-6 shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Fertilizers</p>
              <div className="h-1 w-8 rounded-full bg-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{reportStats.fertilizers}</p>
            <p className="text-xs text-slate-600 mt-3">{t('admin_dashboard_fertilizers_summary')}</p>
          </div>

          <div className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-white/95 to-slate-50/90 p-6 shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Approved records</p>
              <div className="h-1 w-8 rounded-full bg-violet-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{reportStats.approvedRecords}</p>
            <p className="text-xs text-slate-600 mt-3">{t('admin_dashboard_approved_summary')}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-white/95 to-slate-50/90 p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.24em] text-teal-600 font-semibold mb-2">{t('admin_dashboard_catalog_intensity')}</p>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('admin_dashboard_operational_ranking')}</h2>
            <div className="space-y-5">
              {getTopCrops().map((crop, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700">{crop.name}</p>
                    <p className="text-sm font-semibold text-slate-600">{crop.npk} NPK</p>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${crop.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-white/95 to-slate-50/90 p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-600 font-semibold mb-2">{t('admin_dashboard_fertilizer_balance')}</p>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('admin_dashboard_operational_ranking')}</h2>
            <div className="space-y-5">
              {getTopFertilizers().map((fert, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700">{fert.name}</p>
                    <p className="text-sm font-semibold text-slate-600">{fert.npk}</p>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${fert.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-white/95 to-slate-50/90 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-teal-600 font-semibold mb-1">{t('admin_dashboard_live_activity')}</p>
                <h2 className="text-2xl font-bold text-slate-900">{t('admin_dashboard_recent_calculation_records')}</h2>
              </div>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{t('admin_dashboard_waiting_for_usage') || 'Waiting for usage'}</span>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-600">
                {t('admin_dashboard_usage_placeholder') || 'No calculation history yet. Once users run the calculator, the latest operations will appear here automatically.'}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700/60 bg-gradient-to-br from-[#1a3a3a]/80 to-[#0d2b2b]/70 p-6 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.24em] text-teal-300 font-semibold mb-2">{t('admin_dashboard_usage_snapshot')}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-600/40 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('admin_dashboard_latest_area')}</p>
                <p className="text-lg font-bold text-white mt-2">—</p>
              </div>
              <div className="rounded-2xl border border-slate-600/40 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('admin_dashboard_latest_crop')}</p>
                <p className="text-lg font-bold text-white mt-2">—</p>
              </div>
              <div className="rounded-2xl border border-slate-600/40 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('admin_dashboard_latest_cost')}</p>
                <p className="text-lg font-bold text-white mt-2">—</p>
              </div>
              <div className="rounded-2xl border border-slate-600/40 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('admin_dashboard_status_label')}</p>
                <p className="text-lg font-bold text-white mt-2">—</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              {t('admin_dashboard_live_metrics_note') || 'The dashboard now shows only live metrics from the backend. No static content or fake activity blocks are used here.'}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-white/95 to-slate-50/90 p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">{t('admin_dashboard_audit_trail')}</p>
              <h2 className="text-3xl font-bold text-slate-900">{t('admin_dashboard_recent_admin_activity')}</h2>
            </div>
            <p className="text-sm text-slate-600">{t('admin_dashboard_latest_system_actions')}</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <div className="grid min-w-[760px] gap-0 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs uppercase tracking-[0.16em] text-slate-600 sm:grid-cols-[1.2fr_0.8fr_1fr_1.8fr_1fr]">
              <span>{t('admin_dashboard_actor')}</span>
              <span>{t('admin_dashboard_action')}</span>
              <span>{t('admin_dashboard_entity')}</span>
              <span>{t('admin_dashboard_description')}</span>
              <span>{t('admin_dashboard_time')}</span>
            </div>
            {auditLogs.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-600">{t('admin_dashboard_no_audit_records')}</div>
            ) : (
              auditLogs.map((entry) => (
                <div key={entry._id} className="grid min-w-[760px] gap-0 border-t border-slate-200 px-6 py-4 sm:grid-cols-[1.2fr_0.8fr_1fr_1.8fr_1fr] hover:bg-slate-50 transition">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.actorName || 'System'}</p>
                    <p className="text-xs text-slate-600">{entry.actorRole || '—'}</p>
                  </div>
                  <div>
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{entry.action}</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{entry.entityType}</p>
                    <p className="text-xs text-slate-600">{entry.entityName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{entry.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-white/95 to-slate-50/90 p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">{t('admin_dashboard_user_management')}</p>
              <h2 className="text-3xl font-bold text-slate-900">{t('admin_dashboard_user_count_details')}</h2>
            </div>
            <p className="text-sm text-slate-600">{t('admin_dashboard_updated_at', { stamp: new Date().toLocaleString() })}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 p-6 border border-teal-200/50">
              <p className="text-xs uppercase tracking-[0.16em] text-teal-700 font-semibold mb-2">{t('admin_dashboard_total_users')}</p>
              <p className="text-4xl font-bold text-teal-900">{users.length}</p>
              <p className="text-xs text-teal-700 mt-3">{t('admin_dashboard_all_registered_accounts')}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 border border-emerald-200/50">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-700 font-semibold mb-2">{t('admin_dashboard_total_farmers')}</p>
              <p className="text-4xl font-bold text-emerald-900">{farmerCount}</p>
              <p className="text-xs text-emerald-700 mt-3">{t('admin_dashboard_active_farmers')}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 p-6 border border-cyan-200/50">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-700 font-semibold mb-2">{t('admin_dashboard_total_client_admins')}</p>
              <p className="text-4xl font-bold text-cyan-900">{adminCount}</p>
              <p className="text-xs text-cyan-700 mt-3">{t('admin_dashboard_system_administrators')}</p>
            </div>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <input
              value={userSearch}
              onChange={(event) => { setUserSearch(event.target.value); setUserPage(1); }}
              placeholder={t('admin_dashboard_search_users')}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            />
            <select value={userRoleFilter} onChange={(event) => { setUserRoleFilter(event.target.value); setUserPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
              <option value="">{t('admin_dashboard_all_roles')}</option>
              <option value="farmer">Farmers</option>
              <option value="client_admin">Client admins</option>
              <option value="super_admin">Super admins</option>
            </select>
            <div className="flex gap-2">
              <select value={userSortBy} onChange={(event) => { setUserSortBy(event.target.value); setUserPage(1); }} className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                <option value="createdAt">Created</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="village">Village</option>
              </select>
              <select value={userSortOrder} onChange={(event) => { setUserSortOrder(event.target.value); setUserPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                <option value="desc">↓</option>
                <option value="asc">↑</option>
              </select>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-600">Showing {users.length} of {userPagination.totalItems || users.length} users</div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={userPageSize} onChange={(event) => { setUserPageSize(Number(event.target.value)); setUserPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                <option value="5">5 / page</option>
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
              </select>
              <button type="button" onClick={() => setUserPage((prev) => Math.max(1, prev - 1))} disabled={!userPagination.hasPrevPage} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                {t('admin_dashboard_previous')}
              </button>
              <span className="text-sm font-medium text-slate-700">{t('admin_dashboard_page', { current: userPagination.page, total: userPagination.totalPages })}</span>
              <button type="button" onClick={() => setUserPage((prev) => prev + 1)} disabled={!userPagination.hasNextPage} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                {t('admin_dashboard_next')}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <div className="grid min-w-[700px] gap-0 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs uppercase tracking-[0.16em] text-slate-600 sm:grid-cols-[2fr_3fr_1.5fr_1.5fr]">
              <span>{t('admin_dashboard_name')}</span>
              <span>{t('admin_dashboard_email')}</span>
              <span>{t('admin_dashboard_role')}</span>
              <span>{t('admin_dashboard_location')}</span>
            </div>
            {loading ? (
              <div className="px-6 py-8 text-center text-slate-600">{t('generic_loading') || 'Loading...'}</div>
            ) : error ? (
              <div className="px-6 py-8 text-center text-rose-600">{error}</div>
            ) : users.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-600">{t('admin_dashboard_no_users')}</div>
            ) : (
              users.map((record) => (
                <div
                  key={record.id}
                  className="grid min-w-[700px] gap-0 border-t border-slate-200 px-6 py-4 sm:grid-cols-[2fr_3fr_1.5fr_1.5fr] hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{record.name}</p>
                    <p className="text-xs text-slate-600">{record.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{record.email}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        record.role === 'super_admin'
                          ? 'bg-cyan-100 text-cyan-700'
                          : record.role === 'client_admin'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {record.role === 'super_admin' ? 'Super Admin' : record.role === 'client_admin' ? 'Client Admin' : 'Farmer'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{record.village || '—'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
