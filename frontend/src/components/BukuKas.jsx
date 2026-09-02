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
import { Pencil, Trash2, Plus, Filter, X } from "lucide-react";

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
      .reverse(); // newest first
  }, [withBal, f]);

  const clearFilter = () => setF({ dari: "", sampai: "", kategori: "Semua", jenis: "Semua" });
  const hasFilter = f.dari || f.sampai || f.kategori !== "Semua" || f.jenis !== "Semua";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-800 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Total Saldo Kas</p>
          <p className="font-mono-num text-3xl font-bold" data-testid="kas-total-saldo">{formatRupiah(cashBalance)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowFilter((s) => !s)} data-testid="toggle-filter-btn">
            <Filter size={16} className="mr-1" /> Filter
          </Button>
          <Button onClick={onAdd} className="bg-white text-indigo-700 hover:bg-indigo-50" data-testid="add-transaction-btn">
            <Plus size={16} className="mr-1" /> Tambah
          </Button>
        </div>
      </div>

      {showFilter && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
          <div>
            <Label className="text-xs">Dari Tanggal</Label>
            <Input type="date" value={f.dari} onChange={(e) => setF({ ...f, dari: e.target.value })} data-testid="filter-dari" />
          </div>
          <div>
            <Label className="text-xs">Sampai Tanggal</Label>
            <Input type="date" value={f.sampai} onChange={(e) => setF({ ...f, sampai: e.target.value })} data-testid="filter-sampai" />
          </div>
          <div>
            <Label className="text-xs">Kategori</Label>
            <Select value={f.kategori} onValueChange={(v) => setF({ ...f, kategori: v })}>
              <SelectTrigger data-testid="filter-kategori"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Semua", "Pemasukan", "Pengeluaran"].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Jenis</Label>
            <Select value={f.jenis} onValueChange={(v) => setF({ ...f, jenis: v })}>
              <SelectTrigger data-testid="filter-jenis"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_JENIS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {hasFilter && (
            <Button variant="ghost" className="sm:col-span-4 justify-start text-slate-500" onClick={clearFilter} data-testid="clear-filter-btn">
              <X size={14} className="mr-1" /> Hapus filter
            </Button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="kas-table">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3 text-right">Nominal</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Belum ada transaksi</td></tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50" data-testid={`kas-row-${t.id}`}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatTanggal(t.tanggal)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{t.keterangan}</p>
                    {t.keterangan_tambahan && <p className="text-xs text-slate-400">{t.keterangan_tambahan}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      t.kategori === "Pemasukan"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}>{t.kategori}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.jenis}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-mono-num font-semibold ${
                    t.kategori === "Pemasukan" ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {t.kategori === "Pemasukan" ? "+" : "-"}{formatRupiah(t.nominal).replace("Rp", "Rp")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono-num text-slate-700">{formatRupiah(t.saldo)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => onEdit(t)} className="mr-2 text-slate-400 hover:text-indigo-600" data-testid={`edit-btn-${t.id}`}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setToDelete(t)} className="text-slate-400 hover:text-red-600" data-testid={`delete-btn-${t.id}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.keterangan}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { onDelete(toDelete.id); setToDelete(null); }}
              data-testid="confirm-delete-btn"
            >Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
