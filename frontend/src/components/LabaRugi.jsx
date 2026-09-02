import React, { useMemo, useState, useEffect } from "react";
import { formatRupiah, monthLabel } from "../lib/format";
import { availableMonths, monthDetail } from "../lib/compute";
import { Button } from "./ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { CheckCircle2, RotateCcw, Users } from "lucide-react";

const Row = ({ label, value, className }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-slate-600">{label}</span>
    <span className={`font-mono-num font-semibold ${className || "text-slate-800"}`}>{formatRupiah(value)}</span>
  </div>
);

export const LabaRugi = ({ transactions, profitShares, onMarkShared, onUnmarkShared }) => {
  const months = useMemo(() => availableMonths(transactions), [transactions]);
  const [bulan, setBulan] = useState(months[0] || "");

  useEffect(() => {
    if (months.length && !months.includes(bulan)) setBulan(months[0]);
  }, [months, bulan]);

  const d = useMemo(() => monthDetail(transactions, bulan), [transactions, bulan]);
  const shared = profitShares.find((p) => p.bulan === bulan);
  const bagian = d.laba > 0 ? d.laba / 2 : 0;

  if (!months.length) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400">Belum ada data transaksi</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900">Laba Rugi & Bagi Hasil</h2>
          <p className="text-sm text-slate-500">Ringkasan & pembagian 50:50 per bulan</p>
        </div>
        <Select value={bulan} onValueChange={setBulan}>
          <SelectTrigger className="w-56" data-testid="labarugi-bulan"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m) => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Ringkasan</p>
          <Row label="Total Pemasukan" value={d.pemasukan} className="text-emerald-600" />
          <div className="my-2 border-t border-dashed border-slate-200" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pengeluaran</p>
          <Row label="Bahan / Mitra" value={d.bahanMitra} className="text-red-600" />
          <Row label="KUR" value={d.kur} className="text-red-600" />
          <Row label="Internet + Listrik + Operasional" value={d.internetListrikOps} className="text-red-600" />
          {d.lainPengeluaran > 0 && <Row label="Pengeluaran Lain-lain" value={d.lainPengeluaran} className="text-red-600" />}
          <div className="my-2 border-t border-dashed border-slate-200" />
          <Row label="Total Pengeluaran" value={d.pengeluaran} className="text-red-600" />
        </div>

        <div className="flex flex-col gap-4">
          <div className={`rounded-2xl p-6 text-white ${d.laba >= 0 ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-red-500 to-red-700"}`} data-testid="profit-share-card">
            <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
              {d.laba >= 0 ? "Laba Bersih" : "Rugi Bersih"} — {monthLabel(bulan)}
            </p>
            <p className="mt-1 font-mono-num text-4xl font-bold" data-testid="laba-bersih-value">{formatRupiah(d.laba)}</p>
            <p className="mt-1 text-sm opacity-90">Margin {d.margin.toFixed(1)}%</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-slate-700">
              <Users size={18} /><p className="font-semibold">Bagi Hasil 50 : 50</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pemilik (50%)</p>
                <p className="mt-1 font-mono-num text-lg font-bold text-slate-900" data-testid="bagian-pemilik">{formatRupiah(bagian)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pengelola (50%)</p>
                <p className="mt-1 font-mono-num text-lg font-bold text-slate-900" data-testid="bagian-pengelola">{formatRupiah(bagian)}</p>
              </div>
            </div>
            {d.laba <= 0 && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                Tidak ada laba, tidak ada yang dibagi.
              </p>
            )}
            {d.laba > 0 && (
              shared ? (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={16} /> Sudah dibagi
                  </span>
                  <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => onUnmarkShared(bulan)} data-testid="unmark-shared-btn">
                    <RotateCcw size={14} className="mr-1" /> Batalkan
                  </Button>
                </div>
              ) : (
                <Button
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => onMarkShared({ bulan, laba_bersih: d.laba, bagian_pemilik: bagian, bagian_pengelola: bagian })}
                  data-testid="mark-shared-btn"
                >
                  <CheckCircle2 size={16} className="mr-1" /> Tandai Sudah Dibagi
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {profitShares.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Histori Bagi Hasil</p>
          <div className="space-y-2">
            {[...profitShares].sort((a, b) => (a.bulan < b.bulan ? 1 : -1)).map((p) => (
              <div key={p.bulan} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm" data-testid={`share-history-${p.bulan}`}>
                <span className="font-medium text-slate-700">{monthLabel(p.bulan)}</span>
                <span className="font-mono-num text-slate-600">
                  Pemilik {formatRupiah(p.bagian_pemilik)} · Pengelola {formatRupiah(p.bagian_pengelola)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
