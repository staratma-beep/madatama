import React, { useState, useEffect, useCallback, useMemo } from "react";
import { formatRupiah, formatTanggal, monthKey, monthLabel } from "../lib/format";
import { api } from "../lib/api";
import { downloadNota, downloadInvoice, downloadSuratJalan } from "../lib/nota";
import { exportSalesCSV } from "../lib/salesExport";
import { downloadReport } from "../lib/salesReport";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, Download, ReceiptText, FileText, FileSpreadsheet, Truck, Filter as FilterIcon, X } from "lucide-react";

export const RiwayatNota = ({ onSaleUpdate }) => {
    const [sales, setSales] = useState([]);
    const [profile, setProfile] = useState({});
    const [notaDel, setNotaDel] = useState(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportMonth, setReportMonth] = useState("");

    // Filter states
    const [f, setF] = useState({ search: "", dari: "", sampai: "" });
    const [showFilter, setShowFilter] = useState(false);

    const refresh = useCallback(async () => {
        const [s, st] = await Promise.all([api.getSales(), api.getSettings()]);
        setSales(s);
        setProfile(st);
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const hapusNota = async (s) => {
        await api.deleteSale(s.id);
        setSales((arr) => arr.filter((x) => x.id !== s.id));
        setNotaDel(null);
        if (onSaleUpdate) onSaleUpdate();
        toast.success("Nota penjualan berhasil dihapus!");
    };

    const curMonth = monthKey(new Date().toISOString());
    const saleMonths = Array.from(new Set(sales.map((s) => (s.tanggal || "").slice(0, 7)))).filter(Boolean).sort((a, b) => (a < b ? 1 : -1));

    const clearFilter = () => setF({ search: "", dari: "", sampai: "" });
    const hasFilter = f.dari || f.sampai || f.search;

    const filteredSales = useMemo(() => {
        return sales.filter(s => {
            if (f.dari && s.tanggal < f.dari) return false;
            if (f.sampai && s.tanggal > f.sampai) return false;
            if (f.search) {
                const lower = f.search.toLowerCase();
                if (!s.nama.toLowerCase().includes(lower) &&
                    !s.nota_no.toLowerCase().includes(lower) &&
                    !(s.pembeli || "").toLowerCase().includes(lower)) {
                    return false;
                }
            }
            return true;
        }).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }, [sales, f]);

    return (
        <div className="flex flex-col h-[calc(100vh-130px)] max-w-7xl mx-auto gap-4">
            {/* STATIC TOP SECTION (Always visible) */}
            <div className="space-y-4">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-md border border-indigo-400/30 w-full" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.95), rgba(109,40,217,0.95))" }}>
                    <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
                    <div className="absolute right-8 bottom-0 h-24 w-24 rounded-full bg-white/5" />
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2 text-white drop-shadow-sm">
                                <ReceiptText size={20} /> Riwayat Nota Penjualan
                            </h2>
                            <p className="text-xs text-indigo-100 mt-1 max-w-md line-clamp-2">
                                Lihat daftar bukti transaksi yang tersimpan. Cetak kembali Nota, Invoice, atau Surat Jalan kapan pun dibutuhkan.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {sales.length > 0 && (
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowFilter(!showFilter)}
                                    className={`gap-2 text-white border-0 backdrop-blur-md shadow-sm transition-all ${showFilter ? "bg-white/40 ring-2 ring-white/50" : "bg-white/20 hover:bg-white/30"}`}
                                >
                                    <FilterIcon size={15} /> Filter
                                    {hasFilter && <span className="ml-1 grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-white shadow-sm">!</span>}
                                </Button>
                            )}
                            {sales.length > 0 && (
                                <Button variant="secondary" className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm shadow-sm" onClick={() => { setReportMonth(saleMonths[0] || curMonth); setReportOpen(true); }}>
                                    <FileText size={15} /> Rekap PDF
                                </Button>
                            )}
                            {sales.length > 0 && (
                                <Button onClick={() => exportSalesCSV(filteredSales)} className="gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold shadow-md">
                                    <Download size={15} /> Export CSV
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilter && (
                    <div className="grid grid-cols-1 gap-4 rounded-xl border border-indigo-100 bg-white/80 p-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-2 shadow-sm backdrop-blur-md">
                        <div className="lg:col-span-2">
                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Pencarian</Label>
                            <Input type="text" placeholder="Cari nota, produk, atau nama pembeli..." value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} className="bg-white border-indigo-200 focus-visible:ring-indigo-500" />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Dari Tanggal</Label>
                            <Input type="date" value={f.dari} onChange={(e) => setF({ ...f, dari: e.target.value })} className="bg-white border-indigo-200 focus-visible:ring-indigo-500" />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Sampai Tanggal</Label>
                            <Input type="date" value={f.sampai} onChange={(e) => setF({ ...f, sampai: e.target.value })} className="bg-white border-indigo-200 focus-visible:ring-indigo-500" />
                        </div>
                        {hasFilter && (
                            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                                <Button variant="ghost" className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-100" onClick={clearFilter}>
                                    <X size={14} className="mr-1.5" /> Hapus semua filter
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SCROLLABLE TABLE SECTION */}
            <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm flex flex-col min-h-0">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm relative">
                        <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur shadow-sm border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-400">Tanggal & No. Nota</th>
                                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-400">Produk & Detail Pembeli</th>
                                <th className="px-5 py-3.5 text-right w-40 text-xs font-bold uppercase tracking-widest text-slate-400">Tagihan</th>
                                <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Cetak & Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-50 border border-slate-100 text-slate-300">
                                                {hasFilter ? <FilterIcon size={24} /> : <ReceiptText size={24} />}
                                            </div>
                                            <p className="text-slate-500 font-semibold text-base">{hasFilter ? "Tidak ada nota yang cocok" : "Belum ada nota yang tersimpan."}</p>
                                            <p className="text-sm text-slate-400">{hasFilter ? "Coba ubah kata kunci pencarian Anda." : "Transaksi yang selesai (dijual) akan muncul di sini."}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((s) => (
                                    <tr key={s.id} className="group hover:bg-indigo-50/40 transition-colors">
                                        <td className="px-5 py-4 align-top w-48">
                                            <p className="font-semibold text-slate-800">{formatTanggal(s.tanggal)}</p>
                                            <span className="inline-block mt-1.5 font-mono font-bold text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded tracking-wider">{s.nota_no}</span>
                                        </td>
                                        <td className="px-5 py-4 align-top min-w-[250px]">
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-slate-800 font-bold text-base leading-tight">
                                                    {s.nama} <span className="font-medium text-slate-500 text-sm ml-1">× {s.qty} {s.qty > 1 ? 'pcs' : 'pc'}</span>
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {s.pembeli && (
                                                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">Pembeli</span> {s.pembeli}
                                                        </span>
                                                    )}
                                                    {s.is_dp && (
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full inline-flex items-center">
                                                            KREDIT / DP (Sisa {formatRupiah(s.total - s.dp_amount)})
                                                        </span>
                                                    )}
                                                </div>
                                                {s.diskon > 0 && <p className="text-xs text-rose-500 font-medium font-mono-num">- Diskon: {formatRupiah(s.diskon)}</p>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-top text-right">
                                            <p className="font-mono-num text-lg font-bold text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-md mb-1">{formatRupiah(s.total)}</p>
                                            {(s.laba > 0) && <p className="text-[10px] text-indigo-500 font-bold font-mono-num tracking-wide mt-1 uppercase">Laba: {formatRupiah(s.laba)}</p>}
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                                                <Button size="sm" variant="ghost" className="h-8 gap-1.5 hover:bg-slate-100 hover:text-slate-700 text-slate-500 font-semibold" onClick={() => downloadNota(s, profile)} title="Download Thermal 58mm">
                                                    <FileText size={14} /> Nota
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 gap-1.5 hover:bg-indigo-100 hover:text-indigo-700 text-indigo-500 font-semibold" onClick={() => downloadInvoice(s, profile)} title="Download Invoice A4/PDF">
                                                    <FileSpreadsheet size={14} /> Invoice
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 gap-1.5 hover:bg-slate-100 hover:text-slate-700 text-slate-500 font-semibold" onClick={() => downloadSuratJalan(s, profile)} title="Download Surat Jalan Delivery">
                                                    <Truck size={14} /> Jalan
                                                </Button>
                                                <button onClick={() => setNotaDel(s)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors ml-1" title="Hapus">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Mencetak Laporan Penjualan</DialogTitle>
                        <DialogDescription>Pilih bulan laporan untuk direkapitulasi dan diunduh dalam bentuk PDF.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select value={reportMonth} onValueChange={setReportMonth}>
                            <SelectTrigger><SelectValue placeholder="Pilih bulan laporan" /></SelectTrigger>
                            <SelectContent>
                                {saleMonths.map((m) => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportOpen(false)}>Batal</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { downloadReport(sales, profile, reportMonth); setReportOpen(false); }}>Unduh Laporan PDF</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!notaDel} onOpenChange={(o) => !o && setNotaDel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-rose-600">Hapus Nota Penjualan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak bisa dibatalkan! Nota <strong>{notaDel?.nota_no}</strong> akan dihancurkan bersama Catatan Pemasukannya di Buku Kas. <br /><br />(Saran: Edit stok secara manual jika retur barang terjadi.)
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal Hapus</AlertDialogCancel>
                        <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => hapusNota(notaDel)}>Ya, Hapus Nota</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
