import { formatTanggal } from "./format";

const HEADER = ["No Nota", "Tanggal", "Produk", "Kategori", "Qty", "Harga Satuan", "Diskon", "Total", "Laba", "Pembeli"];

export function exportSalesCSV(sales) {
  const rows = [...sales]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((s) => [
      s.nota_no, formatTanggal(s.tanggal), s.nama, s.kategori, s.qty,
      s.harga_satuan, s.diskon || 0, s.total, s.laba, s.pembeli || "",
    ]);
  const csv = [HEADER, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rekap-penjualan-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
