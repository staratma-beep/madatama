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
import { Toaster, toast } from "sonner";
import {
  Printer, BookText, CalendarRange, PieChart, HandCoins,
  Plus, Calculator, AlertTriangle, TrendingUp,
} from "lucide-react";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [records, setRecords] = useState([]);
  const [profitShares, setProfitShares] = useState([]);
  const [fixedCosts, setFixedCosts] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [saldoAwal, setSaldoAwal] = useState(0);
  const [tab, setTab] = useState("kas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const reload = useCallback(async () => {
    const [t, r, p, s, fc, sl, pr] = await Promise.all([
      api.getTransactions(), api.getRecords(), api.getProfitShares(), api.getSettings(), api.getFixedCosts(), api.getSales(), api.getProducts(),
    ]);
    setTransactions(t); setRecords(r); setProfitShares(p); setSaldoAwal(s.saldo_awal || 0); setFixedCosts(fc); setSales(sl); setProducts(pr);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const cashBalance = useMemo(() => computeCashBalance(transactions, saldoAwal), [transactions, saldoAwal]);
  const curMonth = monthKey(todayISO());
  const monthProfit = useMemo(() => monthDetail(transactions, curMonth).laba, [transactions, curMonth]);
  const totalPiutang = useMemo(() => records.filter((r) => r.jenis === "Piutang" && r.status === "Belum Lunas").reduce((a, r) => a + r.nominal, 0), [records]);
  const totalUtang = useMemo(() => records.filter((r) => r.jenis === "Utang" && r.status === "Belum Lunas").reduce((a, r) => a + r.nominal, 0), [records]);
  const labaProduk = useMemo(() => sales.filter((s) => monthKey(s.tanggal) === curMonth).reduce((a, s) => a + (s.laba || 0), 0), [sales, curMonth]);
  const lowStock = useMemo(() => products.filter((p) => (p.harga_jual || 0) > 0 && (p.stok ?? 0) <= 5).sort((a, b) => (a.stok || 0) - (b.stok || 0)), [products]);

  const handleAdd = () => { setEditing(null); setDialogOpen(true); };
  const handleEdit = (t) => { setEditing(t); setDialogOpen(true); };

  const handleSubmit = async (data) => {
    if (editing) { await api.updateTransaction(editing.id, data); toast.success("Transaksi diperbarui"); }
    else { await api.createTransaction(data); toast.success("Transaksi ditambahkan"); }
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
  const settleRecord = async (id) => { await api.settleRecord(id); toast.success("Ditandai lunas & tercatat di kas"); reload(); };
  const unsettleRecord = async (id) => { await api.unsettleRecord(id); toast.success("Status dikembalikan"); reload(); };
  const deleteRecord = async (id) => { await api.deleteRecord(id); toast.success("Catatan dihapus"); reload(); };

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

  const tabs = [
    { key: "kas", label: "Buku Kas", icon: BookText },
    { key: "hpp", label: "Kalkulator HPP", icon: Calculator },
    { key: "rekap", label: "Rekap Bulanan", icon: CalendarRange },
    { key: "labarugi", label: "Laba Rugi & Bagi Hasil", icon: PieChart },
    { key: "piutang", label: "Piutang & Utang", icon: HandCoins },
  ];

  return (
    <div className="App min-h-screen" style={{ background: "linear-gradient(135deg, #eef2ff 0%, #f0f4ff 50%, #faf5ff 100%)" }}>
      <Toaster position="top-center" richColors expand />

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 border-b border-indigo-100/70 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
            >
              <Printer size={20} />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold leading-tight text-slate-900">
                Bukuku <span className="gradient-text">Pro</span>
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">

        {/* ===== DASHBOARD CARDS ===== */}
        <Dashboard
          cashBalance={cashBalance} monthProfit={monthProfit} currentMonthKey={curMonth}
          piutang={totalPiutang} utang={totalUtang} labaProduk={labaProduk}
        />

        {/* ===== LOW STOCK ALERT ===== */}
        {lowStock.length > 0 && (
          <div
            className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 shadow-sm fade-up"
            data-testid="low-stock-alert"
          >
            <div className="grid h-8 w-8 flex-none place-items-center rounded-xl bg-amber-100">
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <div className="text-sm text-amber-800">
              <span className="font-bold">Stok menipis ({lowStock.length} produk):</span>{" "}
              {lowStock.slice(0, 8).map((p) => `${p.nama} (${p.stok ?? 0})`).join(", ")}
              {lowStock.length > 8 ? ", …" : ""}
              <span className="ml-1 text-amber-600 font-medium">— segera restok di tab Kalkulator HPP.</span>
            </div>
          </div>
        )}

        {/* ===== FIXED COSTS BAR ===== */}
        <FixedCostsBar fixedCosts={fixedCosts} onReload={reload} />

        {/* ===== MAIN TABS ===== */}
        <div className="rounded-2xl border border-indigo-100/60 bg-white/90 shadow-sm backdrop-blur-sm overflow-hidden">
          {/* Tab List */}
          <div className="border-b border-slate-100 overflow-x-auto">
            <div
              className="flex min-w-max px-2 pt-2 gap-1"
              role="tablist"
              data-testid="main-tabs"
            >
              {tabs.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  data-testid={`tab-${t.key}`}
                  className={[
                    "flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                    tab === t.key
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50",
                  ].join(" ")}
                >
                  <t.icon size={15} />
                  <span className="text-xs sm:text-sm">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {tab === "kas" && (
              <BukuKas
                transactions={transactions} saldoAwal={saldoAwal} cashBalance={cashBalance}
                onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete}
              />
            )}
            {tab === "hpp" && <HPPKalkulator onSold={reload} cashBalance={cashBalance} />}
            {tab === "rekap" && <RekapBulanan transactions={transactions} />}
            {tab === "labarugi" && (
              <LabaRugi transactions={transactions} profitShares={profitShares} onMarkShared={markShared} onUnmarkShared={unmarkShared} />
            )}
            {tab === "piutang" && (
              <PiutangUtang records={records} onCreate={createRecord} onSettle={settleRecord} onUnsettle={unsettleRecord} onDelete={deleteRecord} />
            )}
          </div>
        </div>
      </main>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleSubmit} editing={editing} fixedCosts={fixedCosts} />

      {/* FAB mobile */}
      <button
        onClick={handleAdd}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full p-4 text-white shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 md:hidden"
        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 8px 30px rgba(79,70,229,0.4)" }}
        data-testid="fab-add-transaction"
        aria-label="Tambah transaksi"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

export default App;
