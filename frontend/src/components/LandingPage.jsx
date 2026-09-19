import { Link } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { TranslationContext } from '../context/TranslationContext'

export default function LandingPage() {
  const { clientBranding } = useContext(AuthContext)
  const brandName = clientBranding?.name || 'NutriMate'
  const brandLogo = clientBranding?.logo || '/images/Agriculture.png'
  const brandPrimary = clientBranding?.primaryColor || '#39b54a'
  const brandSecondary = clientBranding?.secondaryColor || '#2f9a3d'
  const { t } = useContext(TranslationContext)
  const translatedTitle = t('landing_page_hero_title') || 'Optimize Your Crop Fertilization'
  const translatedSubtitle = (t('landing_page_hero_subtitle') || '').replace('{brandName}', brandName)

  return (
    <div className="page-shell min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(57,181,74,0.16),_transparent_30%),linear-gradient(135deg,_#f4fff8_0%,_#f4faff_55%,_#fffaf0_100%)]">
      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 text-2xl font-bold" style={{ color: brandPrimary }}>
            <img src={brandLogo} alt={`${brandName} logo`} className="h-10 w-10 rounded-xl object-contain bg-white/90 p-1 shadow-sm" />
            <span>{brandName}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-slate-600 transition hover:text-green-600">
              {t ? t('features') : 'Features'}
            </a>
            <a href="#how-it-works" className="text-slate-600 transition hover:text-green-600">
              {t ? t('how_it_works') : 'How it Works'}
            </a>
            <Link
              to="/login"
              className="rounded-full px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              style={{ backgroundColor: brandPrimary }}
            >
              {t ? t('login') : 'Login'}
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50/90 px-4 py-2 shadow-sm">
          <span className="text-sm font-semibold" style={{ color: brandPrimary }}>{t('landing_page_badge')}</span>
        </div>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 lg:text-6xl">
          {translatedTitle}
        </h1>
        <p className="mx-auto mb-10 max-w-3xl text-xl text-slate-600 lg:text-2xl">
          {translatedSubtitle}
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/signup"
            className="rounded-full px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:shadow-xl"
            style={{ backgroundColor: brandPrimary }}
          >
            {t ? t('landing_page_cta_get_started') : 'Get Started Free'}
          </Link>
          <Link
            to="/about"
            className="rounded-full border-2 border-slate-300 px-8 py-4 text-lg font-semibold text-slate-900 transition hover:bg-slate-50"
            style={{ borderColor: brandSecondary }}
          >
            {t ? t('landing_page_cta_learn_more') : 'Learn More'}
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-3">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mb-2 text-4xl font-bold" style={{ color: brandPrimary }}>26</div>
          <p className="text-slate-600">{t('landing_page_stat_crop_varieties')}</p>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mb-2 text-4xl font-bold" style={{ color: brandPrimary }}>18</div>
          <p className="text-slate-600">{t('landing_page_stat_fertilizer_types')}</p>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mb-2 text-4xl font-bold" style={{ color: brandPrimary }}>100%</div>
          <p className="text-slate-600">{t('landing_page_stat_free_to_use')}</p>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="mb-16 text-center text-4xl font-bold text-slate-900">
          {t('landing_page_why_choose').replace('{brandName}', brandName)}
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-1">
            <div className="mb-4 text-4xl">📊</div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900">{t('landing_page_feature_data_title')}</h3>
            <p className="text-slate-600">{t('landing_page_feature_data_body')}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-1">
            <div className="mb-4 text-4xl">💰</div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900">{t('landing_page_feature_cost_title')}</h3>
            <p className="text-slate-600">{t('landing_page_feature_cost_body')}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-1">
            <div className="mb-4 text-4xl">🌱</div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900">{t('landing_page_feature_yield_title')}</h3>
            <p className="text-slate-600">{t('landing_page_feature_yield_body')}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-1">
            <div className="mb-4 text-4xl">⚡</div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900">{t('landing_page_feature_simple_title')}</h3>
            <p className="text-slate-600">{t('landing_page_feature_simple_body')}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-1">
            <div className="mb-4 text-4xl">📱</div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900">{t('landing_page_feature_mobile_title')}</h3>
            <p className="text-slate-600">{t('landing_page_feature_mobile_body')}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-1">
            <div className="mb-4 text-4xl">🔐</div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900">{t('landing_page_feature_secure_title')}</h3>
            <p className="text-slate-600">{t('landing_page_feature_secure_body')}</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl rounded-[32px] bg-gradient-to-r from-green-50 to-blue-50 px-6 py-20 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <h2 className="mb-16 text-center text-4xl font-bold text-slate-900">
          {t('landing_page_how_it_works_title')}
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-2xl font-bold text-white">
              1
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">{t('landing_page_step_signup_title')}</h3>
            <p className="text-slate-600">{t('landing_page_step_signup_body')}</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-2xl font-bold text-white">
              2
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">{t('landing_page_step_crop_title')}</h3>
            <p className="text-slate-600">{t('landing_page_step_crop_body')}</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-2xl font-bold text-white">
              3
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">{t('landing_page_step_details_title')}</h3>
            <p className="text-slate-600">{t('landing_page_step_details_body')}</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-2xl font-bold text-white">
              4
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">{t('landing_page_step_results_title')}</h3>
            <p className="text-slate-600">{t('landing_page_step_results_body')}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h2 className="mb-6 text-4xl font-bold text-slate-900">
          {t('landing_page_cta_banner_title')}
        </h2>
        <p className="mb-10 text-xl text-slate-600">
          {t('landing_page_cta_banner_body')}
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/signup"
            className="rounded-full bg-green-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-green-700"
          >
            {t('landing_page_cta_banner_primary')}
          </Link>
          <Link
            to="/login"
            className="rounded-full border-2 border-green-600 px-8 py-4 text-lg font-semibold text-green-600 transition hover:bg-green-50"
          >
            {t('landing_page_cta_banner_secondary')}
          </Link>
        </div>
      </section>

    </div>
  )
}
