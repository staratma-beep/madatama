import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { applyAppTheme } from "../lib/theme";
import { Lock, User, Loader2, Eye, EyeOff } from "lucide-react";

export const Login = ({ onLogin, profile: propProfile }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [profile, setProfile] = useState(propProfile || {});

    useEffect(() => {
        api.getSettings().then(s => {
            setProfile(s);
            if (s?.app_theme) applyAppTheme(s.app_theme);
        }).catch(() => { });
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api.login({ username, password });
            if (res.ok) onLogin(res.user);
        } catch (err) {
            console.error("Login error:", err?.response?.status, err?.response?.data, err?.message);
            if (err.response?.status === 401) {
                setError("Username atau password salah.");
            } else if (err.response?.status === 429) {
                setError("Akun terkunci sementara. Coba lagi dalam 15 menit.");
            } else if (!err.response) {
                setError("Tidak dapat terhubung ke server.");
            } else {
                setError(err.response?.data?.detail || "Terjadi kesalahan. Silakan coba lagi.");
            }
        } finally {
            setLoading(false);
        }
    };

    const namaUsaha = profile?.nama_usaha || "Madatama Pro";
    const firstChar = namaUsaha.charAt(0).toUpperCase();

    const tagline = profile?.tagline_usaha || "Sistem Manajemen Bisnis";

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Card Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">

                    {/* Logo & Nama Usaha */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div
                            className="w-16 h-16 flex-none flex items-center justify-center relative z-10 transition-transform hover:scale-105 duration-300"
                            style={profile?.logo ? {} : { background: "var(--theme-600, #4f46e5)", borderRadius: "1rem", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        >
                            {profile?.logo ? (
                                <img src={profile.logo} alt="Logo" className="w-16 h-16 object-contain drop-shadow-sm" />
                            ) : (
                                <span className="text-3xl font-black text-white">{firstChar}</span>
                            )}
                        </div>

                        <div className="flex flex-col justify-center">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-1 leading-none">{namaUsaha}</h1>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest line-clamp-2 leading-relaxed">{tagline}</p>
                        </div>
                    </div>



                    {/* Error */}
                    {error && (
                        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Username</label>
                            <div className="relative">
                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Masukkan username"
                                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--theme-400,#818cf8)] focus:ring-2 focus:ring-[var(--theme-100,#e0e7ff)] transition-all"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Masukkan password"
                                    className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--theme-400,#818cf8)] focus:ring-2 focus:ring-[var(--theme-100,#e0e7ff)] transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                            style={{ background: "var(--theme-600, #4f46e5)" }}
                        >
                            {loading
                                ? <><Loader2 size={15} className="animate-spin" /> Memproses...</>
                                : "Masuk ke Sistem"
                            }
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-400 text-[11px] mt-5">
                    &copy; {new Date().getFullYear()} {namaUsaha} · Semua hak dilindungi
                </p>
            </div>
        </div>
    );
};
