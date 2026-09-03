import React, { useMemo, useState } from "react";
import { formatRupiah, formatTanggal } from "../lib/format";
import { JENIS_PEMASUKAN, JENIS_PENGELUARAN } from "../lib/api";
import { withRunningBalance } from "../lib/compute";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog";
import { Pencil, Trash2, Plus, Filter, X, TrendingUp, TrendingDown } from "lucide-react";

const ALL_JENIS = ["Semua", ...JENIS_PEMASUKAN, ...JENIS_PENGELUARAN.filter((j) => j !== "Lain-lain")];

export const BukuKas = ({ transactions, saldoAwal, onAdd, onEdit, onDelete, cashBalance }) => {
  const [f, setF] = useState({ dari: "", sampai: "", kategori: "Semua", jenis: "Semua" });
  const [showFilter, setShowFilter] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const withBal = useMemo(() => withRunningBalance(transactions, saldoAwal), [transactions, saldoAwal]);

  const filtered = useMemo(() => {
    return withBal
      .filter((t) => {
        if (f.dari && t.tanggal < f.dari) return false;
        if (f.sampai && t.tanggal > f.sampai) return false;
        if (f.kategori !== "Semua" && t.kategori !== f.kategori) return false;
        if (f.jenis !== "Semua" && t.jenis !== f.jenis) return false;
        return true;
      })
      .reverse();
  }, [withBal, f]);

  const clearFilter = () => setF({ dari: "", sampai: "", kategori: "Semua", jenis: "Semua" });
  const hasFilter = f.dari || f.sampai || f.kategori !== "Semua" || f.jenis !== "Semua";

  const totalMasuk = filtered.filter(t => t.kategori === "Pemasukan").reduce((a, t) => a + t.nominal, 0);
  const totalKeluar = filtered.filter(t => t.kategori === "Pengeluaran").reduce((a, t) => a + t.nominal, 0);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 text-white"
        style={{ background: "linear-gradient(135deg, #4f46e5, #6d28d9)" }}
      >
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute right-8 bottom-0 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Total Saldo Kas</p>
            <p className="font-mono-num text-3xl font-bold mt-1" data-testid="kas-total-saldo">
              {formatRupiah(cashBalance)}
            </p>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} className="text-emerald-300" />
                <span className="text-xs text-indigo-200">Masuk: <span className="font-semibold text-emerald-300">{formatRupiah(totalMasuk)}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown size={13} className="text-red-300" />
                <span className="text-xs text-indigo-200">Keluar: <span className="font-semibold text-red-300">{formatRupiah(totalKeluar)}</span></span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowFilter((s) => !s)}
              data-testid="toggle-filter-btn"
              className={`bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm ${showFilter ? "ring-2 ring-white/50" : ""}`}
            >
              <Filter size={15} className="mr-1.5" /> Filter
              {hasFilter && <span className="ml-1.5 grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-white">!</span>}
            </Button>
            <Button
              onClick={onAdd}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-md"
              data-testid="add-transaction-btn"
            >
              <Plus size={15} className="mr-1.5" /> Tambah
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:grid-cols-4 fade-up">
          <div>
            <Label className="text-xs font-semibold text-slate-600">Dari Tanggal</Label>
            <Input type="date" value={f.dari} onChange={(e) => setF({ ...f, dari: e.target.value })} data-testid="filter-dari" className="mt-1 border-indigo-200 focus:border-indigo-400" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">Sampai Tanggal</Label>
            <Input type="date" value={f.sampai} onChange={(e) => setF({ ...f, sampai: e.target.value })} data-testid="filter-sampai" className="mt-1 border-indigo-200 focus:border-indigo-400" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">Kategori</Label>
            <Select value={f.kategori} onValueChange={(v) => setF({ ...f, kategori: v })}>
              <SelectTrigger data-testid="filter-kategori" className="mt-1 border-indigo-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Semua", "Pemasukan", "Pengeluaran"].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">Jenis</Label>
            <Select value={f.jenis} onValueChange={(v) => setF({ ...f, jenis: v })}>
              <SelectTrigger data-testid="filter-jenis" className="mt-1 border-indigo-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_JENIS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {hasFilter && (
            <Button variant="ghost" className="sm:col-span-4 justify-start text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={clearFilter} data-testid="clear-filter-btn">
              <X size={14} className="mr-1.5" /> Hapus semua filter
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="kas-table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-400">Tanggal</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-400">Keterangan</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-400">Kategori</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-400">Jenis</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-widest text-slate-400">Nominal</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-widest text-slate-400">Saldo</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-widest text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100">
                        <Filter size={20} className="text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-medium">Belum ada transaksi</p>
                      <p className="text-xs text-slate-300">Tambahkan transaksi pertama Anda</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((t, i) => (
                <tr key={t.id} className="group hover:bg-indigo-50/40 transition-colors" data-testid={`kas-row-${t.id}`}>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500 font-medium">{formatTanggal(t.tanggal)}</td>
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <p className="font-semibold text-slate-800 truncate">{t.keterangan}</p>
                    {t.keterangan_tambahan && <p className="text-xs text-slate-400 truncate">{t.keterangan_tambahan}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${t.kategori === "Pemasukan"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                      }`}>
                      {t.kategori === "Pemasukan" ? "▲" : "▼"} {t.kategori}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{t.jenis}</td>
                  <td className={`whitespace-nowrap px-4 py-3.5 text-right font-mono-num text-sm font-bold ${t.kategori === "Pemasukan" ? "text-emerald-600" : "text-red-500"
                    }`}>
                    {t.kategori === "Pemasukan" ? "+" : "-"}{formatRupiah(t.nominal)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono-num text-sm font-semibold text-slate-700">
                    {formatRupiah(t.saldo)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(t)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                        data-testid={`edit-btn-${t.id}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setToDelete(t)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                        data-testid={`delete-btn-${t.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-indigo-100 bg-indigo-50/50">
                  <td colSpan={4} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Total ({filtered.length} transaksi)
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num text-sm font-bold text-indigo-700">
                    {formatRupiah(cashBalance)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-lg">Hapus transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-slate-700">"{toDelete?.keterangan}"</span> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 hover:bg-red-700"
              onClick={() => { onDelete(toDelete.id); setToDelete(null); }}
              data-testid="confirm-delete-btn"
            >Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
