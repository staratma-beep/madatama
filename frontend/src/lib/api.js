import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const API = `${BACKEND_URL}/api`;

const http = axios.create({ baseURL: API });

export const api = {
  getTransactions: () => http.get("/transactions").then((r) => r.data),
  createTransaction: (d) => http.post("/transactions", d).then((r) => r.data),
  updateTransaction: (id, d) => http.put(`/transactions/${id}`, d).then((r) => r.data),
  deleteTransaction: (id) => http.delete(`/transactions/${id}`).then((r) => r.data),

  getRecords: () => http.get("/records").then((r) => r.data),
  createRecord: (d) => http.post("/records", d).then((r) => r.data),
  updateRecord: (id, d) => http.put(`/records/${id}`, d).then((r) => r.data),
  settleRecord: (id) => http.post(`/records/${id}/settle`).then((r) => r.data),
  unsettleRecord: (id) => http.post(`/records/${id}/unsettle`).then((r) => r.data),
  deleteRecord: (id) => http.delete(`/records/${id}`).then((r) => r.data),

  getProfitShares: () => http.get("/profit-shares").then((r) => r.data),
  createProfitShare: (d) => http.post("/profit-shares", d).then((r) => r.data),
  deleteProfitShare: (bulan) => http.delete(`/profit-shares/${bulan}`).then((r) => r.data),

  getSettings: () => http.get("/settings").then((r) => r.data),
  updateSettings: (d) => http.put("/settings", d).then((r) => r.data),

  getFixedCosts: () => http.get("/fixed-costs").then((r) => r.data),
  createFixedCost: (d) => http.post("/fixed-costs", d).then((r) => r.data),
  updateFixedCost: (id, d) => http.put(`/fixed-costs/${id}`, d).then((r) => r.data),
  deleteFixedCost: (id) => http.delete(`/fixed-costs/${id}`).then((r) => r.data),

  getProducts: () => http.get("/products").then((r) => r.data),
  createProduct: (d) => http.post("/products", d).then((r) => r.data),
  updateProduct: (id, d) => http.put(`/products/${id}`, d).then((r) => r.data),
  deleteProduct: (id) => http.delete(`/products/${id}`).then((r) => r.data),

  getSales: () => http.get("/sales").then((r) => r.data),
  createSale: (d) => http.post("/sales", d).then((r) => r.data),
  deleteSale: (id) => http.delete(`/sales/${id}`).then((r) => r.data),
  updateSaleStatus: (id, status) => http.patch(`/sales/${id}/status`, { status_produksi: status }).then((r) => r.data),

  backup: () => http.get("/backup").then((r) => r.data),
  restore: (d) => http.post("/restore", d).then((r) => r.data),
  importTransactions: (items) => http.post("/import-transactions", items).then((r) => r.data),
  getLogs: () => http.get("/logs").then((r) => r.data),
  login: (creds) => http.post("/login", creds).then((r) => r.data),
  getPublicOrders: () => http.get("/public-orders").then((r) => r.data),
  resolvePublicOrder: (id) => http.post(`/public-orders/${id}/accept`).then((r) => r.data),
  deletePublicOrder: (id) => http.delete(`/public-orders/${id}/hard`).then((r) => r.data),
  editPublicOrder: (id, payload) => http.put(`/public-orders/${id}`, payload).then((r) => r.data),
  confirmPublicOrderPayment: (id) => http.post(`/public-orders/${id}/confirm-payment`).then((r) => r.data),
  getWebSettings: () => http.get("/web-settings").then((r) => r.data),
  updateWebSettings: (data) => http.put("/web-settings", data).then((r) => r.data),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return http.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data.url);
  },
};

export const JENIS_PEMASUKAN = [
  "Penjualan Branding",
  "Penjualan Printing",
  "Penjualan Advertising",
  "Lain-lain",
];

export const JENIS_PENGELUARAN = [
  "Bahan/Mitra",
  "KUR",
  "Internet",
  "Listrik",
  "Operasional",
  "Lain-lain",
];
