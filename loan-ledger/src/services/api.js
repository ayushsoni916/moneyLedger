import axios from 'axios';

// Base configuration for your local Node.js server
const API = axios.create({
  // baseURL: 'https://mplloid.com/money-api/api',
  baseURL: 'http://192.168.1.46:4700/api',
  timeout: 10000, // 10 seconds
});

// API Calls
export const getClients = (signal) => API.get('/clients', { signal });
export const addClient = (clientData) => API.post('/clients', clientData);
export const getClientProfile = (id) => API.get(`/clients/${id}`);

export const addLoan = (loanData) => API.post('/loans', loanData);

export const getCollections = (type, sort) => API.get(`/loans/collections?type=${type}&sort=${sort}`);
export const recordPayment = (id, paymentData) => API.patch(`/loans/${id}/pay`, paymentData);

// NEW: History API
export const getLoanHistory = (month, search) => 
  API.get(`/loans/history`, { params: { month, search } });

export const getDashboardStats = () => API.get('/loans/dashboard');


export default API;