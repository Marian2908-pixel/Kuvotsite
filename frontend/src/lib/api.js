import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Prices
export const getPrices = () => api.get('/prices');
export const createPrice = (data) => api.post('/prices', data);
export const updatePrice = (id, data) => api.put(`/prices/${id}`, data);
export const deletePrice = (id) => api.delete(`/prices/${id}`);
export const seedPrices = () => api.post('/prices/seed');

// Products
export const getProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Orders
export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

// Analytics
export const getAnalyticsSummary = (params) => api.get('/analytics/summary', { params });
export const getDailyAnalytics = (date) => api.get('/analytics/daily', { params: { date_str: date } });
export const getAvailableMonths = () => api.get('/analytics/months');

// Export
export const exportToExcel = (params) => {
  const queryString = new URLSearchParams(params).toString();
  window.open(`${API}/export/excel?${queryString}`, '_blank');
};

export default api;
