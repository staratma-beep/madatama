import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Bell, ShoppingCart, Receipt, Clock } from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "./ui/dropdown-menu";

export const WebOrders = ({ onNavigate }) => {
    const [orders, setOrders] = useState([]);

    const refreshOrders = async () => {
        try {
            const o = await api.getPublicOrders();
            setOrders(o);
        } catch (e) { }
    };

    useEffect(() => {
        refreshOrders();
        const inv = setInterval(refreshOrders, 30000);
        return () => clearInterval(inv);
    }, []);

    const pendingOrders = orders.filter(o => o.status === "Menunggu Konfirmasi").map(o => ({ ...o, notifType: 'order' }));
    const pendingPayments = orders.filter(o => o.payment_status === "Menunggu Konfirmasi Bayar").map(o => ({ ...o, notifType: 'payment' }));

    const allNotifs = [...pendingOrders, ...pendingPayments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const notificationCount = allNotifs.length;

    return (
        <DropdownMenu onOpenChange={(open) => { if (open) refreshOrders() }}>
            <DropdownMenuTrigger asChild>
                <button
                    className="relative grid h-9 w-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 place-items-center rounded-xl transition-all shadow-sm outline-none"
                    title="Ada pesanan online & konfirmasi pembayaran baru"
                >
                    <Bell size={18} className={notificationCount > 0 ? "animate-pulse text-amber-500" : ""} />
                    {notificationCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
                            {notificationCount < 10 ? notificationCount : '9+'}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 md:w-96 p-0 max-h-[80vh] overflow-hidden flex flex-col bg-white border border-slate-100 shadow-xl rounded-2xl">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-sm text-slate-700">Notifikasi Baru Diterima</h3>
                </div>

                <div className="overflow-y-auto max-h-[60vh]">
                    {allNotifs.length > 0 ? (
                        allNotifs.map(n => (
                            <div
                                key={`${n.notifType}-${n.id}`}
                                className="flex gap-4 p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                                onClick={() => { if (onNavigate) onNavigate(); }}
                            >
                                <div className="shrink-0 mt-1">
                                    {n.notifType === 'order' ? (
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><ShoppingCart size={18} /></div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Receipt size={18} /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-slate-800 leading-tight mb-1 truncate">
                                        {n.notifType === 'order' ? 'Pesanan Baru Masuk' : 'Konfirmasi Pembayaran'}
                                    </h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {n.notifType === 'order'
                                            ? `Pesanan baru dari ${n.nama} senilai ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n.total || 0)}. Menunggu persetujuan.`
                                            : `${n.nama} telah mengunggah bukti pembayaran via ${n.payment_method || 'transfer'}.`
                                        }
                                    </p>
                                    <span className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-medium"><Clock size={10} /> {new Date(n.created_at).toLocaleString("id-ID", { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            <Bell className="mx-auto mb-2 text-slate-300" size={32} />
                            <p className="text-sm">Tidak ada notifikasi baru</p>
                        </div>
                    )}
                </div>

                <div className="p-2 bg-slate-50/80 border-t border-slate-100">
                    <button
                        className="w-full py-2.5 text-sm font-bold text-indigo-600 hover:bg-white hover:text-indigo-700 bg-transparent rounded-xl border border-transparent transition-all"
                        onClick={() => { if (onNavigate) onNavigate(); }}
                    >
                        Tampilkan Semua Pesanan
                    </button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
