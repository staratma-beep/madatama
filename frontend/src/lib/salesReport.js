import { formatRupiah, formatTanggal, monthLabel } from "./format";

export function buildReportHTML(sales, profile = {}, mkey) {
  const items = sales
    .filter((s) => (s.tanggal || "").slice(0, 7) === mkey)
    .sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
  const omzet = items.reduce((a, s) => a + s.total, 0);
  const diskon = items.reduce((a, s) => a + (s.diskon || 0), 0);
  const laba = items.reduce((a, s) => a + (s.laba || 0), 0);
  const qtyTotal = items.reduce((a, s) => a + (s.qty || 0), 0);
  const hppTotal = omzet - laba;

  const cat = {};
  items.forEach((s) => { cat[s.kategori] = (cat[s.kategori] || 0) + s.total; });

  const bn = profile.nama_usaha || "Bukuku Pro";
  const ba = profile.alamat || "";
  const bt = profile.telepon || "";
  const bl = profile.logo || "";

  const rows = items.map((s, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td class="num">${formatTanggal(s.tanggal)}</td>
      <td class="num">#${s.nota_no}</td>
      <td style="color:#0f172a; font-weight:700;">${s.nama}</td>
      <td class="r">${s.qty}</td>
      <td class="r" style="color:#ef4444">${s.diskon ? "- " + formatRupiah(s.diskon) : "-"}</td>
      <td class="r">${formatRupiah(s.total)}</td>
      <td class="r" style="color: #64748b;">${formatRupiah(s.total - (s.laba || 0))}</td>
      <td class="r" style="color: #047857;">${formatRupiah(s.laba || 0)}</td>
      <td style="font-size:13px">${s.pembeli || "-"}</td>
    </tr>`).join("");

  const catRows = Object.entries(cat).map(([k, v]) =>
    `<div class="chip"><span>${k}</span><b>${formatRupiah(v)}</b></div>`).join("");

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rekap Penjualan - ${monthLabel(mkey)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px; color: #0f172a; display: flex; flex-direction: column; align-items: center; }
  
  .doc-container { 
    width: 100%; max-width: 1100px; background: #fff; border-radius: 12px; 
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); padding: 50px 60px; 
    border: 1px solid #f1f5f9; display: flex; flex-direction: column;
  }
  
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 30px; margin-bottom: 30px; }
  .head-left { display: flex; align-items: center; gap: 20px; }
  .logo { max-height: 80px; max-width: 120px; object-fit: contain; }
  .head-left h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; }
  .head-left p { margin: 0; font-size: 13px; color: #64748b; font-weight: 500; }
  
  .head-right { text-align: right; }
  .head-right h2 { margin: 0 0 8px; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #cbd5e1; text-transform: uppercase; }
  .head-right p { margin: 0; font-size: 12px; font-weight: 800; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; }
  
  .summary { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
  .box { flex: 1; min-width: 180px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px 20px; background: #f8fafc; }
  .box span { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 8px; }
  .box b { font-size: 24px; font-family: 'JetBrains Mono', monospace; color: #0f172a; font-weight: 800; }
  
  .box.green { background: #f0fdf4; border-color: #bbf7d0; }
  .box.green span { color: #166534; }
  .box.green b { color: #16a34a; }
  
  .box.red { background: #fff1f2; border-color: #fecdd3; }
  .box.red span { color: #9f1239; }
  .box.red b { color: #e11d48; }

  .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 40px; }
  .chip { background: #f1f5f9; border-radius: 8px; padding: 10px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
  .chip b { margin-left: 10px; font-family: 'JetBrains Mono', monospace; color: #0f172a; font-size: 14px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 13px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; padding-bottom: 15px; border-bottom: 2px dashed #cbd5e1; }
  th.r { text-align: right; }
  td { padding: 16px 5px 16px 0; border-bottom: 1px dashed #e2e8f0; font-weight: 600; color: #334155; }
  td.r { text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #0f172a; padding-right: 0; padding-left: 5px; }
  td.num { font-family: 'JetBrains Mono', monospace; color: #64748b; font-size: 13px; }
  
  tfoot td { padding: 20px 0; font-weight: 800; font-size: 14px; border-top: 2px dashed #94a3b8; border-bottom: 2px dashed #94a3b8; }
  tfoot td.r { font-size: 16px; color: #0f172a; font-family: 'JetBrains Mono', monospace; }

  .foot { text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  
  .btn-print { 
    display: block; width: 100%; max-width: 1100px; margin: 30px auto 0; padding: 16px; border: 0; border-radius: 12px; 
    background: #0f172a; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
    box-shadow: 0 10px 20px -10px rgba(15,23,42,0.4); text-transform: uppercase; letter-spacing: 0.05em; transition: 0.2s;
  }
  .btn-print:hover { background: #1e293b; transform: translateY(-2px); }
  
  @media print { 
    body { background: #fff; padding: 0; display: block; } 
    .doc-container { box-shadow: none; border: none; padding: 0; width: 100%; max-width: 100%; margin: 0; } 
    .btn-print { display: none; } 
    .box, .chip { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: landscape; }
  }
</style>
</head>
<body>
  <div>
    <div class="doc-container">
      
      <div class="head">
        <div class="head-left">
          ${bl ? `<img src="${bl}" class="logo" alt="logo"/>` : ``}
          <div>
            <h1>${bn}</h1>
            <p>${ba}</p>
            ${bt ? `<p>WhatsApp: ${bt}</p>` : ``}
          </div>
        </div>
        <div class="head-right">
            <h2>REKAPITULASI</h2>
            <p>Periode: <b>${monthLabel(mkey)}</b></p>
        </div>
      </div>
      
      <div class="summary">
        <div class="box"><span>Total Omzet Penjualan</span><b>${formatRupiah(omzet)}</b></div>
        <div class="box" style="background:#f8fafc;"><span>Total Diskon Keluar</span><b>${formatRupiah(diskon)}</b></div>
        <div class="box red"><span>Total HPP (Nilai Modal)</span><b>${formatRupiah(hppTotal)}</b></div>
        <div class="box green"><span>Total Laba Kotor</span><b>${formatRupiah(laba)}</b></div>
      </div>
      
      ${catRows ? `<div class="chips">${catRows}</div>` : ``}
      
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Tanggal</th>
            <th>No Nota</th>
            <th>Nama Produk / SKU</th>
            <th class="r">Qty</th>
            <th class="r">Diskon</th>
            <th class="r">Total Akhir</th>
            <th class="r">HPP (Modal)</th>
            <th class="r">Laba Kotor</th>
            <th style="padding-left:15px">Pembeli</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:40px;font-weight:600;">Belum ada penjualan di periode bulan ini.</td></tr>`}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="text-align:right; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; padding-right:15px;">Akumulasi Periode Ini</td>
            <td class="r" style="color:#0f172a">${qtyTotal}</td>
            <td class="r" style="color:#ef4444">${formatRupiah(diskon)}</td>
            <td class="r">${formatRupiah(omzet)}</td>
            <td class="r" style="color:#e11d48">${formatRupiah(hppTotal)}</td>
            <td class="r" style="color:#047857">${formatRupiah(laba)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      
      <div class="foot">
        Dokumen dicetak dari sistem ${bn} — Periode Pelaporan: ${monthLabel(mkey)}
      </div>
      
    </div>
    
    <button class="btn-print" onclick="window.print()">Cetak / Simpan Rekap sebagai PDF</button>
  </div>
</body>
</html>`;
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
