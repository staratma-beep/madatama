import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
});

export const getPublicProducts = async () => {
    const rs = await api.get('/public/products');
    return rs.data;
};

export const createPublicOrder = async (orderData) => {
    const rs = await api.post('/public/orders', orderData);
    return rs.data;
};

export const trackPublicOrder = async (orderId) => {
    const rs = await api.get(`/public/track/${orderId}`);
    return rs.data;
};

export const getPublicSettings = async () => {
    const rs = await api.get('/public/settings');
    return rs.data;
};

export const payPublicOrder = async (orderId, data) => {
    const rs = await api.post(`/public/orders/${orderId}/pay`, data);
    return rs.data;
};

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const rs = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return rs.data.url;
};
