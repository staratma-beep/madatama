import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Monitor, Image as ImageIcon, Globe } from "lucide-react";

export const WebSettingsTab = () => {
    const [data, setData] = useState({ title: "", subtitle: "", banner_url: "", theme_gradient: "indigo-purple", banner_position: "center", banner_opacity: 40 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getWebSettings().then(res => {
            setData(res);
            setLoading(false);
        });
    }, []);

    const save = async () => {
        try {
            await api.updateWebSettings(data);
            toast.success("Pengaturan Toko Publik berhasil disimpan!");
        } catch {
            toast.error("Gagal menyimpan pengaturan");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            toast.loading("Mengunggah banner...", { id: "upload-banner" });
            const url = await api.uploadImage(file);
            setData({ ...data, banner_url: url });
            toast.success("Banner berhasil diunggah", { id: "upload-banner" });
        } catch (err) {
            toast.error("Gagal mengunggah banner", { id: "upload-banner" });
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-indigo-500">Memuat Pengaturan...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <Monitor className="text-indigo-600" /> Pengaturan Tampilan Depan Web
                    </h2>
                    <a
                        href={`http://${window.location.hostname}:5173`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
                    >
                        <Globe size={16} /> Buka Web Publik
                    </a>
                </div>

                <div className="space-y-5">
                    <div>
                        <Label className="text-slate-700 font-bold mb-1.5 block">Judul Halaman Utama (Slogan)</Label>
                        <Input
                            value={data.title} onChange={e => setData({ ...data, title: e.target.value })}
                            placeholder="Contoh: Kualitas Terbaik, Harga Masuk Akal."
                        />
                    </div>
                    <div>
                        <Label className="text-slate-700 font-bold mb-1.5 block">Sub-Judul (Deskripsi Singkat)</Label>
                        <textarea
                            value={data.subtitle} onChange={e => setData({ ...data, subtitle: e.target.value })}
                            placeholder="Dari spanduk besar hingga stempel..."
                            className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <Label className="text-slate-700 font-bold mb-1.5 block">Gambar Latar (Hero Banner)</Label>
                        <div className="flex gap-4 mt-2">
                            <div className="bg-slate-100 w-32 h-20 rounded-xl flex-none grid place-items-center overflow-hidden border border-slate-200">
                                {data.banner_url ? (
                                    <img src={data.banner_url} alt="Banner" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon size={24} className="text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="cursor-pointer file:cursor-pointer file:bg-indigo-50 file:text-indigo-700 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 hover:file:bg-indigo-100"
                                />
                                <p className="text-[11px] text-slate-500 leading-tight">Gunakan gambar rasio memanjang (Landscape) agar terlihat rapi saat dibuka melalui Laptop.</p>
                                {data.banner_url && (
                                    <button onClick={() => setData({ ...data, banner_url: "" })} className="text-xs font-bold text-red-500 hover:underline">Hapus Latar Belakang</button>
                                )}
                            </div>
                        </div>
                        {data.banner_url && (
                            <div className="mt-4 bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <Label className="text-xs font-bold text-slate-600 min-w-[120px]">Fokus Gambar (Posisi):</Label>
                                    <div className="flex bg-slate-200/60 p-1 rounded-md">
                                        {['top', 'center', 'bottom'].map(pos => (
                                            <button
                                                key={pos}
                                                onClick={() => setData({ ...data, banner_position: pos })}
                                                className={`px-3 py-1.5 text-xs font-bold capitalize rounded transition-colors ${data.banner_position === pos ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                {pos === 'top' ? 'Atas' : pos === 'center' ? 'Tengah' : 'Bawah'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <Label className="text-xs font-bold text-slate-600 min-w-[120px]">Transparansi ({data.banner_opacity || 40}%):</Label>
                                    <div className="flex-1 flex items-center gap-3">
                                        <input
                                            type="range" min="0" max="100"
                                            value={data.banner_opacity || 40}
                                            onChange={(e) => setData({ ...data, banner_opacity: parseInt(e.target.value) })}
                                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded w-10 text-center">{data.banner_opacity || 40}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <Label className="text-slate-700 font-bold mb-3 block">Tema Warna Gradasi (Pengaruh ke Layar Teks & Background)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[
                                { id: 'indigo-purple', label: 'Eksklusif (Ungu/Biru)', color: 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200' },
                                { id: 'emerald-teal', label: 'Segar (Hijau)', color: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' },
                                { id: 'rose-orange', label: 'Hangat (Merah/Oranye)', color: 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200' },
                                { id: 'blue-cyan', label: 'Profesional (Biru)', color: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200' },
                                { id: 'slate-gray', label: 'Minimalis (Abu-abu)', color: 'bg-gradient-to-br from-slate-100 to-gray-50 border-slate-300' }
                            ].map(theme => (
                                <div
                                    key={theme.id}
                                    onClick={() => setData({ ...data, theme_gradient: theme.id })}
                                    className={`cursor-pointer rounded-xl border-2 p-1 transition-all ${data.theme_gradient === theme.id ? 'border-indigo-500 shadow-md transform scale-105' : 'border-transparent hover:border-slate-300'}`}
                                >
                                    <div className={`h-16 w-full rounded-lg border ${theme.color}`}></div>
                                    <p className="text-center text-[10px] sm:text-xs font-semibold text-slate-600 mt-2">{theme.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 mt-2 border-t border-slate-100">
                        <Button onClick={save} className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">Simpan Perubahan Web</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
