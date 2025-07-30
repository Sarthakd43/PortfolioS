import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user] = useState({
    id: 1,
    username: 'portfolio_user',
    email: 'user@portfolio.com',
    firstName: 'Portfolio',
    lastName: 'User'
  });

  const value = {
    user,
    loading: false,
    login: () => ({ success: true }),
    register: () => ({ success: true }),
    logout: () => {}
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};