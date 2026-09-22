import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Monitor, Image as ImageIcon, Globe } from "lucide-react";

export const WebSettingsTab = () => {
    const [data, setData] = useState({ title: "", subtitle: "", banner_url: "", theme_gradient: "indigo-purple", banner_position: "center", banner_opacity: 40, business_name: "Madatama Print", logo_url: "", favicon_url: "" });
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

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            toast.loading("Mengunggah logo...", { id: "upload-logo" });
            const url = await api.uploadImage(file);
            setData({ ...data, logo_url: url });
            toast.success("Logo berhasil diunggah", { id: "upload-logo" });
        } catch (err) {
            toast.error("Gagal mengunggah logo", { id: "upload-logo" });
        }
    };

    const handleFaviconUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            toast.loading("Mengunggah icon...", { id: "upload-favicon" });
            const url = await api.uploadImage(file);
            setData({ ...data, favicon_url: url });
            toast.success("Icon berhasil diunggah", { id: "upload-favicon" });
        } catch (err) {
            toast.error("Gagal mengunggah icon", { id: "upload-favicon" });
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-indigo-500">Memuat Pengaturan...</div>;

    return (
        <div className="w-full flex flex-col gap-6 pb-10">
            {/* Header Sticky Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-20">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <Monitor className="text-indigo-600" /> Katalog & Eksterior Web
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Sesuaikan identitas, tampilan beranda, dan gambar promosi publik (Toko Online).</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <a
                        href={`http://${window.location.hostname}:5173`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-xl hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
                    >
                        <Globe size={18} /> Buka Web
                    </a>
                    <Button onClick={save} className="flex gap-2 items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md h-auto">
                        Simpan Perubahan
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Kolom Kiri: Informasi & Teks */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            Identitas Kontekstual Web
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <Label className="text-slate-700 font-bold mb-1.5 block">Nama Bisnis (Header/Navigasi)</Label>
                                <Input
                                    value={data.business_name} onChange={e => setData({ ...data, business_name: e.target.value })}
                                    placeholder="Contoh: Madatama Print" className="h-10 border-slate-200 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-700 font-bold mb-1.5 block">Slogan (Judul Layar Utama)</Label>
                                <Input
                                    value={data.title} onChange={e => setData({ ...data, title: e.target.value })}
                                    placeholder="Contoh: Kualitas Terbaik, Harga Masuk Akal." className="h-10 border-slate-200 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-700 font-bold mb-1.5 block">Deskripsi Singkat (Sub-Judul)</Label>
                                <textarea
                                    value={data.subtitle} onChange={e => setData({ ...data, subtitle: e.target.value })}
                                    placeholder="Dari spanduk besar hingga stempel, kami mendesain..."
                                    className="w-full flex min-h-[120px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-shadow leading-relaxed"
                                />
                            </div>

                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <Label className="text-emerald-800 font-bold mb-1.5 block">Nomor Telepon / WhatsApp CS</Label>
                                <p className="text-[11px] text-emerald-600 mb-3 leading-tight opacity-90">Tombol hubungi kami akan diarahkan ke kontak ini.</p>
                                <div className="flex">
                                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-emerald-200 bg-white text-emerald-700 font-bold text-sm">+</span>
                                    <Input
                                        value={data.whatsapp_number || ""} onChange={e => setData({ ...data, whatsapp_number: e.target.value })}
                                        placeholder="6281234567890 (Gunakan awalan 62)"
                                        className="rounded-l-none font-mono font-bold bg-white border-emerald-200 focus-visible:ring-emerald-500 h-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Aset Visual & Branding */}
                <div className="xl:col-span-7 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            Branding & Visual Grafis
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Logo */}
                            <div>
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-3">Logo Web (Header Utama)</Label>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-lg border border-white bg-white shadow-sm">
                                        {data.logo_url ? <img src={data.logo_url} alt="Logo" className="w-full h-full object-contain p-1.5" /> : <ImageIcon size={26} className="text-slate-300" />}
                                    </div>
                                    <div className="flex flex-col items-start gap-2 w-full">
                                        <div className="relative w-full">
                                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Unggah Logo" />
                                            <Button type="button" variant="outline" size="sm" className="w-full h-8 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 pointer-events-none">Pilih Logo Baru</Button>
                                        </div>
                                        {data.logo_url && <button onClick={() => setData({ ...data, logo_url: "" })} className="text-[11px] font-medium text-rose-500 hover:text-rose-700 underline underline-offset-2">Hapus Logo</button>}
                                    </div>
                                </div>
                            </div>

                            {/* Favicon */}
                            <div>
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-3">Icon Tabs (Favicon)</Label>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="grid h-12 w-12 flex-none place-items-center overflow-hidden rounded-lg border border-white bg-white shadow-sm">
                                        {data.favicon_url ? <img src={data.favicon_url} alt="Favicon" className="w-full h-full object-contain p-1" /> : <Globe size={20} className="text-slate-300" />}
                                    </div>
                                    <div className="flex flex-col items-start gap-1.5 w-full">
                                        <div className="relative w-full">
                                            <input type="file" accept="image/x-icon,image/png,image/jpeg" onChange={handleFaviconUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Unggah Favicon" />
                                            <Button type="button" variant="outline" size="sm" className="w-full h-7 text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 pointer-events-none">Unggah Icon</Button>
                                        </div>
                                        {data.favicon_url && <button onClick={() => setData({ ...data, favicon_url: "" })} className="text-[10px] font-medium text-rose-500 hover:text-rose-700 underline underline-offset-2 pt-0.5">Hapus Icon</button>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 my-8"></div>

                        {/* Banner */}
                        <div>
                            <Label className="text-slate-700 font-bold mb-3 block">Gambar Latar Belakang Beranda (Hero Banner)</Label>
                            <div className="flex gap-5 mt-2 bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex-col sm:flex-row">
                                <div className="bg-white w-full sm:w-48 h-28 rounded-xl flex-none grid place-items-center overflow-hidden border border-slate-300 shadow-sm relative group">
                                    {data.banner_url ? (
                                        <img src={data.banner_url} alt="Banner" className={`w-full h-full object-cover object-${data.banner_position || 'center'}`} />
                                    ) : (
                                        <ImageIcon size={32} className="text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-3 flex flex-col justify-center">
                                    <div className="relative inline-block w-full sm:w-auto">
                                        <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Unggah Banner" />
                                        <Button type="button" size="sm" className="w-full bg-slate-800 hover:bg-slate-900 text-white shadow pointer-events-none">Unggah Banner Latar</Button>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed border-l-2 border-indigo-300 pl-2">Upload visual landscape/melebar dengan resolusi tinggi. Teks web Anda akan tampil melayang di atas gambar ini.</p>
                                    {data.banner_url && (
                                        <button onClick={() => setData({ ...data, banner_url: "" })} className="text-xs font-bold text-rose-500 hover:text-rose-700 underline w-fit">Hapus Banner Latar Belakang</button>
                                    )}
                                </div>
                            </div>

                            {data.banner_url && (
                                <div className="mt-4 bg-indigo-50/50 border border-indigo-100 p-5 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-indigo-900 block">Titik Fokus Gambar:</Label>
                                        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                            {['top', 'center', 'bottom'].map(pos => (
                                                <button
                                                    key={pos}
                                                    onClick={() => setData({ ...data, banner_position: pos })}
                                                    className={`flex-1 py-1.5 text-[11px] font-bold capitalize rounded-md transition-all ${data.banner_position === pos ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                                                >
                                                    {pos === 'top' ? 'Agak Ke Atas' : pos === 'center' ? 'Tengah (Default)' : 'Agak Ke Bawah'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-indigo-900 flex justify-between">
                                            <span>Transparansi Hamparan Gelap (Overlay):</span>
                                            <span className="bg-indigo-200 text-indigo-800 px-1.5 rounded">{data.banner_opacity || 40}%</span>
                                        </Label>
                                        <input
                                            type="range" min="0" max="100"
                                            value={data.banner_opacity || 40}
                                            onChange={(e) => setData({ ...data, banner_opacity: parseInt(e.target.value) })}
                                            className="w-full accent-indigo-600 h-2.5 bg-white border border-slate-200 rounded-lg appearance-none cursor-pointer shadow-inner mt-2"
                                            title="Atur transparansi jaring gelap di atas banner"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-100 my-8"></div>

                        {/* Theme */}
                        <div>
                            <Label className="text-slate-700 font-bold mb-4 block">Nuansa Warna Publik (Gradient Background)</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {[
                                    { id: 'indigo-purple', label: 'Eksklusif (Ungu/Biru)', color: 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200' },
                                    { id: 'emerald-teal', label: 'Segar (Hijau)', color: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' },
                                    { id: 'rose-orange', label: 'Hangat (Merah)', color: 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200' },
                                    { id: 'blue-cyan', label: 'Profesional (Biru)', color: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200' },
                                    { id: 'slate-gray', label: 'Klasik (Abu)', color: 'bg-gradient-to-br from-slate-100 to-gray-50 border-slate-300' }
                                ].map(theme => (
                                    <div
                                        key={theme.id}
                                        onClick={() => setData({ ...data, theme_gradient: theme.id })}
                                        className={`cursor-pointer rounded-xl border-2 p-1.5 transition-all bg-white hover:bg-slate-50 ${data.theme_gradient === theme.id ? 'border-indigo-500 shadow-md transform scale-[1.03] ring-4 ring-indigo-50' : 'border-transparent hover:border-slate-300'}`}
                                    >
                                        <div className={`h-12 w-full rounded-md border shadow-inner ${theme.color}`}></div>
                                        <p className={`text-center text-[10px] font-bold mt-2 ${data.theme_gradient === theme.id ? 'text-indigo-700' : 'text-slate-500'}`}>{theme.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
