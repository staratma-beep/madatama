import React from "react";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { THEME_COLORS } from "../lib/theme";

export function Sidebar({ expanded, onToggle, currentTab, onSelectTab, tabs, authUser, sidebarConfig, appTheme = "indigo" }) {

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

    const theme = THEME_COLORS[appTheme] || THEME_COLORS.indigo;

    const getVisibleTabsInGroup = (keys) => {
        return keys.map(k => tabs.find(t => t.key === k)).filter(Boolean);
    };

    return (
        <aside
            className={`sticky top-0 z-50 flex h-screen flex-col border-r border-slate-100 bg-white/95 backdrop-blur-xl shadow-lg transition-all duration-300 ${expanded ? "w-64" : "w-[4.5rem]"}`}
        >
            <div className="flex items-center justify-between p-4 border-b border-slate-100/80">
                <div className={`flex items-center overflow-hidden transition-all duration-300 ${expanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
                    <span className="font-heading text-[15px] font-extrabold text-slate-800 whitespace-nowrap pl-2">Navigasi Utama</span>
                </div>
                <button
                    onClick={onToggle}
                    className={`grid h-9 w-9 ${theme.lightBg} ${theme.hoverBg} ${theme.text} ${theme.hoverText} place-items-center rounded-xl transition-colors shrink-0 ${expanded ? "" : "mx-auto"}`}
                >
                    {expanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 overflow-x-hidden p-3 gap-6 flex flex-col scrollbar-thin scrollbar-thumb-slate-200">
                {groups.map((group, idx) => {
                    const visibleTabs = getVisibleTabsInGroup(group.keys);
                    if (visibleTabs.length === 0) return null;

                    return (
                        <div key={idx} className="flex flex-col gap-1.5">
                            {expanded ? (
                                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {group.title}
                                </div>
                            ) : (
                                <div className="h-4 border-b border-slate-100/50 mb-2 w-8 mx-auto" />
                            )}
                            {visibleTabs.map((t) => {
                                const isActive = currentTab === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        onClick={() => onSelectTab(t.key)}
                                        title={!expanded ? t.label : undefined}
                                        className={`group relative flex items-center gap-3 rounded-xl transition-all duration-200 mx-auto ${expanded ? "w-full px-3 py-2.5" : "w-10 h-10 justify-center"} ${isActive
                                            ? `${theme.primary} text-white shadow-md ${theme.shadow}`
                                            : `text-slate-500 ${theme.hoverBg} ${theme.hoverText}`
                                            }`}
                                    >
                                        <div className="shrink-0 flex items-center justify-center">
                                            <t.icon size={expanded ? 18 : 20} className={isActive ? "text-white" : `text-slate-400 group-hover:${theme.text} transition-colors`} />
                                        </div>
                                        {expanded && (
                                            <span className="text-sm font-semibold whitespace-nowrap text-left truncate flex-1">
                                                {t.label}
                                            </span>
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
