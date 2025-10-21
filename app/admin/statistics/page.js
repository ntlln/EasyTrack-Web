'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, MenuItem, Select, LinearProgress, useTheme, CircularProgress
} from '@mui/material';
import { Gauge } from '@mui/x-charts/Gauge';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import IconButton from '@mui/material/IconButton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

let priceToRegionMap = new Map();

async function fetchPricingData() {
  try {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getAllPricing' })
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const pricingData = data.pricing || [];
    
    priceToRegionMap.clear();
    pricingData.forEach(item => {
      if (item.price && item.region) {
        priceToRegionMap.set(Number(item.price), item.region);
      }
    });
    
    return pricingData;
  } catch (error) {
    return null;
  }
}

function detectRegionFromPrice(deliveryCharge) {
  if (!deliveryCharge || deliveryCharge <= 0) return null;
  
  const price = Number(deliveryCharge);
  
  if (priceToRegionMap.has(price)) {
    return priceToRegionMap.get(price);
  }
  
  let minDifference = Infinity;
  let closestRegion = null;
  
  for (const [pricingPrice, region] of priceToRegionMap.entries()) {
    const difference = Math.abs(price - pricingPrice);
    if (difference < minDifference) {
      minDifference = difference;
      closestRegion = region;
    }
  }
  
  if (closestRegion && minDifference <= price * 0.1) {
    return closestRegion;
  }
  
  return null;
}


const dateOptions = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'thisWeek' },
  { label: 'Last Week', value: 'lastWeek' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'This Year', value: 'thisYear' },
  { label: 'Last Year', value: 'lastYear' },
];

const statusList = [
  { id: 1, name: 'Available for Pickup' },
  { id: 2, name: 'Cancelled' },
  { id: 3, name: 'Accepted - Awaiting Pickup' },
  { id: 4, name: 'In Transit' },
  { id: 5, name: 'Delivered' },
  { id: 6, name: 'Delivery Failed' },
];

function filterByDate(contracts, filter) {
  if (filter === 'all') return contracts;
  const now = new Date();
  return contracts.filter(contract => {
    const createdAt = contract.created_at ? new Date(contract.created_at) : null;
    if (!createdAt) return false;
    switch (filter) {
      case 'today':
        return createdAt.toDateString() === now.toDateString();
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return createdAt.toDateString() === yesterday.toDateString();
      }
      case 'thisWeek': {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as first day
        firstDayOfWeek.setHours(0,0,0,0);
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23,59,59,999);
        return createdAt >= firstDayOfWeek && createdAt <= lastDayOfWeek;
      }
      case 'lastWeek': {
        const firstDayOfThisWeek = new Date(now);
        firstDayOfThisWeek.setDate(now.getDate() - now.getDay());
        firstDayOfThisWeek.setHours(0,0,0,0);
        const firstDayOfLastWeek = new Date(firstDayOfThisWeek);
        firstDayOfLastWeek.setDate(firstDayOfThisWeek.getDate() - 7);
        const lastDayOfLastWeek = new Date(firstDayOfLastWeek);
        lastDayOfLastWeek.setDate(firstDayOfLastWeek.getDate() + 6);
        lastDayOfLastWeek.setHours(23,59,59,999);
        return createdAt >= firstDayOfLastWeek && createdAt <= lastDayOfLastWeek;
      }
      case 'thisMonth':
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      case 'lastMonth': {
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        return createdAt.getMonth() === lastMonth.getMonth() && createdAt.getFullYear() === lastMonth.getFullYear();
      }
      case 'thisYear':
        return createdAt.getFullYear() === now.getFullYear();
      case 'lastYear':
        return createdAt.getFullYear() === now.getFullYear() - 1;
      default:
        return true;
    }
  });
}

