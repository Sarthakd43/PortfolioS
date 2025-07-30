import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  AttachMoney,
  PieChart
} from '@mui/icons-material';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [overviewResponse, alertsResponse] = await Promise.all([
          axios.get('/portfolio/overview'),
          axios.get('/portfolio/alerts')
        ]);

        setData({
          overview: overviewResponse.data,
          alerts: alertsResponse.data.alerts
        });
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const { overview, alerts } = data;
  const { overview: portfolioOverview, stocks, bonds, cashflow } = overview;

  // Prepare chart data for asset allocation
  const allocationData = {
    labels: ['Stocks', 'Bonds'],
    datasets: [
      {
        data: [stocks.currentValue, bonds.currentValue],
        backgroundColor: ['#1976d2', '#dc004e'],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'primary', trend }) => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" component="div" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend > 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'}>
                  {trend > 0 ? '+' : ''}{trend.toFixed(2)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Portfolio Value"
            value={`$${portfolioOverview.totalCurrentValue.toLocaleString()}`}
            icon={<PieChart fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Gain/Loss"
            value={`$${portfolioOverview.totalGainLoss.toLocaleString()}`}
            icon={portfolioOverview.totalGainLoss >= 0 ? <TrendingUp fontSize="large" /> : <TrendingDown fontSize="large" />}
            color={portfolioOverview.totalGainLoss >= 0 ? 'success' : 'error'}
            trend={portfolioOverview.totalReturnPercentage}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Cash Flow"
            value={`$${cashflow.netCashflow.toLocaleString()}`}
            subtitle={`Income: $${cashflow.recentIncome.toLocaleString()}`}
            icon={<AttachMoney fontSize="large" />}
            color={cashflow.netCashflow >= 0 ? 'success' : 'error'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assets"
            value={portfolioOverview.totalAssets}
            subtitle={`${stocks.count} stocks, ${bonds.count} bonds`}
            icon={<AccountBalance fontSize="large" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Asset Allocation Chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Asset Allocation
            </Typography>
            {portfolioOverview.totalCurrentValue > 0 ? (
              <Box sx={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Doughnut 
                  data={allocationData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  No assets to display
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Portfolio Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Portfolio Breakdown
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Stocks
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stocks.count} holdings
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h6">
                    ${stocks.currentValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color={stocks.gainLoss >= 0 ? 'success.main' : 'error.main'}>
                    {stocks.gainLoss >= 0 ? '+' : ''}${stocks.gainLoss.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Bonds
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {bonds.count} holdings
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h6">
                    ${bonds.currentValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color={bonds.gainLoss >= 0 ? 'success.main' : 'error.main'}>
                    {bonds.gainLoss >= 0 ? '+' : ''}${bonds.gainLoss.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {bonds.annualIncome > 0 && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Annual Bond Income
                  </Typography>
                  <Typography variant="h6" color="success.dark">
                    ${bonds.annualIncome.toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Alerts and Notifications */}
        {alerts.length > 0 && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Alerts & Notifications
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {alerts.map((alert, index) => (
                  <Chip
                    key={index}
                    label={alert.message}
                    color={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
