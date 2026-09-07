import { formatRupiah, formatTanggal } from "./format";

export function buildNotaHTML(sale, profile = {}) {
  const tgl = formatTanggal(sale.tanggal);
  const bn = profile.nama_usaha || "Bukuku Pro";
  const ba = profile.alamat || "";
  const bt = profile.telepon || "";
  const bl = profile.logo || "";
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nota ${sale.nota_no}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Roboto, sans-serif; background:#f1f5f9; margin:0; padding:24px; color:#0f172a; }
  .nota { max-width:420px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.08); }
  .head { background:linear-gradient(135deg,#4f46e5,#3730a3); color:#fff; padding:22px 24px; display:flex; gap:12px; align-items:center; }
  .head .logo { height:52px; width:52px; object-fit:contain; background:#fff; border-radius:10px; padding:5px; flex:none; }
  .head h1 { margin:0; font-size:20px; }
  .head p { margin:2px 0 0; font-size:12px; opacity:.9; }
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
      ${bl ? `<img src="${bl}" class="logo" alt="logo"/>` : ``}
      <div>
        <h1>${bn}</h1>
        <p>${ba || "Percetakan • Branding • Advertising"}</p>
        ${bt ? `<p>${bt}</p>` : ``}
      </div>
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
          <tr><td>${sale.nama}</td><td class="r">${sale.qty}</td><td class="r">${formatRupiah(sale.harga_satuan)}</td><td class="r">${formatRupiah(sale.harga_satuan * sale.qty)}</td></tr>
        </tbody>
      </table>
    </div>
    ${sale.diskon ? `<div class="meta" style="border-top:1px dashed #e2e8f0"><div><span>Subtotal</span><b>${formatRupiah(sale.harga_satuan * sale.qty)}</b></div><div><span>Diskon${sale.harga_satuan * sale.qty > 0 ? ` (${Math.round((sale.diskon / (sale.harga_satuan * sale.qty)) * 1000) / 10}%)` : ``}</span><b>- ${formatRupiah(sale.diskon)}</b></div></div>` : ``}
    <div class="total"><span>Total</span><b>${formatRupiah(sale.total)}</b></div>
    <div class="foot">Terima kasih atas kepercayaan Anda 🙏</div>
  </div>
  <button class="btn" onclick="window.print()">Cetak / Simpan sebagai PDF</button>
</body></html>`;
}

export function buildInvoiceHTML(sale, profile = {}) {
  const tgl = formatTanggal(sale.tanggal);
  const bn = profile.nama_usaha || "Bukuku Pro";
  const ba = profile.alamat || "Alamat belum diatur";
  const bt = profile.telepon || "";
  const bl = profile.logo || "";
  const sisaBayar = sale.is_dp ? sale.total - sale.dp_amount : 0;

  // Status tag
  let statusHTML = '';
  if (sale.is_dp) {
    statusHTML = '<div class="status-badge dp">PARTIAL Pymt (DP)</div>';
  } else {
    statusHTML = '<div class="status-badge lunas">LUNAS</div>';
  }

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { 
    font-family: 'Inter', sans-serif; 
    background: #f1f5f9; 
    padding: 20px; 
    color: #1e293b; 
    margin: 0; 
  }
  .invoice-wrapper {
    max-width: 800px; 
    margin: 0 auto; 
    background: #fff; 
    border-radius: 16px; 
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    overflow: hidden;
    position: relative;
  }
  .accent-bar { display: none; }
  .content { padding: 40px 50px; }
  
  .header { 
    background: linear-gradient(135deg, #4f46e5, #3730a3);
    color: #fff;
    padding: 30px 50px; 
    display: flex; justify-content: space-between; align-items: flex-start;
  }
  .company-profile { display: flex; align-items: center; gap: 16px; }
  .logo { max-width: 70px; max-height: 70px; object-fit: contain; border-radius: 12px; background:#fff; padding:6px; }
  .company-info h1 { margin: 0 0 4px 0; font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
  .company-info p { margin: 0; font-size: 13px; color: #cbd5e1; line-height: 1.5; max-width: 250px; }
  
  .invoice-meta { text-align: right; }
  .invoice-meta h2 { margin: 0 0 5px 0; font-size: 32px; font-weight: 800; color: #fff; letter-spacing: -0.03em; }
  .invoice-meta p { margin: 2px 0; font-size: 13px; color: #cbd5e1; font-weight: 500; text-transform: uppercase; }
  .invoice-meta b { font-weight: 700; color: #fff; }
  .status-badge { 
    display: inline-block; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 10px;
  }
  .status-badge.lunas { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .status-badge.dp { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }

  .bill-to {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 40px;
    width: max-content;
    min-width: 250px;
  }
  .bill-to p { margin: 0 0 5px 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .bill-to h3 { margin: 0; font-size: 16px; color: #0f172a; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  th { background: #f8fafc; padding: 14px 16px; text-align: left; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
  th.r { text-align: right; }
  td { padding: 16px; font-size: 14px; color: #334155; font-weight: 500; border-bottom: 1px solid #f1f5f9; }
  td.r { text-align: right; }
  
  .totals-wrapper { display: flex; justify-content: flex-end; margin-bottom: 40px; }
  .totals { width: 350px; }
  .totals-row { display: flex; justify-content: space-between; padding: 10px 16px; font-size: 14px; color: #64748b; }
  .totals-row span:last-child { font-weight: 600; color: #334155; }
  .totals-row.grand { 
    background: #f8fafc; border-radius: 8px; margin-top: 5px; 
    font-size: 16px; color: #0f172a; font-weight: 800; padding: 16px;
  }
  .totals-row.grand span:last-child { color: #4f46e5; }
  .totals-row.sisa {
    background: #fff1f2; border-radius: 8px; margin-top: 8px;
    font-size: 15px; color: #be123c; font-weight: 800; padding: 12px 16px; border: 1px solid #fecdd3;
  }
  .totals-row.sisa span:last-child { color: #be123c; }

  .footer { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; text-align: center; }
  .sign-box { width: 220px; }
  .sign-box p.role { font-size: 13px; color: #64748b; font-weight: 600; margin: 0 0 70px 0; }
  .sign-box p.name { font-size: 14px; color: #0f172a; font-weight: 800; margin: 0; text-decoration: underline; text-underline-offset: 4px; }
  
  .btn-print { 
    display: block; width: 100%; max-width: 800px; margin: 0 auto 20px; 
    background: #4f46e5; color: white; border: none; padding: 14px; border-radius: 12px; 
    font-size: 15px; font-weight: 600; cursor: pointer; transition: 0.2s;
  }
  .btn-print:hover { background: #4338ca; }
  
  @media print { 
    body { background: #fff; padding: 0; } 
    .btn-print { display: none; } 
    .invoice-wrapper { box-shadow: none; max-width: 100%; } 
    .accent-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .status-badge, .totals-row, th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">Cetak Invoice / Simpan PDF</button>
  
  <div class="invoice-wrapper">
    <div class="header">
      <div class="company-profile">
        ${bl ? `<img src="${bl}" class="logo" />` : ''}
        <div class="company-info">
          <h1>${bn}</h1>
          <p>${ba}</p>
          ${bt ? `<p>${bt}</p>` : ''}
        </div>
      </div>
      
      <div class="invoice-meta">
        <h2>INVOICE</h2>
        <p>NO <b>#${sale.nota_no}</b></p>
        <p>TANGGAL <b>${tgl}</b></p>
        ${statusHTML}
      </div>
    </div>

    <div class="content">
      <div class="bill-to">
        <p>Kepada Yth:</p>
        <h3>${sale.pembeli || "Pelanggan Terhormat"}</h3>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Deskripsi Produk</th>
            <th class="r">Qty</th>
            <th class="r">Harga Satuan</th>
            <th class="r">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>${sale.nama}</b></td>
            <td class="r">${sale.qty}</td>
            <td class="r">${formatRupiah(sale.harga_satuan)}</td>
            <td class="r">${formatRupiah(sale.harga_satuan * sale.qty)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="totals-wrapper">
        <div class="totals">
          ${sale.diskon ? `
            <div class="totals-row"><span>Subtotal</span><span>${formatRupiah(sale.harga_satuan * sale.qty)}</span></div>
            <div class="totals-row"><span>Diskon</span><span style="color:#ef4444">- ${formatRupiah(sale.diskon)}</span></div>
          ` : ''}
          <div class="totals-row grand"><span>Total Tagihan</span><span>${formatRupiah(sale.total)}</span></div>
          
          ${sale.is_dp ? `
            <div class="totals-row"><span>Telah Dibayar (DP)</span><span>${formatRupiah(sale.dp_amount)}</span></div>
            <div class="totals-row sisa"><span>Sisa Terutang</span><span>${formatRupiah(sisaBayar)}</span></div>
          ` : ''}
        </div>
      </div>
      
      <div class="footer">
        <div class="sign-box">
          <p class="role">Penerima / Pembeli</p>
          <p class="name">${sale.pembeli || "Hamba Allah"}</p>
        </div>
        <div class="sign-box">
          <p class="role">Hormat Kami,</p>
          <p class="name">${bn}</p>
        </div>
      </div>
      
    </div>
  </div>
</body>
</html>`;
}

export function buildSuratJalanHTML(sale, profile = {}) {
  const tgl = formatTanggal(sale.tanggal);
  const bn = profile.nama_usaha || "Bukuku Pro";
  const ba = profile.alamat || "Alamat Usaha";
  const bl = profile.logo || "";

  return `<!doctype html>
<html lang="id">
<head><meta charset="utf-8">
<style>
  body { font-family: 'Arial', sans-serif; padding:40px; color:#333; max-width:800px; margin:0 auto; font-size:14px; }
  .header { display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:15px; margin-bottom:30px; }
  .title { text-align:right; }
  .title h1 { margin:0; text-transform:uppercase; font-size:24px;}
  table { width:100%; border-collapse:collapse; margin-bottom:30px; }
  th, td { border:1px solid #ddd; padding:12px; text-align:left; }
  th { background:#f9fafb; font-weight:bold; }
  @media print { .btn-print { display:none; } }
</style>
</head>
<body>
  <button class="btn-print" onclick="window.print()" style="margin-bottom:20px; padding:10px 15px; cursor:pointer;">Cetak Surat Jalan</button>
  <div class="header">
    <div class="logo-box">
      ${bl ? `<img src="${bl}" style="max-height:80px"/>` : `<h2>${bn}</h2>`}
      <p style="margin:5px 0 0; color:#666;">${ba}</p>
    </div>
    <div class="title">
      <h1>SURAT JALAN</h1>
      <p><b>#SJ-${sale.nota_no.replace('NT-', '')}</b><br/>Tanggal: ${tgl}</p>
    </div>
  </div>
  <p>Kepada Yth: <b>${sale.pembeli || "................................."}</b></p>
  <p>Kami kirimkan barang-barang di bawah ini dengan kendaraan .............................</p>
  <table>
    <thead><tr><th width="10%">No</th><th>Nama Barang</th><th width="15%">Qty</th><th width="30%">Keterangan</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>${sale.nama}</td><td>${sale.qty}</td><td></td></tr>
      <tr style="height:30px"><td></td><td></td><td></td><td></td></tr>
      <tr style="height:30px"><td></td><td></td><td></td><td></td></tr>
    </tbody>
  </table>
  <div style="display:flex; justify-content:space-between; text-align:center; margin-top:50px;">
    <div>Penerima<br><br><br><br>( ...................... )</div>
    <div>Pengirim<br><br><br><br>( ...................... )</div>
    <div>Hormat Kami<br><br><br><br>( ${bn} )</div>
  </div>
</body></html>`;
}

export function downloadNota(sale, profile = {}) {
  _print(buildNotaHTML(sale, profile));
}

export function downloadInvoice(sale, profile = {}) {
  _print(buildInvoiceHTML(sale, profile));
}

export function downloadSuratJalan(sale, profile = {}) {
  _print(buildSuratJalanHTML(sale, profile));
}

function _print(htmlString) {
  const win = window.open("", "_blank");
  win.document.open();
  win.document.write(htmlString);
  win.document.close();

  // Script to trigger print automatically once images load
  const script = win.document.createElement("script");
  script.innerHTML = `
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500); 
    };
  `;
  win.document.body.appendChild(script);
}
