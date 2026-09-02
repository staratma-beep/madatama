import React, { useState, useEffect, useCallback } from "react";
import { formatRupiah, formatNumberInput, parseNumber, todayISO } from "../lib/format";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, ShoppingCart } from "lucide-react";

const KATEGORI = ["Branding", "Printing", "Advertising"];
const SALE_JENIS = { Branding: "Penjualan Branding", Printing: "Penjualan Printing", Advertising: "Penjualan Advertising" };

const fmtRow = (p) => ({
  ...p,
  bahan_baku: formatNumberInput(String(p.bahan_baku || 0)),
  jasa_mitra: formatNumberInput(String(p.jasa_mitra || 0)),
  tambahan: formatNumberInput(String(p.tambahan || 0)),
  harga_jual: formatNumberInput(String(p.harga_jual || 0)),
});

const toPayload = (r) => ({
  kategori: r.kategori,
  nama: r.nama,
  jenis: r.jenis,
  bahan_baku: parseNumber(r.bahan_baku),
  jasa_mitra: parseNumber(r.jasa_mitra),
  tambahan: parseNumber(r.tambahan),
  harga_jual: parseNumber(r.harga_jual),
});

const NumCell = ({ value, onChange, onBlur, testId }) => (
  <Input
    inputMode="numeric"
    value={value}
    onChange={(e) => onChange(formatNumberInput(e.target.value))}
    onBlur={onBlur}
    className="h-9 w-28 text-right font-mono-num"
    data-testid={testId}
  />
);

