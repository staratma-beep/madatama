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
    <div className="space-y-6">
      {/* Cards Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <StatCard
          title="Saldo Kas Saat Ini"
          value={cashBalance}
          icon={Wallet}
          gradient="from-indigo-500 to-indigo-700"
          glow="shadow-indigo-200"
          sub="Total kas tersedia"
          testId="card-saldo-kas"
          delay={0}
        />
        <StatCard
          title={`Omzet ${monthLabel(currentMonthKey).split(" ")[0]}`}
          value={omzet || 0}
          icon={TrendingUp} // Or another appropriate icon
          gradient="from-blue-500 to-cyan-600"
          glow="shadow-blue-200"
          sub="Total pendapatan kotor bulan ini"
          testId="card-omzet-bulan"
          delay={1}
        />
        <StatCard
          title={`Laba Bersih ${monthLabel(currentMonthKey).split(" ")[0]}`}
          value={monthProfit}
          icon={monthProfit >= 0 ? TrendingUp : TrendingDown}
          gradient={monthProfit >= 0 ? "from-emerald-500 to-teal-600" : "from-red-500 to-rose-600"}
          glow={monthProfit >= 0 ? "shadow-emerald-200" : "shadow-red-200"}
          sub={monthProfit >= 0 ? "Laba bersih operasional" : "Rugi operasional"}
          testId="card-laba-bulan"
          delay={2}
        />
        <StatCard
          title="Piutang Belum Lunas"
          value={piutang}
          icon={ArrowDownLeft}
          gradient="from-teal-400 to-cyan-600"
          glow="shadow-teal-200"
          sub="Uang yang belum diterima"
          testId="card-piutang"
          delay={3}
        />
        <StatCard
          title="Utang Belum Lunas"
          value={utang}
          icon={ArrowUpRight}
          gradient="from-amber-400 to-orange-500"
          glow="shadow-amber-200"
          sub="Kewajiban yang belum dibayar"
          testId="card-utang"
          delay={4}
        />
        <StatCard
          title={`Laba Produk ${monthLabel(currentMonthKey).split(" ")[0]}`}
          value={labaProduk || 0}
          icon={Boxes}
          gradient={(labaProduk || 0) >= 0 ? "from-fuchsia-500 to-purple-700" : "from-red-500 to-rose-600"}
          glow="shadow-fuchsia-200"
          sub="Laba kotor penjualan produk"
          testId="card-laba-produk"
          delay={5}
        />
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div
          className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-5 py-4 border border-amber-200 shadow-sm cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => onNavigateTab("hpp")}
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

      {/* Recommended Section (Quick Actions & Mini Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PlusCircle size={18} className="text-indigo-500" /> Akses Cepat</h3>
          <div className="flex flex-col gap-3">
            <button onClick={() => onNavigateTab("pesanan-web")} className="flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl transition-all text-left">
              <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><ShoppingCart size={18} /></div>
              <div>
                <p className="font-bold text-sm text-slate-700">Pesanan Web</p>
                <p className="text-xs text-slate-500">Cek orderan online terbaru</p>
              </div>
            </button>
            <button onClick={() => onNavigateTab("hpp")} className="flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl transition-all text-left">
              <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><Calculator size={18} /></div>
              <div>
                <p className="font-bold text-sm text-slate-700">Kalkulator HPP</p>
                <p className="text-xs text-slate-500">Hitung & simpan produk baru</p>
              </div>
            </button>
            <button onClick={() => onNavigateTab("kas")} className="flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl transition-all text-left">
              <div className="bg-amber-100 text-amber-600 p-2 rounded-lg"><Wallet size={18} /></div>
              <div>
                <p className="font-bold text-sm text-slate-700">Buku Kas</p>
                <p className="text-xs text-slate-500">Pantau semua arus uang</p>
              </div>
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-500" /> Ringkasan Aktivitas Terbaru</h3>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map(trx => (
                <div key={trx.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors">
                  <div className="flex flex-col">
                    <p className="font-semibold text-sm text-slate-700">{trx.keterangan}</p>
                    <span className="text-xs font-medium text-slate-400">{new Date(trx.created_at || trx.tanggal).toLocaleString("id-ID")}</span>
                  </div>
                  <span className={`font-mono-num font-bold text-sm ${trx.kategori === 'Pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {trx.kategori === 'Pemasukan' ? '+' : '-'}{formatRupiah(trx.nominal)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-6 text-sm">
              Belum ada aktivitas yang tercatat.
            </div>
          )}
        </div>
      </div>

      {/* Monthly Chart Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
          <BarChart3 size={22} className="text-indigo-500" /> Grafik Arus Kas Bulan Ini — {monthLabel(currentMonthKey)}
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rawDailyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Rp${(value / 1000).toLocaleString('id-ID')}k`}
                width={80}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
          <span className="text-amber-500 text-xl">🏆</span> Produk Terlaris — {monthLabel(currentMonthKey)}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
          {/* Most Sold Column */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Paling Sering Dijual</h4>
            {topSold.length > 0 ? (
              <div className="space-y-5">
                {topSold.map((p, i) => (
                  <div key={i} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                        <span className="text-sm font-semibold text-slate-700 truncate">{p.name}</span>
                      </div>
                      <span className="font-mono-num font-bold text-sm text-slate-600 shrink-0">{p.qty} pcs</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full rounded-full transition-all duration-1000" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-10 text-sm border-2 border-dashed border-slate-100 rounded-xl">Belum ada data penjualan bulan ini.</div>
            )}
          </div>

          {/* Most Profitable Column */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Paling Menguntungkan</h4>
            {topProfit.length > 0 ? (
              <div className="space-y-5">
                {topProfit.map((p, i) => (
                  <div key={i} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                        <span className="text-sm font-semibold text-slate-700 truncate">{p.name}</span>
                      </div>
                      <span className="font-mono-num font-bold text-sm text-emerald-600 shrink-0">{formatRupiah(p.profit)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${(p.profit / maxProfit) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-10 text-sm border-2 border-dashed border-slate-100 rounded-xl">Belum ada data penjualan bulan ini.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
