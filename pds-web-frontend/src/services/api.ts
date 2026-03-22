import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5002/api', 
});

API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem('pds_token');
    if (token) {
      req.headers.Authorization = `Bearer ${token}`; 
    }
    return req;
  },
  (error) => Promise.reject(error)
);

export const downloadReceipt = async (slotId: string) => {
  try {
    const response = await API.get(`/receipt/${slotId}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TNPDS_Receipt_${slotId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

export const getInventory = () => API.get('/inventory');
export const updateInventory = (data: any) => API.put('/inventory', data);
export const getInventoryLogs = (timeframe: string) => API.get(`/inventory/logs?timeframe=${timeframe}`);

export default API;
