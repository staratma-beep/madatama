import React, { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import {
    Users, Plus, Pencil, Trash2, KeyRound, ShieldCheck, X,
    Loader2, Eye, EyeOff, UserPlus, Check, LockKeyhole, Unlock
} from "lucide-react";

const ROLES = ["Owner", "Kasir", "Produksi"];

const ROLE_BADGE = {
    Owner: "bg-violet-100 text-violet-700 border-violet-200",
    Kasir: "bg-blue-100 text-blue-700 border-blue-200",
    Produksi: "bg-amber-100 text-amber-700 border-amber-200",
};

// ── Modal Tambah / Edit User ──────────────────────────────────
function UserModal({ user, onClose, onSaved }) {
    const isEdit = !!user;
    const [form, setForm] = useState({
        username: user?.username || "",
        name: user?.name || "",
        role: user?.role || "Kasir",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    const handle = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        if (!isEdit && form.password.length < 6) {
            toast.error("Password minimal 6 karakter"); return;
        }
        setLoading(true);
        try {
            if (isEdit) {
                await api.updateUser(user.username, { name: form.name, role: form.role, username: form.username });
                toast.success("Akun berhasil diperbarui");
            } else {
                await api.createUser({ username: form.username, name: form.name, role: form.role, password: form.password });
                toast.success(`Akun ${form.username} berhasil dibuat`);
            }
            onSaved();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Gagal menyimpan");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <UserPlus size={17} style={{ color: "var(--theme-600,#4f46e5)" }} />
                        {isEdit ? "Edit Akun" : "Tambah Akun Baru"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
                </div>

                <form onSubmit={submit} className="p-6 space-y-4">
                    {/* Nama */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Nama Lengkap</label>
                        <input value={form.name} onChange={handle("name")} required
                            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[var(--theme-400,#818cf8)] focus:ring-2 focus:ring-[var(--theme-100,#e0e7ff)]"
                            placeholder="cth: Budi Santoso" />
                    </div>
                    {/* Username */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Username</label>
                        <input value={form.username} onChange={handle("username")} required
                            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[var(--theme-400,#818cf8)] focus:ring-2 focus:ring-[var(--theme-100,#e0e7ff)] font-mono"
                            placeholder="cth: kasir_02" />
                    </div>
                    {/* Role */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Role / Akses</label>
                        <select value={form.role} onChange={handle("role")}
                            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[var(--theme-400,#818cf8)]">
                            {ROLES.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    {/* Password — hanya saat buat baru */}
                    {!isEdit && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Password Awal</label>
                            <div className="relative">
                                <input type={showPw ? "text" : "password"} value={form.password} onChange={handle("password")} required minLength={6}
                                    className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[var(--theme-400,#818cf8)] focus:ring-2 focus:ring-[var(--theme-100,#e0e7ff)]"
                                    placeholder="Min. 6 karakter" />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">Pengguna akan diminta ganti password saat login pertama.</p>
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Batal</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            style={{ background: "var(--theme-600,#4f46e5)" }}>
                            {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                            {isEdit ? "Simpan Perubahan" : "Buat Akun"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal Reset Password ──────────────────────────────────────
function ResetPasswordModal({ user, onClose, onSaved }) {
    const [pw, setPw] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (pw.length < 6) { toast.error("Password minimal 6 karakter"); return; }
        setLoading(true);
        try {
            await api.resetUserPassword(user.username, pw);
            toast.success(`Password ${user.username} berhasil direset`);
            onSaved();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Gagal reset password");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <KeyRound size={17} className="text-amber-500" /> Reset Password: <span className="font-mono text-sm">{user.username}</span>
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Password Baru</label>
                        <div className="relative">
                            <input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} required minLength={6}
                                className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[var(--theme-400,#818cf8)] focus:ring-2 focus:ring-[var(--theme-100,#e0e7ff)]"
                                placeholder="Min. 6 karakter" autoFocus />
                            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                {show ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Pengguna wajib ganti password saat login berikutnya.</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Batal</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60">
                            {loading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Komponen Utama ────────────────────────────────────────────
export const UserManagementTab = ({ authUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | { type: "add"|"edit"|"reset", user? }

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
            if (err?.response?.status === 403) toast.error("Hanya Owner yang bisa mengakses halaman ini.");
            else toast.error("Gagal memuat: " + (err?.response?.data?.detail || err.message));
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (username) => {
        if (!window.confirm(`Hapus akun "${username}"? Tindakan ini tidak bisa dibatalkan.`)) return;
        try {
            await api.deleteUser(username);
            toast.success(`Akun ${username} dihapus`);
            load();
        } catch (err) { toast.error(err?.response?.data?.detail || "Gagal menghapus"); }
    };

    const handleToggleActive = async (u) => {
        try {
            await api.updateUser(u.username, { is_active: !u.is_active });
            toast.success(`Akun ${u.username} ${u.is_active ? "dinonaktifkan" : "diaktifkan"}`);
            load();
        } catch { toast.error("Gagal mengubah status akun"); }
    };

    const closeModal = () => setModal(null);
    const saved = () => { closeModal(); load(); };

    const handleExportTxt = () => {
        if (!users || users.length === 0) return toast.error("Tidak ada data untuk diekspor");

        const content = users.map(u => {
            return `NAMA       : ${u.name || u.username}\nUSERNAME   : ${u.username}\nROLE/AKSES : ${u.role}\nPASSWORD   : [ TERENKRIPSI RAHASIA (Silakan gunakan fitur Reset Password di Web jika staf lupa) ]\nSTATUS     : ${u.is_active !== false ? "Aktif" : "Nonaktif"}\n-----------------------------------------------------------`;
        }).join("\n\n");

        const header = `=== REKAP DATA AKUN SISTEM MADATAMA ===\nTanggal Unduh: ${new Date().toLocaleString('id-ID')}\n===========================================================\n\n`;

        const blob = new Blob([header + content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Data_Akun_Madatama_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("File notepad berhasil diunduh");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users size={20} style={{ color: "var(--theme-600,#4f46e5)" }} />
                        Manajemen Akun Pengguna
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">Kelola username, password, dan hak akses setiap staf.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={handleExportTxt}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
                        Ekspor (.txt)
                    </button>
                    <button
                        onClick={() => setModal({ type: "add" })}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all"
                        style={{ background: "var(--theme-600,#4f46e5)" }}
                    >
                        <Plus size={16} /> Tambah Akun
                    </button>
                </div>
            </div>

            {/* Info akses */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                <span>Halaman ini hanya bisa diakses oleh <strong>Owner</strong>. Password yang baru direset wajib diganti saat login pertama.</span>
            </div>

            {/* Tabel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                        <Loader2 size={20} className="animate-spin" /> Memuat data...
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm">Belum ada akun pengguna.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama / Username</th>
                                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.username} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <p className="font-semibold text-slate-800">{u.name || u.username}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <p className="text-xs font-mono text-slate-500">@{u.username}</p>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(u.username); toast.success("Username disalin!"); }}
                                                className="text-slate-300 hover:text-slate-500 transition-colors"
                                                title="Salin Username"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${ROLE_BADGE[u.role] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 hidden md:table-cell">
                                        {u.is_active !== false ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Aktif</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />Nonaktif</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {/* Toggle Aktif */}
                                            {u.username !== authUser?.username && (
                                                <button
                                                    onClick={() => handleToggleActive(u)}
                                                    className={`p-1.5 rounded-lg transition-colors ${u.is_active !== false ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                                                    title={u.is_active !== false ? "Nonaktifkan" : "Aktifkan"}
                                                >
                                                    {u.is_active !== false ? <LockKeyhole size={15} /> : <Unlock size={15} />}
                                                </button>
                                            )}
                                            {/* Edit */}
                                            <button
                                                onClick={() => setModal({ type: "edit", user: u })}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                title="Edit Akun"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            {/* Reset Password */}
                                            <button
                                                onClick={() => setModal({ type: "reset", user: u })}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                title="Reset Password"
                                            >
                                                <KeyRound size={15} />
                                            </button>
                                            {/* Hapus */}
                                            {u.username !== authUser?.username && (
                                                <button
                                                    onClick={() => handleDelete(u.username)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Hapus Akun"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modals */}
            {modal?.type === "add" && <UserModal onClose={closeModal} onSaved={saved} />}
            {modal?.type === "edit" && <UserModal user={modal.user} onClose={closeModal} onSaved={saved} />}
            {modal?.type === "reset" && <ResetPasswordModal user={modal.user} onClose={closeModal} onSaved={saved} />}
        </div>
    );
};
