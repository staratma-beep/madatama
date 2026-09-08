import React, { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { formatNumberInput, parseNumber } from "../lib/format";
import { toast } from "sonner";
import { Save, Plus, ArrowUp, ArrowDown, Trash2, Palette, Settings, Image as ImageIcon, Upload, Building2, Database } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

const AVAILABLE_TABS = [
    { key: "dashboard", label: "Dashboard Utama" },
    { key: "pesanan-web", label: "Pesanan Web & Toko" },
    { key: "produksi", label: "Manajemen Produksi" },
    { key: "kas", label: "Buku Kas" },
    { key: "piutang", label: "Piutang & Utang" },
    { key: "hpp", label: "Kalkulator HPP" },
    { key: "riwayat-nota", label: "Riwayat Penjualan" },
    { key: "web", label: "Pengaturan Eksterior Web" },
    { key: "rekap", label: "Laporan Rekap Bulanan" },
    { key: "labarugi", label: "Laba Rugi & Bagi Hasil" },
    { key: "log", label: "Log Aktivitas Sejarah" },
    { key: "theme-settings", label: "Tampilan & Menu Utama" }
];

const THEMES = [
    { id: "slate", label: "Abu-abu (Netral)", color: "bg-slate-500" },
    { id: "rose", label: "Merah Muda (Rose)", color: "bg-rose-500" },
    { id: "orange", label: "Jeruk (Orange)", color: "bg-orange-500" },
    { id: "amber", label: "Kuning (Amber)", color: "bg-amber-500" },
    { id: "emerald", label: "Hijau (Emerald)", color: "bg-emerald-500" },
    { id: "teal", label: "Hijau Kebiruan (Teal)", color: "bg-teal-500" },
    { id: "cyan", label: "Sian (Cyan)", color: "bg-cyan-500" },
    { id: "blue", label: "Biru (Blue)", color: "bg-blue-500" },
    { id: "indigo", label: "Nila (Indigo)", color: "bg-indigo-500" },
    { id: "purple", label: "Ungu (Purple)", color: "bg-purple-500" },
    { id: "fuchsia", label: "Merah Keunguan (Fuchsia)", color: "bg-fuchsia-500" },
];

const DEFAULT_GROUPS = [
    { title: "Dashboard", keys: ["dashboard"] },
    { title: "Toko & Transaksi", keys: ["pesanan-web", "produksi", "kas", "piutang"] },
    { title: "Katalog & Pengaturan", keys: ["hpp", "web"] },
    { title: "Laporan & Histori", keys: ["riwayat-nota", "rekap", "labarugi", "log"] }
];

export const ThemeSettingsTab = () => {
    const [settings, setSettings] = useState(null);
    const [theme, setTheme] = useState("indigo");
    const [groups, setGroups] = useState(DEFAULT_GROUPS);
    const [tabNames, setTabNames] = useState({});
    const [loading, setLoading] = useState(true);
    const [cfg, setCfg] = useState({ saldo_awal: "0", nama_usaha: "", alamat: "", telepon: "", logo: "" });
    const logoRef = useRef();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const s = await api.getSettings();
            setSettings(s);
            setTheme(s.app_theme || "indigo");
            setGroups(s.sidebar_config && s.sidebar_config.length > 0 ? s.sidebar_config : DEFAULT_GROUPS);
            setTabNames(s.tab_names || {});
            setCfg({
                saldo_awal: formatNumberInput(String(s.saldo_awal || 0)),
                nama_usaha: s.nama_usaha || "",
                alamat: s.alamat || "",
                telepon: s.telepon || "",
                logo: s.logo || "",
            });
        } catch (e) {
            toast.error("Gagal memuat pengaturan web.");
        } finally {
            setLoading(false);
        }
    };

    const onLogo = (e) => {
        const file = e.target.files[0]; if (!file) return;
        if (file.size > 500 * 1024) { toast.error("Logo maksimal 500KB"); e.target.value = ""; return; }
        const reader = new FileReader();
        reader.onload = () => setCfg((c) => ({ ...c, logo: reader.result }));
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleSave = async () => {
        try {
            await api.updateSettings({
                ...settings,
                sidebar_config: groups,
                app_theme: theme,
                tab_names: tabNames,
                saldo_awal: parseNumber(cfg.saldo_awal),
                nama_usaha: cfg.nama_usaha,
                alamat: cfg.alamat,
                telepon: cfg.telepon,
                logo: cfg.logo
            });
            toast.success("Pengaturan berhasil disimpan! Harap muat ulang (refresh) halaman untuk melihat perubahan.");
            setTimeout(() => window.location.reload(), 2000);
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan.");
        }
    };

    const addGroup = () => {
        setGroups([...groups, { title: "Grup Baru", keys: [] }]);
    };

    const removeGroup = (index) => {
        setGroups(groups.filter((_, i) => i !== index));
    };

    const moveGroup = (index, dir) => {
        if (index + dir < 0 || index + dir >= groups.length) return;
        const newGroups = [...groups];
        const temp = newGroups[index];
        newGroups[index] = newGroups[index + dir];
        newGroups[index + dir] = temp;
        setGroups(newGroups);
    };

    const updateGroupTitle = (index, title) => {
        const newGroups = [...groups];
        newGroups[index].title = title;
        setGroups(newGroups);
    };

    const removeTabFromGroup = (groupIndex, tabKey) => {
        const newGroups = [...groups];
        newGroups[groupIndex].keys = newGroups[groupIndex].keys.filter(k => k !== tabKey);
        setGroups(newGroups);
    };

    const addTabToGroup = (groupIndex, tabKey) => {
        const newGroups = [...groups];
        if (!newGroups[groupIndex].keys.includes(tabKey)) {
            newGroups[groupIndex].keys.push(tabKey);
        }
        setGroups(newGroups);
    };

    const moveTabInGroup = (groupIndex, tabIndex, dir) => {
        const newGroups = [...groups];
        const keys = newGroups[groupIndex].keys;
        if (tabIndex + dir < 0 || tabIndex + dir >= keys.length) return;

        const temp = keys[tabIndex];
        keys[tabIndex] = keys[tabIndex + dir];
        keys[tabIndex + dir] = temp;
        setGroups(newGroups);
    };

    const updateTabName = (tabKey, newName) => {
        setTabNames(prev => ({ ...prev, [tabKey]: newName }));
    };

    const getDefaultLabel = (key) => {
        return AVAILABLE_TABS.find(t => t.key === key)?.label || key;
    };

    if (loading) return <div>Memuat...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <Settings className="text-indigo-600" /> Tampilan & Navigasi
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Atur warna tema aplikasi internal dan susunan menu sidebar sesuai kebutuhan bisnis Anda.</p>
                    </div>
                    <button onClick={handleSave} className="flex gap-2 items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md">
                        <Save size={18} /> Simpan Perubahan
                    </button>
                </div>

                {/* Theme Selection */}
                <div>
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Palette size={18} className="text-slate-400" /> Warna Tema Aplikasi</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {THEMES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === t.id ? `border-${t.id}-500 bg-${t.id}-50 ring-2 ring-${t.id}-200` : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                            >
                                <div className={`w-8 h-8 rounded-full ${t.color} mb-2 shadow-sm ${theme === t.id ? 'ring-2 ring-white scale-110' : ''}`} />
                                <span className={`text-[10px] font-bold text-center ${theme === t.id ? `text-${t.id}-700` : 'text-slate-500'}`}>{t.label}</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">*Perubahan warna tema sebagian besarnya akan terlihat setelah halaman dimuat ulang.</p>
                </div>

                <div className="h-px bg-slate-100 w-full" />

                {/* Profil Usaha Configuration */}
                <div>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Building2 size={18} className="text-slate-400" /> Profil Usaha & Pengaturan Kas</h3>

                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Kolom 1 (Profil) */}
                        <div className="space-y-4">
                            <div className="mb-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Logo Usaha (Untuk Nota)</Label>
                                <div className="flex items-center gap-4">
                                    <div className="grid h-20 w-20 flex-none place-items-center overflow-hidden rounded-xl border bg-slate-50 shadow-inner">
                                        {cfg.logo ? <img src={cfg.logo} alt="logo" className="h-full w-full object-contain" /> : <ImageIcon size={26} className="text-slate-300" />}
                                    </div>
                                    <div className="flex flex-col items-start gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()} className="h-8 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
                                            <Upload size={14} className="mr-2" /> Unggah Logo
                                        </Button>
                                        {cfg.logo && <button type="button" className="text-xs font-medium text-rose-500 hover:text-rose-700 underline underline-offset-2" onClick={() => setCfg({ ...cfg, logo: "" })}>Hapus Logo</button>}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Label>Nama Usaha</Label>
                                <Input value={cfg.nama_usaha} onChange={(e) => setCfg({ ...cfg, nama_usaha: e.target.value })} placeholder="Ketik nama bisnis Anda di sini" />
                            </div>
                        </div>

                        {/* Kolom 2 */}
                        <div className="space-y-4">
                            <div>
                                <Label>Alamat Outlet / Toko</Label>
                                <Input value={cfg.alamat} onChange={(e) => setCfg({ ...cfg, alamat: e.target.value })} placeholder="Cth: Jl. Raya Mataram No. 10" />
                            </div>
                            <div>
                                <Label>Nomor Telepon / WhatsApp</Label>
                                <Input value={cfg.telepon} onChange={(e) => setCfg({ ...cfg, telepon: e.target.value })} placeholder="Cth: 0812-3456-7890" />
                            </div>
                            <div className="pt-2">
                                <Label className="text-emerald-700 flex items-center gap-1.5"><Database size={14} /> Saldo Kas Awal / Modal Awal (Rp)</Label>
                                <p className="text-[10px] text-slate-500 mb-1">Saldo dasar di sistem sebelum bertransaksi.</p>
                                <Input inputMode="numeric" className="font-mono-num font-bold text-lg h-10 border-emerald-200 focus-visible:ring-emerald-500" value={cfg.saldo_awal} onChange={(e) => setCfg({ ...cfg, saldo_awal: formatNumberInput(e.target.value) })} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 w-full" />

                {/* Sidebar Configuration */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800">Susunan Menu Sidebar Terkustomisasi</h3>
                        <button onClick={addGroup} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                            <Plus size={14} /> Tambah Grup
                        </button>
                    </div>

                    <div className="space-y-4">
                        {groups.map((g, gIdx) => {
                            const unselectedTabs = AVAILABLE_TABS.filter(t => !g.keys.includes(t.key));

                            return (
                                <div key={gIdx} className="border border-slate-200 rounded-xl bg-slate-50/50 p-4 relative group">
                                    {/* Header Group */}
                                    <div className="flex justify-between items-start sm:items-center mb-4 gap-4 flex-col sm:flex-row border-b border-slate-200 pb-3">
                                        <input
                                            type="text"
                                            value={g.title}
                                            onChange={(e) => updateGroupTitle(gIdx, e.target.value)}
                                            className="font-bold text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
                                            placeholder="Nama Grup (Misal: Navigasi Utama)"
                                        />

                                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                                            <button onClick={() => moveGroup(gIdx, -1)} disabled={gIdx === 0} title="Geser ke Atas" className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"><ArrowUp size={16} /></button>
                                            <button onClick={() => moveGroup(gIdx, 1)} disabled={gIdx === groups.length - 1} title="Geser ke Bawah" className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"><ArrowDown size={16} /></button>
                                            <div className="w-px h-5 bg-slate-200 mx-1"></div>
                                            <button onClick={() => removeGroup(gIdx)} title="Hapus Grup" className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    {/* List Aktif */}
                                    <div className="space-y-2 mb-4">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Halama Yang Ditampilkan (Sesuai Urutan):</div>
                                        {g.keys.length === 0 ? (
                                            <div className="text-xs text-slate-400 italic p-2 border border-dashed rounded-lg text-center bg-white/50">Grup ini masih kosong. Tambahkan halaman di bawah.</div>
                                        ) : (
                                            g.keys.map((tabKey, tabIdx) => (
                                                <div key={tabKey} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 shadow-sm relative pr-24 group/item">
                                                    <div className="text-xs text-slate-400 font-mono w-4 font-bold">{tabIdx + 1}.</div>
                                                    <input
                                                        type="text"
                                                        value={tabNames[tabKey] !== undefined ? tabNames[tabKey] : getDefaultLabel(tabKey)}
                                                        onChange={(e) => updateTabName(tabKey, e.target.value)}
                                                        className="flex-1 text-sm font-semibold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 focus:bg-white border focus:border-indigo-300 border-transparent rounded px-2 py-1 outline-none transition-colors"
                                                        placeholder={getDefaultLabel(tabKey)}
                                                    />

                                                    {/* Controls (Absolute right side on hover, relative on mobile) */}
                                                    <div className="absolute right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity">
                                                        <button disabled={tabIdx === 0} onClick={() => moveTabInGroup(gIdx, tabIdx, -1)} className="p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded disabled:opacity-30"><ArrowUp size={14} /></button>
                                                        <button disabled={tabIdx === g.keys.length - 1} onClick={() => moveTabInGroup(gIdx, tabIdx, 1)} className="p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded disabled:opacity-30"><ArrowDown size={14} /></button>
                                                        <button onClick={() => removeTabFromGroup(gIdx, tabKey)} className="p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded ml-1"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* List Tersedia */}
                                    {unselectedTabs.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-slate-200/60">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Tambah Halaman:</div>
                                            <div className="flex flex-wrap gap-2">
                                                {unselectedTabs.map(tab => (
                                                    <button
                                                        key={tab.key}
                                                        onClick={() => addTabToGroup(gIdx, tab.key)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                                                    >
                                                        <Plus size={12} /> {tabNames[tab.key] !== undefined ? tabNames[tab.key] : tab.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};
