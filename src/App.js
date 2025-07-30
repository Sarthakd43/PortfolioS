import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './components/Dashboard/Dashboard';
import Stocks from './components/Stocks/Stocks';
import Bonds from './components/Bonds/Bonds';
import Cashflow from './components/Cashflow/Cashflow';
import Portfolio from './components/Portfolio/Portfolio';
import Layout from './components/Layout/Layout';
import './App.css';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App">
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/stocks" element={<Stocks />} />
                <Route path="/bonds" element={<Bonds />} />
                <Route path="/cashflow" element={<Cashflow />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Layout>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;