import React, { useMemo, useState, useEffect } from "react";
import { formatRupiah, monthLabel, monthKey } from "../lib/format";
import { availableMonths, monthDetail } from "../lib/compute";
import { Button } from "./ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { CheckCircle2, RotateCcw, Users, PiggyBank, ChevronDown, ChevronUp, PieChart, TrendingUp, TrendingDown } from "lucide-react";

const Row = ({ label, value, className, sub }) => (
  <div className="flex flex-wrap items-center justify-between py-2.5 border-b border-slate-100/80 last:border-0 hover:bg-slate-50 px-3 -mx-3 rounded-lg transition-colors">
    <span className="text-[13px] font-medium text-slate-600">
      {label}
      {sub && <span className="ml-1 text-xs text-slate-400">({sub})</span>}
    </span>
    <span className={`text-sm tabular-nums font-bold tracking-tight ${className || "text-slate-800"}`}>{formatRupiah(value)}</span>
  </div>
);

const SliderRow = ({ label, value, onChange, min = 10, max = 100, step = 5, color = "indigo" }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600 font-medium">{label}</span>
      <span className={`font-bold text-${color}-700 tabular-nums`}>{value}%</span>
    </div>
    <input
      type="range" min={min} max={max} step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full accent-${color}-600 h-1.5`}
    />
  </div>
);

export const LabaRugi = ({ transactions, sales = [], profitShares, onMarkShared, onUnmarkShared }) => {
  const months = useMemo(() => availableMonths(transactions), [transactions]);
  const [bulan, setBulan] = useState(months[0] || "");
  const [distribusiPct, setDistribusiPct] = useState(80);
  const [pemilikPct, setPemilikPct] = useState(50);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (months.length && !months.includes(bulan)) setBulan(months[0]);
  }, [months, bulan]);

  const pengelolaPct = 100 - pemilikPct;

  const handlePemilikChange = (val) => {
    if (val < 10) val = 10;
    if (val > 90) val = 90;
    setPemilikPct(val);
  };

  // Recompute Labarugi components (Accrual Basis for full sync)
  const dRaw = useMemo(() => monthDetail(transactions, bulan), [transactions, bulan]);

  const labaProdukTarget = useMemo(() => {
    return sales.filter((s) => monthKey(s.tanggal) === bulan).reduce((a, s) => a + (s.laba || 0), 0);
  }, [sales, bulan]);

  const omzetTarget = useMemo(() => {
    return sales.filter((s) => monthKey(s.tanggal) === bulan).reduce((a, s) => a + (s.total || 0), 0);
  }, [sales, bulan]);

  const hppTarget = omzetTarget - labaProdukTarget;

  const opeks = (dRaw.pengeluaran || 0) - (dRaw.bahanMitra || 0);
  const accrualLaba = labaProdukTarget - opeks;
  const accrualMargin = omzetTarget > 0 ? (accrualLaba / omzetTarget) * 100 : 0;
  const d = { ...dRaw, laba: accrualLaba, margin: accrualMargin };

  const shared = profitShares.find((p) => p.bulan === bulan);

  const labaDibagi = d.laba > 0 ? Math.round(d.laba * distribusiPct / 100) : 0;
  const labaDitahan = d.laba > 0 ? d.laba - labaDibagi : 0;
  const bagianPemilik = Math.round(labaDibagi * pemilikPct / 100);
  const bagianPengelola = labaDibagi - bagianPemilik;

  if (!months.length) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400">Belum ada data transaksi</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2">
            <PieChart size={20} className="text-slate-700" /> Laba Rugi & Bagi Hasil
          </h2>
          <p className="text-sm text-slate-500 mt-1">Ringkasan bulanan dengan alokasi laba yang bisa dikustomisasi</p>
        </div>
        <Select value={bulan} onValueChange={setBulan}>
          <SelectTrigger className="w-56" data-testid="labarugi-bulan"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m) => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Pengaturan Alokasi (collapsible) */}
      {!shared && d.laba > 0 && (
        <div className="rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border border-slate-200 bg-white p-4">
          <button
            className="flex w-full items-center justify-between text-[13px] font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            onClick={() => setShowSettings((s) => !s)}
          >
            <span className="flex items-center gap-2">⚙️ Pengaturan Alokasi Bagi Hasil</span>
            {showSettings ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
          </button>
          {showSettings && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Distribusi Laba</p>
                <SliderRow
                  label="Laba yang Dibagikan"
                  value={distribusiPct}
                  onChange={setDistribusiPct}
                  min={10} max={100} step={5}
                  color="indigo"
                />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Dibagi ({distribusiPct}%)</p>
                    <p className="mt-0.5 tabular-nums font-bold text-[13px] text-slate-800">{formatRupiah(labaDibagi)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Modal Kerja ({100 - distribusiPct}%)</p>
                    <p className="mt-0.5 tabular-nums font-bold text-[13px] text-slate-800">{formatRupiah(labaDitahan)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Porsi Mitra</p>
                <SliderRow
                  label={`Pemilik`}
                  value={pemilikPct}
                  onChange={handlePemilikChange}
                  min={10} max={90} step={5}
                  color="indigo"
                />
                <SliderRow
                  label={`Pengelola`}
                  value={pengelolaPct}
                  onChange={(v) => handlePemilikChange(100 - v)}
                  min={10} max={90} step={5}
                  color="indigo"
                />
                <p className="text-[11px] text-slate-400 text-center">Geser salah satu, yang lain otomatis menyesuaikan</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Kolom Kiri: Ringkasan Laba Rugi (Accrual) */}
        <div className="rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Pendapatan Penjualan</p>
          <Row label="Omzet (Pendapatan Kotor)" value={omzetTarget} className="text-emerald-700" />
          <Row label="Total HPP (Harga Modal)" value={hppTarget} className="text-red-500" />
          <div className="my-1 border-t border-slate-100" />
          <Row label="Laba Kotor Penjualan" value={labaProdukTarget} className="text-indigo-600 font-bold" />

          <div className="my-2 border-t border-dashed border-slate-200" />

          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Beban Operasional</p>
          {Object.entries(d.biayaTetapRinci || {})
            .filter(([_, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([nama, nominal]) => (
              <Row key={nama} label={nama} value={nominal} className="text-red-600" />
            ))}
          {d.lainPengeluaran > 0 && <Row label="Pengeluaran Lain-lain" value={d.lainPengeluaran} className="text-red-600" />}

          <div className="my-2 border-t border-dashed border-slate-200" />
          <Row label="Total Beban Operasional" value={opeks} className="text-red-700 font-bold" />

          <div className="my-3 border-t-2 border-slate-200" />
          <Row label="Laba Bersih Usaha" value={d.laba} className={`text-base tracking-tight ${d.laba >= 0 ? "text-emerald-700" : "text-red-600"}`} />

          {/* Realisasi jika sudah dibagi */}
          {d.laba > 0 && shared && (
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Realisasi Alokasi</p>
              <Row label={`Dibagikan (${shared.distribusi_pct ?? 100}%)`} value={(shared.bagian_pemilik || 0) + (shared.bagian_pengelola || 0)} className="text-emerald-700" />
              <Row label="Laba Ditahan (Modal Kerja)" value={shared.laba_ditahan || 0} className="text-blue-600" />
            </div>
          )}
        </div>

        {/* Kolom Kanan: Bagi Hasil */}
        <div className="flex flex-col gap-3">
          {/* Banner Laba - Minimalist */}
          <div className={`rounded-lg border shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-4 ${d.laba >= 0
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
            }`} data-testid="profit-share-card">
            <div className="flex items-start gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-lg shrink-0 ${d.laba >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                }`}>
                {d.laba >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-semibold uppercase tracking-widest ${d.laba >= 0 ? "text-emerald-600" : "text-red-500"
                  }`}>
                  {d.laba >= 0 ? "Laba Bersih" : "Rugi Bersih"} — {monthLabel(bulan)}
                </p>
                <p className={`mt-1 text-[26px] font-bold tabular-nums leading-tight ${d.laba >= 0 ? "text-emerald-900" : "text-red-800"
                  }`} data-testid="laba-bersih-value">{formatRupiah(d.laba)}</p>
                <p className={`mt-0.5 text-[12px] font-medium ${d.laba >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}>Margin Operasional: {d.margin.toFixed(1)}%</p>
              </div>
            </div>
            {d.laba > 0 && !shared && (
              <div className="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-2 gap-2">
                <div className="bg-white border border-emerald-100 rounded-md px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">Dibagikan ({distribusiPct}%)</p>
                  <p className="tabular-nums text-[13px] font-bold text-slate-800">{formatRupiah(labaDibagi)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-md px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Modal Kerja ({100 - distribusiPct}%)</p>
                  <p className="tabular-nums text-[13px] font-bold text-slate-800">{formatRupiah(labaDitahan)}</p>
                </div>
              </div>
            )}
            {d.laba > 0 && shared && (
              <div className="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-2 gap-2">
                <div className="bg-white border border-emerald-100 rounded-md px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">Dibagikan ({shared.distribusi_pct ?? 100}%)</p>
                  <p className="tabular-nums text-[13px] font-bold text-slate-800">{formatRupiah((shared.bagian_pemilik || 0) + (shared.bagian_pengelola || 0))}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-md px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Modal Kerja</p>
                  <p className="tabular-nums text-[13px] font-bold text-slate-800">{formatRupiah(shared.laba_ditahan || 0)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Panel Bagi Hasil */}
          <div className="rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center gap-2 text-slate-700">
              <Users size={18} />
              <p className="font-semibold">Rincian Bagi Hasil</p>
              {!shared && d.laba > 0 && (
                <span className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                  {pemilikPct} : {pengelolaPct}
                </span>
              )}
              {shared && (
                <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                  {shared.pemilik_pct ?? 50} : {shared.pengelola_pct ?? 50}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Pemilik ({shared ? (shared.pemilik_pct ?? 50) : pemilikPct}%)
                </p>
                <p className="tabular-nums text-[16px] font-bold text-indigo-700" data-testid="bagian-pemilik">
                  {formatRupiah(shared ? shared.bagian_pemilik : bagianPemilik)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Pengelola ({shared ? (shared.pengelola_pct ?? 50) : pengelolaPct}%)
                </p>
                <p className="tabular-nums text-[16px] font-bold text-indigo-700" data-testid="bagian-pengelola">
                  {formatRupiah(shared ? shared.bagian_pengelola : bagianPengelola)}
                </p>
              </div>
            </div>

            {/* Modal kerja info */}
            {d.laba > 0 && !shared && labaDitahan > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                <PiggyBank size={15} className="text-blue-500 flex-none" />
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">{formatRupiah(labaDitahan)}</span> tetap di kas sebagai modal kerja bulan berikutnya
                </p>
              </div>
            )}

            {d.laba <= 0 && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                Tidak ada laba, tidak ada yang dibagi.
              </p>
            )}

            {d.laba > 0 && (
              shared ? (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={16} /> Sudah dibagi
                  </span>
                  <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => onUnmarkShared(bulan)} data-testid="unmark-shared-btn">
                    <RotateCcw size={14} className="mr-1" /> Batalkan
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 space-y-1">
                    <p>⚠️ Saat dikonfirmasi, <strong>2 transaksi Pengeluaran Prive</strong> otomatis dibuat di Buku Kas:</p>
                    <ul className="ml-2 space-y-0.5 list-disc list-inside">
                      <li>Prive Pemilik: <span className="font-semibold">{formatRupiah(bagianPemilik)}</span></li>
                      <li>Prive Pengelola: <span className="font-semibold">{formatRupiah(bagianPengelola)}</span></li>
                    </ul>
                    {labaDitahan > 0 && (
                      <p className="text-blue-700"><span className="font-semibold">{formatRupiah(labaDitahan)}</span> tetap mengendap di kas sebagai modal kerja.</p>
                    )}
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onMarkShared({
                      bulan,
                      laba_bersih: d.laba,
                      bagian_pemilik: bagianPemilik,
                      bagian_pengelola: bagianPengelola,
                      laba_ditahan: labaDitahan,
                      distribusi_pct: distribusiPct,
                      pemilik_pct: pemilikPct,
                      pengelola_pct: pengelolaPct,
                    })}
                    data-testid="mark-shared-btn"
                  >
                    <CheckCircle2 size={16} className="mr-1" /> Konfirmasi &amp; Catat Bagi Hasil
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Histori Bagi Hasil */}
      {profitShares.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-4">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-slate-400">Histori Bagi Hasil</p>
          <div className="space-y-2">
            {[...profitShares].sort((a, b) => (a.bulan < b.bulan ? 1 : -1)).map((p) => (
              <div key={p.bulan} className="flex flex-col gap-1.5 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 text-sm" data-testid={`share-history-${p.bulan}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{monthLabel(p.bulan)}</span>
                  <div className="flex items-center gap-2">
                    {p.distribusi_pct && (
                      <span className="text-xs text-slate-400">Distribusi {p.distribusi_pct}% · Porsi {p.pemilik_pct ?? 50}:{p.pengelola_pct ?? 50}</span>
                    )}
                    <span className="rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">✓ Dibagi</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 tabular-nums tracking-tight font-medium">
                  <span>Laba Total: <span className="font-bold text-slate-700">{formatRupiah(p.laba_bersih)}</span></span>
                  <span className="text-indigo-600">Pemilik: <span className="font-bold">{formatRupiah(p.bagian_pemilik)}</span></span>
                  <span className="text-indigo-500">Pengelola: <span className="font-bold">{formatRupiah(p.bagian_pengelola)}</span></span>
                  {(p.laba_ditahan > 0) && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <PiggyBank size={11} /> Modal Kerja: <span className="font-bold">{formatRupiah(p.laba_ditahan)}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
