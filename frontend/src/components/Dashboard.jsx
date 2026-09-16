import React from "react";
import { formatRupiah, monthLabel } from "../lib/format";
import { Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Boxes, AlertTriangle, PlusCircle, ShoppingCart, Calculator, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const StatCard = ({ title, value, sub, icon: Icon, gradient, glow, testId, delay = 0 }) => (
  <div
    data-testid={testId}
    className={`stat-card relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg ${glow} fade-up`}
    style={{ animationDelay: `${delay * 0.07}s` }}
  >
    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
    <div className="absolute -right-2 -bottom-8 h-20 w-20 rounded-full bg-white/5" />
    <div className="relative">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{title}</p>
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-4 font-mono-num text-2xl font-bold tracking-tight">
        {formatRupiah(value)}
      </p>
      {sub && <p className="mt-1 text-xs text-white/60 font-medium">{sub}</p>}
    </div>
  </div>
);

export const Dashboard = ({
  cashBalance, monthProfit, currentMonthKey, piutang, utang, labaProduk, omzet,
  lowStock = [], onNavigateTab, recentTransactions = [], sales = []
}) => {
  const currentMonthSales = sales.filter((s) => s.tanggal && s.tanggal.startsWith(currentMonthKey));

  const productStats = {};
  currentMonthSales.forEach((s) => {
    if (!productStats[s.nama]) {
      productStats[s.nama] = { name: s.nama, qty: 0, profit: 0 };
    }
    productStats[s.nama].qty += (s.qty || 0);
    // Since some sales could have discount, laba is already calculated overall for the row
    productStats[s.nama].profit += (s.laba || 0);
  });

  const topSold = Object.values(productStats).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topProfit = Object.values(productStats).sort((a, b) => b.profit - a.profit).slice(0, 5);

  const maxQty = Math.max(...topSold.map(p => p.qty), 1);
  const maxProfit = Math.max(...topProfit.map(p => p.profit), 1);

  // Data Grafik Bulanan
  const [yr, mo] = currentMonthKey.split("-");
  const daysInMonth = new Date(parseInt(yr), parseInt(mo), 0).getDate();
  const rawDailyData = Array.from({ length: daysInMonth }, (_, i) => ({
    name: String(i + 1).padStart(2, "0"),
    Pemasukan: 0,
    Pengeluaran: 0
  }));

  const thisMonthTrx = recentTransactions.filter(trx => trx.tanggal && trx.tanggal.startsWith(currentMonthKey));
  thisMonthTrx.forEach(trx => {
    const day = parseInt(trx.tanggal.split("-")[2], 10);
    if (!isNaN(day) && day >= 1 && day <= daysInMonth) {
      if (trx.kategori === 'Pemasukan') rawDailyData[day - 1].Pemasukan += trx.nominal || 0;
      if (trx.kategori === 'Pengeluaran') rawDailyData[day - 1].Pengeluaran += trx.nominal || 0;
    }
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl">
          <p className="font-bold text-slate-700 mb-1">{`Tanggal ${label} ${monthLabel(currentMonthKey)}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: {formatRupiah(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Quick Action Horizontal Pills */}
      <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-4">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1.5"><PlusCircle size={14} /> Akses Cepat:</span>
        <button onClick={() => onNavigateTab("pesanan-web")} className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-600 border border-indigo-100 hover:border-indigo-600 text-indigo-700 hover:text-white px-4 py-2 rounded-full font-bold text-xs transition-all shadow-sm">
          <ShoppingCart size={14} /> Pesanan Toko Online
        </button>
        <button onClick={() => onNavigateTab("hpp")} className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-600 border border-emerald-100 hover:border-emerald-600 text-emerald-700 hover:text-white px-4 py-2 rounded-full font-bold text-xs transition-all shadow-sm">
          <Calculator size={14} /> Kalkulator HPP
        </button>
        <button onClick={() => onNavigateTab("kas")} className="flex items-center gap-2 bg-amber-50 hover:bg-amber-600 border border-amber-100 hover:border-amber-600 text-amber-700 hover:text-white px-4 py-2 rounded-full font-bold text-xs transition-all shadow-sm">
          <Wallet size={14} /> Buku Kas
        </button>
        <button onClick={() => onNavigateTab("produksi")} className="flex items-center gap-2 bg-rose-50 hover:bg-rose-600 border border-rose-100 hover:border-rose-600 text-rose-700 hover:text-white px-4 py-2 rounded-full font-bold text-xs transition-all shadow-sm">
          <Boxes size={14} /> Produksi
        </button>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Saldo Kas Saat Ini"
          value={cashBalance}
          icon={Wallet}
          gradient="from-indigo-600 to-indigo-800"
          glow="shadow-indigo-200/50"
          sub="Total uang tersedia di Kas"
          testId="card-saldo-kas"
          delay={0}
        />
        <StatCard
          title="Piutang Menunggu"
          value={piutang}
          icon={ArrowDownLeft}
          gradient="from-teal-500 to-cyan-600"
          glow="shadow-teal-200/50"
          sub="Uang masuk belum lunas"
          testId="card-piutang"
          delay={1}
        />
        <StatCard
          title="Utang ke Vendor"
          value={utang}
          icon={ArrowUpRight}
          gradient="from-rose-500 to-red-600"
          glow="shadow-rose-200/50"
          sub="Kewajiban belum terbayar"
          testId="card-utang"
          delay={2}
        />
        <StatCard
          title={`Omzet ${monthLabel(currentMonthKey).split(" ")[0]}`}
          value={omzet || 0}
          icon={TrendingUp}
          gradient="from-blue-500 to-sky-600"
          glow="shadow-blue-200/50"
          sub="Total pendapatan kotor bulan ini"
          testId="card-omzet-bulan"
          delay={3}
        />
        <StatCard
          title={`Laba Bersih ${monthLabel(currentMonthKey).split(" ")[0]}`}
          value={monthProfit}
          icon={monthProfit >= 0 ? TrendingUp : TrendingDown}
          gradient={monthProfit >= 0 ? "from-emerald-500 to-teal-600" : "from-red-500 to-rose-600"}
          glow={monthProfit >= 0 ? "shadow-emerald-200/50" : "shadow-red-200/50"}
          sub={monthProfit >= 0 ? "Laba bersih operasional" : "Rugi operasional"}
          testId="card-laba-bulan"
          delay={4}
        />
        <StatCard
          title={`Laba Produk ${monthLabel(currentMonthKey).split(" ")[0]}`}
          value={labaProduk || 0}
          icon={Boxes}
          gradient={(labaProduk || 0) >= 0 ? "from-fuchsia-500 to-purple-600" : "from-red-500 to-rose-600"}
          glow="shadow-fuchsia-200/50"
          sub="Keuntungan kotor penjualan"
          testId="card-laba-produk"
          delay={5}
        />
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div
          className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl shadow-sm cursor-pointer hover:shadow hover:border-amber-300 transition-all group"
          onClick={() => onNavigateTab("hpp")}
          data-testid="low-stock-alert"
        >
          <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-amber-200/50 text-amber-700 group-hover:scale-110 transition-transform">
            <AlertTriangle size={20} />
          </div>
          <div className="text-sm text-amber-900 leading-tight">
            <span className="font-extrabold uppercase tracking-widest text-[11px] block mb-0.5 text-amber-700">Peringatan: Stok Menipis ({lowStock.length} Item)</span>
            {lowStock.slice(0, 8).map((p) => `${p.nama} (${p.stok ?? 0})`).join(", ")}
            {lowStock.length > 8 ? ", …" : ""}
            <span className="ml-1 opacity-75 font-medium italic">— Restok di kalkulator HPP.</span>
          </div>
        </div>
      )}

      {/* Analytical Section (Chart + Recent Activity Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Chart Section */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
            <BarChart3 size={20} className="text-indigo-500" /> Grafik Arus Kas Bulan Ini <span className="text-sm font-medium text-slate-400">({monthLabel(currentMonthKey)})</span>
          </h3>
          <div className="flex-1 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rawDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${(value / 1000).toLocaleString('id-ID')}k`} width={80} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg"><TrendingUp size={20} className="text-indigo-500" /> Ringkasan Aktivitas</h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-md uppercase tracking-wider">Terbaru</span>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4 flex-1">
              {recentTransactions.slice(0, 6).map(trx => (
                <div key={trx.id} className="group flex justify-between items-center rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${trx.kategori === 'Pemasukan' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                    <div className="flex flex-col">
                      <p className="font-bold text-sm text-slate-700 line-clamp-1">{trx.keterangan}</p>
                      <span className="text-[11px] font-semibold text-slate-400">{new Date(trx.created_at || trx.tanggal).toLocaleString("id-ID", { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  <span className={`font-mono-num font-black text-sm bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 ${trx.kategori === 'Pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {trx.kategori === 'Pemasukan' ? '+' : '-'}{formatRupiah(trx.nominal)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-6">
              <span className="text-3xl mb-2">📉</span>
              <span className="text-sm font-medium">Belum ada aktivitas</span>
            </div>
          )}
        </div>
      </div>
      {/* Top Products Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
          <span className="text-amber-500 text-xl">🏆</span> Produk Terlaris — {monthLabel(currentMonthKey)}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
          {/* Most Sold Column */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Paling Sering Dijual</h4>
            {topSold.length > 0 ? (
              <div className="space-y-4">
                {topSold.map((p, i) => (
                  <div key={i} className="relative group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">{i + 1}</div>
                        <span className="text-sm font-semibold text-slate-700 truncate">{p.name}</span>
                      </div>
                      <span className="font-mono-num font-bold text-sm text-slate-600 shrink-0 bg-slate-50 px-2 py-0.5 rounded">{p.qty} pcs</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-indigo-400 to-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center flex flex-col items-center justify-center text-slate-400 py-10 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                <span className="text-2xl mb-2 grayscale opacity-50">🛒</span>
                Belum ada data penjualan.
              </div>
            )}
          </div>

          {/* Most Profitable Column */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Paling Menguntungkan</h4>
            {topProfit.length > 0 ? (
              <div className="space-y-4">
                {topProfit.map((p, i) => (
                  <div key={i} className="relative group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">{i + 1}</div>
                        <span className="text-sm font-semibold text-slate-700 truncate">{p.name}</span>
                      </div>
                      <span className="font-mono-num font-bold text-sm text-emerald-600 shrink-0 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{formatRupiah(p.profit)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(p.profit / maxProfit) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center flex flex-col items-center justify-center text-slate-400 py-10 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                <span className="text-2xl mb-2 grayscale opacity-50">📈</span>
                Belum ada laba tercatat.
              </div>
            )}
          </div>
        </div>
      </div >
    </div >
  );
};
