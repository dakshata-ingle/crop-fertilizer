import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchRecommendations, toggleRecommendationBookmark } from '../utils/api';

const formatDate = (value) => {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return '—';
  }
};

const formatValue = (value, digits = 2) => Number(value || 0).toFixed(digits);

export default function RecommendationHistory() {
  const { token, user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarkingId, setBookmarkingId] = useState(null);

  const handleToggleBookmark = async (item) => {
    if (!token || !item?._id) return;

    setBookmarkingId(item._id);
    setError(null);

    try {
      const response = await toggleRecommendationBookmark(token, item._id, !item.isBookmarked);
      setHistory((current) => current.map((entry) => (entry._id === item._id ? { ...entry, isBookmarked: response.recommendation?.isBookmarked ?? !entry.isBookmarked } : entry)));
    } catch (err) {
      setError(err.message || 'Unable to update saved recommendation.');
    } finally {
      setBookmarkingId(null);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchRecommendations(token);
        setHistory((data.recommendations || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        setError(err.message || 'Unable to load recommendation history.');
      } finally {
        setLoading(false);
      }
    };

    if (token && user?.role === 'farmer') {
      loadHistory();
    }
  }, [token, user?.role]);

  if (user && user.role !== 'farmer') {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-2 text-sm text-slate-600">This page is available only to farmers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-100">Recommendation history</p>
              <h1 className="mt-2 text-3xl font-bold">Your saved fertilizer calculations</h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50">
                Review all fertilizer recommendations created from the calculator, including field details, total cost, and nutrient targets.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/farmer" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50">
                Back to dashboard
              </Link>
              <Link to="/calculator" className="rounded-xl border border-white/40 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
                New calculation
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Saved recommendations</p>
              <h2 className="text-2xl font-bold text-slate-900">Previous recommendations</h2>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">{history.length}</span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
              Loading your recommendation history...
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No recommendations saved yet. Use the calculator to create your first one.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <article key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.cropName || item.crop || 'Recommendation'}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.fieldArea || 0} {item.areaUnit || 'acre'} • {item.doseType === 'custom' ? 'Custom dose' : 'Recommended dose'}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Fertilizers selected: {item.selectedFertilizers?.length || 0}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500">
                      <p className="font-medium text-slate-700">{formatDate(item.createdAt)}</p>
                      <p className="mt-1">Total cost: ₹{formatValue(item.results?.totalCost || 0)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(item)}
                      disabled={bookmarkingId === item._id}
                      className={`rounded-full px-3 py-2 text-sm font-semibold ${item.isBookmarked ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
                    >
                      {bookmarkingId === item._id ? 'Saving...' : item.isBookmarked ? '★ Saved' : '☆ Save'}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">N</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{formatValue(item.results?.nutrients?.provided?.n || item.customDose?.n || 0)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">P</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{formatValue(item.results?.nutrients?.provided?.p || item.customDose?.p || 0)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">K</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{formatValue(item.results?.nutrients?.provided?.k || item.customDose?.k || 0)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
