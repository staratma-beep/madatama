import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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

  backup: () => http.get("/backup").then((r) => r.data),
  restore: (d) => http.post("/restore", d).then((r) => r.data),
  importTransactions: (items) => http.post("/import-transactions", items).then((r) => r.data),
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
