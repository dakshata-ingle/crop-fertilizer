import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchClients, createClient, updateClient, updateClientStatus, toggleClientActiveStatus, createClientAdmin } from '../utils/api';
import { Link } from 'react-router-dom';

const generateClientCode = (name) => {
  const normalized = (name || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();

  return normalized.slice(0, 24);
};

export default function Clients() {
  const { token } = useContext(AuthContext);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const emptyClientForm = { name: '', code: '', email: '', phone: '', address: '' };
  const [logoFile, setLogoFile] = useState(null);
  const [formState, setFormState] = useState(emptyClientForm);
  const [editingClientId, setEditingClientId] = useState(null);
  const [adminFormState, setAdminFormState] = useState({ name: '', email: '', phone: '', village: '', password: '', confirmPassword: '', clientId: '' });
  const [workflowStep, setWorkflowStep] = useState(1);
  const [clientCodeLocked, setClientCodeLocked] = useState(false);
  const [selectedClientForAdmin, setSelectedClientForAdmin] = useState(null);
  const [success, setSuccess] = useState(null);
  const [adminSuccess, setAdminSuccess] = useState(null);
  const [adminError, setAdminError] = useState(null);

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClients(token, { search, status: statusFilter, isActive: activeFilter, sortBy, sortOrder, page, limit: pageSize });
        setClients(data.clients || []);
        setPagination(data.pagination || { page: 1, limit: pageSize, totalItems: data.count || 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
      } catch (err) {
        setError(err.message || 'Unable to fetch clients');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadClients();
    }
  }, [token, search, statusFilter, activeFilter, sortBy, sortOrder, page, pageSize]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormState((prev) => {
      const nextState = { ...prev, [name]: value };

      if (name === 'name' && !editingClientId && !clientCodeLocked) {
        nextState.code = generateClientCode(value);
      }

      if (name === 'code') {
        setClientCodeLocked(true);
      }

      return nextState;
    });
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminFormState((prev) => ({ ...prev, [name]: value }));
  };

  const resetClientForm = () => {
    setFormState(emptyClientForm);
    setLogoFile(null);
    setEditingClientId(null);
    setClientCodeLocked(false);
  };

  const handleEdit = (client) => {
    setWorkflowStep(1);
    setSelectedClientForAdmin(null);
    setEditingClientId(client._id || client.id);
    setFormState({
      name: client.name || '',
      code: client.code || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const payload = new FormData();
      Object.entries(formState).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          payload.append(key, value);
        }
      });
      if (logoFile) {
        payload.append('logo', logoFile);
      }

      if (editingClientId) {
        const data = await updateClient(token, editingClientId, payload);
        setClients((prev) => prev.map((client) => ((client._id || client.id) === editingClientId ? data.client : client)));
        setSuccess(data.message || 'Client updated successfully.');
        setSelectedClientForAdmin(null);
      } else {
        const data = await createClient(token, payload);
        setClients((prev) => [data.client, ...prev]);
        setSuccess(data.message || 'Client created successfully.');
        setWorkflowStep(2);
        setSelectedClientForAdmin(data.client);
        setAdminFormState((prev) => ({ ...prev, clientId: data.client._id || data.client.id }));
      }
      resetClientForm();
    } catch (err) {
      setError(err.message || (editingClientId ? 'Unable to update client' : 'Unable to create client'));
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);

    try {
      const data = await createClientAdmin(token, adminFormState);
      setAdminSuccess(data.message || 'Client admin created successfully.');
      setAdminFormState({ name: '', email: '', phone: '', village: '', password: '', confirmPassword: '', clientId: '' });
    } catch (err) {
      setAdminError(err.message || 'Unable to create client admin');
    }
  };

  const handleStatusChange = async (clientId, status) => {
    setError(null);
    setSuccess(null);

    try {
      const data = await updateClientStatus(token, clientId, status);
      setClients((prev) => prev.map((client) => ((client._id || client.id) === clientId ? { ...client, status: data.client?.status || status } : client)));
      setSuccess(data.message || 'Client status updated successfully.');
    } catch (err) {
      setError(err.message || 'Unable to update client status');
    }
  };

  const handleActiveToggle = async (clientId, isActive) => {
    setError(null);
    setSuccess(null);

    try {
      const data = await toggleClientActiveStatus(token, clientId, isActive);
      setClients((prev) => prev.map((client) => ((client._id || client.id) === clientId ? { ...client, isActive: data.client?.isActive ?? isActive, status: data.client?.status || (isActive ? 'pending' : 'inactive') } : client)));
      setSuccess(data.message || (isActive ? 'Client reactivated successfully.' : 'Client deactivated successfully.'));
    } catch (err) {
      setError(err.message || 'Unable to update client active status');
    }
  };

  const startNewClientWorkflow = () => {
    resetClientForm();
    setWorkflowStep(1);
    setSelectedClientForAdmin(null);
    setAdminFormState({ name: '', email: '', phone: '', village: '', password: '', confirmPassword: '', clientId: '' });
    setAdminSuccess(null);
    setAdminError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Client Management</h1>
            <p className="text-sm text-slate-600">View and add clients using backend APIs.</p>
          </div>
          <Link to="/admin" className="text-sm font-semibold text-white bg-slate-900 px-4 py-2 rounded-lg">
            Back to Dashboard
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">Clients</p>
                <h2 className="text-2xl font-bold text-slate-900">All clients</h2>
              </div>
              <span className="text-sm font-medium text-slate-500">Total {clients.length}</span>
            </div>

            <div className="mb-6 grid gap-3 md:grid-cols-4">
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Search client"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              />
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="inactive">Inactive</option>
              </select>
              <select value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                <option value="">All activity</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <div className="flex gap-2">
                <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                  <option value="createdAt">Created</option>
                  <option value="name">Name</option>
                  <option value="code">Code</option>
                  <option value="status">Status</option>
                </select>
                <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                  <option value="desc">↓</option>
                  <option value="asc">↑</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-500">Loading clients...</div>
            ) : error ? (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700">{error}</div>
            ) : clients.length === 0 ? (
              <div className="py-16 text-center text-slate-500">No clients found.</div>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client._id || client.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{client.name}</h3>
                        <p className="text-sm text-slate-600">{client.code}</p>
                      </div>
                      <div className="text-sm text-slate-500">
                        <p>{client.email}</p>
                        <p>{client.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${client.isActive === false || client.status === 'inactive' ? 'bg-slate-200 text-slate-700' : client.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : client.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {client.isActive === false || client.status === 'inactive' ? 'Inactive' : client.status || 'pending'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(client._id || client.id, 'approved')}
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(client._id || client.id, 'rejected')}
                          className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActiveToggle(client._id || client.id, !(client.isActive === false || client.status === 'inactive'))}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${client.isActive === false || client.status === 'inactive' ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                          {client.isActive === false || client.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(client)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    {client.address && <p className="mt-3 text-sm text-slate-600">{client.address}</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                Showing {clients.length} of {pagination.totalItems || clients.length} clients
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                >
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

          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">Client onboarding</p>
                  <h2 className="text-2xl font-bold text-slate-900">Guided two-step workflow</h2>
                  <p className="mt-2 text-sm text-slate-600">Create the client first, then add the first client admin automatically.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Step</p>
                  <p className="text-lg font-semibold text-slate-900">{workflowStep === 2 ? '2 of 2' : '1 of 2'}</p>
                </div>
              </div>

              {success && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-700">{success}</div>}
              {error && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700">{error}</div>}

              <div className="grid gap-3 sm:grid-cols-2 mb-6">
                <div className={`rounded-2xl border px-4 py-3 ${workflowStep === 1 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step 1</p>
                  <p className="font-semibold text-slate-900">Create client</p>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${workflowStep === 2 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step 2</p>
                  <p className="font-semibold text-slate-900">Create client admin</p>
                </div>
              </div>

              {workflowStep === 1 ? (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Name</label>
                    <input
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-slate-700">Code</label>
                      <span className="text-xs text-slate-500">Auto-generated from client name</span>
                    </div>
                    <input
                      name="code"
                      value={formState.code}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Phone</label>
                    <input
                      name="phone"
                      value={formState.phone}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Client logo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setLogoFile(event.target.files?.[0] || null)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Address</label>
                    <textarea
                      name="address"
                      value={formState.address}
                      onChange={handleChange}
                      rows="3"
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-white font-semibold hover:bg-slate-800 transition"
                    >
                      {editingClientId ? 'Update Client' : 'Create Client'}
                    </button>
                    {editingClientId && (
                      <button
                        type="button"
                        onClick={resetClientForm}
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-semibold">Client created</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-900">{selectedClientForAdmin?.name || formState.name || 'New client'}</p>
                    <p className="text-sm text-emerald-700">Client code: {selectedClientForAdmin?.code || formState.code || '—'}</p>
                  </div>

                  {adminSuccess && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-700">{adminSuccess}</div>}
                  {adminError && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700">{adminError}</div>}

                  <form className="space-y-4" onSubmit={handleAdminSubmit}>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Full name</label>
                      <input
                        name="name"
                        value={adminFormState.name}
                        onChange={handleAdminChange}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Email</label>
                      <input
                        name="email"
                        type="email"
                        value={adminFormState.email}
                        onChange={handleAdminChange}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Phone</label>
                      <input
                        name="phone"
                        value={adminFormState.phone}
                        onChange={handleAdminChange}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Village</label>
                      <input
                        name="village"
                        value={adminFormState.village}
                        onChange={handleAdminChange}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                      />
                    </div>
                    <input type="hidden" name="clientId" value={adminFormState.clientId} />
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      This admin will be linked to <span className="font-semibold text-slate-900">{selectedClientForAdmin?.name || 'the newly created client'}</span>.
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Password</label>
                      <input
                        name="password"
                        type="password"
                        value={adminFormState.password}
                        onChange={handleAdminChange}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Confirm password</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        value={adminFormState.confirmPassword}
                        onChange={handleAdminChange}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setWorkflowStep(1)}
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold hover:bg-emerald-700 transition"
                      >
                        Create Client Admin
                      </button>
                    </div>
                  </form>

                  <button
                    type="button"
                    onClick={startNewClientWorkflow}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Create another client
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
