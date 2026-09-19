import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { TranslationContext } from '../context/TranslationContext';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loginType, setLoginType] = useState(() => {
    try {
      const storedType = localStorage.getItem('loginType') || 'farmer';
      if (storedType === 'admin') return 'super_admin';
      if (storedType === 'superadmin') return 'super_admin';
      return storedType;
    } catch {
      return 'farmer';
    }
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated, user, clientBranding } = useContext(AuthContext);
  const brandName = clientBranding?.name || 'NutriMate';
  const brandPrimary = clientBranding?.primaryColor || '#39b54a';
  const brandSecondary = clientBranding?.secondaryColor || '#2f9a3d';
  const { t } = useContext(TranslationContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = t('auth_email_required') || 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth_email_invalid') || 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = t('auth_password_required') || 'Password is required';
    }
    return newErrors;
  };

  useEffect(() => {
    try {
      localStorage.setItem('loginType', loginType);
    } catch {
      // ignore storage failures
    }
  }, [loginType]);

  useEffect(() => {
    const titleLabel = loginType === 'super_admin'
      ? (t('super_admin_login') || 'Super Admin Login')
      : loginType === 'client_admin'
        ? (t('client_admin_login') || 'Client Admin Login')
        : (t('farmer_login') || 'Farmer Login');
    document.title = `${titleLabel} - ${brandName}`;
    return () => {
      document.title = brandName;
    };
  }, [loginType, brandName, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const normalizedType = loginType === 'admin' ? 'super_admin' : loginType;
    const result = await login(formData.email, formData.password, normalizedType);
    if (result.success) {
      if (normalizedType === 'super_admin') {
        navigate('/admin', { replace: true });
      } else if (normalizedType === 'client_admin') {
        navigate('/client-admin', { replace: true });
      } else if (normalizedType === 'farmer') {
        navigate('/farmer', { replace: true });
      } else {
        navigate('/calculator', { replace: true });
      }
    }
  };

  return (
    <div className="page-shell min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(57,181,74,0.16),_transparent_36%),linear-gradient(135deg,_#f7fff8_0%,_#f4faff_56%,_#fdfcf2_100%)] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto flex max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-[0_38px_90px_rgba(15,23,42,0.16)] backdrop-blur-xl xl:flex-row">
        <div className="auth-illustration relative flex flex-1 flex-col justify-between p-8 sm:p-10 lg:p-12">
          <div className="relative z-10">
            <div className="theme-pill inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: brandPrimary }} />
              {brandName}
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {loginType === 'super_admin' ? (t ? t('super_admin_login') : 'Super Admin Login') : loginType === 'client_admin' ? (t ? t('client_admin_login') : 'Client Admin Login') : (t ? t('farmer_login') : 'Farmer Login')}
            </h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-slate-700">
              {t ? t('select_login_type') : 'Select login type and sign in to continue'}
            </p>
          </div>

          <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{t ? t('farmer_login') : 'Farmer Login'}</p>
              <p className="mt-1 text-sm text-slate-600">{t ? t('login_page_current_type') : 'Current access mode'}</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-slate-950/90 px-4 py-4 text-white shadow-sm">
              <p className="text-sm font-semibold">{brandName}</p>
              <p className="mt-1 text-sm text-slate-300">{t ? t('app_tagline') : 'A Smart Fertilizer Advisor'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-slate-950/95 p-6 sm:p-8 lg:p-10">
          <div className="glass-panel w-full max-w-md rounded-[28px] border border-white/10 bg-white/95 p-7 shadow-2xl">
            <div className="mb-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoginType('farmer')
                  setErrors({})
                }}
                aria-pressed={loginType === 'farmer'}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${loginType === 'farmer' ? 'text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                style={loginType === 'farmer' ? { backgroundColor: brandPrimary, '--tw-ring-color': brandSecondary } : undefined}
              >
                {t ? t('farmer_login') : 'Farmer Login'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType('client_admin')
                  setErrors({})
                }}
                aria-pressed={loginType === 'client_admin'}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${loginType === 'client_admin' ? 'text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                style={loginType === 'client_admin' ? { backgroundColor: brandPrimary, '--tw-ring-color': brandSecondary } : undefined}
              >
                {t ? t('client_admin_login') : 'Client Admin Login'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType('super_admin')
                  setErrors({})
                }}
                aria-pressed={loginType === 'super_admin'}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${loginType === 'super_admin' ? 'text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                style={loginType === 'super_admin' ? { backgroundColor: brandPrimary, '--tw-ring-color': brandSecondary } : undefined}
              >
                {t ? t('super_admin_login') : 'Super Admin Login'}
              </button>
            </div>



            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('signup_page_email_address')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-2 ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
                  style={{ '--tw-ring-color': brandPrimary }}
                  placeholder={t('login_page_placeholder_email') || 'you@example.com'}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('signup_page_password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border px-4 py-3 pr-12 text-sm shadow-sm outline-none transition focus:ring-2 ${errors.password ? 'border-red-400' : 'border-slate-200'}`}
                    style={{ '--tw-ring-color': brandPrimary }}
                    placeholder={t('login_page_placeholder_password') || '••••••••'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-500 transition hover:text-slate-700"
                    aria-label={showPassword ? t('generic_hide_password') || 'Hide password' : t('generic_show_password') || 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: brandPrimary }}
              >
                {loading ? (t ? t('logging_in') : 'Logging in...') : (t ? t('login') : 'Login')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              {loginType === 'farmer' ? (
                <>
                  {t ? t('dont_have_account') : "Don't have an account?"}{' '}
                  <Link to="/signup" className="font-semibold hover:underline" style={{ color: brandPrimary }}>
                    {t ? t('sign_up_here') : 'Sign up here'}
                  </Link>
                </>
              ) : (
                <span className="text-slate-500">
                  {t('admin_signup_not_available') || 'Admin accounts are created by system administrators only.'}
                </span>
              )}
            </p>
            {loginType === 'super_admin' && (
              <p className="mt-3 text-center text-sm text-slate-500">
                {t('login_page_super_admin_credentials')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
