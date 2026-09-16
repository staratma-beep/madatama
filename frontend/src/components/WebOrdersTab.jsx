import React, { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { CheckSquare, Trash2, Receipt, Search, Image as ImageIcon, ShoppingCart } from "lucide-react";
import { parseNumber, formatNumberInput } from "../lib/format";
import { toast } from "sonner";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog";

export const WebOrdersTab = ({ onAccepted }) => {
    const [orders, setOrders] = useState([]);
    const [accepting, setAccepting] = useState(null);
    const [hargaJuals, setHargaJuals] = useState({});
    const [activeTab, setActiveTab] = useState("baru");
    const [editingOrder, setEditingOrder] = useState(null);
    const [editForm, setEditForm] = useState({ nama: "", kontak: "" });
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [confirmModal, setConfirmModal] = useState(null);

    const handleSaveEdit = async () => {
        try {
            await api.editPublicOrder(editingOrder.id, editForm);
            toast.success("Pesanan berhasil diperbarui");
            setEditingOrder(null);
            refreshOrders();
        } catch {
            toast.error("Gagal menyimpan perubahan");
        }
    };

    const handleDeleteOrder = async (o) => {
        if (!window.confirm(`Yakin ingin menghapus pesanan ${o.nama} secara permanen?`)) return;
        try {
            await api.deletePublicOrder(o.id);
            toast.success("Pesanan berhasil dihapus");
            refreshOrders();
        } catch {
            toast.error("Gagal menghapus pesanan");
        }
    };

    const prevOrdersRef = useRef([]);

    const playNotificationSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            // Modern, pleasant double-chime
            osc.type = "sine";
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5

            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) { console.log(e); }
    };

    const refreshOrders = async () => {
        try {
            const o = await api.getPublicOrders();
            setOrders(o);

            // Check for new orders to play sound
            const currentIds = o.map(x => x.id);
            const prevIds = prevOrdersRef.current;
            const hasNewOrder = currentIds.some(id => !prevIds.includes(id));

            if (prevIds.length > 0 && hasNewOrder) {
                playNotificationSound();
                toast('🔔 Pesanan Web Baru Masuk!', { style: { background: '#4f46e5', color: '#fff' } });
            }
            prevOrdersRef.current = currentIds;
        } catch (e) { }
    };

    const handleBulkDelete = () => {
        setConfirmModal({
            title: "Hapus Pesanan",
            message: `Yakin ingin secara permanen menghapus ${selectedIds.length} pesanan sekaligus? Data yang terhapus tidak dapat dikembalikan.`,
            type: "danger",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await Promise.all(selectedIds.map(id => api.deletePublicOrder(id)));
                    toast.success(`${selectedIds.length} pesanan berhasil dihapus`);
                    setSelectedIds([]);
                    refreshOrders();
                } catch {
                    toast.error("Terjadi kegagalan saat menghapus beberapa pesanan");
                }
            }
        });
    };

    useEffect(() => {
        refreshOrders();
        const inv = setInterval(refreshOrders, 8000); // Poll every 8s
        return () => clearInterval(inv);
    }, []);

    const handleBulkAccept = () => {
        setConfirmModal({
            title: "Persetujuan Pesanan",
            message: `Yakin ingin menyetujui (Acc) ${selectedIds.length} pesanan sekaligus dengan harga awal katalog?`,
            type: "success",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    const selectedOrders = orders.filter(o => selectedIds.includes(o.id));
                    toast.loading("Menerima pesanan massal...", { id: "bulk-acc" });

                    for (const o of selectedOrders) {
                        const items = o.items || [o];
                        for (const it of items) {
                            const hargaNum = parseFloat(it.product?.harga_jual || 0);
                            const hppBahan = parseFloat(it.product?.bahan_baku || 0);
                            const hppJasa = parseFloat(it.product?.jasa_mitra || 0);
                            const hppTambahan = parseFloat(it.product?.tambahan || 0);
                            const hppTotal = hppBahan + hppJasa + hppTambahan;

                            await api.createSale({
                                nama: it.product?.nama || "Produk Web",
                                kategori: it.product?.kategori || "Bebas",
                                qty: it.qty,
                                harga_satuan: hargaNum,
                                hpp_satuan: hppTotal,
                                is_dp: true,
                                dp_amount: 0,
                                pembeli: o.nama,
                                product_id: it.product_id,
                                status_produksi: "Desain",
                                public_order_id: o.id
                            });
                        }
                        await api.resolvePublicOrder(o.id);
                    }
                    toast.success(`${selectedIds.length} pesanan berhasil disetujui`, { id: "bulk-acc" });
                    setSelectedIds([]);
                    refreshOrders();
                    if (onAccepted) onAccepted();
                } catch {
                    toast.error("Terjadi kegagalan saat menyetujui beberapa pesanan", { id: "bulk-acc" });
                }
            }
        });
    };

    const handleStartAccept = (o) => {
        setAccepting(o);
        const hj = {};
        const items = o.items || [o];
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
                const hppBahan = parseNumber(String(it.product?.bahan_baku || 0));
                const hppJasa = parseNumber(String(it.product?.jasa_mitra || 0));
                const hppTambahan = parseNumber(String(it.product?.tambahan || 0));
                const hppTotal = hppBahan + hppJasa + hppTambahan;

                await api.createSale({
                    nama: it.product?.nama || "Produk Web",
                    kategori: it.product?.kategori || "Bebas",
                    qty: it.qty,
                    harga_satuan: hargaNum,
                    hpp_satuan: hppTotal,
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

    const displayedOrders = activeTab === "baru" ? pendingOrders : activeTab === "bayar" ? pendingPayments : historyOrders;

    const filteredAndSearchedOrders = displayedOrders.filter(o =>
        (o.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col max-w-7xl mx-auto space-y-4 pb-12">
            {/* Banner Section */}
            <div className="flex-none relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 p-6 text-white shadow-lg">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-indigo-900/20 blur-xl"></div>
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <ShoppingCart className="text-indigo-100" /> Pesanan Toko Online
                        </h2>
                        <p className="mt-1 text-sm text-indigo-100 max-w-lg opacity-90">Kelola pesanan baru, setujui pembayaran, dan pantau riwayat pesanan dari web publik.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-white/60" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari Nama / ID Pesanan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white/10 hover:bg-white/20 focus:bg-white/30 border border-white/20 text-white placeholder:text-white/60 rounded-lg text-sm outline-none transition-all w-64 shadow-sm"
                            />
                        </div>
                        <div className="bg-white/10 text-white font-medium px-4 py-2.5 rounded-lg border border-white/20 text-sm flex items-center gap-2 cursor-default" title="Otomatis memuat data pesanan terbaru setiap 5 detik">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            Live Update
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">

                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mt-2 mb-4">
                    <div className="flex gap-2 font-sans">
                        <button onClick={() => { setActiveTab('baru'); setSelectedIds([]); }} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'baru' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>Pesanan Baru {pendingOrders.length > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-2 text-[10px] py-0.5">{pendingOrders.length}</span>}</button>
                        <button onClick={() => { setActiveTab('bayar'); setSelectedIds([]); }} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'bayar' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>Cek Pembayaran {pendingPayments.length > 0 && <span className="ml-1 bg-amber-500 text-white rounded-full px-2 text-[10px] py-0.5">{pendingPayments.length}</span>}</button>
                        <button onClick={() => { setActiveTab('riwayat'); setSelectedIds([]); }} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'riwayat' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>Riwayat Selesai</button>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm animate-in fade-in slide-in-from-right-5">
                            <span className="text-sm font-bold text-slate-700 mr-2">{selectedIds.length} Dipilih</span>
                            {activeTab === 'baru' && (
                                <button onClick={handleBulkAccept} className="bg-emerald-100 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 text-emerald-700 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap">
                                    <CheckSquare size={14} /> Acc Sekaligus
                                </button>
                            )}
                            <button onClick={handleBulkDelete} className="bg-rose-100 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 text-rose-700 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap">
                                <Trash2 size={14} /> Hapus Sekaligus
                            </button>
                        </div>
                    )}
                </div>

                {filteredAndSearchedOrders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-20 bg-slate-50/50 rounded-2xl border border-slate-100/50 mt-2">
                        <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                            <Search className="text-indigo-200" size={48} />
                        </div>
                        <p className="font-semibold text-slate-600 text-lg mb-1">
                            {searchQuery ? 'Pencarian tidak ditemukan' : 'Tidak ada pesanan'}
                        </p>
                        <p className="text-sm text-slate-400">
                            {searchQuery ? `Tidak ada pesanan yang cocok dengan "${searchQuery}"` : 'Belum ada data pesanan pada kategori ini saat ini.'}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap relative">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase tracking-widest shadow-sm">
                                <tr>
                                    <th className="px-5 py-4 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            className="circular-checkbox"
                                            checked={filteredAndSearchedOrders.length > 0 && selectedIds.length === filteredAndSearchedOrders.length}
                                            onChange={(e) => e.target.checked ? setSelectedIds(filteredAndSearchedOrders.map(o => o.id)) : setSelectedIds([])}
                                        />
                                    </th>
                                    <th className="px-2 py-4">Tanggal & ID Pesanan</th>
                                    <th className="px-4 py-4 w-48">Pembeli</th>
                                    <th className="px-4 py-4 min-w-[260px]">Item Pesanan</th>
                                    <th className="px-6 py-4 text-center w-40">Status</th>
                                    <th className="px-6 py-4 text-center w-48">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredAndSearchedOrders.map(o => {
                                    const items = o.items || [o];
                                    const isSelected = selectedIds.includes(o.id);

                                    return (
                                        <tr key={o.id} className={`group hover:bg-indigo-50/20 hover:shadow-[inset_4px_0_0_0_rgba(99,102,241,1)] transition-all duration-200 ${isSelected ? 'bg-indigo-50/40 shadow-[inset_4px_0_0_0_rgba(99,102,241,1)]' : 'bg-white'}`}>
                                            <td className="px-5 py-3.5 align-middle text-center w-12">
                                                <input
                                                    type="checkbox"
                                                    className="circular-checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedIds([...selectedIds, o.id]);
                                                        else setSelectedIds(selectedIds.filter(id => id !== o.id));
                                                    }}
                                                />
                                            </td>
                                            <td className="px-2 py-3.5 align-middle w-56">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-slate-800 whitespace-nowrap">{new Date(o.created_at).toLocaleString("id-ID", { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                    <span className="inline-block w-fit font-mono font-bold text-[11px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded tracking-wider shadow-sm">{o.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 align-middle w-48">
                                                <div className="flex flex-col gap-0.5 max-w-[160px]">
                                                    <span className="font-bold text-slate-800 text-[13px] truncate" title={o.nama}>{o.nama}</span>
                                                    <span className="text-[11px] text-slate-400 font-mono">({o.kontak})</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 align-middle min-w-[260px]">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {items.map((it, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-lg shadow-sm">
                                                            {it.custom_image ? (
                                                                <a href={it.custom_image} target="_blank" rel="noreferrer" className="w-6 h-6 border border-slate-200 rounded object-cover overflow-hidden hover:scale-110 transition-transform" title="Desain Kustom">
                                                                    <img src={it.custom_image} className="w-full h-full object-cover" alt="Kustom" />
                                                                </a>
                                                            ) : <span className="text-[10px] grayscale opacity-60">📦</span>}
                                                            <span className="text-xs font-bold text-slate-700 max-w-[140px] truncate">{it.product?.nama || "Produk"}</span>
                                                            {it.catatan && (
                                                                <span className="text-[10px] text-slate-500 italic max-w-[80px] truncate" title={it.catatan}>"{it.catatan}"</span>
                                                            )}
                                                            <span className="bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[9px] shrink-0">x{it.qty}</span>

                                                            {accepting?.id === o.id && (
                                                                <div className="flex items-center gap-1.5 ml-2 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                                                                    <Label className="text-[9px] font-bold text-indigo-700">Rp</Label>
                                                                    <Input
                                                                        className="h-5 w-20 text-[10px] px-1 font-mono-num font-bold text-indigo-900 bg-white"
                                                                        value={hargaJuals[idx] || ""}
                                                                        onChange={e => setHargaJuals({ ...hargaJuals, [idx]: formatNumberInput(e.target.value) })}
                                                                        placeholder="Harga Jual"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 align-middle text-center border-l-transparent">
                                                {activeTab === 'bayar' ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 shadow-sm px-3 py-1 rounded-full border border-amber-200 uppercase tracking-wider">Menunggu Bayar</span>
                                                        {o.bukti_bayar && (
                                                            <a href={o.bukti_bayar} target="_blank" rel="noreferrer" className="text-[10px] flex gap-1.5 items-center font-bold text-indigo-700 mt-1 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full transition-colors hover:bg-indigo-600 hover:text-white shadow-sm">
                                                                <ImageIcon size={12} /> Bukti TF
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : activeTab === 'riwayat' ? (
                                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${o.payment_status === 'Lunas' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                        {o.payment_status === 'Lunas' ? '✅ Lunas' : o.payment_status || o.status}
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-extrabold uppercase tracking-widest rounded-full shadow-sm">Baru</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5 align-middle">
                                                {accepting?.id === o.id ? (
                                                    <div className="flex flex-col gap-2 items-center justify-center">
                                                        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs shadow-sm transition-all hover:shadow-md" onClick={handleConfirmAccept}>Simpan</button>
                                                        <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-1.5 rounded-xl text-xs transition-colors" onClick={() => setAccepting(null)}>Batal</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2 flex-nowrap">
                                                        {activeTab === 'baru' && (
                                                            <button onClick={() => handleStartAccept(o)} className="h-9 px-3.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-transparent font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"><CheckSquare size={14} /> Acc</button>
                                                        )}
                                                        {activeTab === 'bayar' && (
                                                            <button onClick={() => handleConfirmPayment(o)} className="h-9 px-3.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-transparent font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"><Receipt size={14} /> Lunas</button>
                                                        )}

                                                        <button title="Edit Pesanan" onClick={() => {
                                                            setEditingOrder(o);
                                                            setEditForm({ nama: o.nama, kontak: o.kontak });
                                                        }} className="h-9 px-3.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold justify-center rounded-lg text-xs transition-all shadow-sm whitespace-nowrap">Edit</button>

                                                        <button title="Hapus Pesanan" onClick={() => handleDeleteOrder(o)} className="grid shrink-0 h-9 w-9 place-items-center rounded-lg bg-white border border-slate-200 hover:bg-rose-500 hover:border-rose-500 text-slate-400 hover:text-white transition-all shadow-sm">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {editingOrder && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                            <div className="p-5 border-b border-slate-100">
                                <h3 className="font-bold text-lg text-slate-800">Edit Pesanan Web</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 block mb-1">Nama Pemesan</Label>
                                    <Input value={editForm.nama} onChange={e => setEditForm({ ...editForm, nama: e.target.value })} className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 block mb-1">WhatsApp</Label>
                                    <Input value={editForm.kontak} onChange={e => setEditForm({ ...editForm, kontak: e.target.value })} className="h-9" />
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                                <button onClick={() => setEditingOrder(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-200 rounded-lg text-sm transition-colors">Batal</button>
                                <button onClick={handleSaveEdit} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-md transition-colors">Simpan Perubahan</button>
                            </div>
                        </div>
                    </div>
                )}

                {confirmModal && (
                    <AlertDialog open={!!confirmModal} onOpenChange={(o) => !o && setConfirmModal(null)}>
                        <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-heading text-lg">{confirmModal.title}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {confirmModal.message}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                <AlertDialogAction
                                    className={`rounded-xl ${confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                    onClick={confirmModal.onConfirm}
                                >
                                    {confirmModal.type === 'danger' ? 'Hapus' : 'Ya, Setuju'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div >
    );
};
