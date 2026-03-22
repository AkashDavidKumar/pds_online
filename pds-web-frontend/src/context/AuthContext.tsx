import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Assume backend has a /users/profile route mapping to token auth
        const { data } = await API.get('/users/profile');
        setUser(data.user || data);
      } catch (error) {
        console.error("Session expired or invalid token:", error);
        localStorage.removeItem('pds_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem('pds_token')) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (rationCardNumber: string, password: string) => {
    try {
      // 🔄 Clear any legacy session data before new login attempt
      localStorage.removeItem('pds_token');
      localStorage.removeItem('user'); 
      
      const { data } = await API.post('/users/login', { rationCardNumber, password });
      
      localStorage.setItem('pds_token', data.token);
      
      const userData = data.user || data;
      setUser(userData); 
      return { success: true, user: userData };
    } catch (error: any) {
      console.error(error);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('pds_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await API.get('/users/profile');
      setUser(data.user || data);
    } catch (err) {
      console.error("Manual refresh failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
