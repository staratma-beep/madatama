import React from "react";
import { formatRupiah, monthLabel } from "../lib/format";
import { Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Boxes, AlertTriangle, PlusCircle, ShoppingCart, Calculator, BarChart3, LayoutDashboard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const StatCard = ({ title, value, sub, icon: Icon, testId, delay = 0, gradient }) => {
  let colorTheme = "bg-slate-50 text-slate-500";
  if (gradient?.includes("indigo")) colorTheme = "bg-indigo-50 text-indigo-600";
  else if (gradient?.includes("teal")) colorTheme = "bg-teal-50 text-teal-600";
  else if (gradient?.includes("rose") || gradient?.includes("red")) colorTheme = "bg-red-50 text-red-600";
  else if (gradient?.includes("blue")) colorTheme = "bg-sky-50 text-sky-600";
  else if (gradient?.includes("emerald")) colorTheme = "bg-emerald-50 text-emerald-600";
  else if (gradient?.includes("fuchsia") || gradient?.includes("purple")) colorTheme = "bg-fuchsia-50 text-fuchsia-600";

  return (
    <div
      data-testid={testId}
      className="relative overflow-hidden rounded-lg bg-white border border-slate-200 p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] fade-up"
      style={{ animationDelay: `${delay * 0.07}s` }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-medium text-slate-600">{title}</p>
        <div className={`grid h-8 w-8 place-items-center rounded ${colorTheme}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="flex flex-col">
        <p className="font-mono-num text-[22px] font-bold text-slate-900 tracking-tight">
          {formatRupiah(value)}
        </p>
        {sub && <p className="mt-1 text-[12px] text-slate-500 font-medium">{sub}</p>}
      </div>
    </div>
  );
};

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
      <div className="flex-none flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 bg-transparent">
        <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2">
          <LayoutDashboard size={20} className="text-slate-700" /> Dashboard
        </h2>
      </div>

      {/* Quick Action Horizontal Pills */}
      <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-4">
        <span className="text-[12px] font-semibold text-slate-500 mr-2 flex items-center gap-1.5">Akses Cepat:</span>
        <button onClick={() => onNavigateTab("pesanan-web")} className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-medium text-[13px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-colors">
          <ShoppingCart size={14} className="text-slate-500" /> Pesanan Online
        </button>
        <button onClick={() => onNavigateTab("hpp")} className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-medium text-[13px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-colors">
          <Calculator size={14} className="text-slate-500" /> Kalkulator HPP
        </button>
        <button onClick={() => onNavigateTab("kas")} className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-medium text-[13px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-colors">
          <Wallet size={14} className="text-slate-500" /> Buku Kas
        </button>
        <button onClick={() => onNavigateTab("produksi")} className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-medium text-[13px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-colors">
          <Boxes size={14} className="text-slate-500" /> Produksi
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
          className="flex items-center gap-3 bg-white border-y border-r border-l-4 border-l-amber-500 border-y-slate-200 border-r-slate-200 p-4 rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] cursor-pointer hover:bg-slate-50 transition-all group"
          onClick={() => onNavigateTab("hpp")}
          data-testid="low-stock-alert"
        >
          <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle size={16} />
          </div>
          <div className="text-[13px] text-amber-900 leading-snug">
            <span className="font-semibold block mb-0.5 text-amber-800">Peringatan: Stok Menipis ({lowStock.length} Item)</span>
            {lowStock.slice(0, 8).map((p) => `${p.nama} (${p.stok ?? 0})`).join(", ")}
            {lowStock.length > 8 ? ", …" : ""}
            <span className="ml-1 text-slate-500">— Restok di kalkulator HPP.</span>
          </div>
        </div>
      )}

      {/* Analytical Section (Chart + Recent Activity Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Chart Section */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-[14px]">
            Grafik Arus Kas Bulan Ini <span className="font-normal text-slate-500">({monthLabel(currentMonthKey)})</span>
          </h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rawDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${(value / 1000).toLocaleString('id-ID')}k`} width={80} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[2, 2, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-[14px]">Ringkasan Aktivitas</h3>
            <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md">Terbaru</span>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="flex-1 flex flex-col gap-3">
              {recentTransactions.slice(0, 6).map(trx => (
                <div key={trx.id} className="flex justify-between items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-1 w-[6px] h-[6px] rounded-full shrink-0 ${trx.kategori === 'Pemasukan' ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
                    <div className="flex flex-col">
                      <p className="font-medium text-[13px] text-slate-800 leading-snug">{trx.keterangan}</p>
                      <span className="text-[11px] text-slate-500">{new Date(trx.created_at || trx.tanggal).toLocaleString("id-ID", { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  <span className={`font-mono-num font-semibold text-[13px] shrink-0 ${trx.kategori === 'Pemasukan' ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {trx.kategori === 'Pemasukan' ? '+' : '-'}{formatRupiah(trx.nominal)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-6">
              <span className="text-[13px] font-medium">Buku Kas Kosong</span>
            </div>
          )}
        </div>
      </div>
      {/* Top Products Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] overflow-hidden">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2 text-[14px]">
          <span className="text-amber-500 text-lg">🏆</span> Produk Terlaris <span className="font-normal text-slate-400">({monthLabel(currentMonthKey)})</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
          {/* Most Sold Column */}
          <div>
            <h4 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-4">Paling Sering Dijual</h4>
            {topSold.length > 0 ? (
              <div className="space-y-4">
                {topSold.map((p, i) => (
                  <div key={i} className="relative group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                        <span className="text-[13px] font-medium text-slate-700 truncate">{p.name}</span>
                      </div>
                      <span className="font-mono-num font-semibold text-[13px] text-slate-600 shrink-0">{p.qty} pcs</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#6366f1] h-full rounded-full transition-all duration-1000" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center flex flex-col items-center justify-center text-slate-400 py-10 text-[13px] border border-dashed border-slate-200 rounded-lg">
                Belum ada data penjualan.
              </div>
            )}
          </div>

          {/* Most Profitable Column */}
          <div>
            <h4 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-4">Paling Menguntungkan</h4>
            {topProfit.length > 0 ? (
              <div className="space-y-4">
                {topProfit.map((p, i) => (
                  <div key={i} className="relative group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                        <span className="text-[13px] font-medium text-slate-700 truncate">{p.name}</span>
                      </div>
                      <span className="font-mono-num font-semibold text-[13px] text-emerald-600 shrink-0">{formatRupiah(p.profit)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#10b981] h-full rounded-full transition-all duration-1000" style={{ width: `${(p.profit / maxProfit) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center flex flex-col items-center justify-center text-slate-400 py-10 text-[13px] border border-dashed border-slate-200 rounded-lg">
                Belum ada laba tercatat.
              </div>
            )}
          </div>
        </div>
      </div >
    </div >
  );
};
