import React, { useState, useEffect, useCallback, useMemo } from "react";
import "@/App.css";
import { api } from "@/lib/api";
import { computeCashBalance, monthDetail } from "@/lib/compute";
import { monthKey, todayISO } from "@/lib/format";
import { Dashboard } from "@/components/Dashboard";
import { BukuKas } from "@/components/BukuKas";
import { RekapBulanan } from "@/components/RekapBulanan";
import { LabaRugi } from "@/components/LabaRugi";
import { PiutangUtang } from "@/components/PiutangUtang";
import { HPPKalkulator } from "@/components/HPPKalkulator";
import { TransactionDialog } from "@/components/TransactionDialog";
import { Toolbar } from "@/components/Toolbar";
import { FixedCostsBar } from "@/components/FixedCostsBar";
import { Produksi } from "@/components/Produksi";
import { LogAktivitas } from "@/components/LogAktivitas";
import { Login } from "@/components/Login";
import { WebOrders } from "@/components/WebOrders";
import { WebOrdersTab } from "@/components/WebOrdersTab";
import { WebSettingsTab } from "@/components/WebSettingsTab";
import { Sidebar } from "@/components/Sidebar";
import { ThemeSettingsTab } from "@/components/ThemeSettingsTab";
import { RiwayatNota } from "@/components/RiwayatNota";
import { THEME_COLORS } from "@/lib/theme";
import { Toaster, toast } from "sonner";
import {
  LogOut, LayoutDashboard, BookText, Calculator, PieChart, HandCoins, Package, Coins,
  History, BookOpen, Settings, Store, UserRoundCog, PlusCircle, Search, CalendarRange,
  Menu, X, ChevronRight, CheckCircle2, TrendingUp, Filter, WalletCards, Briefcase,
  ShoppingBag, BellRing, Layers, Globe, Settings as SettingsIcon, ShoppingCart, ReceiptText,
  Printer, Plus, AlertTriangle
} from "lucide-react";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [records, setRecords] = useState([]);
  const [profitShares, setProfitShares] = useState([]);
  const [fixedCosts, setFixedCosts] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [saldoAwal, setSaldoAwal] = useState(0);
  const [settings, setSettings] = useState({});
  const [tab, setTab] = useState("kas");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem("madatama_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (u) => {
    localStorage.setItem("madatama_user", JSON.stringify(u));
    setAuthUser(u);
    setTab(u.role === "Produksi" ? "produksi" : "dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("madatama_user");
    setAuthUser(null);
  };

  const reload = useCallback(async () => {
    const [t, r, p, s, fc, sl, pr] = await Promise.all([
      api.getTransactions(), api.getRecords(), api.getProfitShares(), api.getSettings(), api.getFixedCosts(), api.getSales(), api.getProducts(),
    ]);
    setTransactions(t); setRecords(r); setProfitShares(p); setSaldoAwal(s.saldo_awal || 0); setSettings(s); setFixedCosts(fc); setSales(sl); setProducts(pr);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    document.title = settings.nama_usaha || "Madatama Pro";
  }, [settings.nama_usaha]);

  const cashBalance = useMemo(() => computeCashBalance(transactions, saldoAwal), [transactions, saldoAwal]);
  const curMonth = monthKey(todayISO());
  const labaProduk = useMemo(() => sales.filter((s) => monthKey(s.tanggal) === curMonth).reduce((a, s) => a + (s.laba || 0), 0), [sales, curMonth]);
  const omzet = useMemo(() => sales.filter((s) => monthKey(s.tanggal) === curMonth).reduce((a, s) => a + (s.total || 0), 0), [sales, curMonth]);

  const monthProfit = useMemo(() => {
    const curDetail = monthDetail(transactions, curMonth);
    const opex = (curDetail.pengeluaran || 0) - (curDetail.bahanMitra || 0);
    return labaProduk - opex;
  }, [transactions, curMonth, labaProduk]);

  const totalPiutang = useMemo(() => records.filter((r) => r.jenis === "Piutang" && r.status === "Belum Lunas").reduce((a, r) => a + r.nominal, 0), [records]);
  const totalUtang = useMemo(() => records.filter((r) => r.jenis === "Utang" && r.status === "Belum Lunas").reduce((a, r) => a + r.nominal, 0), [records]);
  const lowStock = useMemo(() => products.filter((p) => (p.harga_jual || 0) > 0 && (p.stok ?? 0) <= 5).sort((a, b) => (a.stok || 0) - (b.stok || 0)), [products]);

  const handleAdd = () => { setEditing(null); setDialogOpen(true); };
  const handleEdit = (t) => { setEditing(t); setDialogOpen(true); };

  const handleSubmit = async (data) => {
    if (editing) { await api.updateTransaction(editing.id, data); toast.success("Transaksi diperbarui"); }
    else { await api.createTransaction(data); toast.success("Transaksi ditambahkan"); }
    setDialogOpen(false); setEditing(null); reload();
  };

  const handleSale = async (data) => {
    await api.createSale({ ...data, tanggal: todayISO() });
    toast.success("Penjualan instan dicatat di Buku Kas");
    setDialogOpen(false); setEditing(null); reload();
  };

  const handleDelete = async (idOrIds) => {
    if (Array.isArray(idOrIds)) {
      await Promise.all(idOrIds.map(id => api.deleteTransaction(id)));
      toast.success(`${idOrIds.length} transaksi dihapus`);
    } else {
      await api.deleteTransaction(idOrIds);
      toast.success("Transaksi dihapus");
    }
    reload();
  };
  const createRecord = async (d) => { await api.createRecord(d); toast.success("Catatan ditambahkan"); reload(); };
  const settleRecord = async (idOrIds) => {
    if (Array.isArray(idOrIds)) {
      await Promise.all(idOrIds.map(id => api.settleRecord(id)));
      toast.success(`${idOrIds.length} tagihan ditandai lunas`);
    } else {
      await api.settleRecord(idOrIds);
      toast.success("Ditandai lunas & tercatat di kas");
    }
    reload();
  };
  const unsettleRecord = async (id) => { await api.unsettleRecord(id); toast.success("Status dikembalikan"); reload(); };
  const deleteRecord = async (idOrIds) => {
    if (Array.isArray(idOrIds)) {
      await Promise.all(idOrIds.map(id => api.deleteRecord(id)));
      toast.success(`${idOrIds.length} catatan dihapus`);
    } else {
      await api.deleteRecord(idOrIds);
      toast.success("Catatan dihapus");
    }
    reload();
  };

  const markShared = async (d) => {
    const { bulan, laba_bersih, bagian_pemilik, bagian_pengelola } = d;
    // Ambil tanggal akhir bulan sebagai tanggal transaksi prive
    const [yr, mo] = bulan.split("-");
    const lastDay = new Date(Number(yr), Number(mo), 0).getDate();
    const tanggal = `${yr}-${mo}-${String(lastDay).padStart(2, "0")}`;
    // Buat 2 transaksi Pengeluaran Prive otomatis di Buku Kas
    await Promise.all([
      api.createTransaction({
        tanggal,
        keterangan: `Prive Pemilik — Bagi Hasil ${bulan}`,
        kategori: "Pengeluaran",
        jenis: "Lain-lain",
        nominal: bagian_pemilik,
        keterangan_tambahan: "prive_bagi_hasil",
      }),
      api.createTransaction({
        tanggal,
        keterangan: `Prive Pengelola — Bagi Hasil ${bulan}`,
        kategori: "Pengeluaran",
        jenis: "Lain-lain",
        nominal: bagian_pengelola,
        keterangan_tambahan: "prive_bagi_hasil",
      }),
    ]);
    await api.createProfitShare(d);
    toast.success("Bagi hasil dicatat & saldo kas dipotong otomatis ✅");
    reload();
  };

  const unmarkShared = async (bulan) => {
    // Hapus transaksi prive yang terkait bulan ini
    const priveKas = transactions.filter(
      (t) => t.keterangan_tambahan === "prive_bagi_hasil" && t.keterangan?.includes(bulan)
    );
    await Promise.all([
      api.deleteProfitShare(bulan),
      ...priveKas.map((t) => api.deleteTransaction(t.id)),
    ]);
    toast.success("Bagi hasil dibatalkan & transaksi prive dihapus");
    reload();
  };


  const allTabs = [
    { key: "dashboard", label: settings?.tab_names?.["dashboard"] || "Dashboard Utama", icon: LayoutDashboard },
    { key: "pesanan-web", label: settings?.tab_names?.["pesanan-web"] || "Pesanan Web", icon: ShoppingCart },
    { key: "kas", label: settings?.tab_names?.["kas"] || "Buku Kas", icon: BookText },
    { key: "hpp", label: settings?.tab_names?.["hpp"] || "Kalkulator & Kasir", icon: Calculator },
    { key: "produksi", label: settings?.tab_names?.["produksi"] || "Produksi", icon: Layers },
    { key: "riwayat-nota", label: settings?.tab_names?.["riwayat-nota"] || "Riwayat Penjualan", icon: ReceiptText },
    { key: "web", label: settings?.tab_names?.["web"] || "Eksterior Web", icon: Globe },
    { key: "rekap", label: settings?.tab_names?.["rekap"] || "Rekap Bulanan", icon: CalendarRange },
    { key: "labarugi", label: settings?.tab_names?.["labarugi"] || "Laba Rugi & Bagi Hasil", icon: PieChart },
    { key: "piutang", label: settings?.tab_names?.["piutang"] || "Piutang & Utang", icon: HandCoins },
    { key: "log", label: settings?.tab_names?.["log"] || "Log Aktivitas", icon: History },
    { key: "theme-settings", label: settings?.tab_names?.["theme-settings"] || "Tampilan & Menu", icon: SettingsIcon },
  ];

  const tabs = allTabs.filter(t => {
    if (authUser?.role === "Owner") return true;
    if (authUser?.role === "Kasir") return ["dashboard", "pesanan-web", "hpp", "kas", "produksi", "riwayat-nota", "piutang", "web", "theme-settings"].includes(t.key);
    if (authUser?.role === "Produksi") return ["produksi"].includes(t.key);
    return false;
  });

  if (!authUser) {
    return <Login onLogin={handleLogin} profile={settings} />;
  }

  return (
    <div className="App flex min-h-screen" style={{ background: "linear-gradient(135deg, #eef2ff 0%, #f0f4ff 50%, #faf5ff 100%)" }}>
      <Toaster position="top-center" richColors expand />

      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        currentTab={tab}
        onSelectTab={setTab}
        tabs={tabs}
        authUser={authUser}
        sidebarConfig={settings?.sidebar_config}
        appTheme={settings?.app_theme}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* ===== HEADER ===== */}
        <header className="sticky top-0 z-40 border-b border-indigo-100/70 bg-white/80 shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div
                className="relative grid h-10 w-10 overflow-hidden place-items-center rounded-xl text-white shadow-md shrink-0"
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
              >
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="absolute inset-0 h-full w-full object-cover bg-white" />
                ) : (
                  <Printer size={20} />
                )}
              </div>
              <div>
                <h1 className="font-heading text-lg font-bold leading-tight text-slate-900">
                  {settings.nama_usaha || "Bukuku Pro"}
                </h1>
                <p className="text-xs text-slate-400 font-medium">Pembukuan Percetakan & Branding</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <TrendingUp size={12} />
                Sistem Aktif
              </div>
              <Toolbar transactions={transactions} saldoAwal={saldoAwal} onReload={reload} />
              <div className="flex items-center gap-3 ml-2 pl-3 sm:ml-4 sm:pl-4 border-l border-slate-200">
                <a
                  href={`http://${window.location.hostname}:5173`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
                  title="Buka Toko Online (Frontend Publik)"
                >
                  <Globe size={12} />
                  Buka Web
                </a>
                <WebOrders onAccepted={reload} onNavigate={() => setTab("pesanan-web")} />
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-700 leading-tight">{authUser?.name}</p>
                  <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">{authUser?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="grid h-9 w-9 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 place-items-center rounded-xl transition-colors"
                  title="Keluar (Logout)"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">

          {/* ===== DASHBOARD SECTION MOVED INSIDE TABS ===== */}

          {/* ===== FIXED COSTS BAR ===== */}
          {tab === "kas" && authUser?.role === "Owner" && (
            <FixedCostsBar fixedCosts={fixedCosts} onReload={reload} />
          )}

          {/* ===== MAIN CONTENT TABS ===== */}
          <div className="rounded-2xl border border-indigo-100/60 bg-white/90 shadow-sm backdrop-blur-sm overflow-hidden">
            {/* Tab Content */}
            <div className="p-5 overflow-x-auto">
              {tab === "dashboard" && authUser?.role !== "Produksi" && (
                <Dashboard
                  cashBalance={cashBalance} monthProfit={monthProfit} currentMonthKey={curMonth}
                  piutang={totalPiutang} utang={totalUtang} labaProduk={labaProduk} omzet={omzet}
                  lowStock={lowStock} onNavigateTab={setTab} recentTransactions={transactions}
                  sales={sales}
                />
              )}
              {tab === "kas" && authUser?.role !== "Produksi" && (
                <BukuKas
                  transactions={transactions} saldoAwal={saldoAwal} cashBalance={cashBalance} profile={settings} sales={sales}
                  onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete}
                />
              )}
              {tab === "hpp" && authUser?.role !== "Produksi" && <HPPKalkulator onSold={reload} cashBalance={cashBalance} role={authUser?.role} />}
              {tab === "rekap" && authUser?.role === "Owner" && <RekapBulanan transactions={transactions} />}
              {tab === "labarugi" && authUser?.role === "Owner" && (
                <LabaRugi transactions={transactions} sales={sales} profitShares={profitShares} onMarkShared={markShared} onUnmarkShared={unmarkShared} />
              )}
              {tab === "piutang" && authUser?.role !== "Produksi" && (
                <PiutangUtang records={records} onCreate={createRecord} onSettle={settleRecord} onUnsettle={unsettleRecord} onDelete={deleteRecord} />
              )}
              {tab === "produksi" && (
                <Produksi sales={sales} onStatusChange={api.updateSaleStatus} onUpdated={reload} role={authUser?.role} />
              )}
              {tab === "riwayat-nota" && <RiwayatNota onSaleUpdate={reload} />}
              {tab === "log" && authUser?.role === "Owner" && <LogAktivitas />}
              {tab === "pesanan-web" && <WebOrdersTab onAccepted={reload} />}
              {tab === "web" && <WebSettingsTab />}
              {tab === "theme-settings" && <ThemeSettingsTab />}
            </div>
          </div>
        </main>
      </div>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleSubmit} editing={editing} fixedCosts={fixedCosts} onSale={handleSale} products={products} />

      {/* FAB mobile */}
      <button
        onClick={handleAdd}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full p-4 text-white shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 md:hidden bg-gradient-to-br ${THEME_COLORS[settings?.app_theme || "indigo"]?.gradient || "from-indigo-600 to-indigo-400"}`}
        style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
        data-testid="fab-add-transaction"
        aria-label="Tambah transaksi"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

export default App;
