import { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchClientAdminById, fetchClients, updateClientAdmin, updateClientAdminStatus } from '../utils/api';

export default function ClientAdminDetails() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formState, setFormState] = useState({ name: '', email: '', phone: '', village: '', clientId: '' });
  const [clients, setClients] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const loadAdmin = async () => {
      setLoading(true);
      setError(null);

      try {
        const [adminData, clientsData] = await Promise.all([
          fetchClientAdminById(token, id),
          fetchClients(token),
        ]);
        const currentAdmin = adminData.admin || null;
        setAdmin(currentAdmin);
        setClients(clientsData.clients || []);
        if (currentAdmin) {
          setFormState({
            name: currentAdmin.name || '',
            email: currentAdmin.email || '',
            phone: currentAdmin.phone || '',
            village: currentAdmin.village || '',
            clientId: currentAdmin.clientId || '',
          });
        }
      } catch (err) {
        setError(err.message || 'Unable to fetch client admin details');
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      loadAdmin();
    }
  }, [token, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusToggle = async () => {
    setError(null);
    setSuccess(null);
    setStatusLoading(true);

    try {
      const nextStatus = admin?.status === 'active' ? 'inactive' : 'active';
      const data = await updateClientAdminStatus(token, id, nextStatus);
      setAdmin((prev) => prev ? { ...prev, ...data.admin, status: data.admin.status } : data.admin);
      setSuccess(data.message || 'Client admin status updated.');
    } catch (err) {
      setError(err.message || 'Unable to update client admin status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const data = await updateClientAdmin(token, id, formState);
      setAdmin((prev) => prev ? { ...prev, ...data.admin } : data.admin);
      setSuccess(data.message || 'Client admin updated successfully.');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Unable to update client admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Client Admin Details</h1>
            <p className="text-sm text-slate-600">View the selected client administrator and linked client information.</p>
          </div>
          <Link to="/admin/client-admins" className="text-sm font-semibold text-white bg-slate-900 px-4 py-2 rounded-lg">
            Back to List
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">
            Loading client admin details...
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-rose-50 border border-rose-200 p-6 text-rose-700 shadow-sm">
            {error}
          </div>
        ) : !admin ? (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">
            Client admin not found.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">Client admin</p>
                  <h2 className="text-2xl font-bold text-slate-900">{admin.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStatusToggle}
                    disabled={statusLoading}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${admin?.status === 'active' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  >
                    {statusLoading ? 'Updating...' : admin?.status === 'active' ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
              </div>

              {success && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-700">{success}</div>}

              {isEditing ? (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Full name</label>
                    <input name="name" value={formState.name} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input name="email" type="email" value={formState.email} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Phone</label>
                    <input name="phone" value={formState.phone} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Village</label>
                    <input name="village" value={formState.village} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Associated client</label>
                    <select name="clientId" value={formState.clientId} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">
                      <option value="">Choose a client</option>
                      {clients.map((client) => (
                        <option key={client._id || client.id} value={client._id || client.id}>
                          {client.name} ({client.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold hover:bg-emerald-700 transition">
                    Save changes
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-sm text-slate-700">
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="font-medium text-slate-500">Email</span>
                    <span className="text-right">{admin.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="font-medium text-slate-500">Phone</span>
                    <span className="text-right">{admin.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="font-medium text-slate-500">Village</span>
                    <span className="text-right">{admin.village || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="font-medium text-slate-500">Role</span>
                    <span className="text-right">{admin.role}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="font-medium text-slate-500">Status</span>
                    <span className={`text-right font-semibold ${admin.status === 'active' ? 'text-emerald-600' : 'text-slate-600'}`}>{admin.status === 'active' ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Created</span>
                    <span className="text-right">{new Date(admin.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">Associated client</p>
                <h2 className="text-2xl font-bold text-slate-900">{admin.clientName}</h2>
              </div>

              <div className="space-y-4 text-sm text-slate-700">
                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="font-medium text-slate-500">Client code</span>
                  <span className="text-right">{admin.clientCode}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="font-medium text-slate-500">Email</span>
                  <span className="text-right">{admin.clientEmail}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="font-medium text-slate-500">Phone</span>
                  <span className="text-right">{admin.clientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Address</span>
                  <span className="text-right">{admin.clientAddress}</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
