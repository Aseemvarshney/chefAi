import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chefai_user')); } catch { return null; }
  });

  const _save = (data) => {
    localStorage.setItem('chefai_token', data.access_token);
    localStorage.setItem('chefai_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  // Classic email + password login
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return _save(data);
  };

  // Classic registration
  const register = async (name, email, password, phone = null) => {
    const { data } = await api.post('/auth/register', { name, email, password, phone });
    return _save(data);
  };

  // OTP Step 1 — request OTP
  const sendOTP = async (identifier, identifierType) => {
    const { data } = await api.post('/auth/send-otp', {
      identifier,
      identifier_type: identifierType,
    });
    return data; // { message, identifier, identifier_type, is_new_user, dev_otp }
  };

  // OTP Step 2 — verify OTP and get JWT
  const verifyOTP = async (identifier, identifierType, otpCode, name = null) => {
    const { data } = await api.post('/auth/verify-otp', {
      identifier,
      identifier_type: identifierType,
      otp_code: otpCode,
      name,
    });
    return _save(data);
  };

  const logout = () => {
    localStorage.removeItem('chefai_token');
    localStorage.removeItem('chefai_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      localStorage.setItem('chefai_user', JSON.stringify(data));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, login, register, sendOTP, verifyOTP, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
