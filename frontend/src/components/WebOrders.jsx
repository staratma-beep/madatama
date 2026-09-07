import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Bell, CheckSquare, Trash2, Receipt, Search, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { parseNumber, formatNumberInput } from "../lib/format";
import { toast } from "sonner";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

export const WebOrders = ({ onAccepted }) => {
    const [orders, setOrders] = useState([]);
    const [open, setOpen] = useState(false);
    const [accepting, setAccepting] = useState(null);
    const [hargaJuals, setHargaJuals] = useState({});
    const [activeTab, setActiveTab] = useState("baru");

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

    const handleStartAccept = (o) => {
        setAccepting(o);
        const hj = {};
        const items = o.items || [o]; // fallback for legacy structure
        items.forEach((it, i) => {
            hj[i] = formatNumberInput(String(it.product?.harga_jual || 0));
        });
        setHargaJuals(hj);
    };

    const handleConfirmAccept = async () => {
        if (!accepting) return;
        try {
            const items = accepting.items || [accepting];
            for (let i = 0; i < items.length; i++) {
                const it = items[i];
                const hargaNum = parseNumber(hargaJuals[i] || "0");
                await api.createSale({
                    nama: it.product?.nama || "Produk Web",
                    kategori: it.product?.kategori || "Bebas",
                    qty: it.qty,
                    harga_satuan: hargaNum,
                    hpp_satuan: 0,
                    is_dp: true,
                    dp_amount: 0,
                    pembeli: accepting.nama,
                    product_id: it.product_id,
                    status_produksi: "Desain",
                    public_order_id: accepting.id
                });
            }
            await api.resolvePublicOrder(accepting.id);
            toast.success(`Pesanan ${accepting.nama} diterima!`);
            setAccepting(null);
            refreshOrders();
            if (onAccepted) onAccepted();
        } catch (e) {
            toast.error("Gagal memproses pesanan");
        }
    };

    const handleConfirmPayment = async (o) => {
        try {
            await api.confirmPublicOrderPayment(o.id);
            toast.success(`Pembayaran ${o.nama} berhasil dikonfirmasi!`);
            refreshOrders();
            if (onAccepted) onAccepted();
        } catch (e) {
            toast.error("Gagal mengkonfirmasi pembayaran");
        }
    };

    const pendingOrders = orders.filter(o => o.status === "Menunggu Konfirmasi");
    const pendingPayments = orders.filter(o => o.payment_status === "Menunggu Konfirmasi Bayar");
    const historyOrders = orders.filter(o => o.status !== "Menunggu Konfirmasi" && o.payment_status !== "Menunggu Konfirmasi Bayar");

    const notificationCount = pendingOrders.length + pendingPayments.length;

    const displayedOrders = activeTab === "baru" ? pendingOrders : activeTab === "bayar" ? pendingPayments : historyOrders;

    return (
        <>
            <button
                onClick={() => { refreshOrders(); setOpen(true); }}
                className="relative grid h-9 w-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 place-items-center rounded-xl transition-all shadow-sm"
                title="Pesanan Online & Pembayaran"
            >
                <Bell size={18} />
                {notificationCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
                        {notificationCount < 10 ? notificationCount : '9+'}
                    </span>
                )}
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl flex items-center gap-2">
                            <Bell className="text-amber-500" /> Pesanan Toko Online
                        </DialogTitle>
                        <DialogDescription>
                            Kelola pesanan baru, setujui pembayaran, dan lihat riwayat order dari toko online.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-2 border-b border-slate-100 pb-2 mt-2">
                        <button onClick={() => setActiveTab('baru')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'baru' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>Pesanan Baru {pendingOrders.length > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-2 text-[10px] py-0.5">{pendingOrders.length}</span>}</button>
                        <button onClick={() => setActiveTab('bayar')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'bayar' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>Cek Pembayaran {pendingPayments.length > 0 && <span className="ml-1 bg-amber-500 text-white rounded-full px-2 text-[10px] py-0.5">{pendingPayments.length}</span>}</button>
                        <button onClick={() => setActiveTab('riwayat')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'riwayat' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>Riwayat Selesai</button>
                    </div>

                    {displayedOrders.length === 0 ? (
                        <div className="text-center text-slate-500 py-16 bg-slate-50 rounded-2xl border border-slate-100 mt-4">
                            <Search className="mx-auto text-slate-300 mb-3" size={40} />
                            <p className="font-medium">Tidak ada data di kategori ini.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            {displayedOrders.map(o => {
                                const items = o.items || [o];
                                return (
                                    <div key={o.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <span className="text-xs font-bold font-mono px-2 py-0.5 bg-slate-200 rounded text-slate-600">{o.id}</span>
                                                <span className="text-xs text-slate-400">{new Date(o.created_at).toLocaleString("id-ID")}</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-3 px-1 mb-3">
                                                <div><span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Pemesan</span><span className="font-bold text-slate-800">{o.nama}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">WhatsApp</span><span className="font-bold text-slate-800 font-mono-num">{o.kontak}</span></div>
                                            </div>

                                            <div className="space-y-2">
                                                {items.map((it, idx) => (
                                                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                                                        <p className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">📦 {it.product?.nama || "Produk"} <span className="text-indigo-600">×{it.qty}</span></p>
                                                        {it.catatan && <div className="mt-1 mb-2"><span className="font-medium text-slate-800 bg-amber-50 px-2 py-1 rounded text-xs block whitespace-pre-wrap">{it.catatan}</span></div>}

                                                        {accepting?.id === o.id && (
                                                            <div className="mt-2 flex items-center gap-3">
                                                                <Label className="text-xs text-emerald-700 font-bold whitespace-nowrap">Input Harga Satuan @ Rp</Label>
                                                                <Input
                                                                    className="h-8 font-mono-num font-bold text-emerald-700 bg-emerald-50 border-emerald-200 flex-1 max-w-[150px]"
                                                                    value={hargaJuals[idx] || ""}
                                                                    onChange={e => setHargaJuals({ ...hargaJuals, [idx]: formatNumberInput(e.target.value) })}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {activeTab === "baru" && (
                                            accepting?.id === o.id ? (
                                                <div className="sm:w-40 flex-none flex flex-col justify-end gap-2 pb-2 mt-4 sm:mt-0">
                                                    <button className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg text-xs" onClick={() => setAccepting(null)}>Batal</button>
                                                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-sm shadow-md" onClick={handleConfirmAccept}>Simpan Semua</button>
                                                </div>
                                            ) : (
                                                <div className="sm:w-36 flex-none flex flex-col justify-center gap-2 mt-4 sm:mt-0">
                                                    <button onClick={() => handleStartAccept(o)} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"><CheckSquare size={16} /> Terima Pesanan</button>
                                                    <button onClick={async () => { await api.resolvePublicOrder(o.id); refreshOrders(); }} className="w-full py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"><Trash2 size={16} /> Tolak</button>
                                                </div>
                                            )
                                        )}

                                        {activeTab === "bayar" && (
                                            <div className="sm:w-56 flex-none flex flex-col gap-3 mt-4 sm:mt-0 p-3 bg-white rounded-xl border border-slate-100 justify-center">
                                                <div className="flex items-center gap-3">
                                                    <a href={o.bukti_bayar} target="_blank" rel="noreferrer" className="block relative w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                                                        {o.bukti_bayar ? <img src={o.bukti_bayar} alt="Bukti" className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-4 text-slate-300" />}
                                                    </a>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Via {o.payment_method}</p>
                                                        <a href={o.bukti_bayar} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:underline">Lihat Bukti Full</a>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleConfirmPayment(o)} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"><Receipt size={16} /> ACC Pembayaran Lunas</button>
                                            </div>
                                        )}

                                        {activeTab === "riwayat" && (
                                            <div className="sm:w-40 flex-none flex flex-col justify-center gap-2 mt-4 sm:mt-0 text-right">
                                                <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${o.payment_status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : o.status === 'Menunggu Konfirmasi' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {o.payment_status === 'Lunas' ? '✅ Lunas' : o.payment_status || o.status}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">{o.payment_method ? `Via ${o.payment_method}` : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
