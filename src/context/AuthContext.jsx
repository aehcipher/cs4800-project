import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('student_rental_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.get('/auth/me');
        if (mounted) setUser(data.user);
      } catch (error) {
        localStorage.removeItem('student_rental_token');
        if (mounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    bootstrap();
    return () => { mounted = false; };
  }, [token]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login: async (payload) => {
      const data = await api.post('/auth/login', payload);
      if (data.requiresMfa) return data;
      localStorage.setItem('student_rental_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    },
    register: (payload) => api.post('/auth/register', payload),
    verifyEmail: (payload) => api.post('/auth/verify-email', payload),
    logout: async () => {
      try { await api.post('/auth/logout', {}); } catch {}
      localStorage.removeItem('student_rental_token');
      setToken(null);
      setUser(null);
    }
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
