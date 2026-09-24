import React from "react";
import { ChevronLeft, ChevronRight, Menu, Printer } from "lucide-react";
import { THEME_COLORS } from "../lib/theme";

export function Sidebar({ expanded, onToggle, currentTab, onSelectTab, tabs, authUser, sidebarConfig, appTheme = "indigo", settings }) {

    const defaultGroups = [
        { title: "Dashboard", keys: ["dashboard"] },
        { title: "Toko & Transaksi", keys: ["pesanan-web", "produksi", "kas", "piutang"] },
        { title: "Katalog & Pengaturan", keys: ["hpp", "web", "theme-settings"] },
        { title: "Laporan & Histori", keys: ["riwayat-nota", "rekap", "labarugi", "log"] }
    ];

    let groups = sidebarConfig && sidebarConfig.length > 0 ? JSON.parse(JSON.stringify(sidebarConfig)) : defaultGroups;

    // Ensure "theme-settings" and "riwayat-nota" are always accessible
    const hasThemeSettings = groups.some(g => g.keys.includes("theme-settings"));
    if (!hasThemeSettings) {
        const pengaturanGroup = groups.find(g => g.title.toLowerCase().includes("pengaturan") || g.title.toLowerCase().includes("katalog"));
        if (pengaturanGroup) {
            pengaturanGroup.keys.push("theme-settings");
        } else {
            groups.push({ title: "Sistem", keys: ["theme-settings"] });
        }
    }

    const hasRiwayatNota = groups.some(g => g.keys.includes("riwayat-nota"));
    if (!hasRiwayatNota) {
        const laporanGroup = groups.find(g => g.title.toLowerCase().includes("laporan") || g.title.toLowerCase().includes("histori") || g.title.toLowerCase().includes("toko"));
        if (laporanGroup) {
            laporanGroup.keys.push("riwayat-nota");
        } else {
            groups.push({ title: "Laporan & Histori", keys: ["riwayat-nota"] });
        }
    }

    // Ensure "users" tab appears for Owner under Sistem/Pengaturan group
    if (authUser?.role === "Owner") {
        const hasUsers = groups.some(g => g.keys.includes("users"));
        if (!hasUsers) {
            const settingsGroup = groups.find(g =>
                g.title.toLowerCase().includes("pengaturan") || g.title.toLowerCase().includes("katalog") || g.title.toLowerCase().includes("sistem")
            );
            if (settingsGroup) {
                settingsGroup.keys.push("users");
            } else {
                groups.push({ title: "Sistem", keys: ["users"] });
            }
        }
    }


    const theme = THEME_COLORS[appTheme] || THEME_COLORS.indigo;

    const getVisibleTabsInGroup = (keys) => {
        return keys.map(k => tabs.find(t => t.key === k)).filter(Boolean);
    };

    return (
        <aside
            className={`sticky top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-[#f1f1f1] transition-all duration-300 ${expanded ? "w-64" : "w-[4.5rem]"}`}
        >
            <div className="flex items-center justify-between p-4 border-b border-slate-100/80">
                {expanded && (
                    <div className="flex items-center gap-2.5 overflow-hidden animate-in fade-in">
                        {settings?.logo ? (
                            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                                <img src={settings.logo} alt="Logo" className="h-full w-full object-contain drop-shadow-sm" />
                            </div>
                        ) : (
                            <div
                                className="relative grid h-8 w-8 overflow-hidden place-items-center rounded-[10px] text-white shadow-sm shrink-0"
                                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                            >
                                <Printer size={16} />
                            </div>
                        )}
                        <div className="flex flex-col whitespace-nowrap overflow-hidden pr-2 justify-center mt-1">
                            <span className="text-xl font-black text-slate-900 tracking-tight leading-none truncate uppercase">
                                {settings?.nama_usaha || "Navigasi Utama"}
                            </span>
                        </div>
                    </div>
                )}

                <button
                    onClick={onToggle}
                    title="Buka/Tutup Menu"
                    className={expanded
                        ? `grid h-8 w-8 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 place-items-center rounded-full transition-colors shrink-0 shadow-sm`
                        : settings?.logo
                            ? "relative flex h-10 w-10 shrink-0 mx-auto transition-transform hover:scale-105 items-center justify-center"
                            : "relative grid h-9 w-9 overflow-hidden place-items-center rounded-full text-white shadow-sm shrink-0 mx-auto transition-transform hover:scale-105"
                    }
                    style={(!expanded && !settings?.logo) ? { background: "linear-gradient(135deg, #4f46e5, #7c3aed)" } : undefined}
                >
                    {expanded ? (
                        <ChevronLeft size={16} strokeWidth={2.5} />
                    ) : (
                        settings?.logo ? (
                            <img src={settings.logo} alt="Logo" className="h-full w-full object-contain drop-shadow-sm" />
                        ) : (
                            <Printer size={18} />
                        )
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 overflow-x-hidden px-2.5 gap-1.5 flex flex-col scrollbar-thin scrollbar-thumb-slate-200">
                {groups.map((group, idx) => {
                    const visibleTabs = getVisibleTabsInGroup(group.keys);
                    if (visibleTabs.length === 0) return null;

                    return (
                        <div key={idx} className="flex flex-col gap-0.5">
                            {expanded ? (
                                group.title !== "Dashboard" && (
                                    <div className="px-3 pb-1 pt-4 mt-1 text-[13px] font-semibold text-slate-700 flex items-center justify-between group cursor-default">
                                        <span>{group.title}</span>
                                        <ChevronRight size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )
                            ) : (
                                group.title !== "Dashboard" && <div className="h-px bg-slate-200/60 my-2 w-6 mx-auto" />
                            )}
                            {visibleTabs.map((t) => {
                                const isActive = currentTab === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        onClick={() => onSelectTab(t.key)}
                                        title={!expanded ? t.label : undefined}
                                        className={`group relative flex items-center gap-3 rounded-[8px] transition-all duration-150 mx-auto ${expanded ? "w-full px-3 py-[6px]" : "w-10 h-10 justify-center"} ${isActive
                                            ? `bg-white text-slate-900 font-bold shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-slate-200/50`
                                            : `text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 font-medium`
                                            }`}
                                    >
                                        <div className="shrink-0 flex items-center justify-center relative">
                                            <t.icon size={19} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-slate-900" : `text-slate-600 group-hover:text-slate-900 transition-colors`} fill={isActive ? "none" : "none"} />
                                            {!expanded && t.badge && (
                                                <div className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-2 ring-slate-100">
                                                    {t.badge > 99 ? '99+' : t.badge}
                                                </div>
                                            )}
                                        </div>
                                        {expanded && (
                                            <>
                                                <span className="text-[13px] whitespace-nowrap text-left truncate flex-1">
                                                    {t.label}
                                                </span>
                                                {t.badge && (
                                                    <div className="shrink-0 ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                                                        {t.badge > 99 ? '99+' : t.badge}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Tooltip for collapsed state */}
                                        {!expanded && (
                                            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                                {t.label}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}
