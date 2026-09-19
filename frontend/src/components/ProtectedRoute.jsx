import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, allowedRoles = ['farmer', 'super_admin'] }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  const storedUser = user || (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

  const hasToken = isAuthenticated || !!localStorage.getItem('token');
  const role = storedUser?.role;
  const isSuperAdmin = role === 'super_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = isSuperAdmin
    ? allowedRoles.includes('super_admin')
    : allowedRoles.includes(role);

  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
