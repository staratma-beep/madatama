import { formatRupiah, formatTanggal, monthLabel } from "./format";

export function buildReportHTML(sales, profile = {}, mkey) {
  const items = sales
    .filter((s) => (s.tanggal || "").slice(0, 7) === mkey)
    .sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
  const omzet = items.reduce((a, s) => a + s.total, 0);
  const diskon = items.reduce((a, s) => a + (s.diskon || 0), 0);
  const laba = items.reduce((a, s) => a + s.laba, 0);
  const qtyTotal = items.reduce((a, s) => a + s.qty, 0);

  const cat = {};
  items.forEach((s) => { cat[s.kategori] = (cat[s.kategori] || 0) + s.total; });

  const bn = profile.nama_usaha || "Bukuku Pro";
  const ba = profile.alamat || "";
  const bt = profile.telepon || "";
  const bl = profile.logo || "";

  const rows = items.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${formatTanggal(s.tanggal)}</td>
      <td>${s.nota_no}</td>
      <td>${s.nama}</td>
      <td class="r">${s.qty}</td>
      <td class="r">${s.diskon ? formatRupiah(s.diskon) : "-"}</td>
      <td class="r">${formatRupiah(s.total)}</td>
      <td class="r">${formatRupiah(s.laba)}</td>
      <td>${s.pembeli || "-"}</td>
    </tr>`).join("");

  const catRows = Object.entries(cat).map(([k, v]) =>
    `<div class="chip"><span>${k}</span><b>${formatRupiah(v)}</b></div>`).join("");

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rekap Penjualan ${monthLabel(mkey)}</title>
<style>
  *{box-sizing:border-box;}
  body{font-family:'Segoe UI',Roboto,sans-serif;background:#f1f5f9;color:#0f172a;margin:0;padding:24px;}
  .doc{max-width:820px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.08);}
  .head{background:linear-gradient(135deg,#4f46e5,#3730a3);color:#fff;padding:20px 24px;display:flex;gap:12px;align-items:center;}
  .head .logo{height:52px;width:52px;object-fit:contain;background:#fff;border-radius:10px;padding:5px;flex:none;}
  .head h1{margin:0;font-size:19px;}
  .head p{margin:2px 0 0;font-size:12px;opacity:.9;}
  .title{padding:16px 24px;border-bottom:1px solid #e2e8f0;}
  .title h2{margin:0;font-size:16px;color:#4f46e5;}
  .title p{margin:2px 0 0;font-size:12px;color:#64748b;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  thead th{background:#f8fafc;text-align:left;padding:8px 10px;color:#64748b;text-transform:uppercase;font-size:10px;letter-spacing:.04em;border-bottom:1px solid #e2e8f0;}
  tbody td{padding:8px 10px;border-bottom:1px solid #f1f5f9;}
  .r{text-align:right;}
  tfoot td{padding:10px;font-weight:700;border-top:2px solid #e2e8f0;background:#f8fafc;}
  .summary{display:flex;flex-wrap:wrap;gap:10px;padding:16px 24px;}
  .box{flex:1;min-width:150px;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;}
  .box span{display:block;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;}
  .box b{font-size:18px;font-family:'JetBrains Mono',monospace;}
  .green b{color:#047857;}
  .chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 24px 16px;}
  .chip{background:#eef2ff;border-radius:10px;padding:6px 12px;font-size:12px;color:#3730a3;}
  .chip b{margin-left:6px;}
  .foot{padding:12px 24px 20px;text-align:center;font-size:11px;color:#94a3b8;}
  .btn{display:block;width:100%;max-width:820px;margin:18px auto 0;padding:12px;border:0;border-radius:12px;background:#4f46e5;color:#fff;font-size:15px;font-weight:600;cursor:pointer;}
  @media print{body{background:#fff;padding:0;}.doc{box-shadow:none;}.btn{display:none;}}
</style></head><body>
  <div class="doc">
    <div class="head">
      ${bl ? `<img src="${bl}" class="logo" alt="logo"/>` : ``}
      <div><h1>${bn}</h1><p>${ba || "Percetakan • Branding • Advertising"}</p>${bt ? `<p>${bt}</p>` : ``}</div>
    </div>
    <div class="title"><h2>Rekap Penjualan — ${monthLabel(mkey)}</h2><p>${items.length} transaksi • ${qtyTotal} pcs terjual</p></div>
    <div class="summary">
      <div class="box"><span>Total Omzet</span><b>${formatRupiah(omzet)}</b></div>
      <div class="box"><span>Total Diskon</span><b>${formatRupiah(diskon)}</b></div>
      <div class="box green"><span>Laba Kotor</span><b>${formatRupiah(laba)}</b></div>
    </div>
    ${catRows ? `<div class="chips">${catRows}</div>` : ``}
    <table>
      <thead><tr><th>#</th><th>Tanggal</th><th>No Nota</th><th>Produk</th><th class="r">Qty</th><th class="r">Diskon</th><th class="r">Total</th><th class="r">Laba</th><th>Pembeli</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:24px">Tidak ada penjualan bulan ini</td></tr>`}</tbody>
      <tfoot><tr><td colspan="6" class="r">TOTAL</td><td class="r">${formatRupiah(omzet)}</td><td class="r">${formatRupiah(laba)}</td><td></td></tr></tfoot>
    </table>
    <div class="foot">Dicetak dari ${bn} • ${monthLabel(mkey)}</div>
  </div>
  <button class="btn" onclick="window.print()">Cetak / Simpan sebagai PDF</button>
</body></html>`;
}

export function downloadReport(sales, profile, mkey) {
  const blob = new Blob([buildReportHTML(sales, profile, mkey)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Rekap-Penjualan-${mkey}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
