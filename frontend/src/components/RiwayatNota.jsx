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
                {/* Page Header */}
                <div className="flex-none flex items-center justify-between pb-2 bg-transparent">
                    <div>
                        <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2">
                            <ReceiptText size={20} className="text-slate-700" /> Riwayat Nota Penjualan
                        </h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {sales.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => setShowFilter(!showFilter)}
                                className={`gap-2 h-8 text-[13px] font-medium shadow-sm transition-all ${showFilter ? "bg-slate-100" : "bg-white"}`}
                            >
                                <FilterIcon size={14} /> Filter
                                {hasFilter && <span className="ml-1 w-2 h-2 rounded-full bg-indigo-600 block"></span>}
                            </Button>
                        )}
                        {sales.length > 0 && (
                            <Button variant="outline" className="gap-2 h-8 bg-white text-[13px] font-medium shadow-sm" onClick={() => { setReportMonth(saleMonths[0] || curMonth); setReportOpen(true); }}>
                                <FileText size={14} /> Rekap PDF
                            </Button>
                        )}
                        {sales.length > 0 && (
                            <Button onClick={() => exportSalesCSV(filteredSales)} className="gap-2 h-8 bg-white text-[13px] font-medium shadow-sm border border-slate-200 hover:bg-slate-50">
                                <Download size={14} /> Export CSV
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilter && (
                    <div className="grid grid-cols-1 gap-4 rounded-lg bg-white border border-slate-200 p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-2">
                        <div className="lg:col-span-2">
                            <Label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Pencarian</Label>
                            <Input type="text" placeholder="Cari nota, produk, atau nama pembeli..." value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} className="bg-white border-slate-200 text-[13px] h-9" />
                        </div>
                        <div>
                            <Label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Dari Tanggal</Label>
                            <Input type="date" value={f.dari} onChange={(e) => setF({ ...f, dari: e.target.value })} className="bg-white border-slate-200 text-[13px] h-9" />
                        </div>
                        <div>
                            <Label className="text-[12px] font-medium text-slate-600 mb-1.5 block">Sampai Tanggal</Label>
                            <Input type="date" value={f.sampai} onChange={(e) => setF({ ...f, sampai: e.target.value })} className="bg-white border-slate-200 text-[13px] h-9" />
                        </div>
                        {hasFilter && (
                            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                                <Button variant="ghost" className="h-8 text-[12px] font-medium text-slate-500 hover:text-slate-800" onClick={clearFilter}>
                                    <X size={14} className="mr-1.5" /> Bersihkan Filter
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SCROLLABLE TABLE SECTION */}
            <div className="flex-1 rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.1)] bg-white overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-[13px] border-collapse relative">
                        <thead className="sticky top-0 z-20 bg-[#f7f7f7] border-b border-slate-200 text-slate-600 font-medium shadow-none">
                            <tr>
                                <th className="px-5 py-2.5 min-w-[150px] border-r border-slate-100/50">Tanggal & No. Nota</th>
                                <th className="px-5 py-2.5 w-full border-r border-slate-100/50">Produk & Detail Pembeli</th>
                                <th className="px-5 py-2.5 text-right w-[150px] border-r border-slate-100/50">Tagihan</th>
                                <th className="px-5 py-2.5 text-center min-w-[200px]">Cetak & Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[13px]">
                            {filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-24 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-slate-400 font-medium text-[13px]">{hasFilter ? "Tidak ada nota yang cocok" : "Belum ada nota yang tersimpan."}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((s) => (
                                    <tr key={s.id} className="group hover:bg-[#f9fafb] transition-all bg-white">
                                        <td className="px-5 py-3 align-top min-w-[150px]">
                                            <p className="font-medium text-slate-800">{formatTanggal(s.tanggal)}</p>
                                            <span className="block mt-0.5 text-[11px] text-slate-500 font-mono tracking-wide">{s.nota_no}</span>
                                        </td>
                                        <td className="px-5 py-3 align-top">
                                            <div className="flex flex-col gap-1 inline-flex">
                                                <p className="text-slate-800 font-semibold leading-tight">
                                                    {s.nama} <span className="font-normal text-slate-500 text-[12px] ml-1">× {s.qty} {s.qty > 1 ? 'pcs' : 'pc'}</span>
                                                </p>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                    {s.pembeli && (
                                                        <span className="text-[12px] text-slate-500 flex items-center gap-1">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PBL</span> {s.pembeli}
                                                        </span>
                                                    )}
                                                    {s.is_dp && (
                                                        <span className="text-[10px] font-semibold text-[#b35e20] bg-[#fbf1ed] border border-[#f5e1d2] px-1.5 py-0.5 rounded ml-1 uppercase">
                                                            Sisa {formatRupiah(s.total - s.dp_amount)}
                                                        </span>
                                                    )}
                                                </div>
                                                {s.diskon > 0 && <p className="text-[12px] text-[#ef4444] font-mono-num">- Diskon: {formatRupiah(s.diskon)}</p>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 align-top text-right w-[150px]">
                                            <p className="font-mono-num text-[14px] font-semibold text-slate-800">{formatRupiah(s.total)}</p>
                                            {(s.laba > 0) && <p className="text-[11px] text-slate-400 font-mono-num mt-0.5">Laba: {formatRupiah(s.laba)}</p>}
                                        </td>
                                        <td className="px-5 py-3 align-top text-center min-w-[200px]">
                                            <div className="flex flex-wrap items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] bg-white text-slate-600 hover:bg-slate-50 shadow-sm" onClick={() => downloadNota(s, profile)} title="Download Thermal 58mm">
                                                    Nota
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] bg-white text-slate-600 hover:bg-slate-50 shadow-sm" onClick={() => downloadInvoice(s, profile)} title="Download Invoice A4/PDF">
                                                    Invoice
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] bg-white text-slate-600 hover:bg-slate-50 shadow-sm" onClick={() => downloadSuratJalan(s, profile)} title="Download Surat Jalan Delivery">
                                                    Surat Jalan
                                                </Button>
                                                <button onClick={() => setNotaDel(s)} className="grid h-7 w-7 shrink-0 place-items-center rounded border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all shadow-sm ml-1" title="Hapus">
                                                    <Trash2 size={13} />
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
