import React, { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { formatNumberInput, parseNumber } from "../lib/format";
import { toast } from "sonner";
import { Save, Plus, ArrowUp, ArrowDown, Trash2, Palette, Settings, Image as ImageIcon, Upload, Building2, Database, CheckCircle2 } from "lucide-react";
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
    const [darkMode, setDarkMode] = useState(false);
    const [groups, setGroups] = useState(DEFAULT_GROUPS);
    const [tabNames, setTabNames] = useState({});
    const [loading, setLoading] = useState(true);
    const defaultRoles = {
        Kasir: ["dashboard", "pesanan-web", "hpp", "kas", "produksi", "riwayat-nota", "piutang", "web", "theme-settings"],
        Produksi: ["produksi"]
    };
    const [rolePermissions, setRolePermissions] = useState(defaultRoles);

    const [cfg, setCfg] = useState({ saldo_awal: "0", nama_usaha: "", alamat: "", telepon: "", logo: "", favicon: "" });
    const logoRef = useRef();
    const faviconRef = useRef();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const s = await api.getSettings();
            setSettings(s);
            setTheme(s.app_theme || "indigo");
            setDarkMode(s.dark_mode || false);
            setGroups(s.sidebar_config && s.sidebar_config.length > 0 ? s.sidebar_config : DEFAULT_GROUPS);
            setTabNames(s.tab_names || {});
            setRolePermissions(s.role_permissions || defaultRoles);

            setCfg({
                saldo_awal: formatNumberInput(String(s.saldo_awal || 0)),
                nama_usaha: s.nama_usaha || "",
                tagline_usaha: s.tagline_usaha || "",
                alamat: s.alamat || "",
                telepon: s.telepon || "",
                logo: s.logo || "",
                favicon: s.favicon || "",
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

    const onFavicon = (e) => {
        const file = e.target.files[0]; if (!file) return;
        if (file.size > 200 * 1024) { toast.error("Icon maksimal 200KB"); e.target.value = ""; return; }
        const reader = new FileReader();
        reader.onload = () => setCfg((c) => ({ ...c, favicon: reader.result }));
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleSave = async () => {
        try {
            await api.updateSettings({
                ...settings,
                sidebar_config: groups,
                app_theme: theme,
                dark_mode: darkMode,
                tab_names: tabNames,
                role_permissions: rolePermissions,
                saldo_awal: parseNumber(cfg.saldo_awal),
                nama_usaha: cfg.nama_usaha,
                tagline_usaha: cfg.tagline_usaha,
                alamat: cfg.alamat,
                telepon: cfg.telepon,
                logo: cfg.logo,
                favicon: cfg.favicon
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
        <div className="w-full flex flex-col gap-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 bg-transparent sticky top-0 z-20">
                <div>
                    <h2 className="text-[20px] font-bold flex items-center gap-2 text-slate-800">
                        <Settings size={20} className="text-slate-700" /> Pengaturan Web Admin
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Atur profil usaha, tampilan, dan navigasi sidebar untuk menyempurnakan pengalaman Anda.</p>
                </div>
                <button onClick={handleSave} className="flex gap-2 items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shrink-0">
                    <Save size={18} /> Simpan Perubahan
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                {/* Kolom Kiri: Profil & Tema */}
                <div className="xl:col-span-7 flex flex-col gap-6">

                    {/* Profil Usaha & Kas */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Building2 size={18} className="text-slate-400" /> Profil Usaha & Pengaturan Kas
                        </h3>

                        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
                        <input ref={faviconRef} type="file" accept="image/x-icon,image/png,image/jpeg" className="hidden" onChange={onFavicon} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Sub-kolom 1 */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Logo Utama (Untuk Sidebar & Nota)</Label>
                                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-lg border border-white bg-white shadow-sm">
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

                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Icon Web (Favicon)</Label>
                                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="grid h-12 w-12 flex-none place-items-center overflow-hidden rounded-lg border border-white bg-white shadow-sm">
                                            {cfg.favicon ? <img src={cfg.favicon} alt="favicon" className="h-full w-full object-contain" /> : <ImageIcon size={20} className="text-slate-300" />}
                                        </div>
                                        <div className="flex flex-col items-start gap-1">
                                            <Button type="button" variant="outline" size="sm" onClick={() => faviconRef.current?.click()} className="h-7 text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
                                                <Upload size={12} className="mr-2" /> Unggah Icon
                                            </Button>
                                            {cfg.favicon && <button type="button" className="text-[10px] font-medium text-rose-500 hover:text-rose-700 underline underline-offset-2" onClick={() => setCfg({ ...cfg, favicon: "" })}>Hapus Icon</button>}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="font-semibold text-slate-700">Nama Usaha</Label>
                                    <Input value={cfg.nama_usaha} onChange={(e) => setCfg({ ...cfg, nama_usaha: e.target.value })} placeholder="Ketik nama bisnis Anda di sini" className="h-10 border-slate-200 focus-visible:ring-indigo-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="font-semibold text-slate-700">Slogan / Tagline (Di Bawah Nama)</Label>
                                    <Input value={cfg.tagline_usaha} onChange={(e) => setCfg({ ...cfg, tagline_usaha: e.target.value })} placeholder="Cth: Percetakan & Branding (atau biarkan kosong)" className="h-10 border-slate-200 focus-visible:ring-indigo-500" />
                                </div>
                            </div>

                            {/* Sub-kolom 2 */}
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <Label className="font-semibold text-slate-700">Alamat Outlet / Toko</Label>
                                    <Input value={cfg.alamat} onChange={(e) => setCfg({ ...cfg, alamat: e.target.value })} placeholder="Cth: Jl. Raya Mataram No. 10" className="h-10 border-slate-200 focus-visible:ring-indigo-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="font-semibold text-slate-700">Nomor Telepon / WhatsApp</Label>
                                    <Input value={cfg.telepon} onChange={(e) => setCfg({ ...cfg, telepon: e.target.value })} placeholder="Cth: 0812-3456-7890" className="h-10 border-slate-200 focus-visible:ring-indigo-500" />
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 mt-2">
                                    <Label className="text-emerald-800 font-bold flex items-center gap-1.5 mb-1"><Database size={16} /> Saldo Kas Awal / Modal Dasar</Label>
                                    <p className="text-xs text-emerald-600 mb-3 opacity-90">Tentukan nilai saldo untuk pembukuan pertama kali.</p>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-700 font-bold">Rp</div>
                                        <Input inputMode="numeric" className="pl-9 font-mono-num font-black text-lg h-11 border-emerald-300 bg-white focus-visible:ring-emerald-500" value={cfg.saldo_awal} onChange={(e) => setCfg({ ...cfg, saldo_awal: formatNumberInput(e.target.value) })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tema Visual & Mode Gelap */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
                        <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Palette size={18} className="text-slate-400" /> Warna Tema Aplikasi
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                            {THEMES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`flex flex-col items-center justify-center p-3 px-1 rounded-xl border-2 transition-all ${theme === t.id ? `border-${t.id}-500 bg-${t.id}-50 ring-4 ring-${t.id}-100 shadow-sm transform scale-[1.02]` : 'border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50'}`}
                                >
                                    <div className={`w-10 h-10 rounded-full ${t.color} mb-3 shadow-md ${theme === t.id ? 'ring-2 ring-offset-2 ring-white scale-110' : ''}`} />
                                    <span className={`text-[10px] font-bold text-center leading-tight ${theme === t.id ? `text-${t.id}-700` : 'text-slate-500'}`}>{t.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Toggle Mode Gelap */}
                        <div className="mt-8 border-t border-slate-100 pt-6">
                            <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">Pilih Nuansa Dashboard</h4>
                            <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={darkMode}
                                    onChange={(e) => setDarkMode(e.target.checked)}
                                />
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${darkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors text-sm">Mode Gelap (Dark Mode)</span>
                                    <span className="text-xs text-slate-500">Tampilan redup untuk kenyamanan mata & nuansa futuristik (berlaku di semua web admin ini).</span>
                                </div>
                            </label>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-5 bg-slate-50 p-3 rounded-lg border border-slate-100">*Catatan: Perubahan warna tema dan nuansa akan sepenuhnya dimuat setelah konfigurasi disimpan / halaman direfresh.</p>
                    </div>

                    {/* Hak Akses User */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
                        <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Building2 size={18} className="text-slate-400" /> Pengaturan Hak Akses (Role Permissions)
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">Centang menu apa saja yang boleh dibuka oleh akun dengan role terkait. Akun <b>Owner</b> selalu mendapatkan akses ke semua fitur.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {["Kasir", "Produksi"].map((role) => (
                                <div key={role} className="space-y-3">
                                    <h4 className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded pr-4 inline-flex shadow-sm text-sm tracking-wide">
                                        Akun {role}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                                        {AVAILABLE_TABS.map((tab) => {
                                            const isChecked = (rolePermissions[role] || []).includes(tab.key);
                                            return (
                                                <label key={tab.key} className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isChecked ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200" : "bg-white border-slate-300 text-transparent group-hover:border-indigo-400"
                                                        }`}>
                                                        <CheckCircle2 size={12} strokeWidth={4} />
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setRolePermissions(prev => {
                                                                const list = prev[role] || [];
                                                                return {
                                                                    ...prev,
                                                                    [role]: checked ? [...list, tab.key] : list.filter(k => k !== tab.key)
                                                                }
                                                            });
                                                        }}
                                                    />
                                                    <span className={`text-xs font-semibold ${isChecked ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-600'} transition-colors`}>{tab.label}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Kolom Kanan: Menu Sidebar */}
                <div className="xl:col-span-5 flex flex-col h-full">
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] h-full">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Settings size={18} className="text-slate-400" /> Sidebar & Navigasi
                            </h3>
                            <button onClick={addGroup} className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-colors shadow-sm">
                                <Plus size={14} /> Grup Menu
                            </button>
                        </div>

                        <div className="space-y-4">
                            {groups.map((g, gIdx) => {
                                const unselectedTabs = AVAILABLE_TABS.filter(t => !g.keys.includes(t.key));

                                return (
                                    <div key={gIdx} className="border border-slate-200 rounded-xl bg-slate-50/70 p-4 relative group transition-all hover:bg-slate-50 hover:shadow-md hover:border-slate-300">
                                        {/* Header Group */}
                                        <div className="flex justify-between items-start xl:items-center mb-4 gap-3 flex-col xl:flex-row">
                                            <input
                                                type="text"
                                                value={g.title}
                                                onChange={(e) => updateGroupTitle(gIdx, e.target.value)}
                                                className="font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full xl:w-56 shadow-sm"
                                                placeholder="Nama Grup (Msl: Transaksi)"
                                            />

                                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm shrink-0">
                                                <button onClick={() => moveGroup(gIdx, -1)} disabled={gIdx === 0} title="Geser ke Atas" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"><ArrowUp size={14} /></button>
                                                <button onClick={() => moveGroup(gIdx, 1)} disabled={gIdx === groups.length - 1} title="Geser ke Bawah" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"><ArrowDown size={14} /></button>
                                                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                                <button onClick={() => removeGroup(gIdx)} title="Hapus Grup" className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={14} /></button>
                                            </div>
                                        </div>

                                        {/* List Aktif */}
                                        <div className="space-y-2 mb-4">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 mb-2">Item Navigasi (Sesuai Urutan):</div>
                                            {g.keys.length === 0 ? (
                                                <div className="text-xs text-slate-400 italic p-3 border border-dashed border-slate-300 rounded-xl text-center bg-slate-50/50">Grup ini kosong. Klik tombol di bawah.</div>
                                            ) : (
                                                g.keys.map((tabKey, tabIdx) => (
                                                    <div key={tabKey} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 shadow-sm relative group/item hover:border-slate-300 transition-colors">
                                                        <div className="text-xs text-slate-400 font-mono w-5 font-bold text-right shrink-0">{tabIdx + 1}.</div>
                                                        <input
                                                            type="text"
                                                            value={tabNames[tabKey] !== undefined ? tabNames[tabKey] : getDefaultLabel(tabKey)}
                                                            onChange={(e) => updateTabName(tabKey, e.target.value)}
                                                            className="w-full text-xs font-semibold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 focus:bg-white border focus:border-indigo-300 border-transparent rounded px-2 py-1.5 outline-none transition-colors pr-16"
                                                            placeholder={getDefaultLabel(tabKey)}
                                                        />

                                                        {/* Controls Tab */}
                                                        <div className="absolute right-2 flex items-center gap-0.5 opacity-100 xl:opacity-0 xl:group-hover/item:opacity-100 transition-opacity bg-white/90 px-1 rounded-md backdrop-blur-sm shadow-sm border border-slate-100">
                                                            <button disabled={tabIdx === 0} onClick={() => moveTabInGroup(gIdx, tabIdx, -1)} className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded disabled:opacity-30"><ArrowUp size={12} /></button>
                                                            <button disabled={tabIdx === g.keys.length - 1} onClick={() => moveTabInGroup(gIdx, tabIdx, 1)} className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded disabled:opacity-30"><ArrowDown size={12} /></button>
                                                            <div className="w-px h-3 bg-slate-200 mx-0.5"></div>
                                                            <button onClick={() => removeTabFromGroup(gIdx, tabKey)} className="p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded"><Trash2 size={12} /></button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* List Tersedia */}
                                        {unselectedTabs.length > 0 && (
                                            <div className="mt-4 pt-3 border-t border-slate-200/60">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {unselectedTabs.map(tab => (
                                                        <button
                                                            key={tab.key}
                                                            title={`Tambahkan halaman ${tab.label}`}
                                                            onClick={() => addTabToGroup(gIdx, tab.key)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
                                                        >
                                                            <Plus size={10} strokeWidth={3} /> {tabNames[tab.key] !== undefined ? tabNames[tab.key] : tab.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 leading-relaxed italic">
                            <span className="font-bold border-b border-indigo-200 pb-0.5">Tips Navigasi:</span> Area menu bisa diubah urutannya (atas/bawah), diubah nama tampilannya (ketik langsung pada list angka), hingga dihapus.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
