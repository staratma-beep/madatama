import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Bell, ShoppingCart, Receipt, Clock } from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "./ui/dropdown-menu";

export const WebOrders = ({ onNavigate, publicOrders = [] }) => {
    const pendingOrders = publicOrders.filter(o => o.status === "Menunggu Konfirmasi").map(o => ({ ...o, notifType: 'order' }));
    const pendingPayments = publicOrders.filter(o => o.payment_status === "Menunggu Konfirmasi Bayar").map(o => ({ ...o, notifType: 'payment' }));

    const allNotifs = [...pendingOrders, ...pendingPayments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const notificationCount = allNotifs.length;

    const [isOpen, setIsOpen] = useState(false);

    const handleNavigate = () => {
        setIsOpen(false);
        if (onNavigate) onNavigate();
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
            <DropdownMenuTrigger asChild>
                <button
                    className="relative grid h-8 w-8 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 place-items-center rounded-md transition-all shadow-sm outline-none"
                    title="Ada pesanan online & konfirmasi pembayaran baru"
                >
                    <Bell size={15} className={notificationCount > 0 ? "animate-pulse text-amber-500" : ""} />
                    {notificationCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                            {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 md:w-96 p-0 max-h-[80vh] overflow-hidden flex flex-col bg-white border border-slate-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] rounded-lg animate-in zoom-in-95">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-sm text-slate-700">Notifikasi Baru Diterima</h3>
                </div>

                <div className="overflow-y-auto max-h-[60vh]">
                    {allNotifs.length > 0 ? (
                        allNotifs.map(n => (
                            <DropdownMenuItem
                                key={`${n.notifType}-${n.id}`}
                                className="flex gap-3 py-2.5 px-4 border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer transition-colors focus:bg-slate-50 outline-none rounded-none"
                                onClick={handleNavigate}
                            >
                                <div className="shrink-0 mt-0.5">
                                    {n.notifType === 'order' ? (
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner"><ShoppingCart size={15} /></div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner"><Receipt size={15} /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-slate-800 leading-tight truncate">
                                        {n.notifType === 'order' ? 'Pesanan Baru Masuk' : 'Konfirmasi Pembayaran'}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug mt-0.5">
                                        {n.notifType === 'order'
                                            ? `Dari ${n.nama} senilai ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n.total || 0)}.`
                                            : `${n.nama} mengirim konfirmasi via ${n.payment_method || 'transfer'}.`
                                        }
                                    </p>
                                    <span className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 font-bold"><Clock size={10} /> {new Date(n.created_at).toLocaleString("id-ID", { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                                </div>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            <Bell className="mx-auto mb-2 text-slate-300" size={32} />
                            <p className="text-sm font-semibold">Semua bersih!</p>
                            <p className="text-[11px]">Tidak ada notifikasi baru</p>
                        </div>
                    )}
                </div>

                <div className="p-2 bg-slate-50/80 border-t border-slate-100">
                    <DropdownMenuItem asChild>
                        <button
                            className="w-full py-2.5 text-sm font-bold text-indigo-600 hover:bg-white hover:text-indigo-800 bg-transparent rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 outline-none cursor-pointer"
                            onClick={handleNavigate}
                        >
                            Tampilkan Semua Pesanan
                        </button>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
