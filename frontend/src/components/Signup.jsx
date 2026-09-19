import { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchActiveClientsForSignup } from '../utils/api';
import { TranslationContext } from '../context/TranslationContext';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    village: '',
    registerUnder: 'individual',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerUnderOptions, setRegisterUnderOptions] = useState([]);
  const [loadingRegisterUnderOptions, setLoadingRegisterUnderOptions] = useState(false);
  const navigate = useNavigate();
  const { signup, loading, error, clientBranding } = useContext(AuthContext);
  const brandPrimary = clientBranding?.primaryColor || '#39b54a';
  const brandName = clientBranding?.name || 'NutriMate';
  const { t } = useContext(TranslationContext);

  useEffect(() => {
    const loadClients = async () => {
      setLoadingRegisterUnderOptions(true);
      try {
        const data = await fetchActiveClientsForSignup();
        setRegisterUnderOptions(data.clients || []);
      } catch {
        setRegisterUnderOptions([]);
      } finally {
        setLoadingRegisterUnderOptions(false);
      }
    };

    loadClients();
  }, []);

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

    if (!formData.name.trim()) {
      newErrors.name = t('auth_name_required') || 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('auth_name_min_length') || 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = t('auth_email_required') || 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth_email_invalid') || 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('auth_phone_required') || 'Phone number is required';
    }

    if (!formData.village.trim()) {
      newErrors.village = t('auth_village_required') || 'Village is required';
    }

    if (!formData.password) {
      newErrors.password = t('auth_password_required') || 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth_password_min_length') || 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth_confirm_password_required') || 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth_passwords_mismatch') || 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await signup(
      formData.name,
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.phone,
      formData.village,
      formData.registerUnder,
      'farmer'
    );
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="page-shell min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(57,181,74,0.16),_transparent_34%),linear-gradient(135deg,_#f5fff7_0%,_#f2f9ff_60%,_#fffaf0_100%)] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto flex max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-[0_38px_90px_rgba(15,23,42,0.16)] backdrop-blur-xl lg:flex-row">
        <div className="auth-illustration relative flex flex-1 flex-col justify-between p-8 sm:p-10 lg:p-12">
          <div className="relative z-10">
            <div className="theme-pill inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: brandPrimary }} />
              {t ? t('create_account') : 'Create account'}
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{t ? t('create_account') : 'Create Account'}</h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-slate-700">{t ? t('join_us') : 'Join us for smarter farming'}</p>
          </div>

          <div className="relative z-10 mt-8 rounded-3xl border border-white/60 bg-white/70 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{t ? t('signup_page_register_under') : 'Register under'}</p>
                <p className="text-sm text-slate-600">{t ? t('signup_page_register_helper') : 'Choose a client or sign up as an individual.'}</p>
              </div>
              <div className="rounded-2xl px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: brandPrimary }}>
                {brandName}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-slate-950/95 p-6 sm:p-8 lg:p-10">
          <div className="glass-panel w-full max-w-xl rounded-[28px] border border-white/10 bg-white/95 p-7 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('signup_page_full_name')}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-2 ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
                  style={{ '--tw-ring-color': brandPrimary }}
                  placeholder={t('signup_page_placeholder_name')}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

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
                  placeholder={t('signup_page_placeholder_email')}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-700">
                    {t('signup_page_phone_number')}
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-2 ${errors.phone ? 'border-red-400' : 'border-slate-200'}`}
                    style={{ '--tw-ring-color': brandPrimary }}
                    placeholder={t('signup_page_placeholder_phone')}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="village" className="mb-2 block text-sm font-semibold text-slate-700">
                    {t('signup_page_village')}
                  </label>
                  <input
                    type="text"
                    id="village"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-2 ${errors.village ? 'border-red-400' : 'border-slate-200'}`}
                    style={{ '--tw-ring-color': brandPrimary }}
                    placeholder={t('signup_page_placeholder_village')}
                  />
                  {errors.village && <p className="mt-1 text-sm text-red-500">{errors.village}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="registerUnder" className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('signup_page_register_under')}
                </label>
                <select
                  id="registerUnder"
                  name="registerUnder"
                  value={formData.registerUnder}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-2"
                  style={{ '--tw-ring-color': brandPrimary }}
                >
                  <option value="individual">{t('signup_page_individual_option')}</option>
                  {loadingRegisterUnderOptions ? (
                    <option value="" disabled>{t('signup_page_loading_clients')}</option>
                  ) : (
                    registerUnderOptions.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name}
                      </option>
                    ))
                  )}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  {t('signup_page_register_helper')}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                      placeholder="••••••••"
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

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">
                    {t('signup_page_confirm_password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full rounded-2xl border px-4 py-3 pr-12 text-sm shadow-sm outline-none transition focus:ring-2 ${errors.confirmPassword ? 'border-red-400' : 'border-slate-200'}`}
                      style={{ '--tw-ring-color': brandPrimary }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 transition hover:text-slate-700"
                      aria-label={showConfirmPassword ? t('generic_hide_password') || 'Hide password' : t('generic_show_password') || 'Show password'}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: brandPrimary }}
              >
                {loading ? (t ? t('creating_account') : 'Creating Account...') : (t ? t('sign_up') : 'Sign Up')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              {t ? t('already_have_account') : 'Already have an account?'}{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: brandPrimary }}>
                {t ? t('login_here') : 'Login here'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
