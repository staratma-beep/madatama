import { formatRupiah, formatTanggal } from "./format";

export function buildNotaHTML(sale) {
  const tgl = formatTanggal(sale.tanggal);
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nota ${sale.nota_no}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Roboto, sans-serif; background:#f1f5f9; margin:0; padding:24px; color:#0f172a; }
  .nota { max-width:420px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.08); }
  .head { background:linear-gradient(135deg,#4f46e5,#3730a3); color:#fff; padding:22px 24px; }
  .head h1 { margin:0; font-size:20px; }
  .head p { margin:2px 0 0; font-size:12px; opacity:.85; }
  .meta { padding:16px 24px; font-size:13px; color:#475569; border-bottom:1px dashed #e2e8f0; }
  .meta div { display:flex; justify-content:space-between; margin:3px 0; }
  .meta b { color:#0f172a; }
  table { width:100%; border-collapse:collapse; }
  .items { padding:8px 24px; }
  .items th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; padding:8px 0; border-bottom:1px solid #e2e8f0; }
  .items td { padding:12px 0; font-size:14px; border-bottom:1px solid #f1f5f9; }
  .r { text-align:right; }
  .total { padding:16px 24px; display:flex; justify-content:space-between; align-items:center; background:#ecfdf5; }
  .total span { font-size:13px; color:#047857; font-weight:600; text-transform:uppercase; }
  .total b { font-size:24px; color:#047857; font-family:'JetBrains Mono',monospace; }
  .foot { padding:16px 24px 24px; text-align:center; font-size:12px; color:#94a3b8; }
  .btn { display:block; width:100%; max-width:420px; margin:18px auto 0; padding:12px; border:0; border-radius:12px; background:#4f46e5; color:#fff; font-size:15px; font-weight:600; cursor:pointer; }
  @media print { body { background:#fff; padding:0; } .nota { box-shadow:none; } .btn { display:none; } }
</style></head>
<body>
  <div class="nota">
    <div class="head">
      <h1>Bukuku Pro</h1>
      <p>Percetakan • Branding • Advertising</p>
    </div>
    <div class="meta">
      <div><span>No. Nota</span><b>${sale.nota_no}</b></div>
      <div><span>Tanggal</span><b>${tgl}</b></div>
      <div><span>Pembeli</span><b>${sale.pembeli || "-"}</b></div>
      <div><span>Kategori</span><b>${sale.kategori}</b></div>
    </div>
    <div class="items">
      <table>
        <thead><tr><th>Produk</th><th class="r">Qty</th><th class="r">Harga</th><th class="r">Subtotal</th></tr></thead>
        <tbody>
          <tr><td>${sale.nama}</td><td class="r">${sale.qty}</td><td class="r">${formatRupiah(sale.harga_satuan)}</td><td class="r">${formatRupiah(sale.total)}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="total"><span>Total</span><b>${formatRupiah(sale.total)}</b></div>
    <div class="foot">Terima kasih atas kepercayaan Anda 🙏</div>
  </div>
  <button class="btn" onclick="window.print()">Cetak / Simpan sebagai PDF</button>
</body></html>`;
}

export function downloadNota(sale) {
  const blob = new Blob([buildNotaHTML(sale)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Nota-${sale.nota_no}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