export default function Page() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState("");
  const [regionData, setRegionData] = useState({});
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [regions, setRegions] = useState([]); // [{ id, region }]
  const [regionsLoading, setRegionsLoading] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const router = useRouter();

  useEffect(() => {
    async function fetchContracts() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin?action=allContracts');
        const result = await res.json();
        setContracts(result.data || []);
      } catch (err) {
        setContracts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchContracts();
  }, []);

  // Fetch pricing data on component mount
  useEffect(() => {
    async function loadPricingData() {
      const data = await fetchPricingData();
      setPricingLoaded(!!data);
    }
    loadPricingData();
  }, []);

  // Fetch pricing regions from backend source of truth
  useEffect(() => {
    async function loadRegions() {
      setRegionsLoading(true);
      try {
        const response = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getPricingRegion' })
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data.regions)) {
          setRegions(data.regions);
        } else {
          setRegions([]);
        }
      } catch (_) {
        setRegions([]);
      } finally {
        setRegionsLoading(false);
      }
    }
    loadRegions();
  }, []);

  useEffect(() => {
    if (contracts.length === 0 || !pricingLoaded) return;
    
    setGeocodingLoading(true);
    const newRegionData = {};
    
    contracts.forEach(contract => {
      if (contract.delivery_charge) {
        const detectedRegion = detectRegionFromPrice(contract.delivery_charge);
        if (detectedRegion) {
          newRegionData[contract.id] = detectedRegion;
        }
      }
    });
    
    setRegionData(newRegionData);
    setGeocodingLoading(false);
  }, [contracts, pricingLoaded]);

  const filteredContracts = filterByDate(contracts, dateFilter);
  const totalDeliveries = 50;
  const successfulDeliveries = filteredContracts.filter(c => c.contract_status?.status_name === 'Delivered').length;
  const failedDeliveries = filteredContracts.filter(c => c.contract_status?.status_name === 'Delivery Failed').length;
  const successRate = totalDeliveries ? Math.min(100, (successfulDeliveries / totalDeliveries) * 100) : 0;

  const deliveryTimes = filteredContracts
    .filter(c => c.pickup_at && c.delivered_at)
    .map(c => (new Date(c.delivered_at) - new Date(c.pickup_at)) / 60000)
    .filter(mins => mins > 0);
  const avgDeliveryTime = deliveryTimes.length ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length) : 0;

  const deliveriesByRegion = React.useMemo(() => {
    return (regions || []).map(r => {
      const regionName = r.region;
      const count = filteredContracts.filter(c => regionData[c.id] === regionName).length;
      return { region: regionName, count };
    });
  }, [regions, filteredContracts, regionData]);

  const statusCounts = React.useMemo(() => {
    const counts = {};
    statusList.forEach(s => { counts[s.id] = 0; });
    filteredContracts.forEach(contract => {
      if (contract.contract_status_id && counts.hasOwnProperty(contract.contract_status_id)) {
        counts[contract.contract_status_id]++;
      }
    });
    return counts;
  }, [filteredContracts]);

  async function generateGeminiInsight() {
    setInsightLoading(true);
    setInsight("");
    const stats = {
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      successRate,
      avgDeliveryTime,
      deliveriesByRegion,
      statusCounts,
      dateFilter: dateOptions.find(opt => opt.value === dateFilter)?.label || 'All Time'
    };
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'geminiInsight', params: { stats } }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const details = [
          data.error && `Error: ${data.error}`,
          data.details && `Details: ${data.details}`,
          typeof data.apiKeyPresent !== 'undefined' && `API key present: ${data.apiKeyPresent}`,
          data.apiKeyPrefix && `API key prefix: ${data.apiKeyPrefix}`,
        ].filter(Boolean).join('\n');
        setInsight(details || 'Failed to generate insight.');
        return;
      }
      setInsight(data.insight || "No insight generated.");
    } catch (err) {
      setInsight("Failed to generate insight. Please try again later.");
    }
    setInsightLoading(false);
  }

  const containerStyles = { p: 3, bgcolor: theme.palette.background.default, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' };
  const cardStyles = {
    p: 2,
    bgcolor: theme.palette.background.paper,
    borderRadius: 2,
    boxShadow: isDark ? 2 : 1,
    border: isDark ? `1px solid ${theme.palette.divider}` : undefined,
    transition: 'background 0.3s',
  };

  return (
    <Box sx={containerStyles}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, width: '100%', maxWidth: 1200 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ color: theme.palette.primary.main }}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h4" color="primary.main" fontWeight="bold">
            Statistics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ mr: 2 }}>Filter by Date:</Typography>
          <Select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 180, bgcolor: isDark ? theme.palette.background.paper : '#fff', color: theme.palette.text.primary, borderRadius: 1 }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: isDark ? theme.palette.background.paper : '#fff',
                  color: theme.palette.text.primary,
                },
              },
            }}
          >
            {dateOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </Box>
      </Box>
      <Box sx={{ mb: 3, width: '100%', maxWidth: 1200 }}>
        <Grid container spacing={2} justifyContent="center">
          {statusList.map((status) => {
            const statusFilterMap = ['', 'available', 'cancelled', 'accepted', 'transit', 'delivered', 'failed'];
            const filterValue = statusFilterMap[status.id];
            const value = totalDeliveries ? Math.min(100, Math.round((statusCounts[status.id] || 0) / totalDeliveries * 100)) : 0;
            return (
              <Grid item xs={12} sm={6} md={4} lg={2} key={status.id}>
                <Link href={`/admin/luggage-management?status=${encodeURIComponent(filterValue)}`} style={{ textDecoration: 'none' }}>
                  <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 2, width: 180, height: 180, m: 'auto', bgcolor: theme.palette.background.paper, borderRadius: 2, boxShadow: isDark ? 2 : 1, border: isDark ? `1px solid ${theme.palette.divider}` : undefined, transition: 'transform 0.2s ease-in-out', cursor: 'pointer', '&:hover': { transform: 'scale(1.02)' } }}>
                    <Typography variant="subtitle2" color="primary.main" fontWeight="bold" mb={1} textAlign="center">{status.name}</Typography>
                    <Gauge value={value} width={100} height={100} startAngle={0} endAngle={360} innerRadius="80%" outerRadius="100%" text={`${value}%`} />
                    <Typography variant="body2" color="primary.main" mt={1}>{statusCounts[status.id] || 0} / {totalDeliveries}</Typography>
                  </Card>
                </Link>
              </Grid>
            );
          })}
        </Grid>
      </Box>
      <Box sx={{ mb: 3, width: '100%', maxWidth: 1200 }}>
        <Card sx={cardStyles}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main, fontWeight: 'bold' }}>Success Rate</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <LinearProgress variant="determinate" value={successRate} sx={{ height: 16, borderRadius: 8 }} />
              </Box>
              <Typography variant="h6" sx={{ minWidth: 60, textAlign: 'right' }}>{Math.round(successRate)}%</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main, fontWeight: 'bold' }}>Average Delivery Time</Typography>
                <Typography variant="h4">{avgDeliveryTime} minutes</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main, fontWeight: 'bold' }}>Deliveries by Region</Typography>
                {regionsLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography>Loading regions...</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2} justifyContent="center" alignItems="stretch">
                    {deliveriesByRegion.map(r => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={r.region}>
                        <Card sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.background.paper, boxShadow: isDark ? 2 : 1, border: isDark ? `1px solid ${theme.palette.divider}` : undefined, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="subtitle1" color="primary.main" fontWeight="bold" sx={{ mb: 1, textAlign: 'center' }}>
                            {r.region}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                            <Typography variant="h4" sx={{ textAlign: 'center' }}>{r.count}</Typography>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Box sx={{ mb: 3, width: '100%', maxWidth: 1200 }}>
        <Card sx={cardStyles}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 1, color: theme.palette.primary.main, fontWeight: 'bold' }}>
              AI-Powered Insights
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Get AI-powered analysis of your delivery performance and actionable recommendations. Powered by Gemini Pro
            </Typography>
            <Box sx={{ p: 2, bgcolor: theme.palette.background.paper, borderRadius: 2, textAlign: 'center' }}>
              <button
                style={{
                  background: theme.palette.primary.main,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 24px',
                  fontWeight: 'bold',
                  fontSize: 16,
                  cursor: insightLoading ? 'not-allowed' : 'pointer',
                  opacity: insightLoading ? 0.7 : 1,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  margin: '0 auto 16px'
                }}
                onClick={generateGeminiInsight}
                disabled={insightLoading}
              >
                {insightLoading && (
                  <CircularProgress size={18} sx={{ color: 'primary.main' }} />
                )}
                Generate Insight
              </button>
              {insight && (
                <Box 
                  sx={{ 
                    mt: 2, 
                    color: theme.palette.text.primary, 
                    textAlign: 'left', 
                    fontSize: 16,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    p: 2,
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    borderRadius: 2
                  }}
                >
                  {insight}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
      {loading && <Typography>Loading contracts...</Typography>}
      {geocodingLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography>Processing regions...</Typography>
        </Box>
      )}
    </Box>
  );
}
