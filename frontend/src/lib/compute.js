import { monthKey } from "./format";
import { JENIS_PENGELUARAN } from "./api";



export function computeCashBalance(transactions, saldoAwal) {
  const delta = transactions.reduce((acc, t) => {
    return acc + (t.kategori === "Pemasukan" ? t.nominal : -t.nominal);
  }, 0);
  return (saldoAwal || 0) + delta;
}

// returns transactions sorted ascending with running balance attached
export function withRunningBalance(transactions, saldoAwal) {
  const sorted = [...transactions].sort((a, b) => {
    if (a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? -1 : 1;
    return (a.created_at || "") < (b.created_at || "") ? -1 : 1;
  });
  let bal = saldoAwal || 0;
  return sorted.map((t) => {
    bal += t.kategori === "Pemasukan" ? t.nominal : -t.nominal;
    return { ...t, saldo: bal };
  });
}

export function monthlyRecap(transactions) {
  const map = {};
  transactions.forEach((t) => {
    const k = monthKey(t.tanggal);
    if (!k) return;
    if (!map[k]) {
      map[k] = {
        bulan: k,
        pemasukan: 0,
        pengeluaran: 0,
        bahanMitra: 0,
        biayaTetapRinci: {},
        lainPengeluaran: 0,
      };
    }
    const row = map[k];
    if (t.kategori === "Pemasukan") {
      row.pemasukan += t.nominal;
    } else {
      row.pengeluaran += t.nominal;
      if (t.keterangan_tambahan === "Biaya tetap bulanan") {
        const n = t.keterangan || "Lain-lain";
        row.biayaTetapRinci[n] = (row.biayaTetapRinci[n] || 0) + t.nominal;
      } else if (t.jenis === "Bahan/Mitra") {
        row.bahanMitra += t.nominal;
      } else {
        row.lainPengeluaran += t.nominal;
      }
    }
  });
  const rows = Object.values(map).map((r) => {
    const laba = r.pemasukan - r.pengeluaran;
    const margin = r.pemasukan > 0 ? (laba / r.pemasukan) * 100 : 0;
    return { ...r, laba, margin };
  });
  return rows.sort((a, b) => (a.bulan < b.bulan ? 1 : -1)); // newest first
}

export function monthDetail(transactions, bulan) {
  const rows = monthlyRecap(transactions.filter((t) => monthKey(t.tanggal) === bulan));
  return rows[0] || {
    bulan,
    pemasukan: 0,
    pengeluaran: 0,
    bahanMitra: 0,
    biayaTetapRinci: {},
    lainPengeluaran: 0,
    laba: 0,
    margin: 0,
  };
}

export function availableMonths(transactions) {
  const set = new Set(transactions.map((t) => monthKey(t.tanggal)).filter(Boolean));
  return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
}

export const PENGELUARAN_JENIS = JENIS_PENGELUARAN;
