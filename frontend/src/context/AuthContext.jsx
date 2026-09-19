import { createContext, useState, useCallback, useEffect } from 'react';
import { loginUser, signupUser, fetchCurrentUser, fetchClientById } from '../utils/api';

export const AuthContext = createContext();

const DEFAULT_BRANDING = {
  name: 'NutriMate',
  logo: '/images/Agriculture.png',
  primaryColor: '#39b54a',
  secondaryColor: '#2f9a3d',
};

const normalizeBranding = (client) => ({
  name: client?.name || DEFAULT_BRANDING.name,
  logo: client?.logo || DEFAULT_BRANDING.logo,
  primaryColor: client?.primaryColor || DEFAULT_BRANDING.primaryColor,
  secondaryColor: client?.secondaryColor || DEFAULT_BRANDING.secondaryColor,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientBranding, setClientBranding] = useState(DEFAULT_BRANDING);

  const loadClientBranding = useCallback(async (authToken, clientId) => {
    if (!authToken || !clientId) {
      setClientBranding(DEFAULT_BRANDING);
      return;
    }

    try {
      const data = await fetchClientById(authToken, clientId);
      const client = data?.client || data?.data?.client || data?.data || null;
      setClientBranding(normalizeBranding(client));
    } catch {
      setClientBranding(DEFAULT_BRANDING);
    }
  }, []);

  const signup = useCallback(async (name, email, password, confirmPassword, phone, village, registerUnder = 'individual', loginType = 'farmer') => {
    setLoading(true);
    setError(null);
    try {
      const data = await signupUser(name, email, password, confirmPassword, phone, village, registerUnder, loginType);

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      await loadClientBranding(data.token, data.user?.clientId);

      return { success: true, message: data.message };
    } catch (err) {
      const message = err.message || 'Signup failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password, loginType = 'farmer') => {
    const normalizedLoginType = loginType === 'admin' ? 'super_admin' : loginType;
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser(email, password, normalizedLoginType);

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      await loadClientBranding(data.token, data.user?.clientId);

      return { success: true, message: data.message };
    } catch (err) {
      const message = err.message || 'Login failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const syncUser = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await fetchCurrentUser(token);
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          await loadClientBranding(token, data.user?.clientId);
        }
      } catch (err) {
        setUser(null);
        setToken(null);
        setClientBranding(DEFAULT_BRANDING);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [token]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    setClientBranding(DEFAULT_BRANDING);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const value = {
    user,
    token,
    role: user?.role || null,
    clientId: user?.clientId || null,
    clientBranding,
    themeColors: {
      primary: clientBranding.primaryColor,
      secondary: clientBranding.secondaryColor,
    },
    loading,
    error,
    signup,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
