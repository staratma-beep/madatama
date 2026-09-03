import React, { useMemo, useState, useEffect } from "react";
import { formatRupiah, monthLabel } from "../lib/format";
import { availableMonths, monthDetail } from "../lib/compute";
import { Button } from "./ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { CheckCircle2, RotateCcw, Users, PiggyBank, ChevronDown, ChevronUp } from "lucide-react";

const Row = ({ label, value, className, sub }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-slate-600">
      {label}
      {sub && <span className="ml-1 text-xs text-slate-400">({sub})</span>}
    </span>
    <span className={`font-mono-num font-semibold ${className || "text-slate-800"}`}>{formatRupiah(value)}</span>
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

export const LabaRugi = ({ transactions, profitShares, onMarkShared, onUnmarkShared }) => {
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

  const d = useMemo(() => monthDetail(transactions, bulan), [transactions, bulan]);
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
          <h2 className="font-heading text-xl font-bold text-slate-900">Laba Rugi &amp; Bagi Hasil</h2>
          <p className="text-sm text-slate-500">Ringkasan bulanan dengan alokasi laba yang bisa dikustomisasi</p>
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
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
          <button
            className="flex w-full items-center justify-between text-sm font-bold text-indigo-700"
            onClick={() => setShowSettings((s) => !s)}
          >
            <span>⚙️ Pengaturan Alokasi Bagi Hasil</span>
            {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showSettings && (
            <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Distribusi Laba</p>
                <SliderRow
                  label="Laba yang Dibagikan"
                  value={distribusiPct}
                  onChange={setDistribusiPct}
                  min={10} max={100} step={5}
                  color="indigo"
                />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg bg-emerald-100 px-3 py-2 text-center">
                    <p className="text-[11px] font-semibold text-emerald-700">Dibagi ({distribusiPct}%)</p>
                    <p className="font-mono-num font-bold text-sm text-emerald-900">{formatRupiah(labaDibagi)}</p>
                  </div>
                  <div className="rounded-lg bg-blue-100 px-3 py-2 text-center">
                    <p className="text-[11px] font-semibold text-blue-700">Modal Kerja ({100 - distribusiPct}%)</p>
                    <p className="font-mono-num font-bold text-sm text-blue-900">{formatRupiah(labaDitahan)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Porsi Mitra</p>
                <SliderRow
                  label={`Pemilik`}
                  value={pemilikPct}
                  onChange={handlePemilikChange}
                  min={10} max={90} step={5}
                  color="violet"
                />
                <SliderRow
                  label={`Pengelola`}
                  value={pengelolaPct}
                  onChange={(v) => handlePemilikChange(100 - v)}
                  min={10} max={90} step={5}
                  color="cyan"
                />
                <p className="text-xs text-slate-400 text-center">Geser salah satu, yang lain otomatis menyesuaikan</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Kolom Kiri: Ringkasan Laba Rugi */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Ringkasan</p>
          <Row label="Total Pemasukan" value={d.pemasukan} className="text-emerald-600" />
          <div className="my-2 border-t border-dashed border-slate-200" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pengeluaran</p>
          <Row label="Bahan / Mitra" value={d.bahanMitra} className="text-red-600" />
          {Object.keys(d.biayaTetapRinci || {}).length > 0 && (
            <div className="my-1 border-t border-slate-100" />
          )}
          {Object.entries(d.biayaTetapRinci || {})
            .filter(([_, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([nama, nominal]) => (
              <Row key={nama} label={nama} value={nominal} className="text-red-600" />
            ))}
          {d.lainPengeluaran > 0 && <Row label="Pengeluaran Lain-lain" value={d.lainPengeluaran} className="text-red-600" />}
          <div className="my-2 border-t border-dashed border-slate-200" />
          <Row label="Total Pengeluaran" value={d.pengeluaran} className="text-red-600" />
          <div className="my-2 border-t-2 border-slate-200" />
          <Row label="Laba Bersih" value={d.laba} className={`text-base font-bold ${d.laba >= 0 ? "text-emerald-700" : "text-red-600"}`} />

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
        <div className="flex flex-col gap-4">
          {/* Banner Laba */}
          <div className={`rounded-2xl p-6 text-white ${d.laba >= 0 ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-red-500 to-red-700"}`} data-testid="profit-share-card">
            <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
              {d.laba >= 0 ? "Laba Bersih" : "Rugi Bersih"} — {monthLabel(bulan)}
            </p>
            <p className="mt-1 font-mono-num text-4xl font-bold" data-testid="laba-bersih-value">{formatRupiah(d.laba)}</p>
            <p className="mt-1 text-sm opacity-90">Margin {d.margin.toFixed(1)}%</p>
            {d.laba > 0 && !shared && (
              <div className="mt-3 border-t border-white/20 pt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="opacity-70 text-xs">Dibagikan ({distribusiPct}%)</p>
                  <p className="font-mono-num font-bold">{formatRupiah(labaDibagi)}</p>
                </div>
                <div>
                  <p className="opacity-70 text-xs">Modal Kerja ({100 - distribusiPct}%)</p>
                  <p className="font-mono-num font-bold">{formatRupiah(labaDitahan)}</p>
                </div>
              </div>
            )}
            {d.laba > 0 && shared && (
              <div className="mt-3 border-t border-white/20 pt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="opacity-70 text-xs">Dibagikan ({shared.distribusi_pct ?? 100}%)</p>
                  <p className="font-mono-num font-bold">{formatRupiah((shared.bagian_pemilik || 0) + (shared.bagian_pengelola || 0))}</p>
                </div>
                <div>
                  <p className="opacity-70 text-xs">Modal Kerja</p>
                  <p className="font-mono-num font-bold">{formatRupiah(shared.laba_ditahan || 0)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Panel Bagi Hasil */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
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
              <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                  Pemilik ({shared ? (shared.pemilik_pct ?? 50) : pemilikPct}%)
                </p>
                <p className="mt-1 font-mono-num text-xl font-bold text-violet-900" data-testid="bagian-pemilik">
                  {formatRupiah(shared ? shared.bagian_pemilik : bagianPemilik)}
                </p>
              </div>
              <div className="rounded-xl bg-cyan-50 border border-cyan-100 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">
                  Pengelola ({shared ? (shared.pengelola_pct ?? 50) : pengelolaPct}%)
                </p>
                <p className="mt-1 font-mono-num text-xl font-bold text-cyan-900" data-testid="bagian-pengelola">
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Histori Bagi Hasil</p>
          <div className="space-y-2">
            {[...profitShares].sort((a, b) => (a.bulan < b.bulan ? 1 : -1)).map((p) => (
              <div key={p.bulan} className="flex flex-col gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm" data-testid={`share-history-${p.bulan}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{monthLabel(p.bulan)}</span>
                  <div className="flex items-center gap-2">
                    {p.distribusi_pct && (
                      <span className="text-xs text-slate-400">Distribusi {p.distribusi_pct}% · Porsi {p.pemilik_pct ?? 50}:{p.pengelola_pct ?? 50}</span>
                    )}
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">✓ Dibagi</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 font-mono-num">
                  <span>Laba Total: <span className="font-semibold text-slate-700">{formatRupiah(p.laba_bersih)}</span></span>
                  <span className="text-violet-700">Pemilik: <span className="font-semibold">{formatRupiah(p.bagian_pemilik)}</span></span>
                  <span className="text-cyan-700">Pengelola: <span className="font-semibold">{formatRupiah(p.bagian_pengelola)}</span></span>
                  {(p.laba_ditahan > 0) && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <PiggyBank size={11} /> Modal Kerja: <span className="font-semibold">{formatRupiah(p.laba_ditahan)}</span>
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
