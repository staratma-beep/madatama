import React, { useState, useEffect } from "react";
import { formatTanggal } from "../lib/format";
import { api } from "../lib/api";
import { History, Search, RefreshCw, Activity } from "lucide-react";
import { Input } from "./ui/input";

export const LogAktivitas = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await api.getLogs();
            setLogs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const filtered = logs.filter(
        (l) =>
            l.action.toLowerCase().includes(search.toLowerCase()) ||
            l.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 bg-transparent">
                <div>
                    <h2 className="text-[20px] font-bold flex items-center gap-2 text-slate-800">
                        <History size={20} className="text-slate-700" /> Log Aktivitas
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Rekam jejak tindakan dalam sistem (200 aktivitas terakhir).
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64 flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <Input
                            placeholder="Cari log..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 bg-slate-50 border-slate-200 h-9 text-[13px] w-full rounded-md focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                        />
                    </div>
                    <button onClick={loadLogs} className="bg-white border border-slate-200 text-slate-500 p-2 rounded-md hover:bg-slate-50 transition-colors" title="Muat ulang">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] overflow-hidden">
                {loading && logs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-[13px]"><RefreshCw className="animate-spin mx-auto mb-2" size={20} /> Memuat data...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center text-[13px]">
                        <Activity className="opacity-20 mb-3" size={36} />
                        Tidak ada jejak aktivitas ditemukan.
                    </div>
                ) : (
                    <div>
                        {filtered.map((log, logIdx) => {
                            const date = new Date(log.created_at);
                            const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                            return (
                                <div
                                    key={log.id}
                                    className={`flex items-start gap-3 px-4 py-3 text-[13px] hover:bg-slate-50 transition-colors ${logIdx !== filtered.length - 1 ? 'border-b border-slate-100' : ''}`}
                                >
                                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500 mt-0.5">
                                        <Activity size={13} />
                                    </div>
                                    <div className="flex min-w-0 flex-1 justify-between gap-4">
                                        <p className="text-slate-700 font-medium leading-snug">
                                            <span className="font-semibold text-slate-800">{log.action}</span>
                                            <span className="text-slate-400 mx-1">•</span>
                                            <span className="text-slate-500">{log.description}</span>
                                        </p>
                                        <div className="whitespace-nowrap text-right text-[11px] text-slate-400 font-medium shrink-0">
                                            <time dateTime={log.created_at}>{formatTanggal(log.created_at.split("T")[0])} · {time}</time>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
