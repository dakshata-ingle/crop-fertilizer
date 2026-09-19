import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchClients } from '../utils/api';

const initialFormState = {
  name: '',
  fertilizerId: '',
  n: '',
  p: '',
  k: '',
  bagWeight: '',
  price: '',
  description: '',
  clientId: '',
  sulfur: '',
  zinc: '',
  boron: '',
  iron: '',
  manganese: '',
  copper: '',
};

export default function SuperAdminFertilizerForm({
  mode = 'create',
  initialData = null,
  onSubmit,
  submitLabel = 'Create fertilizer',
  cancelLabel = 'Cancel',
  onCancel,
  submitting = false,
  error = null,
  success = null,
}) {
  const { token } = useContext(AuthContext);
  const [formState, setFormState] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [clients, setClients] = useState([]);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await fetchClients(token, { page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
        setClients(data.clients || []);
      } catch (error) {
        console.error('Unable to load clients', error);
      }
    };

    if (token) {
      loadClients();
    }
  }, [token]);

  useEffect(() => {
    if (initialData) {
      setFormState({
        ...initialFormState,
        ...initialData,
        clientId: initialData.clientId || initialData.client?._id || '',
      });
    } else {
      setFormState(initialFormState);
    }
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValidationError(null);
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const numericFields = ['n', 'p', 'k', 'bagWeight', 'price', 'sulfur', 'zinc', 'boron', 'iron', 'manganese', 'copper'];
    const hasInvalidNumericValues = numericFields.some((field) => {
      const value = formState[field];
      return value !== '' && Number.isNaN(Number(value));
    });

    if (hasInvalidNumericValues) {
      setValidationError('Composition values must be valid numbers.');
      return;
    }

    const payload = new FormData();
    Object.entries(formState).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        payload.append(key, value);
      }
    });

    if (imageFile) {
      payload.append('image', imageFile);
    }

    await onSubmit(payload);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{mode === 'edit' ? 'Edit fertilizer' : 'Create fertilizer'}</p>
        <h2 className="text-2xl font-bold text-slate-900">{mode === 'edit' ? 'Update fertilizer details' : 'Add a fertilizer to the system catalog'}</h2>
      </div>

      {success ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{success}</div> : null}
      {error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">{error}</div> : null}
      {validationError ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-700">{validationError}</div> : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input name="name" value={formState.name} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Code</label>
            <input name="fertilizerId" value={formState.fertilizerId} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-700">N</label>
            <input name="n" type="number" min="0" value={formState.n} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">P</label>
            <input name="p" type="number" min="0" value={formState.p} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">K</label>
            <input name="k" type="number" min="0" value={formState.k} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Bag weight</label>
            <input name="bagWeight" type="number" min="0" value={formState.bagWeight} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Price</label>
            <input name="price" type="number" min="0" value={formState.price} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Client</label>
          <select name="clientId" value={formState.clientId} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client._id || client.id} value={client._id || client.id}>
                {client.name} ({client.code || client.email})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Sulfur</label>
            <input name="sulfur" type="number" min="0" value={formState.sulfur} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Zinc</label>
            <input name="zinc" type="number" min="0" value={formState.zinc} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Boron</label>
            <input name="boron" type="number" min="0" value={formState.boron} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Iron</label>
            <input name="iron" type="number" min="0" value={formState.iron} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Manganese</label>
            <input name="manganese" type="number" min="0" value={formState.manganese} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Copper</label>
            <input name="copper" type="number" min="0" value={formState.copper} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Fertilizer image</label>
          <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Description</label>
          <textarea name="description" value={formState.description} onChange={handleChange} rows="4" className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={submitting} className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
            {submitting ? 'Saving...' : submitLabel}
          </button>
          {onCancel ? (
            <button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">
              {cancelLabel}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
