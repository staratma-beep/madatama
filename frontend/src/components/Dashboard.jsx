import React from "react";
import { formatRupiah, monthLabel } from "../lib/format";
import { Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Boxes } from "lucide-react";

const CARDS = [
  {
    key: "saldo",
    title: "Saldo Kas Saat Ini",
    icon: Wallet,
    gradient: "from-indigo-500 to-indigo-700",
    glow: "shadow-indigo-200",
    getText: (v) => ({ value: v, color: "text-white", sub: "Total kas tersedia" }),
    testId: "card-saldo-kas",
  },
  {
    key: "laba",
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-200",
    testId: "card-laba-bulan",
  },
  {
    key: "piutang",
    title: "Piutang Belum Lunas",
    icon: ArrowDownLeft,
    gradient: "from-teal-400 to-cyan-600",
    glow: "shadow-teal-200",
    getText: (v) => ({ value: v, sub: "Uang yang belum diterima" }),
    testId: "card-piutang",
  },
  {
    key: "utang",
    title: "Utang Belum Lunas",
    icon: ArrowUpRight,
    gradient: "from-amber-400 to-orange-500",
    glow: "shadow-amber-200",
    getText: (v) => ({ value: v, sub: "Kewajiban yang belum dibayar" }),
    testId: "card-utang",
  },
  {
    key: "labaproduk",
    icon: Boxes,
    gradient: "from-fuchsia-500 to-purple-700",
    glow: "shadow-fuchsia-200",
    testId: "card-laba-produk",
  },
];

const StatCard = ({ title, value, sub, icon: Icon, gradient, glow, testId, delay = 0 }) => (
  <div
    data-testid={testId}
    className={`stat-card relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg ${glow} fade-up`}
    style={{ animationDelay: `${delay * 0.07}s` }}
  >
    {/* Decorative circles */}
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

export const Dashboard = ({ cashBalance, monthProfit, currentMonthKey, piutang, utang, labaProduk }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
        title={`Laba ${monthLabel(currentMonthKey)}`}
        value={monthProfit}
        icon={monthProfit >= 0 ? TrendingUp : TrendingDown}
        gradient={monthProfit >= 0 ? "from-emerald-500 to-teal-600" : "from-red-500 to-rose-600"}
        glow={monthProfit >= 0 ? "shadow-emerald-200" : "shadow-red-200"}
        sub={monthProfit >= 0 ? "Untung bulan berjalan" : "Rugi bulan berjalan"}
        testId="card-laba-bulan"
        delay={1}
      />
      <StatCard
        title="Piutang Belum Lunas"
        value={piutang}
        icon={ArrowDownLeft}
        gradient="from-teal-400 to-cyan-600"
        glow="shadow-teal-200"
        sub="Uang yang belum diterima"
        testId="card-piutang"
        delay={2}
      />
      <StatCard
        title="Utang Belum Lunas"
        value={utang}
        icon={ArrowUpRight}
        gradient="from-amber-400 to-orange-500"
        glow="shadow-amber-200"
        sub="Kewajiban yang belum dibayar"
        testId="card-utang"
        delay={3}
      />
      <StatCard
        title={`Laba Produk ${monthLabel(currentMonthKey).split(" ")[0]}`}
        value={labaProduk || 0}
        icon={Boxes}
        gradient={(labaProduk || 0) >= 0 ? "from-fuchsia-500 to-purple-700" : "from-red-500 to-rose-600"}
        glow="shadow-fuchsia-200"
        sub="Laba kotor penjualan produk"
        testId="card-laba-produk"
        delay={4}
      />
    </div>
  );
};
