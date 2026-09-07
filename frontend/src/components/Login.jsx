import React, { useState } from "react";
import { api } from "../lib/api";
import { Lock, User, Terminal, Loader2 } from "lucide-react";

export const Login = ({ onLogin, profile }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api.login({ username, password });
            if (res.ok) {
                onLogin(res.user);
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setError("Kredensial salah. Coba lagi.");
            } else {
                setError("Terjadi kesalahan sistem.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transform transition-all">
                <div className="bg-indigo-600 p-8 text-center">
                    <div className="h-16 w-16 bg-white rounded-2xl mx-auto shadow-sm flex items-center justify-center p-2 mb-4">
                        {profile?.logo ? (
                            <img src={profile.logo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-3xl font-black text-indigo-600 tracking-tighter">B</span>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">{profile?.nama_usaha || "Madatama Pro"}</h1>
                    <p className="text-indigo-200 text-sm">Sistem Manajemen Bisnis</p>
                </div>

                <form onSubmit={handleLogin} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 flex items-center justify-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Username (cth: owner / kasir / produksi)"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                placeholder="PIN / Password"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Masuk ke Sistem"}
                    </button>
                </form>

                <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
                    Ditenagai oleh Teknologi Cerdas
                </div>
            </div>

            <div className="absolute bottom-6 text-xs text-slate-400 flex items-center space-x-1 font-medium bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm border border-slate-200">
                <Terminal size={12} className="text-slate-400" />
                <span>Gunakan <span className="font-bold text-slate-600">owner</span> (pass: 1234) untuk full akses.</span>
            </div>
        </div>
    );
};
