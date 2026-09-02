import React from "react";
import { formatRupiah, monthLabel } from "../lib/format";
import { Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from "lucide-react";

const Card = ({ title, value, sub, icon: Icon, accent, testId, valueClass }) => (
  <div
    data-testid={testId}
    className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm fade-up"
  >
    <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 ${accent}`} />
    <div className="flex items-center gap-3">
      <div className={`grid h-10 w-10 place-items-center rounded-xl text-white ${accent}`}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
    </div>
    <p className={`mt-4 font-mono-num text-2xl font-bold tracking-tight ${valueClass || "text-slate-900"}`}>
      {formatRupiah(value)}
    </p>
    {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
  </div>
);

export const Dashboard = ({ cashBalance, monthProfit, currentMonthKey, piutang, utang }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        title="Saldo Kas Saat Ini"
        value={cashBalance}
        icon={Wallet}
        accent="bg-indigo-600"
        testId="card-saldo-kas"
      />
      <Card
        title={`Laba ${monthLabel(currentMonthKey)}`}
        value={monthProfit}
        icon={monthProfit >= 0 ? TrendingUp : TrendingDown}
        accent={monthProfit >= 0 ? "bg-emerald-500" : "bg-red-500"}
        valueClass={monthProfit >= 0 ? "text-emerald-600" : "text-red-600"}
        sub={monthProfit >= 0 ? "Untung bulan berjalan" : "Rugi bulan berjalan"}
        testId="card-laba-bulan"
      />
      <Card
        title="Piutang Belum Lunas"
        value={piutang}
        icon={ArrowDownLeft}
        accent="bg-teal-500"
        valueClass="text-teal-600"
        sub="Uang yang belum diterima"
        testId="card-piutang"
      />
      <Card
        title="Utang Belum Lunas"
        value={utang}
        icon={ArrowUpRight}
        accent="bg-amber-500"
        valueClass="text-amber-600"
        sub="Kewajiban yang belum dibayar"
        testId="card-utang"
      />
    </div>
  );
};
