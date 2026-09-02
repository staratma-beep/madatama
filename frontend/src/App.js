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
import { TransactionDialog } from "@/components/TransactionDialog";
import { Toolbar } from "@/components/Toolbar";
import { FixedCostsBar } from "@/components/FixedCostsBar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toaster, toast } from "sonner";
import { Printer, BookText, CalendarRange, PieChart, HandCoins, Plus } from "lucide-react";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [records, setRecords] = useState([]);
  const [profitShares, setProfitShares] = useState([]);
  const [fixedCosts, setFixedCosts] = useState([]);
  const [saldoAwal, setSaldoAwal] = useState(0);
  const [tab, setTab] = useState("kas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const reload = useCallback(async () => {
    const [t, r, p, s, fc] = await Promise.all([
      api.getTransactions(), api.getRecords(), api.getProfitShares(), api.getSettings(), api.getFixedCosts(),
    ]);
    setTransactions(t); setRecords(r); setProfitShares(p); setSaldoAwal(s.saldo_awal || 0); setFixedCosts(fc);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const cashBalance = useMemo(() => computeCashBalance(transactions, saldoAwal), [transactions, saldoAwal]);
  const curMonth = monthKey(todayISO());
  const monthProfit = useMemo(() => monthDetail(transactions, curMonth).laba, [transactions, curMonth]);
  const totalPiutang = useMemo(() => records.filter((r) => r.jenis === "Piutang" && r.status === "Belum Lunas").reduce((a, r) => a + r.nominal, 0), [records]);
  const totalUtang = useMemo(() => records.filter((r) => r.jenis === "Utang" && r.status === "Belum Lunas").reduce((a, r) => a + r.nominal, 0), [records]);

  const handleAdd = () => { setEditing(null); setDialogOpen(true); };
  const handleEdit = (t) => { setEditing(t); setDialogOpen(true); };

  const handleSubmit = async (data) => {
    if (editing) { await api.updateTransaction(editing.id, data); toast.success("Transaksi diperbarui"); }
    else { await api.createTransaction(data); toast.success("Transaksi ditambahkan"); }
    setDialogOpen(false); setEditing(null); reload();
  };

  const handleDelete = async (id) => { await api.deleteTransaction(id); toast.success("Transaksi dihapus"); reload(); };

  const createRecord = async (d) => { await api.createRecord(d); toast.success("Catatan ditambahkan"); reload(); };
  const settleRecord = async (id) => { await api.settleRecord(id); toast.success("Ditandai lunas & tercatat di kas"); reload(); };
  const unsettleRecord = async (id) => { await api.unsettleRecord(id); toast.success("Status dikembalikan"); reload(); };
  const deleteRecord = async (id) => { await api.deleteRecord(id); toast.success("Catatan dihapus"); reload(); };

  const markShared = async (d) => { await api.createProfitShare(d); toast.success("Bagi hasil dicatat"); reload(); };
  const unmarkShared = async (bulan) => { await api.deleteProfitShare(bulan); toast.success("Dibatalkan"); reload(); };

  const tabs = [
    { key: "kas", label: "Buku Kas", icon: BookText },
    { key: "rekap", label: "Rekap Bulanan", icon: CalendarRange },
    { key: "labarugi", label: "Laba Rugi & Bagi Hasil", icon: PieChart },
    { key: "piutang", label: "Piutang & Utang", icon: HandCoins },
  ];

  return (
    <div className="App min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
              <Printer size={20} />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold leading-tight text-slate-900">Bukuku Pro</h1>
              <p className="text-xs text-slate-500">Pembukuan Percetakan & Branding</p>
            </div>
          </div>
          <Toolbar transactions={transactions} saldoAwal={saldoAwal} onReload={reload} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Dashboard
          cashBalance={cashBalance} monthProfit={monthProfit} currentMonthKey={curMonth}
          piutang={totalPiutang} utang={totalUtang}
        />

        <FixedCostsBar fixedCosts={fixedCosts} onReload={reload} />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-slate-100 p-1 sm:grid-cols-4" data-testid="main-tabs">
            {tabs.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="gap-1.5 py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700" data-testid={`tab-${t.key}`}>
                <t.icon size={15} /> <span className="text-xs sm:text-sm">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="kas" className="mt-4">
            <BukuKas
              transactions={transactions} saldoAwal={saldoAwal} cashBalance={cashBalance}
              onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete}
            />
          </TabsContent>
          <TabsContent value="rekap" className="mt-4">
            <RekapBulanan transactions={transactions} />
          </TabsContent>
          <TabsContent value="labarugi" className="mt-4">
            <LabaRugi transactions={transactions} profitShares={profitShares} onMarkShared={markShared} onUnmarkShared={unmarkShared} />
          </TabsContent>
          <TabsContent value="piutang" className="mt-4">
            <PiutangUtang records={records} onCreate={createRecord} onSettle={settleRecord} onUnsettle={unsettleRecord} onDelete={deleteRecord} />
          </TabsContent>
        </Tabs>
      </main>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleSubmit} editing={editing} fixedCosts={fixedCosts} />

      <button
        onClick={handleAdd}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-emerald-600 p-4 text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 md:hidden"
        data-testid="fab-add-transaction"
        aria-label="Tambah transaksi"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

export default App;
