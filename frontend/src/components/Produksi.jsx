import React, { useMemo, useState } from "react";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Clock, CheckCircle2, PackageCheck, Paintbrush, Printer as PrinterIcon, ListFilter, Search, Image as ImageIcon, CalendarHeart, Flame, Layers } from "lucide-react";
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
        if (activeFilter === "Prioritas") {
            result = result.filter(s => s.is_prioritas);
        } else if (activeFilter !== "Semua") {
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
        // Prioritas naik ke atas, lalu terbaru di atas
        result = [...result].sort((a, b) => {
            if (a.is_prioritas !== b.is_prioritas) return a.is_prioritas ? -1 : 1;
            const dateA = new Date(a.created_at || a.tanggal || 0);
            const dateB = new Date(b.created_at || b.tanggal || 0);
            return dateB - dateA;
        });
        return result;
    }, [sales, activeFilter, search]);

    const counts = useMemo(() => {
        const c = { Semua: sales.length, Prioritas: sales.filter(s => s.is_prioritas).length };
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

    const togglePrioritas = async (sale) => {
        try {
            const next = !sale.is_prioritas;
            await api.updateSalePrioritas(sale.id, next);
            toast.success(next ? `⚡ ${sale.nota_no} ditandai Prioritas!` : `${sale.nota_no} dihapus dari Prioritas`);
            onUpdated && onUpdated();
        } catch (e) {
            toast.error("Gagal mengubah prioritas");
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2">
                        <Layers size={20} className="text-slate-700" /> Papan Status Produksi
                    </h2>
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

            {/* Table matched to BukuKas Theme */}
            <div className="rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.1)] bg-white overflow-hidden flex flex-col mt-2">
                <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-white w-full overflow-x-auto relative z-10 flex-nowrap shrink-0">
                    <button
                        onClick={() => setActiveFilter("Prioritas")}
                        className={`px-3 py-1.5 text-[13px] font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeFilter === "Prioritas" ? 'bg-red-50 text-red-700 border-red-200' : 'text-red-500 hover:bg-red-50 border border-transparent shadow-none'}`}
                    >
                        <Flame size={14} /> Prioritas
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeFilter === "Prioritas" ? "bg-red-600 text-white" : "bg-red-100"}`}>{counts["Prioritas"]}</span>
                    </button>
                    <div className="w-px h-5 bg-slate-200 mx-1 shrink-0"></div>
                    {["Semua", ...STATUSES].map(st => (
                        <button
                            key={st}
                            onClick={() => setActiveFilter(st)}
                            className={`px-3 py-1.5 text-[13px] font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeFilter === st ? 'bg-[#f1f2f4] text-slate-800' : 'text-slate-500 hover:bg-slate-50 border border-transparent shadow-none'}`}
                        >
                            {st !== "Semua" && STATUS_ICONS[st]}
                            {st}
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeFilter === st ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                                {counts[st]}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="w-full">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse whitespace-nowrap relative min-w-[850px]">
                            <thead className="bg-[#f7f7f7] border-b border-slate-200 text-slate-600 text-[13px] font-medium shadow-none">
                                <tr>
                                    <th className="px-4 py-2.5 w-8 text-center border-r border-slate-100/50">#</th>
                                    <th className="px-4 py-2.5 border-r border-slate-100/50">No. Nota</th>
                                    <th className="px-4 py-2.5 min-w-[200px] border-r border-slate-100/50">Nama Produk</th>
                                    <th className="px-4 py-2.5 border-r border-slate-100/50">Pembeli</th>
                                    <th className="px-4 py-2.5 text-center border-r border-slate-100/50">Qty</th>
                                    <th className="px-4 py-2.5 text-right border-r border-slate-100/50">Total</th>
                                    <th className="px-4 py-2.5 border-r border-slate-100/50">Tanggal &amp; Tenggat</th>
                                    <th className="px-4 py-2.5 text-center border-r border-slate-100/50">Bayar</th>
                                    <th className="px-4 py-2.5 text-center w-10 border-r border-slate-100/50" title="Tandai Prioritas">⚡</th>
                                    <th className="px-4 py-2.5 text-center w-40 border-r border-slate-100/50">Status Produksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[13px]">
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
                                                className={`group hover:bg-[#f9fafb] transition-all duration-150 ${sale.is_prioritas
                                                    ? "bg-red-50/50 border-l-4 border-l-red-500"
                                                    : `bg-white border-l-4 ${STATUS_ROW_ACCENT[st] || "border-l-transparent"}`
                                                    }`}
                                            >
                                                <td className="px-4 py-3 align-middle text-center text-slate-400 font-bold">{idx + 1}</td>

                                                {/* Nota No */}
                                                <td className="px-4 py-3.5">
                                                    {sale.is_prioritas && (
                                                        <div className="flex items-center gap-0.5 mb-1">
                                                            <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-600 border border-red-200 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                                <Flame size={8} /> PRIORITAS
                                                            </span>
                                                        </div>
                                                    )}
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

                                                {/* Toggle Prioritas */}
                                                <td className="px-3 py-3.5 text-center">
                                                    <button
                                                        onClick={() => togglePrioritas(sale)}
                                                        title={sale.is_prioritas ? "Hapus Prioritas" : "Tandai Prioritas"}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border mx-auto ${sale.is_prioritas
                                                            ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-200 hover:bg-red-600"
                                                            : "bg-white border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500"
                                                            }`}
                                                    >
                                                        <Flame size={14} />
                                                    </button>
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
                </div>

                {/* Footer summary */}
                {filteredSales.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium mt-[-1px]">
                        <span>Total pesanan: <span className="font-black text-slate-700">{filteredSales.length}</span></span>
                        <span>Total qty: <span className="font-black text-slate-700">{filteredSales.reduce((a, s) => a + (s.qty || 0), 0)} pcs</span></span>
                        <span>Total nilai: <span className="font-black text-slate-700">{formatRupiah(filteredSales.reduce((a, s) => a + (s.total || 0), 0))}</span></span>
                    </div>
                )}
            </div>
        </div>
    );
};
