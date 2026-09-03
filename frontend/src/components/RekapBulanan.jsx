import React, { useMemo, useState } from "react";
import { formatRupiah, monthLabel } from "../lib/format";
import { monthlyRecap } from "../lib/compute";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

// ── Tooltip kustom ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl text-sm space-y-1 min-w-[180px]">
      <p className="font-bold text-slate-800">{monthLabel(d.bulan)}</p>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500">Pemasukan</span>
        <span className="font-mono-num text-emerald-600 font-semibold">{formatRupiah(d.pemasukan)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500">Pengeluaran</span>
        <span className="font-mono-num text-red-500 font-semibold">{formatRupiah(d.pengeluaran)}</span>
      </div>
      <div className="border-t border-slate-100 pt-1 flex justify-between gap-4">
        <span className="text-slate-600 font-medium">Laba/Rugi</span>
        <span className={`font-mono-num font-bold ${d.laba >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatRupiah(d.laba)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500">Margin</span>
        <span className={`font-semibold ${d.laba >= 0 ? "text-emerald-600" : "text-red-500"}`}>{d.margin.toFixed(1)}%</span>
      </div>
    </div>
  );
};

// ── KPI Mini Card ────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, prev, format = "rupiah", color = "indigo" }) => {
  const delta = prev != null ? value - prev : null;
  const pct = prev > 0 ? ((delta / prev) * 100).toFixed(1) : null;
  const up = delta > 0;
  const colors = {
    emerald: "from-emerald-500 to-teal-600",
    red: "from-red-500 to-rose-600",
    indigo: "from-indigo-500 to-violet-600",
    amber: "from-amber-400 to-orange-500",
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colors[color]} p-4 text-white shadow-md`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 font-mono-num text-xl font-bold">
        {format === "rupiah" ? formatRupiah(value) : `${value.toFixed(1)}%`}
      </p>
      {delta !== null && (
        <div className="mt-1.5 flex items-center gap-1 text-xs font-medium opacity-90">
          {delta > 0 ? <ArrowUpRight size={13} /> : delta < 0 ? <ArrowDownRight size={13} /> : <Minus size={13} />}
          <span>{pct != null ? `${Math.abs(pct)}%` : "-"} vs bln lalu</span>
        </div>
      )}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
export const RekapBulanan = ({ transactions }) => {
  const allRows = useMemo(() => monthlyRecap(transactions), [transactions]);
  const [range, setRange] = useState("6");
  const [chartMode, setChartMode] = useState("bar"); // "bar" | "line"

  const rows = useMemo(() => {
    if (range === "all") return allRows;
    return allRows.slice(0, Number(range));
  }, [allRows, range]);

  // Data grafik: urut chronologis (lama → baru)
  const chartData = useMemo(
    () => [...rows].reverse().map((r) => ({
      name: monthLabel(r.bulan).split(" ")[0].slice(0, 3),
      bulan: r.bulan,
      pemasukan: r.pemasukan,
      pengeluaran: r.pengeluaran,
      laba: r.laba,
      margin: r.margin,
    })),
    [rows]
  );

  // KPI: bulan terbaru vs sebelumnya
  const cur = rows[0];
  const prev = rows[1];

  // Kumpulkan semua nama biaya tetap unik yang pernah muncul
  const allBiayaNames = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => Object.keys(r.biayaTetapRinci || {}).forEach((k) => set.add(k)));
    return Array.from(set).sort();
  }, [rows]);

  if (allRows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400">
        Belum ada data transaksi
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* KPI Cards */}
      {cur && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Pemasukan" value={cur.pemasukan} prev={prev?.pemasukan} color="emerald" />
          <KpiCard label="Pengeluaran" value={cur.pengeluaran} prev={prev?.pengeluaran} color="red" />
          <KpiCard label="Laba Bersih" value={cur.laba} prev={prev?.laba} color="indigo" />
          <KpiCard label="Margin" value={cur.margin} prev={prev?.margin} format="pct" color="amber" />
        </div>
      )}

      {/* Grafik */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Tren Keuangan</p>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
              <button
                onClick={() => setChartMode("bar")}
                className={`px-3 py-1.5 transition-colors ${chartMode === "bar" ? "bg-indigo-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
              >Batang</button>
              <button
                onClick={() => setChartMode("line")}
                className={`px-3 py-1.5 transition-colors ${chartMode === "line" ? "bg-indigo-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
              >Garis</button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            {chartMode === "bar" ? (
              <BarChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} width={42} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
                <Bar dataKey="pemasukan" name="Pemasukan" radius={[5, 5, 0, 0]} fill="#10b981" opacity={0.85} />
                <Bar dataKey="pengeluaran" name="Pengeluaran" radius={[5, 5, 0, 0]} fill="#f87171" opacity={0.85} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} width={42} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="pemasukan" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} name="Pemasukan" />
                <Line type="monotone" dataKey="pengeluaran" stroke="#f87171" strokeWidth={2.5} dot={{ r: 4, fill: "#f87171" }} name="Pengeluaran" />
                <Line type="monotone" dataKey="laba" stroke="#6366f1" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 4, fill: "#6366f1" }} name="Laba/Rugi" />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabel */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="rekap-table">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5 font-bold">Bulan</th>
                <th className="px-4 py-3.5 text-right font-bold text-emerald-600">Pemasukan</th>
                <th className="px-4 py-3.5 text-right font-bold text-slate-500">Bahan/Mitra</th>
                {/* Kolom biaya tetap boleh kosong jika tidak ada */}
                {allBiayaNames.map((n) => (
                  <th key={n} className="px-4 py-3.5 text-right font-bold text-slate-500 whitespace-nowrap">{n}</th>
                ))}
                <th className="px-4 py-3.5 text-right font-bold text-slate-500">Lain-lain</th>
                <th className="px-4 py-3.5 text-right font-bold text-red-500">Total Keluar</th>
                <th className="px-4 py-3.5 text-right font-bold">Laba/Rugi</th>
                <th className="px-4 py-3.5 text-right font-bold">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.length === 0 && (
                <tr><td colSpan={7 + allBiayaNames.length} className="px-4 py-10 text-center text-slate-400">Belum ada data</td></tr>
              )}
              {rows.map((r, idx) => (
                <tr
                  key={r.bulan}
                  className={`group font-mono-num transition-colors hover:bg-indigo-50/40 ${idx === 0 ? "bg-indigo-50/20" : ""}`}
                  data-testid={`rekap-row-${r.bulan}`}
                >
                  <td className="whitespace-nowrap px-4 py-3.5 font-sans font-semibold text-slate-800">
                    {monthLabel(r.bulan)}
                    {idx === 0 && <span className="ml-2 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">Terkini</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right text-emerald-600 font-semibold">{formatRupiah(r.pemasukan)}</td>
                  <td className="px-4 py-3.5 text-right text-slate-600">{formatRupiah(r.bahanMitra)}</td>
                  {allBiayaNames.map((n) => (
                    <td key={n} className="px-4 py-3.5 text-right text-slate-600">
                      {formatRupiah((r.biayaTetapRinci || {})[n] || 0)}
                    </td>
                  ))}
                  <td className="px-4 py-3.5 text-right text-slate-500">{formatRupiah(r.lainPengeluaran)}</td>
                  <td className="px-4 py-3.5 text-right text-red-500 font-semibold">{formatRupiah(r.pengeluaran)}</td>
                  <td className={`px-4 py-3.5 text-right font-bold ${r.laba >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    <span className="flex items-center justify-end gap-1">
                      {r.laba > 0 ? <TrendingUp size={13} /> : r.laba < 0 ? <TrendingDown size={13} /> : null}
                      {formatRupiah(r.laba)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${r.laba >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {r.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Footer: Total jika > 1 baris */}
            {rows.length > 1 && (
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 text-sm font-semibold">
                <tr>
                  <td className="px-4 py-3 text-slate-600">Total ({rows.length} bln)</td>
                  <td className="px-4 py-3 text-right font-mono-num text-emerald-600">{formatRupiah(rows.reduce((a, r) => a + r.pemasukan, 0))}</td>
                  <td className="px-4 py-3 text-right font-mono-num text-slate-600">{formatRupiah(rows.reduce((a, r) => a + r.bahanMitra, 0))}</td>
                  {allBiayaNames.map((n) => (
                    <td key={n} className="px-4 py-3 text-right font-mono-num text-slate-600">
                      {formatRupiah(rows.reduce((a, r) => a + ((r.biayaTetapRinci || {})[n] || 0), 0))}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-mono-num text-slate-500">{formatRupiah(rows.reduce((a, r) => a + r.lainPengeluaran, 0))}</td>
                  <td className="px-4 py-3 text-right font-mono-num text-red-500">{formatRupiah(rows.reduce((a, r) => a + r.pengeluaran, 0))}</td>
                  <td className={`px-4 py-3 text-right font-mono-num font-bold ${rows.reduce((a, r) => a + r.laba, 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatRupiah(rows.reduce((a, r) => a + r.laba, 0))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-400 text-xs">—</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
