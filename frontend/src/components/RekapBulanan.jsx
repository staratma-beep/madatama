import React, { useMemo, useState } from "react";
import { formatRupiah, monthLabel } from "../lib/format";
import { monthlyRecap } from "../lib/compute";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";

export const RekapBulanan = ({ transactions }) => {
  const allRows = useMemo(() => monthlyRecap(transactions), [transactions]);
  const [range, setRange] = useState("6");

  const rows = useMemo(() => {
    if (range === "all") return allRows;
    return allRows.slice(0, Number(range));
  }, [allRows, range]);

  const chartData = useMemo(
    () => [...rows].reverse().map((r) => ({ name: monthLabel(r.bulan).split(" ")[0].slice(0, 3), laba: r.laba, bulan: r.bulan })),
    [rows]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900">Rekap Bulanan</h2>
          <p className="text-sm text-slate-500">Perbandingan performa keuangan per bulan</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-48" data-testid="rekap-range"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 bulan terakhir</SelectItem>
            <SelectItem value="6">6 bulan terakhir</SelectItem>
            <SelectItem value="12">12 bulan terakhir</SelectItem>
            <SelectItem value="all">Semua bulan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-slate-700">Tren Laba / Rugi Bersih</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} width={40} />
              <Tooltip
                formatter={(v) => [formatRupiah(v), "Laba/Rugi"]}
                labelFormatter={(l, p) => (p && p[0] ? monthLabel(p[0].payload.bulan) : l)}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Bar dataKey="laba" radius={[6, 6, 0, 0]}>
                {chartData.map((e, i) => <Cell key={i} fill={e.laba >= 0 ? "#10b981" : "#ef4444"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="rekap-table">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Bulan</th>
                <th className="px-4 py-3 text-right">Pemasukan</th>
                <th className="px-4 py-3 text-right">Bahan/Mitra</th>
                <th className="px-4 py-3 text-right">KUR</th>
                <th className="px-4 py-3 text-right">Int+List+Ops</th>
                <th className="px-4 py-3 text-right">Total Keluar</th>
                <th className="px-4 py-3 text-right">Laba/Rugi</th>
                <th className="px-4 py-3 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">Belum ada data</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.bulan} className="hover:bg-slate-50 font-mono-num" data-testid={`rekap-row-${r.bulan}`}>
                  <td className="whitespace-nowrap px-4 py-3 font-sans font-medium text-slate-800">{monthLabel(r.bulan)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{formatRupiah(r.pemasukan)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(r.bahanMitra)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(r.kur)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(r.internetListrikOps)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatRupiah(r.pengeluaran)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${r.laba >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatRupiah(r.laba)}</td>
                  <td className={`px-4 py-3 text-right ${r.laba >= 0 ? "text-emerald-600" : "text-red-600"}`}>{r.margin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
