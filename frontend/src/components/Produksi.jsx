import React, { useMemo, useState } from "react";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Clock, CheckCircle2, PackageCheck, Paintbrush, Printer as PrinterIcon, ListFilter, Search, Image as ImageIcon, CalendarHeart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { api } from "../lib/api";

const STATUSES = ["Desain", "Cetak", "Finishing", "Selesai", "Diambil"];

const STATUS_ICONS = {
    Desain: <Paintbrush size={12} />,
    Cetak: <PrinterIcon size={12} />,
    Finishing: <Clock size={12} />,
    Selesai: <CheckCircle2 size={12} />,
    Diambil: <PackageCheck size={12} />,
};

const STATUS_COLORS = {
    Desain: "bg-blue-100 text-blue-700 border-blue-200",
    Cetak: "bg-orange-100 text-orange-700 border-orange-200",
    Finishing: "bg-purple-100 text-purple-700 border-purple-200",
    Selesai: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Diambil: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_ROW_ACCENT = {
    Desain: "border-l-blue-400",
    Cetak: "border-l-orange-400",
    Finishing: "border-l-purple-400",
    Selesai: "border-l-emerald-400",
    Diambil: "border-l-slate-300",
};

export function Produksi({ sales, onStatusChange, onUpdated }) {
    const [activeFilter, setActiveFilter] = useState("Semua");
    const [search, setSearch] = useState("");

    const filteredSales = useMemo(() => {
        let result = sales;
        if (activeFilter !== "Semua") {
            result = result.filter(s => (s.status_produksi || "Selesai") === activeFilter);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(s =>
                (s.nota_no || "").toLowerCase().includes(q) ||
                (s.nama || "").toLowerCase().includes(q) ||
                (s.pembeli || "").toLowerCase().includes(q)
            );
        }
        return result;
    }, [sales, activeFilter, search]);

    const counts = useMemo(() => {
        const c = { Semua: sales.length };
        STATUSES.forEach(st => {
            c[st] = sales.filter(s => (s.status_produksi || "Selesai") === st).length;
        });
        return c;
    }, [sales]);

    const changeDeadline = async (sale, newDate) => {
        try {
            await api.updateSaleDeadline(sale.id, newDate);
            toast.success(`Tenggat waktu ${sale.nota_no} disimpan`);
            onUpdated && onUpdated();
        } catch (e) {
            toast.error("Gagal mengubah tenggat waktu");
        }
    };

    const changeStatus = async (sale, newStatus) => {
        try {
            await onStatusChange(sale.id, newStatus);
            toast.success(`Status ${sale.nota_no} diubah ke ${newStatus}`);
            onUpdated && onUpdated();
        } catch (e) {
            toast.error("Gagal mengubah status");
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-heading font-bold text-slate-800">Papan Status Produksi</h2>
                    <p className="text-sm text-slate-500 mt-1">Pantau & kelola antrean pesanan dari desain hingga selesai.</p>
                </div>
                {/* Search box */}
                <div className="relative w-full sm:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Cari nota, produk, pembeli..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                <ListFilter size={15} className="text-slate-400 shrink-0" />
                {["Semua", ...STATUSES].map(st => (
                    <button
                        key={st}
                        onClick={() => setActiveFilter(st)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeFilter === st
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                            }`}
                    >
                        {st !== "Semua" && STATUS_ICONS[st]}
                        {st}
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${activeFilter === st ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {counts[st]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[750px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                                <th className="px-4 py-3 w-8">#</th>
                                <th className="px-4 py-3">No. Nota</th>
                                <th className="px-4 py-3">Nama Produk</th>
                                <th className="px-4 py-3">Pembeli</th>
                                <th className="px-4 py-3 text-center">Qty</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3">Tanggal & Tenggat</th>
                                <th className="px-4 py-3 text-center">Bayar</th>
                                <th className="px-4 py-3 text-center w-36">Status Produksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-16 text-slate-400 text-sm font-medium">
                                        Tidak ada pesanan untuk filter ini.
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale, idx) => {
                                    const st = sale.status_produksi || "Selesai";
                                    return (
                                        <tr
                                            key={sale.id}
                                            className={`hover:bg-slate-50/70 transition-colors border-l-4 ${STATUS_ROW_ACCENT[st] || "border-l-transparent"}`}
                                        >
                                            <td className="px-4 py-3.5 text-xs text-slate-400 font-bold">{idx + 1}</td>

                                            {/* Nota No */}
                                            <td className="px-4 py-3.5">
                                                <span className="font-mono text-xs font-bold text-indigo-600">{sale.nota_no}</span>
                                                {sale.public_order_id && (
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className="inline-block bg-indigo-50 text-indigo-500 border border-indigo-200 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">ONLINE</span>
                                                        <span className="font-mono text-[10px] text-slate-400 font-semibold truncate max-w-[120px]" title={sale.public_order_id}>{sale.public_order_id}</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Nama Produk */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    {sale.custom_image && (
                                                        <a href={sale.custom_image} target="_blank" rel="noreferrer" title={`Lihat Desain: ${sale.nama}`}>
                                                            <div className="w-10 h-10 rounded-lg border-2 border-indigo-300 overflow-hidden hover:scale-110 hover:border-indigo-500 transition-all shadow-md flex-shrink-0 bg-indigo-50">
                                                                <img
                                                                    src={sale.custom_image}
                                                                    alt="Desain"
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-indigo-400 text-[9px] font-black leading-tight text-center px-1">FILE<br/>DESAIN</div>';
                                                                    }}
                                                                />
                                                            </div>
                                                        </a>
                                                    )}
                                                    <p className="font-semibold text-sm text-slate-800 line-clamp-1 max-w-[200px]" title={sale.nama}>{sale.nama}</p>
                                                </div>
                                            </td>

                                            {/* Pembeli */}
                                            <td className="px-4 py-3.5">
                                                <p className="text-sm text-slate-600 font-medium truncate max-w-[140px]">{sale.pembeli || "—"}</p>
                                            </td>

                                            {/* Qty */}
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-sm font-bold text-slate-700">{sale.qty}</span>
                                            </td>

                                            {/* Total */}
                                            <td className="px-4 py-3.5 text-right">
                                                <span className="font-bold text-sm text-slate-800 font-mono">{formatRupiah(sale.total)}</span>
                                            </td>

                                            {/* Tanggal & Waktu */}
                                            <td className="px-4 py-3.5">
                                                <div className="mb-2">
                                                    <p className="text-xs font-semibold text-slate-700">{formatTanggal ? formatTanggal(sale.tanggal) : sale.tanggal}</p>
                                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 mb-1">
                                                        Masuk: {sale.tanggal ? new Date(sale.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-7 max-w-[140px] focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all bg-white relative">
                                                    <div className="pl-2 pr-1.5 flex items-center justify-center pointer-events-none text-slate-400 z-10 bg-white group-hover:bg-slate-50">
                                                        <CalendarHeart size={12} className={sale.tenggat_waktu ? "text-indigo-500" : ""} />
                                                    </div>
                                                    <input
                                                        type="date"
                                                        className="w-full h-full text-[10px] font-bold text-slate-700 outline-none pr-1.5 focus:bg-white bg-transparent"
                                                        value={sale.tenggat_waktu || ""}
                                                        onChange={(e) => changeDeadline(sale, e.target.value)}
                                                        title="Set Target / Deadline Selesai"
                                                    />
                                                </div>
                                            </td>

                                            {/* Status Bayar */}
                                            <td className="px-4 py-3.5 text-center">
                                                {sale.is_dp ? (
                                                    <span className="inline-block rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">DP</span>
                                                ) : (
                                                    <span className="inline-block rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">LUNAS</span>
                                                )}
                                            </td>

                                            {/* Status Produksi Dropdown */}
                                            <td className="px-4 py-3.5 text-center">
                                                <Select value={st} onValueChange={(val) => changeStatus(sale, val)}>
                                                    <SelectTrigger className={`h-8 text-xs px-2.5 font-bold border rounded-lg ${STATUS_COLORS[st]}`}>
                                                        <div className="flex items-center gap-1.5">
                                                            {STATUS_ICONS[st]}
                                                            <SelectValue />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {STATUSES.map(s => (
                                                            <SelectItem key={s} value={s} className="text-xs font-medium">
                                                                {s}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer summary */}
                {filteredSales.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                        <span>Total pesanan: <span className="font-black text-slate-700">{filteredSales.length}</span></span>
                        <span>Total qty: <span className="font-black text-slate-700">{filteredSales.reduce((a, s) => a + (s.qty || 0), 0)} pcs</span></span>
                        <span>Total nilai: <span className="font-black text-slate-700">{formatRupiah(filteredSales.reduce((a, s) => a + (s.total || 0), 0))}</span></span>
                    </div>
                )}
            </div>
        </div>
    );
}
