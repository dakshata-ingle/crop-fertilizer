import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { TranslationContext } from '../context/TranslationContext';
import { fetchClientCrops, fetchClientFertilizers, fetchRecommendations, toggleRecommendationBookmark } from '../utils/api';

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

export default function FarmerDashboard() {
  const { token, user } = useContext(AuthContext);
  const { t } = useContext(TranslationContext);
  const [crops, setCrops] = useState([]);
  const [fertilizers, setFertilizers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityError, setActivityError] = useState(null);
  const [bookmarkingId, setBookmarkingId] = useState(null);
  const [savedPage, setSavedPage] = useState(1);
  const [cropPage, setCropPage] = useState(1);
  const [fertilizerPage, setFertilizerPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const pageSize = 4;

  const handleToggleBookmark = async (item) => {
    if (!token || !item?._id) return;

    setBookmarkingId(item._id);
    setActivityError(null);

    try {
      const response = await toggleRecommendationBookmark(token, item._id, !item.isBookmarked);
      setRecommendations((current) => current.map((entry) => (entry._id === item._id ? { ...entry, isBookmarked: response.recommendation?.isBookmarked ?? !entry.isBookmarked } : entry)));
    } catch (err) {
      setActivityError(err.message || t('farmer_dashboard_update_error') || 'Unable to update saved recommendation.');
    } finally {
      setBookmarkingId(null);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      setActivityError(null);

      try {
        const [cropsData, fertilizersData] = await Promise.all([
          fetchClientCrops(token),
          fetchClientFertilizers(token),
        ]);

        setCrops((cropsData.crops || []).filter((crop) => crop.status === 'approved'));
        setFertilizers((fertilizersData.fertilizers || []).filter((fertilizer) => fertilizer.status === 'approved'));
      } catch (err) {
        setError(err.message || t('farmer_dashboard_load_error') || 'Unable to load dashboard data.');
      }

      try {
        const recommendationsData = await fetchRecommendations(token);
        setRecommendations((recommendationsData.recommendations || []).slice(0, 4));
      } catch (err) {
        setActivityError(err.message || t('farmer_dashboard_activity_error') || 'Recent activity is unavailable right now.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadDashboardData();
    }
  }, [token]);

  if (user && user.role !== 'farmer') {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{t('farmer_dashboard_access_denied')}</h1>
          <p className="mt-2 text-sm text-slate-600">{t('farmer_dashboard_access_denied_message')}</p>
        </div>
      </div>
    );
  }

  const savedRecommendations = recommendations.filter((item) => item.isBookmarked);
  const savedTotalPages = Math.max(1, Math.ceil(savedRecommendations.length / pageSize));
  const cropTotalPages = Math.max(1, Math.ceil(crops.length / pageSize));
  const fertilizerTotalPages = Math.max(1, Math.ceil(fertilizers.length / pageSize));
  const activityTotalPages = Math.max(1, Math.ceil(recommendations.length / pageSize));
  const pagedSavedRecommendations = savedRecommendations.slice((savedPage - 1) * pageSize, savedPage * pageSize);
  const pagedCrops = crops.slice((cropPage - 1) * pageSize, cropPage * pageSize);
  const pagedFertilizers = fertilizers.slice((fertilizerPage - 1) * pageSize, fertilizerPage * pageSize);
  const pagedRecommendations = recommendations.slice((activityPage - 1) * pageSize, activityPage * pageSize);

  useEffect(() => {
    setSavedPage(1);
  }, [savedRecommendations.length]);

  useEffect(() => {
    setCropPage(1);
  }, [crops.length]);

  useEffect(() => {
    setFertilizerPage(1);
  }, [fertilizers.length]);

  useEffect(() => {
    setActivityPage(1);
  }, [recommendations.length]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-100">{t('farmer_dashboard_title')}</p>
              <h1 className="mt-2 text-3xl font-bold">{t('farmer_dashboard_welcome', { name: user?.name || 'Farmer' })}</h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50">
                {t('farmer_dashboard_intro')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/calculator" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50">
                {t('farmer_dashboard_open_calculator')}
              </Link>
              <Link to="/farmer/history" className="rounded-xl border border-white/40 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
                {t('farmer_dashboard_view_history')}
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('farmer_dashboard_profile_summary')}</p>
                <h2 className="text-2xl font-bold text-slate-900">{t('farmer_dashboard_farmer_overview')}</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">{t('farmer_dashboard_active')}</span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">{t('farmer_dashboard_full_name')}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{user?.name || t('farmer_dashboard_not_available')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">{t('farmer_dashboard_village')}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{user?.village || t('farmer_dashboard_not_provided')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">{t('farmer_dashboard_phone')}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{user?.phone || t('farmer_dashboard_not_provided')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">{t('farmer_dashboard_email')}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{user?.email || t('farmer_dashboard_not_available')}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-700">{t('farmer_dashboard_assigned_client')}</p>
              <p className="mt-1 text-lg font-semibold text-emerald-900">{user?.clientId ? t('farmer_dashboard_client_id', { clientId: user.clientId }) : t('farmer_dashboard_no_client')}</p>
              <p className="mt-2 text-sm text-emerald-700">{t('farmer_dashboard_client_message')}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('farmer_dashboard_quick_actions')}</p>
            <h2 className="text-2xl font-bold text-slate-900">{t('farmer_dashboard_what_next')}</h2>

            <div className="mt-5 space-y-3">
              <Link to="/calculator" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50">
                <div>
                  <p className="font-semibold text-slate-900">{t('farmer_dashboard_create_recommendation')}</p>
                  <p className="text-sm text-slate-600">{t('farmer_dashboard_create_recommendation_body')}</p>
                </div>
                <span className="text-lg font-semibold text-emerald-700">→</span>
              </Link>
              <Link to="/farmer/approved-crops" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50">
                <div>
                  <p className="font-semibold text-slate-900">{t('farmer_dashboard_review_crops')}</p>
                  <p className="text-sm text-slate-600">{t('farmer_dashboard_review_crops_body')}</p>
                </div>
                <span className="text-lg font-semibold text-emerald-700">→</span>
              </Link>
              <Link to="/farmer/approved-fertilizers" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50">
                <div>
                  <p className="font-semibold text-slate-900">{t('farmer_dashboard_review_fertilizers')}</p>
                  <p className="text-sm text-slate-600">{t('farmer_dashboard_review_fertilizers_body')}</p>
                </div>
                <span className="text-lg font-semibold text-emerald-700">→</span>
              </Link>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('farmer_dashboard_saved_recommendations')}</p>
              <h2 className="text-2xl font-bold text-slate-900">{t('farmer_dashboard_bookmarked_plans')}</h2>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">{savedRecommendations.length}</span>
          </div>

          {savedRecommendations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
              {t('farmer_dashboard_empty_saved')}
            </div>
          ) : (
            <div className="space-y-3">
              {pagedSavedRecommendations.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.cropName || item.crop || t('farmer_dashboard_recommendation_default') || 'Recommendation'}</h3>
                      <p className="text-sm text-slate-600">{item.fieldArea || 0} {item.areaUnit || 'acre'} • {t('farmer_dashboard_total_cost_label') || 'Total cost'}: ₹{Number(item.results?.totalCost || 0).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to="/farmer/history" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700">
                        {t('farmer_dashboard_manage')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(item)}
                        disabled={bookmarkingId === item._id}
                        className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700"
                      >
                        {bookmarkingId === item._id ? t('farmer_dashboard_saving') : t('farmer_dashboard_saved')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {savedRecommendations.length > pageSize && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  <span className="text-sm text-slate-500">Showing {Math.min(savedPage * pageSize, savedRecommendations.length)} of {savedRecommendations.length}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setSavedPage((prev) => Math.max(1, prev - 1))} disabled={savedPage === 1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                    <span className="text-sm font-medium text-slate-700">Page {savedPage} / {savedTotalPages}</span>
                    <button type="button" onClick={() => setSavedPage((prev) => prev + 1)} disabled={savedPage >= savedTotalPages} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section id="approved-crops" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('farmer_dashboard_approved_crops')}</p>
                <h2 className="text-2xl font-bold text-slate-900">{t('farmer_dashboard_crop_recommendations')}</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">{crops.length}</span>
            </div>

            {loading ? (
              <div className="py-10 text-center text-slate-500">{t('farmer_dashboard_loading_crops')}</div>
            ) : crops.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                {t('farmer_dashboard_no_crops')}
              </div>
            ) : (
              <div className="space-y-3">
                {pagedCrops.map((crop) => (
                  <div key={crop._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{crop.name}</h3>
                        <p className="text-sm text-slate-600">{t('farmer_dashboard_code_label') || 'Code'}: {crop.cropId}</p>
                        <p className="text-sm text-slate-600">{t('farmer_dashboard_npk_label') || 'N-P-K'}: {crop.npk?.n ?? 0}/{crop.npk?.p ?? 0}/{crop.npk?.k ?? 0}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{t('farmer_dashboard_approved_badge') || 'Approved'}</span>
                    </div>
                  </div>
                ))}
                {crops.length > pageSize && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <span className="text-sm text-slate-500">Showing {Math.min(cropPage * pageSize, crops.length)} of {crops.length}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setCropPage((prev) => Math.max(1, prev - 1))} disabled={cropPage === 1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                      <span className="text-sm font-medium text-slate-700">Page {cropPage} / {cropTotalPages}</span>
                      <button type="button" onClick={() => setCropPage((prev) => prev + 1)} disabled={cropPage >= cropTotalPages} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section id="approved-fertilizers" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('farmer_dashboard_approved_fertilizers')}</p>
                <h2 className="text-2xl font-bold text-slate-900">{t('farmer_dashboard_fertilizer_options')}</h2>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">{fertilizers.length}</span>
            </div>

            {loading ? (
              <div className="py-10 text-center text-slate-500">{t('farmer_dashboard_loading_fertilizers')}</div>
            ) : fertilizers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                {t('farmer_dashboard_no_fertilizers')}
              </div>
            ) : (
              <div className="space-y-3">
                {pagedFertilizers.map((fertilizer) => (
                  <div key={fertilizer._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{fertilizer.name}</h3>
                        <p className="text-sm text-slate-600">{t('farmer_dashboard_code_label') || 'Code'}: {fertilizer.fertilizerId}</p>
                        <p className="text-sm text-slate-600">{t('farmer_dashboard_npk_label') || 'N-P-K'}: {fertilizer.n}/{fertilizer.p}/{fertilizer.k}</p>
                        <p className="text-sm text-slate-600">{t('farmer_dashboard_bag_weight_label') || 'Bag weight'}: {fertilizer.bagWeight || 50} kg</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{t('farmer_dashboard_approved_badge') || 'Approved'}</span>
                    </div>
                  </div>
                ))}
                {fertilizers.length > pageSize && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <span className="text-sm text-slate-500">Showing {Math.min(fertilizerPage * pageSize, fertilizers.length)} of {fertilizers.length}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setFertilizerPage((prev) => Math.max(1, prev - 1))} disabled={fertilizerPage === 1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                      <span className="text-sm font-medium text-slate-700">Page {fertilizerPage} / {fertilizerTotalPages}</span>
                      <button type="button" onClick={() => setFertilizerPage((prev) => prev + 1)} disabled={fertilizerPage >= fertilizerTotalPages} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <section id="recent-activity" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('farmer_dashboard_recent_activity')}</p>
              <h2 className="text-2xl font-bold text-slate-900">{t('farmer_dashboard_recent_recommendations')}</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{recommendations.length}</span>
          </div>

          {activityError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700">{activityError}</div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
              {t('farmer_dashboard_empty_recent')}
            </div>
          ) : (
            <div className="space-y-3">
              {pagedRecommendations.map((recommendation) => (
                <div key={recommendation._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{recommendation.cropName || recommendation.crop || t('farmer_dashboard_recommendation_default') || 'Recommendation'}</h3>
                      <p className="text-sm text-slate-600">
                        {t('farmer_dashboard_field_size', { fieldSize: recommendation.fieldArea || 0, fieldUnit: recommendation.areaUnit || 'acre', doseType: recommendation.doseType === 'custom' ? t('farmer_dashboard_custom_dose') : t('farmer_dashboard_recommended_dose') })}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {t('farmer_dashboard_npk_target', { n: recommendation.results?.nutrients?.required?.n ?? recommendation.customDose?.n ?? 0, p: recommendation.results?.nutrients?.required?.p ?? recommendation.customDose?.p ?? 0, k: recommendation.results?.nutrients?.required?.k ?? recommendation.customDose?.k ?? 0 })}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500">
                      <p className="font-medium text-slate-700">{formatDate(recommendation.createdAt)}</p>
                      <p className="mt-1">{t('farmer_dashboard_fertilizer_option_count', { count: recommendation.selectedFertilizers?.length || 0 })}</p>
                    </div>
                  </div>
                </div>
              ))}
              {recommendations.length > pageSize && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  <span className="text-sm text-slate-500">Showing {Math.min(activityPage * pageSize, recommendations.length)} of {recommendations.length}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))} disabled={activityPage === 1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                    <span className="text-sm font-medium text-slate-700">Page {activityPage} / {activityTotalPages}</span>
                    <button type="button" onClick={() => setActivityPage((prev) => prev + 1)} disabled={activityPage >= activityTotalPages} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
