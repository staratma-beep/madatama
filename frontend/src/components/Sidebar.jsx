import React from "react";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

export function Sidebar({ expanded, onToggle, currentTab, onSelectTab, tabs, authUser }) {
    // Group the tabs intelligently based on functions
    const groups = [
        {
            title: "Toko & Transaksi",
            keys: ["pesanan-web", "produksi", "kas", "piutang"],
        },
        {
            title: "Katalog & Pengaturan",
            keys: ["hpp", "web"],
        },
        {
            title: "Laporan & Histori",
            keys: ["rekap", "labarugi", "log"],
        }
    ];

    const getVisibleTabsInGroup = (keys) => {
        return keys.map(k => tabs.find(t => t.key === k)).filter(Boolean);
    };

    return (
        <aside
            className={`sticky top-0 z-50 flex h-screen flex-col border-r border-indigo-100/70 bg-white/95 backdrop-blur-xl shadow-lg transition-all duration-300 ${expanded ? "w-64" : "w-[4.5rem]"
                }`}
        >
            <div className="flex items-center justify-between p-4 border-b border-indigo-100/50">
                <div className={`flex items-center overflow-hidden transition-all duration-300 ${expanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
                    <span className="font-heading text-[15px] font-extrabold text-slate-800 whitespace-nowrap pl-2">Navigasi Utama</span>
                </div>
                <button
                    onClick={onToggle}
                    className={`grid h-9 w-9 bg-indigo-50 hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 place-items-center rounded-xl transition-colors shrink-0 ${expanded ? "" : "mx-auto"}`}
                >
                    {expanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 overflow-x-hidden p-3 gap-6 flex flex-col scrollbar-thin scrollbar-thumb-indigo-200">
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
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/50"
                                            : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                                            }`}
                                    >
                                        <div className="shrink-0 flex items-center justify-center">
                                            <t.icon size={expanded ? 18 : 20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500 transition-colors"} />
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
