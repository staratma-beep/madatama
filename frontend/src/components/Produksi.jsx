import React, { useMemo } from "react";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Clock, CheckCircle2, ChevronRight, PackageCheck, Paintbrush, Printer as PrinterIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";

const STATUSES = ["Desain", "Cetak", "Finishing", "Selesai", "Diambil"];

const STATUS_ICONS = {
    Desain: <Paintbrush size={14} />,
    Cetak: <PrinterIcon size={14} />,
    Finishing: <Clock size={14} />,
    Selesai: <CheckCircle2 size={14} />,
    Diambil: <PackageCheck size={14} />,
};

const STATUS_COLORS = {
    Desain: "bg-blue-100 text-blue-800 border-blue-200",
    Cetak: "bg-orange-100 text-orange-800 border-orange-200",
    Finishing: "bg-purple-100 text-purple-800 border-purple-200",
    Selesai: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Diambil: "bg-slate-100 text-slate-500 border-slate-200",
};

export function Produksi({ sales, onStatusChange, onUpdated }) {
    // Only show active sales (not typically those that are 'Diambil' for too long, but for now show all or filter Diambil)
    const groupedSales = useMemo(() => {
        const groups = { Desain: [], Cetak: [], Finishing: [], Selesai: [], Diambil: [] };
        sales.forEach(s => {
            const st = s.status_produksi || "Selesai";
            if (!groups[st]) groups[st] = [];
            groups[st].push(s);
        });
        return groups;
    }, [sales]);

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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-heading font-bold text-slate-800">Papan Status Produksi</h2>
                    <p className="text-sm text-slate-500 mt-1">Pantau & kelola antrean pesanan dari desain hingga selesai.</p>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {STATUSES.map(status => (
                    <div key={status} className="flex-none w-72 flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200/60 p-3 snap-center">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                {STATUS_ICONS[status]}
                                {status}
                                <span className="ml-1.5 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                    {groupedSales[status].length}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto max-h-[70vh] pr-1">
                            {groupedSales[status].map(sale => (
                                <div key={sale.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col gap-2 relative group hover:border-indigo-200 transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">{sale.nota_no}</p>
                                            <h3 className="font-semibold text-slate-800 text-sm mt-0.5 line-clamp-2 leading-snug">{sale.nama}</h3>
                                        </div>
                                        {sale.is_dp ? (
                                            <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">DP</span>
                                        ) : (
                                            <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">LUNAS</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="truncate">{sale.pembeli || "Hamba Allah"}</span>
                                        <span>•</span>
                                        <span>{sale.qty} pcs</span>
                                    </div>

                                    <div className="pt-2 border-t border-slate-50 mt-1 flex items-center justify-between">
                                        <div className="text-xs font-mono-num font-semibold text-slate-600">
                                            {formatRupiah(sale.total)}
                                        </div>
                                        <div className="w-28">
                                            <Select value={status} onValueChange={(val) => changeStatus(sale, val)}>
                                                <SelectTrigger className={`h-7 text-[10px] px-2 font-medium border ${STATUS_COLORS[status]}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUSES.map(s => (
                                                        <SelectItem key={s} value={s} className="text-[11px] font-medium">{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {groupedSales[status].length === 0 && (
                                <div className="h-24 w-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
                                    Kosong
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