export const HPPKalkulator = ({ onSold }) => {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("Branding");
  const [toDelete, setToDelete] = useState(null);

  const refresh = useCallback(async () => {
    const p = await api.getProducts();
    setRows(p.map(fmtRow));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const setField = (id, field, value) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const persist = async (id) => {
    const row = rows.find((r) => r.id === id);
    if (row) await api.updateProduct(id, toPayload(row));
  };

  const persistNow = async (id, patch) => {
    setField(id, Object.keys(patch)[0], Object.values(patch)[0]);
    const row = { ...rows.find((r) => r.id === id), ...patch };
    await api.updateProduct(id, toPayload(row));
  };

  const addRow = async (kategori) => {
    const created = await api.createProduct({ kategori, nama: "Produk Baru", jenis: "Sendiri" });
    setRows((rs) => [...rs, fmtRow(created)]);
    toast.success("Baris produk ditambahkan");
  };

  const removeRow = async (id) => {
    await api.deleteProduct(id);
    setRows((rs) => rs.filter((r) => r.id !== id));
    setToDelete(null);
    toast.success("Produk dihapus");
  };

  const jual = async (r) => {
    const harga = parseNumber(r.harga_jual);
    if (harga <= 0) { toast.error("Isi Harga Jual dulu"); return; }
    await api.createTransaction({
      tanggal: todayISO(),
      keterangan: r.nama,
      kategori: "Pemasukan",
      jenis: SALE_JENIS[r.kategori],
      nominal: harga,
      keterangan_tambahan: `Penjualan produk (${r.kategori})`,
    });
    toast.success(`${r.nama} dicatat sebagai pemasukan ${formatRupiah(harga)}`);
    onSold && onSold();
  };

  const renderTable = (kategori) => {
    const items = rows.filter((r) => r.kategori === kategori);
    const withHarga = items.filter((r) => parseNumber(r.harga_jual) > 0);
    const avgMargin = withHarga.length
      ? withHarga.reduce((a, r) => {
          const hpp = parseNumber(r.bahan_baku) + parseNumber(r.jasa_mitra) + parseNumber(r.tambahan);
          const h = parseNumber(r.harga_jual);
          return a + (h > 0 ? ((h - hpp) / h) * 100 : 0);
        }, 0) / withHarga.length
      : 0;

    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid={`hpp-table-${kategori}`}>
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-3 min-w-[160px]">Nama Produk</th>
                <th className="px-3 py-3">Jenis</th>
                <th className="px-3 py-3 text-right">Bahan Baku</th>
                <th className="px-3 py-3 text-right">Jasa Mitra</th>
                <th className="px-3 py-3 text-right">Tambahan</th>
                <th className="px-3 py-3 text-right">Total HPP</th>
                <th className="px-3 py-3 text-right">Harga Jual</th>
                <th className="px-3 py-3 text-right">Laba</th>
                <th className="px-3 py-3 text-right">Margin</th>
                <th className="px-3 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r) => {
                const hpp = parseNumber(r.bahan_baku) + parseNumber(r.jasa_mitra) + parseNumber(r.tambahan);
                const harga = parseNumber(r.harga_jual);
                const laba = harga - hpp;
                const margin = harga > 0 ? (laba / harga) * 100 : 0;
                return (
                  <tr key={r.id} className="hover:bg-slate-50" data-testid={`hpp-row-${r.id}`}>
                    <td className="px-3 py-2">
                      <Input value={r.nama} onChange={(e) => setField(r.id, "nama", e.target.value)} onBlur={() => persist(r.id)} className="h-9 min-w-[150px]" data-testid={`hpp-nama-${r.id}`} />
                    </td>
                    <td className="px-3 py-2">
                      <Select value={r.jenis} onValueChange={(v) => persistNow(r.id, { jenis: v })}>
                        <SelectTrigger className="h-9 w-28" data-testid={`hpp-jenis-${r.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sendiri">Sendiri</SelectItem>
                          <SelectItem value="Mitra">Mitra</SelectItem>
                          <SelectItem value="Campuran">Campuran</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-right"><NumCell value={r.bahan_baku} onChange={(v) => setField(r.id, "bahan_baku", v)} onBlur={() => persist(r.id)} testId={`hpp-bahan-${r.id}`} /></td>
                    <td className="px-3 py-2 text-right"><NumCell value={r.jasa_mitra} onChange={(v) => setField(r.id, "jasa_mitra", v)} onBlur={() => persist(r.id)} testId={`hpp-jasa-${r.id}`} /></td>
                    <td className="px-3 py-2 text-right"><NumCell value={r.tambahan} onChange={(v) => setField(r.id, "tambahan", v)} onBlur={() => persist(r.id)} testId={`hpp-tambahan-${r.id}`} /></td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-mono-num font-semibold text-slate-700" data-testid={`hpp-total-${r.id}`}>{formatRupiah(hpp)}</td>
                    <td className="px-3 py-2 text-right"><NumCell value={r.harga_jual} onChange={(v) => setField(r.id, "harga_jual", v)} onBlur={() => persist(r.id)} testId={`hpp-harga-${r.id}`} /></td>
                    <td className={`whitespace-nowrap px-3 py-2 text-right font-mono-num font-semibold ${laba >= 0 ? "text-emerald-600" : "text-red-600"}`} data-testid={`hpp-laba-${r.id}`}>{formatRupiah(laba)}</td>
                    <td className={`px-3 py-2 text-right font-mono-num ${margin >= 0 ? "text-emerald-600" : "text-red-600"}`} data-testid={`hpp-margin-${r.id}`}>{margin.toFixed(1)}%</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <Button size="sm" className="mr-1 h-8 bg-emerald-600 px-2 hover:bg-emerald-700" onClick={() => jual(r)} data-testid={`hpp-jual-${r.id}`}>
                        <ShoppingCart size={14} className="mr-1" /> Jual
                      </Button>
                      <button onClick={() => setToDelete(r)} className="text-slate-300 hover:text-red-600 align-middle" data-testid={`hpp-delete-${r.id}`}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">Belum ada produk</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={8} className="px-3 py-3 text-right text-sm font-semibold text-slate-600">Rata-rata Margin {kategori}</td>
                <td className="px-3 py-3 text-right font-mono-num font-bold text-indigo-600" data-testid={`hpp-avg-margin-${kategori}`}>{avgMargin.toFixed(1)}%</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="border-t border-slate-100 p-3">
          <Button variant="outline" size="sm" className="border-dashed" onClick={() => addRow(kategori)} data-testid={`hpp-add-${kategori}`}>
            <Plus size={14} className="mr-1" /> Tambah Produk
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold text-slate-900">Kalkulator HPP Produk</h2>
        <p className="text-sm text-slate-500">Hitung HPP, laba, & margin. Klik <span className="font-semibold text-emerald-600">Jual</span> untuk catat penjualan ke Buku Kas tanpa mengetik.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-100" data-testid="hpp-kategori-tabs">
          {KATEGORI.map((k) => (
            <TabsTrigger key={k} value={k} className="data-[state=active]:bg-white data-[state=active]:text-indigo-700" data-testid={`hpp-tab-${k}`}>{k}</TabsTrigger>
          ))}
        </TabsList>
        {KATEGORI.map((k) => (
          <TabsContent key={k} value={k} className="mt-4">{renderTable(k)}</TabsContent>
        ))}
      </Tabs>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus produk?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.nama}" akan dihapus dari daftar HPP.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => removeRow(toDelete.id)} data-testid="confirm-delete-product-btn">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
