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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl p-5 md:p-6 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600/10 p-3 rounded-2xl">
                        <History size={24} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-600 tracking-tight">
                            Log Aktivitas
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Rekam jejak tindakan dalam sistem (200 aktivitas terakhir).
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64 flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            placeholder="Cari log..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-white border-slate-200 h-10 w-full rounded-xl transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                    <button onClick={loadLogs} className="bg-white border border-slate-200 text-slate-500 p-2.5 rounded-xl hover:bg-slate-50 transition-colors" title="Muat ulang">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 py-4">
                {loading && logs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400"><RefreshCw className="animate-spin mx-auto mb-2" /> Memuat data...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                        <Activity className="opacity-20 mb-3" size={40} />
                        Tidak ada jejak aktivitas ditemukan.
                    </div>
                ) : (
                    <div className="flow-root">
                        <ul role="list" className="-mb-8">
                            {filtered.map((log, logIdx) => {
                                const date = new Date(log.created_at);
                                const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                                return (
                                    <li key={log.id}>
                                        <div className="relative pb-8">
                                            {logIdx !== filtered.length - 1 ? (
                                                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                                            ) : null}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center ring-8 ring-white">
                                                        <Activity className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                                                    </span>
                                                </div>
                                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">
                                                            {log.action} <span className="font-normal text-slate-500">• {log.description}</span>
                                                        </p>
                                                    </div>
                                                    <div className="whitespace-nowrap text-right text-xs text-slate-400 font-medium">
                                                        <time dateTime={log.created_at}>{formatTanggal(log.created_at.split("T")[0])} - {time}</time>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
