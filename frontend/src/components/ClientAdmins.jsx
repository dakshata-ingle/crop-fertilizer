import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchClientAdmins, updateClientAdminStatus } from '../utils/api';

export default function ClientAdmins() {
  const { token } = useContext(AuthContext);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });

  useEffect(() => {
    const loadAdmins = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchClientAdmins(token, { search, status: statusFilter, sortBy, sortOrder, page, limit: pageSize });
        setAdmins(data.admins || []);
        setPagination(data.pagination || { page: 1, limit: pageSize, totalItems: data.count || 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
      } catch (err) {
        setError(err.message || 'Unable to fetch client admins');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadAdmins();
    }
  }, [token, search, statusFilter, sortBy, sortOrder, page, pageSize]);

  const handleStatusToggle = async (adminId, currentStatus) => {
    setActionError(null);

    try {
      const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const data = await updateClientAdminStatus(token, adminId, nextStatus);
      setAdmins((prev) => prev.map((admin) => (admin.id === adminId ? { ...admin, ...data.admin, status: data.admin.status } : admin)));
    } catch (err) {
      setActionError(err.message || 'Unable to update client admin status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Client Admins</h1>
            <p className="text-sm text-slate-600">View all client administrators and their assigned client.</p>
          </div>
          <Link to="/admin" className="text-sm font-semibold text-white bg-slate-900 px-4 py-2 rounded-lg">
            Back to Dashboard
          </Link>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">Client admins</p>
              <h2 className="text-2xl font-bold text-slate-900">All client administrators</h2>
            </div>
            <span className="text-sm font-medium text-slate-500">Total {admins.length}</span>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search admin"
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="flex gap-2">
              <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                <option value="createdAt">Created</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="clientName">Client</option>
              </select>
              <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                <option value="desc">↓</option>
                <option value="asc">↑</option>
              </select>
            </div>
          </div>

          {actionError && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700">{actionError}</div>}

          {loading ? (
            <div className="py-16 text-center text-slate-500">Loading client admins...</div>
          ) : error ? (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700">{error}</div>
          ) : admins.length === 0 ? (
            <div className="py-16 text-center text-slate-500">No client admins found.</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid gap-0 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs uppercase tracking-[0.16em] text-slate-600 sm:grid-cols-[1.4fr_1.2fr_1fr_1fr_0.8fr]">
                <span>Name</span>
                <span>Email</span>
                <span>Phone</span>
                <span>Client</span>
                <span>Status</span>
              </div>
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="grid gap-0 border-t border-slate-200 px-6 py-4 sm:grid-cols-[1.4fr_1.2fr_1fr_1fr_0.8fr] hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{admin.name}</p>
                    <p className="text-xs text-slate-600">{admin.village || '—'}</p>
                    {admin.status !== 'active' && (
                      <span className="mt-1 inline-flex w-fit rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                        Soft-deactivated
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{admin.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{admin.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{admin.clientName}</p>
                    <p className="text-xs text-slate-500">{admin.clientCode}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${admin.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {admin.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(admin.id, admin.status)}
                      className="text-sm font-semibold text-slate-700 underline-offset-2 hover:underline"
                    >
                      {admin.status === 'active' ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              Showing {admins.length} of {pagination.totalItems || admins.length} admins
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
  );
}
