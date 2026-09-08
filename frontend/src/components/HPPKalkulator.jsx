import React, { useState, useEffect, useCallback } from "react";
import { formatRupiah, formatNumberInput, parseNumber, todayISO, monthKey, monthLabel, formatTanggal } from "../lib/format";
import { api } from "../lib/api";
import { downloadNota, downloadInvoice, downloadSuratJalan } from "../lib/nota";
import { exportSalesCSV } from "../lib/salesExport";
import { downloadReport } from "../lib/salesReport";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "./ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, ShoppingCart, Trophy, Download, ReceiptText, Percent, FileText, PackagePlus, CheckCircle2, Wallet, FileSpreadsheet, Truck, Search, Globe, Image } from "lucide-react";

const KATEGORI = ["Branding", "Printing", "Advertising"];

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
  stok: parseInt(r.stok, 10) || 0,
  is_public: r.is_public || false,
  image_url: r.image_url || "",
  deskripsi: r.deskripsi || ""
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

export const HPPKalkulator = ({ onSold, cashBalance = 0 }) => {
  const [rows, setRows] = useState([]);
  const [sales, setSales] = useState([]);
  const [tab, setTab] = useState("Branding");
  const [toDelete, setToDelete] = useState(null);
  const [jualOpen, setJualOpen] = useState(false);
  const [jualRow, setJualRow] = useState(null);
  const [jualQty, setJualQty] = useState("1");
  const [jualPembeli, setJualPembeli] = useState("");
  const [jualDiskon, setJualDiskon] = useState("0");
  const [jualDone, setJualDone] = useState(null);
  const [jualIsDp, setJualIsDp] = useState(false);
  const [jualDpAmount, setJualDpAmount] = useState("");
  const [notaDel, setNotaDel] = useState(null);
  const [profile, setProfile] = useState({});
  const [jualDiskonMode, setJualDiskonMode] = useState("rp");
  const [salinOpen, setSalinOpen] = useState(false);
  const [salinKategori, setSalinKategori] = useState("Branding");
  const [salinMargin, setSalinMargin] = useState("30");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState("");
  const [stokAddOpen, setStokAddOpen] = useState(false);
  const [stokRow, setStokRow] = useState(null);
  const [stokAddQty, setStokAddQty] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Public Web Settings
  const [webMenuOpen, setWebMenuOpen] = useState(false);
  const [webRow, setWebRow] = useState(null);

  const refresh = useCallback(async () => {
    const [p, s, st] = await Promise.all([api.getProducts(), api.getSales(), api.getSettings()]);
    setRows(p.map(fmtRow));
    setSales(s);
    setProfile(st);
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

  const openTambahStok = (r) => {
    setStokRow(r);
    setStokAddQty("");
    setStokAddOpen(true);
  };

  const confirmTambahStok = async () => {
    if (!stokRow) return;
    const add = parseInt(stokAddQty, 10) || 0;
    if (add <= 0) { toast.error("Masukkan jumlah > 0"); return; }
    const current = parseInt(stokRow.stok, 10) || 0;
    const nr = { ...stokRow, stok: current + add };
    setRows((rs) => rs.map((x) => (x.id === nr.id ? nr : x)));
    await api.updateProduct(nr.id, toPayload(nr));
    setStokAddOpen(false);
    await refresh();
    onSold && onSold();
    toast.success(`Stok ${stokRow.nama} +${add} → ${current + add}`);
  };

  const openJual = (r) => {
    if (parseNumber(r.harga_jual) <= 0) { toast.error("Isi Harga Jual dulu"); return; }
    setJualRow(r);
    setJualQty("1");
    setJualPembeli("");
    setJualDiskon("0");
    setJualDiskonMode("rp");
    setJualDone(null);
    setJualOpen(true);
  };

  const jualLagi = () => {
    const latest = rows.find((x) => x.id === jualRow?.id) || jualRow;
    setJualRow(latest);
    setJualDone(null);
    setJualQty("1");
    setJualDiskon("0");
    setJualDiskonMode("rp");
    setJualPembeli("");
    setJualIsDp(false);
    setJualDpAmount("");
  };

  const confirmJual = async (cetak) => {
    if (!jualRow) return;
    const harga = parseNumber(jualRow.harga_jual);
    const hpp = parseNumber(jualRow.bahan_baku) + parseNumber(jualRow.jasa_mitra) + parseNumber(jualRow.tambahan);
    const qty = Math.max(1, parseInt(jualQty, 10) || 1);
    const subtotal = harga * qty;
    const diskonRp = jualDiskonMode === "persen"
      ? Math.round(subtotal * (parseNumber(jualDiskon) / 100))
      : parseNumber(jualDiskon);
    const sale = await api.createSale({
      product_id: jualRow.id, nama: jualRow.nama, kategori: jualRow.kategori,
      qty, harga_satuan: harga, hpp_satuan: hpp, diskon: diskonRp, pembeli: jualPembeli, tanggal: todayISO(),
      is_dp: jualIsDp, dp_amount: parseNumber(jualDpAmount) || 0,
    });
    setRows((rs) => rs.map((x) => (x.id === jualRow.id ? { ...x, stok: (parseInt(x.stok, 10) || 0) - qty } : x)));
    if (cetak) downloadNota(sale, profile);
    setJualDone({ sale, saldo: (cashBalance || 0) + sale.total, sisaStok: (parseInt(jualRow.stok, 10) || 0) - qty });
    await refresh();
    onSold && onSold();
  };

  const hapusNota = async (s) => {
    await api.deleteSale(s.id);
    setSales((arr) => arr.filter((x) => x.id !== s.id));
    if (s.product_id) {
      setRows((rs) => rs.map((x) => (x.id === s.product_id ? { ...x, stok: (parseInt(x.stok, 10) || 0) + (s.qty || 0) } : x)));
    }
    setNotaDel(null);
    await refresh();
    onSold && onSold();
    toast.success("Nota dihapus, stok dikembalikan");
  };

  const applyWebSettings = async () => {
    try {
      await api.updateProduct(webRow.id, toPayload(webRow));
      toast.success(`Pengaturan web untuk ${webRow.nama} disimpan.`);
      setWebMenuOpen(false);
      refresh();
    } catch (e) {
      toast.error("Gagal menyimpan pengaturan web");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading("Mengunggah gambar...", { id: "upload" });
      const url = await api.uploadImage(file);
      setWebRow(prev => ({ ...prev, image_url: url }));
      toast.success("Gambar berhasil diunggah", { id: "upload" });
    } catch (err) {
      toast.error("Gagal mengunggah gambar", { id: "upload" });
    }
  };

  const applySalin = async () => {
    const m = parseFloat(salinMargin);
    if (isNaN(m) || m < 0 || m >= 100) { toast.error("Margin harus 0–99%"); return; }
    const tasks = [];
    const updated = rows.map((r) => {
      if (r.kategori !== salinKategori) return r;
      const hpp = parseNumber(r.bahan_baku) + parseNumber(r.jasa_mitra) + parseNumber(r.tambahan);
      if (hpp <= 0) return r;
      const harga = Math.round(hpp / (1 - m / 100));
      const nr = { ...r, harga_jual: formatNumberInput(String(harga)) };
      tasks.push(api.updateProduct(r.id, toPayload(nr)));
      return nr;
    });
    setRows(updated);
    await Promise.all(tasks);
    setSalinOpen(false);
    toast.success(`Margin ${m}% diterapkan ke ${salinKategori}`);
  };

  const curMonth = monthKey(todayISO());
  const saleMonths = Array.from(new Set(sales.map((s) => (s.tanggal || "").slice(0, 7)))).filter(Boolean).sort((a, b) => (a < b ? 1 : -1));
  const monthSales = sales.filter((s) => monthKey(s.tanggal) === curMonth);
  const agg = {};
  monthSales.forEach((s) => {
    if (!agg[s.nama]) agg[s.nama] = { nama: s.nama, kategori: s.kategori, qty: 0, omzet: 0, laba: 0 };
    agg[s.nama].qty += s.qty;
    agg[s.nama].omzet += s.total;
    agg[s.nama].laba += s.laba;
  });
  const aggList = Object.values(agg);
  const topSold = [...aggList].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topProfit = [...aggList].sort((a, b) => b.laba - a.laba).slice(0, 5);

  const renderTable = (kategori) => {
    const items = rows.filter((r) => r.kategori === kategori && r.nama.toLowerCase().includes(searchQuery.toLowerCase()));
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
                <th className="px-3 py-3 text-right">Stok</th>
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
            <tbody className="divide-y divide-slate-50">
              {items.map((r) => {
                const hpp = parseNumber(r.bahan_baku) + parseNumber(r.jasa_mitra) + parseNumber(r.tambahan);
                const harga = parseNumber(r.harga_jual);
                const laba = harga - hpp;
                const margin = harga > 0 ? (laba / harga) * 100 : 0;
                const stokNum = parseInt(r.stok, 10) || 0;
                const stokKritis = stokNum <= 2;
                const stokRendah = stokNum <= 5 && stokNum > 2;
                const marginBagus = margin >= 30;
                const marginCukup = margin >= 15 && margin < 30;
                return (
                  <tr key={r.id} className={`group hover:bg-indigo-50/30 transition-colors ${stokKritis ? "bg-red-50/30" : ""}`} data-testid={`hpp-row-${r.id}`}>
                    <td className="px-3 py-2">
                      <Input value={r.nama} onChange={(e) => setField(r.id, "nama", e.target.value)} onBlur={() => persist(r.id)} className="h-9 min-w-[150px] border-0 bg-transparent px-1 focus:bg-white focus:border focus:border-slate-200" data-testid={`hpp-nama-${r.id}`} />
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
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <div className="relative">
                          <Input type="number" value={r.stok ?? 0} onChange={(e) => setField(r.id, "stok", e.target.value)} onBlur={() => persist(r.id)}
                            className={`h-9 w-16 text-right font-mono-num font-bold ${stokKritis ? "text-red-600 border-red-300 bg-red-50" :
                              stokRendah ? "text-amber-600 border-amber-200 bg-amber-50" :
                                "text-slate-700"
                              }`}
                            data-testid={`hpp-stok-${r.id}`}
                          />
                          {stokKritis && <span className="absolute -top-1.5 -right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
                        </div>
                        <button type="button" onClick={() => openTambahStok(r)} className="grid h-7 w-7 flex-none place-items-center rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100" title="Tambah stok" data-testid={`hpp-tambah-stok-${r.id}`}>
                          <PackagePlus size={15} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right"><NumCell value={r.bahan_baku} onChange={(v) => setField(r.id, "bahan_baku", v)} onBlur={() => persist(r.id)} testId={`hpp-bahan-${r.id}`} /></td>
                    <td className="px-3 py-2 text-right"><NumCell value={r.jasa_mitra} onChange={(v) => setField(r.id, "jasa_mitra", v)} onBlur={() => persist(r.id)} testId={`hpp-jasa-${r.id}`} /></td>
                    <td className="px-3 py-2 text-right"><NumCell value={r.tambahan} onChange={(v) => setField(r.id, "tambahan", v)} onBlur={() => persist(r.id)} testId={`hpp-tambahan-${r.id}`} /></td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-mono-num font-semibold text-slate-600" data-testid={`hpp-total-${r.id}`}>{formatRupiah(hpp)}</td>
                    <td className="px-3 py-2 text-right"><NumCell value={r.harga_jual} onChange={(v) => setField(r.id, "harga_jual", v)} onBlur={() => persist(r.id)} testId={`hpp-harga-${r.id}`} /></td>
                    <td className={`whitespace-nowrap px-3 py-2 text-right font-mono-num font-semibold ${laba >= 0 ? "text-emerald-600" : "text-red-600"}`} data-testid={`hpp-laba-${r.id}`}>{formatRupiah(laba)}</td>
                    <td className="px-3 py-2 text-right" data-testid={`hpp-margin-${r.id}`}>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${harga <= 0 ? "bg-slate-100 text-slate-400" :
                        marginBagus ? "bg-emerald-100 text-emerald-700" :
                          marginCukup ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-600"
                        }`}>
                        {harga > 0 ? `${margin.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <Button size="sm" className="mr-1 h-8 bg-emerald-600 px-2.5 hover:bg-emerald-700 shadow-sm" onClick={() => openJual(r)} data-testid={`hpp-jual-${r.id}`}>
                        <ShoppingCart size={13} className="mr-1" /> Jual
                      </Button>
                      <button onClick={() => { setWebRow(r); setWebMenuOpen(true); }} className={`mr-2 align-middle transition-colors ${r.is_public ? 'text-indigo-500 hover:text-indigo-700' : 'text-slate-300 hover:text-indigo-500'}`} title="Toko Online">
                        <Globe size={16} />
                      </button>
                      <button onClick={() => setToDelete(r)} className="text-slate-200 hover:text-red-500 align-middle transition-colors" data-testid={`hpp-delete-${r.id}`}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-400">Belum ada produk di kategori ini. Klik "+ Tambah Produk" di bawah.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={9} className="px-3 py-3 text-right text-sm font-semibold text-slate-600">Rata-rata Margin {kategori}</td>
                <td className="px-3 py-3 text-right font-mono-num font-bold text-indigo-600" data-testid={`hpp-avg-margin-${kategori}`}>{avgMargin.toFixed(1)}%</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">
          <Button variant="outline" size="sm" className="border-dashed" onClick={() => addRow(kategori)} data-testid={`hpp-add-${kategori}`}>
            <Plus size={14} className="mr-1" /> Tambah Produk
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setSalinKategori(kategori); setSalinMargin("30"); setSalinOpen(true); }} data-testid={`hpp-salin-${kategori}`}>
            <Percent size={14} className="mr-1" /> Samakan Margin
          </Button>
        </div>
      </div>
    );
  };

  // KPI Bulan Berjalan
  const totalOmzet = monthSales.reduce((a, s) => a + s.total, 0);
  const totalLabaProduk = monthSales.reduce((a, s) => a + (s.laba || 0), 0);
  const totalQty = monthSales.reduce((a, s) => a + s.qty, 0);
  const maxQty = topSold[0]?.qty || 1;
  const maxLaba = topProfit[0]?.laba || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900">Kalkulator HPP Produk</h2>
          <p className="text-sm text-slate-500">Hitung HPP, margin & laba. Klik <span className="font-semibold text-emerald-600">Jual</span> untuk catat penjualan ke Buku Kas secara instan.</p>
        </div>
      </div>

      {/* KPI Cards Bulan Ini */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Omzet {monthLabel(curMonth).split(" ")[0]}</p>
          <p className="mt-2 font-mono-num text-xl font-bold">{formatRupiah(totalOmzet)}</p>
          <p className="mt-0.5 text-xs opacity-70">{totalQty} unit terjual</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-white shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Laba Produk</p>
          <p className="mt-2 font-mono-num text-xl font-bold">{formatRupiah(totalLabaProduk)}</p>
          <p className="mt-0.5 text-xs opacity-70">
            {totalOmzet > 0 ? `Margin ${((totalLabaProduk / totalOmzet) * 100).toFixed(1)}%` : "Belum ada nota"}
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-4 text-white shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Jumlah Nota</p>
          <p className="mt-2 font-mono-num text-xl font-bold">{monthSales.length}</p>
          <p className="mt-0.5 text-xs opacity-70">{aggList.length} produk berbeda</p>
        </div>
      </div>

      {/* Produk Terlaris */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="produk-terlaris">
        <div className="mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <h3 className="font-heading text-base font-bold text-slate-900">Produk Terlaris — {monthLabel(curMonth)}</h3>
        </div>
        {aggList.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">Belum ada penjualan bulan ini. Tekan tombol <b>Jual</b> pada produk.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Paling Sering Dijual</p>
              <div className="space-y-2">
                {topSold.map((p, i) => (
                  <div key={p.nama} data-testid={`top-sold-${i}`}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{i + 1}</span>
                        <span className="font-medium text-slate-700">{p.nama}</span>
                      </span>
                      <span className="font-mono-num font-semibold text-slate-800">{p.qty} pcs</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Paling Menguntungkan</p>
              <div className="space-y-2">
                {topProfit.map((p, i) => (
                  <div key={p.nama} data-testid={`top-profit-${i}`}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{i + 1}</span>
                        <span className="font-medium text-slate-700">{p.nama}</span>
                      </span>
                      <span className="font-mono-num font-semibold text-emerald-600">{formatRupiah(p.laba)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-emerald-400" style={{ width: `${(p.laba / maxLaba) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Tabs Produk per Kategori */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:items-center justify-between">
          <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-slate-100" data-testid="hpp-kategori-tabs">
            {KATEGORI.map((k) => (
              <TabsTrigger key={k} value={k} className="data-[state=active]:bg-white data-[state=active]:text-indigo-700" data-testid={`hpp-tab-${k}`}>
                {k}
                <span className="ml-1.5 hidden rounded-full bg-slate-200 px-1.5 text-[10px] font-bold text-slate-600 sm:inline">
                  {rows.filter((r) => r.kategori === k).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="relative w-full sm:w-64 flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder={`Cari di ${tab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full bg-white border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {KATEGORI.map((k) => (
          <TabsContent key={k} value={k} className="mt-0">{renderTable(k)}</TabsContent>
        ))}
      </Tabs>

      <Dialog open={jualOpen} onOpenChange={setJualOpen}>
        <DialogContent className="sm:max-w-md" data-testid="jual-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Jual: {jualRow?.nama}</DialogTitle>
            <DialogDescription>Otomatis tercatat sebagai pemasukan di Buku Kas.</DialogDescription>
          </DialogHeader>
          {jualDone ? (
            <div className="space-y-3 py-2" data-testid="jual-sukses">
              {/* Success banner */}
              <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}>
                <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-200">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <p className="font-bold text-emerald-900">Tersimpan ke Buku Kas</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Nota {jualDone.sale.nota_no} · {jualDone.sale.nama} ×{jualDone.sale.qty}</p>
                </div>
              </div>

              {/* Stats rows — no outer border/box */}
              <div className="space-y-2 px-1">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-600">Pemasukan</span>
                  <span className="font-mono-num text-base font-bold text-emerald-600">+{formatRupiah(jualDone.sale.total)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <Wallet size={14} className="text-indigo-400" /> Saldo Kas Sekarang
                  </span>
                  <span className="font-mono-num text-base font-bold text-indigo-700" data-testid="jual-sukses-saldo">
                    {formatRupiah(jualDone.saldo)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-600">Sisa Stok {jualDone.sale.nama}</span>
                  <span className={`font-mono-num text-base font-bold ${jualDone.sisaStok <= 0 ? "text-red-600" : "text-slate-700"}`}>
                    {jualDone.sisaStok} pcs
                  </span>
                </div>
              </div>

              <p className="text-center text-xs text-slate-400 pb-1">Tidak perlu buka tab Buku Kas — semua sudah tercatat otomatis.</p>
            </div>
          ) : jualRow && (() => {
            const harga = parseNumber(jualRow.harga_jual);
            const qty = Math.max(1, parseInt(jualQty, 10) || 1);
            const subtotal = harga * qty;
            const diskon = jualDiskonMode === "persen"
              ? Math.round(subtotal * (parseNumber(jualDiskon) / 100))
              : Math.max(0, parseNumber(jualDiskon));
            const total = Math.max(0, subtotal - diskon);
            const qNum = parseInt(jualQty, 10) || 1;
            const stokTersedia = parseInt(jualRow.stok, 10) || 0;
            const isStockEnough = qNum > 0 && qNum <= stokTersedia;
            const qtyStr = isStockEnough && qNum > 0 ? "" : "border-red-400 focus-visible:ring-red-400";
            return (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <Label>Jumlah (Qty)</Label>
                      <span className="text-[10px] text-slate-500 font-medium">Stok: {stokTersedia}</span>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      max={Math.max(1, stokTersedia)}
                      value={jualQty}
                      onChange={(e) => {
                        const val = Math.min(parseInt(e.target.value) || 1, stokTersedia);
                        setJualQty(e.target.value === "" ? "" : String(val));
                      }}
                      className={qtyStr}
                      data-testid="jual-qty-input"
                    />
                    {!isStockEnough && qNum > 0 && (
                      <p className="text-[10px] text-red-600 mt-1 font-medium">Qty melebihi stok!</p>
                    )}
                  </div>
                  <div>
                    <Label>Harga Satuan</Label>
                    <Input value={formatRupiah(harga)} disabled className="font-mono-num" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nama Pembeli (opsional)</Label>
                    <Input value={jualPembeli} onChange={(e) => setJualPembeli(e.target.value)} placeholder="cth: Toko Bu Ani" data-testid="jual-pembeli-input" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Diskon (opsional)</Label>
                      <div className="flex overflow-hidden rounded-md border text-xs">
                        <button type="button" onClick={() => setJualDiskonMode("rp")} className={`px-2 py-0.5 ${jualDiskonMode === "rp" ? "bg-indigo-600 text-white" : "text-slate-500"}`} data-testid="diskon-mode-rp">Rp</button>
                        <button type="button" onClick={() => setJualDiskonMode("persen")} className={`px-2 py-0.5 ${jualDiskonMode === "persen" ? "bg-indigo-600 text-white" : "text-slate-500"}`} data-testid="diskon-mode-persen">%</button>
                      </div>
                    </div>
                    <Input inputMode="numeric" value={jualDiskon} onChange={(e) => setJualDiskon(jualDiskonMode === "persen" ? e.target.value.replace(/[^0-9.]/g, "") : formatNumberInput(e.target.value))} data-testid="jual-diskon-input" />
                  </div>
                </div>
                {diskon > 0 && (
                  <p className="px-1 text-xs text-slate-500" data-testid="jual-diskon-info">Subtotal {formatRupiah(subtotal)} − Diskon {formatRupiah(diskon)}{jualDiskonMode === "persen" ? ` (${parseNumber(jualDiskon)}%)` : ""}</p>
                )}

                <div className="flex items-center gap-2 mt-4 px-1">
                  <input type="checkbox" id="is-dp" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" checked={jualIsDp} onChange={(e) => setJualIsDp(e.target.checked)} />
                  <Label htmlFor="is-dp" className="font-semibold text-slate-700">Pembayaran Uang Muka (DP)</Label>
                </div>

                {jualIsDp && (
                  <div className="mt-2 pl-6">
                    <Label className="text-xs text-slate-500 mb-1 block">Nominal DP Dibayarkan</Label>
                    <Input inputMode="numeric" placeholder="Contoh: 500000" value={jualDpAmount} onChange={(e) => setJualDpAmount(formatNumberInput(e.target.value))} className="bg-white font-mono-num" />
                    <p className="text-[10px] text-amber-600 mt-1 font-medium bg-amber-50 p-1.5 rounded inline-block">Sisa {formatRupiah(Math.max(0, total - parseNumber(jualDpAmount)))} otomatis masuk ke Piutang (Status Produksi masuk Antrean).</p>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 mt-4 border border-emerald-100">
                  <span className="text-sm font-semibold text-emerald-800">{jualIsDp ? "Pemasukan (DP)" : "Total Tagihan"}</span>
                  <span className="font-mono-num text-xl font-bold text-emerald-700" data-testid="jual-total">
                    {formatRupiah(jualIsDp ? parseNumber(jualDpAmount) : total)}
                  </span>
                </div>
              </div>
            );
          })()}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {jualDone ? (
              <>
                <Button variant="outline" onClick={() => downloadNota(jualDone.sale, profile)} data-testid="jual-sukses-nota-btn"><Download size={15} className="mr-1" /> Unduh Nota</Button>
                <Button variant="outline" onClick={jualLagi} data-testid="jual-lagi-btn"><ShoppingCart size={15} className="mr-1" /> Jual Lagi</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setJualOpen(false)} data-testid="jual-tutup-btn">Selesai</Button>
              </>
            ) : (
              <>
                <Button variant="outline" disabled={parseInt(jualQty, 10) > (parseInt(jualRow?.stok, 10) || 0)} onClick={() => confirmJual(false)} data-testid="jual-catat-btn">Catat Saja</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={parseInt(jualQty, 10) > (parseInt(jualRow?.stok, 10) || 0)} onClick={() => confirmJual(true)} data-testid="jual-cetak-btn">
                  <Download size={15} className="mr-1" /> Catat &amp; Unduh Nota
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog open={stokAddOpen} onOpenChange={setStokAddOpen}>
        <DialogContent className="max-w-sm" data-testid="tambah-stok-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Tambah Stok — {stokRow?.nama}</DialogTitle>
            <DialogDescription>Stok saat ini: {parseInt(stokRow?.stok, 10) || 0}. Masukkan jumlah barang yang baru datang.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Jumlah Ditambah</Label>
            <Input type="number" min="1" value={stokAddQty} onChange={(e) => setStokAddQty(e.target.value)} placeholder="0" data-testid="tambah-stok-input" />
            {(parseInt(stokAddQty, 10) || 0) > 0 && <p className="mt-2 text-xs text-slate-500">Stok baru: {(parseInt(stokRow?.stok, 10) || 0) + (parseInt(stokAddQty, 10) || 0)}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStokAddOpen(false)}>Batal</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={confirmTambahStok} data-testid="confirm-tambah-stok-btn">Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-sm" data-testid="report-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Rekap Penjualan PDF</DialogTitle>
            <DialogDescription>Pilih bulan, lalu unduh. Buka file & pilih Cetak/Simpan sebagai PDF.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Bulan</Label>
            <Select value={reportMonth} onValueChange={setReportMonth}>
              <SelectTrigger data-testid="report-month-select"><SelectValue placeholder="Pilih bulan" /></SelectTrigger>
              <SelectContent>
                {saleMonths.map((m) => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Batal</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { downloadReport(sales, profile, reportMonth); setReportOpen(false); }} data-testid="download-report-btn">Unduh Rekap</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={salinOpen} onOpenChange={setSalinOpen}>
        <DialogContent className="max-w-sm" data-testid="salin-margin-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Samakan Margin — {salinKategori}</DialogTitle>
            <DialogDescription>Harga jual semua produk di kategori ini dihitung ulang dari HPP agar marginnya sama. Produk tanpa HPP dilewati.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Target Margin (%)</Label>
            <Input type="number" min="0" max="99" value={salinMargin} onChange={(e) => setSalinMargin(e.target.value)} data-testid="salin-margin-input" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSalinOpen(false)}>Batal</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={applySalin} data-testid="apply-salin-btn">Terapkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!notaDel} onOpenChange={(o) => !o && setNotaDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus nota?</AlertDialogTitle>
            <AlertDialogDescription>Nota {notaDel?.nota_no} ({notaDel?.nama}) akan dihapus, termasuk transaksi pemasukannya di Buku Kas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => hapusNota(notaDel)} data-testid="confirm-delete-nota-btn">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Web Setting Dialog */}
      <Dialog open={webMenuOpen} onOpenChange={setWebMenuOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Globe className="text-indigo-600" size={20} /> Etalase Toko Online
            </DialogTitle>
            <DialogDescription>
              Atur tampilan untuk produk <strong className="text-slate-800">{webRow?.nama}</strong> di website publik.
            </DialogDescription>
          </DialogHeader>
          {webRow && (
            <div className="space-y-4 py-3">
              <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <div>
                  <Label className="text-sm font-bold text-indigo-900 block">Jual Online</Label>
                  <p className="text-xs text-indigo-700/80 mt-0.5">Tampilkan katalog ini di web publik</p>
                </div>
                <div
                  className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${webRow.is_public ? 'bg-indigo-500' : 'bg-slate-300'}`}
                  onClick={() => setWebRow({ ...webRow, is_public: !webRow.is_public })}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${webRow.is_public ? 'translate-x-6' : ''}`} />
                </div>
              </div>

              <div className={!webRow.is_public ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                <div className="mb-3">
                  <Label>Foto / Gambar Produk (Opsional)</Label>
                  <div className="flex gap-3 mt-1 items-center">
                    <div className="bg-slate-100 w-16 h-16 rounded-xl flex-none grid place-items-center overflow-hidden border border-slate-200">
                      {webRow.image_url ? (
                        <img src={webRow.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Image size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="cursor-pointer file:cursor-pointer file:bg-indigo-50 file:text-indigo-700 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 hover:file:bg-indigo-100 pt-2"
                      />
                      <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Pilih gambar dari Komputer/HP Anda agar langsung tampil di Web Publik.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Deskripsi / Spesifikasi Produk</Label>
                  <textarea
                    className="w-full mt-1 flex min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Contoh: Kertas Art Paper 150gsm, Cetak Full Color, Pengerjaan 1 hari..."
                    value={webRow.deskripsi || ""}
                    onChange={(e) => setWebRow({ ...webRow, deskripsi: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebMenuOpen(false)}>Batal</Button>
            <Button onClick={applyWebSettings} className="bg-indigo-600 hover:bg-indigo-700">Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
