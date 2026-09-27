import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (savedToken && savedToken !== 'undefined' && savedToken !== 'null') {
      setToken(savedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          setUser({ email: 'ahmed@epicerie.tn', name: 'Ahmed' });
        }
      } else {
        setUser({ email: 'ahmed@epicerie.tn', name: 'Ahmed' });
      }
    } else {
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const authToken = response.data?.access_token || response.data?.token;
      const userData = response.data?.user || { email, name: email.split('@')[0] };

      if (authToken) {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
        return true;
      }
      throw new Error("Token non reçu de l'API");
    } catch (error) {
      console.warn("API login failed, checking demo credentials...", error);

      // Failsafe pour le hackathon démo
      if (email.trim() === 'ahmed@epicerie.tn' && password.trim() === 'demo123') {
        const fallbackToken = 'demo-jwt-smartstock-tn-token';
        const fallbackUser = { email: 'ahmed@epicerie.tn', name: 'Ahmed', role: 'user' };
        localStorage.setItem('token', fallbackToken);
        localStorage.setItem('user', JSON.stringify(fallbackUser));
        setToken(fallbackToken);
        setUser(fallbackUser);
        return true;
      }

      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
