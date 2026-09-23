import React from "react";
import { formatRupiah, monthLabel } from "../lib/format";
import { Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Boxes, AlertTriangle, PlusCircle, ShoppingCart, Calculator, BarChart3, LayoutDashboard } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
          <p className="font-semibold text-slate-700 mb-1.5 text-[12px] uppercase tracking-wide">{`${label} ${monthLabel(currentMonthKey)}`}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-[13px]">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
              <span className="text-slate-500">{entry.name}:</span>
              <span className="font-bold" style={{ color: entry.color }}>{formatRupiah(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalPemasukan = rawDailyData.reduce((s, d) => s + d.Pemasukan, 0);
  const totalPengeluaran = rawDailyData.reduce((s, d) => s + d.Pengeluaran, 0);

  const yTickFormatter = (value) => {
    if (value === 0) return 'Rp0';
    if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)}jt`;
    if (value >= 1_000) return `Rp${(value / 1_000).toFixed(0)}rb`;
    return `Rp${value}`;
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
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] overflow-hidden flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-[14px]">
                <BarChart3 size={14} className="text-slate-400" />
                Arus Kas <span className="font-normal text-slate-400 text-[13px]">— {monthLabel(currentMonthKey)}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Pemasukan vs Pengeluaran per hari</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 border border-emerald-100 bg-emerald-50 rounded-md px-2.5 py-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-[11px] font-semibold text-emerald-700">{formatRupiah(totalPemasukan)}</span>
              </div>
              <div className="flex items-center gap-1.5 border border-red-100 bg-red-50 rounded-md px-2.5 py-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                <span className="text-[11px] font-semibold text-red-600">{formatRupiah(totalPengeluaran)}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rawDailyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPemasukan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPengeluaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }} tickLine={false} axisLine={false} dy={6} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }} tickLine={false} axisLine={false} tickFormatter={yTickFormatter} width={60} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={2} fill="url(#gradPemasukan)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={2} fill="url(#gradPengeluaran)" dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-[14px]">Aktivitas Terbaru</h3>
            <span className="text-[11px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-md">{recentTransactions.slice(0, 6).length} transaksi</span>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto">
              {recentTransactions.slice(0, 6).map(trx => (
                <div key={trx.id} className="flex justify-between items-start border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-1 grid place-items-center w-6 h-6 rounded shrink-0 ${trx.kategori === 'Pemasukan' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                      }`}>
                      {trx.kategori === 'Pemasukan'
                        ? <ArrowDownLeft size={12} />
                        : <ArrowUpRight size={12} />}
                    </div>
                    <div className="flex flex-col">
                      <p className="font-medium text-[13px] text-slate-800 leading-snug line-clamp-1">{trx.keterangan}</p>
                      <span className="text-[11px] text-slate-400">{new Date(trx.tanggal).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <span className={`font-mono-num font-semibold text-[13px] shrink-0 ml-2 ${trx.kategori === 'Pemasukan' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                    {trx.kategori === 'Pemasukan' ? '+' : '−'}{formatRupiah(trx.nominal)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-6">
              <Wallet size={28} className="mb-2 text-slate-200" />
              <span className="text-[13px] font-medium">Buku Kas Kosong</span>
              <span className="text-[11px] mt-0.5">Belum ada transaksi bulan ini</span>
            </div>
          )}
          {recentTransactions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Masuk</p>
                <p className="text-[13px] font-bold text-emerald-700 tabular-nums">{formatRupiah(totalPemasukan)}</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-md px-3 py-2">
                <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">Keluar</p>
                <p className="text-[13px] font-bold text-red-600 tabular-nums">{formatRupiah(totalPengeluaran)}</p>
              </div>
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
