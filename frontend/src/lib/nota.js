import { formatRupiah, formatTanggal } from "./format";

export function buildNotaHTML(sale, profile = {}) {
  const tgl = formatTanggal(sale.tanggal);
  const bn = profile.nama_usaha || "Bukuku Pro";
  const ba = profile.alamat || "Percetakan & Branding";
  const bt = profile.telepon || "";
  const bl = profile.logo || "";

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nota Transaksi - ${sale.nota_no}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 30px 20px; color: #0f172a; display: flex; justify-content: center; }
  
  .nota-container { 
    width: 100%; max-width: 420px; background: #fff; border-radius: 12px; 
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); padding: 30px; 
    border: 1px solid #f1f5f9; display: flex; flex-direction: column;
  }
  
  .head { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 24px; margin-bottom: 24px; }
  .head .logo { height: 60px; max-width: 150px; object-fit: contain; margin-bottom: 12px; }
  .head h1 { margin: 0 0 4px; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; }
  .head p { margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.5; }
  
  .meta-grid { display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; align-items: baseline; font-size: 13px; margin-bottom: 24px; }
  .meta-grid .lbl { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; white-space: nowrap; }
  .meta-grid .val { color: #0f172a; font-weight: 700; text-align: right; }
  .meta-grid .val.monospace { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 800; }
  
  .divider { border-bottom: 2px dashed #e2e8f0; margin: 0 -30px 20px -30px; }
  
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
  th.r { text-align: right; }
  td { padding: 12px 0; font-size: 14px; border-bottom: 1px dashed #f1f5f9; font-weight: 600; }
  td.r { text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 13px;}
  td.prod-col { color: #1e293b; line-height: 1.4; padding-right: 15px; }
  
  .summary { padding-top: 5px; margin-bottom: 30px; }
  .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13px; color: #64748b; }
  .summary-row span.val { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #334155; }
  .summary-row.diskon span { color: #ef4444; }
  
  .grand-total { 
    display: flex; justify-content: space-between; align-items: center; 
    background: #f8fafc; margin: 15px -30px 0 -30px; padding: 20px 30px; 
    border-top: 2px dashed #cbd5e1; border-bottom: 2px dashed #cbd5e1;
  }
  .grand-total span.lbl { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #0f172a; }
  .grand-total span.val { font-size: 20px; font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
  
  .foot { text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8; line-height: 1.6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  
  .btn-print { 
    display: block; width: 100%; margin: 30px 0 0 0; padding: 16px; border: 0; border-radius: 12px; 
    background: #0f172a; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
    box-shadow: 0 10px 20px -10px rgba(15,23,42,0.4); text-transform: uppercase; letter-spacing: 0.05em; transition: 0.2s;
  }
  .btn-print:hover { background: #1e293b; transform: translateY(-2px); }
  
  @media print { 
    body { background: #fff; padding: 0; display: block; } 
    .nota-container { box-shadow: none; border: none; padding: 10px; width: 100%; max-width: 100%; margin: 0; } 
    .btn-print { display: none; } 
    .grand-total { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .divider, .grand-total { margin-left: 0; margin-right: 0; padding-left: 0; padding-right: 0; }
  }
</style>
</head>
<body>
  <div>
    <div class="nota-container">
      <div class="head">
        ${bl ? `<img src="${bl}" class="logo" alt="logo"/>` : ``}
        <h1>${bn}</h1>
        <p>${ba}</p>
        ${bt ? `<p>WhatsApp: ${bt}</p>` : ``}
      </div>
      
      <div class="meta-grid">
        <span class="lbl">No. Transaksi</span> <span class="val monospace">#${sale.nota_no}</span>
        <span class="lbl">Tanggal</span> <span class="val">${tgl}</span>
        <span class="lbl">Pelanggan</span> <span class="val">${sale.pembeli || "Hamba Allah"}</span>
        <span class="lbl">Kategori</span> <span class="val">${sale.kategori}</span>
      </div>
      
      <div class="divider"></div>
      
      <table>
        <thead>
          <tr>
            <th>Deskripsi</th>
            <th class="r">Qty</th>
            <th class="r">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="prod-col">${sale.nama}</td>
            <td class="r">${sale.qty}</td>
            <td class="r">${formatRupiah(sale.harga_satuan * sale.qty)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="summary">
        ${sale.diskon ? `
          <div class="summary-row">
            <span class="lbl">Subtotal</span>
            <span class="val">${formatRupiah(sale.harga_satuan * sale.qty)}</span>
          </div>
          <div class="summary-row diskon">
            <span class="lbl">Diskon Terspesial</span>
            <span class="val">- ${formatRupiah(sale.diskon)}</span>
          </div>
        ` : ``}
      </div>
      
      <div class="grand-total">
        <span class="lbl">Total Bayar</span>
        <span class="val">${formatRupiah(sale.total)}</span>
      </div>
      
      <div class="foot">
        <p>Terima kasih atas<br/>kepercayaan Anda 🙏</p>
      </div>
    </div>
    
    <button class="btn-print" onclick="window.print()">Cetak / Simpan Nota</button>
  </div>
</body>
</html>`;
}

export function buildInvoiceHTML(sale, profile = {}) {
  const tgl = formatTanggal(sale.tanggal);
  const bn = profile.nama_usaha || "Bukuku Pro";
  const ba = profile.alamat || "Alamat belum diatur";
  const bt = profile.telepon || "";
  const bl = profile.logo || "";
  const sisaBayar = sale.is_dp ? sale.total - sale.dp_amount : 0;

  let statusHTML = '';
  if (sale.is_dp) {
    statusHTML = '<div class="status-badge dp">PARTIAL (DP)</div>';
  } else {
    statusHTML = '<div class="status-badge lunas">L U N A S</div>';
  }

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice - ${sale.nota_no}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px; color: #0f172a; display: flex; flex-direction: column; align-items: center; }
  
  .invoice-container { 
    width: 100%; max-width: 800px; background: #fff; border-radius: 12px; 
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); padding: 50px 60px; 
    border: 1px solid #f1f5f9; display: flex; flex-direction: column;
  }
  
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 30px; margin-bottom: 40px; }
  .head-left { display: flex; align-items: center; gap: 20px; }
  .logo { max-height: 80px; max-width: 120px; object-fit: contain; }
  .head-left h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; }
  .head-left p { margin: 0; font-size: 13px; color: #64748b; font-weight: 500; }
  
  .head-right { text-align: right; }
  .head-right h2 { margin: 0 0 12px; font-size: 34px; font-weight: 900; letter-spacing: -0.02em; color: #cbd5e1; text-transform: uppercase; }
  
  .status-badge { display: inline-block; padding: 6px 16px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; border: 2px solid; }
  .status-badge.lunas { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }
  .status-badge.dp { color: #d97706; border-color: #fef08a; background: #fefce8; }

  .info-sections { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
  .bill-to h3 { font-size: 11px; color: #64748b; text-transform: uppercase; margin: 0 0 6px; letter-spacing: 0.05em; font-weight: 700; }
  .bill-to p { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
  
  .meta-grid { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; align-items: baseline; font-size: 13px; }
  .meta-grid .lbl { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; white-space: nowrap; }
  .meta-grid .val { color: #0f172a; font-weight: 700; text-align: right; }
  .meta-grid .val.monospace { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 800; }
  
  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; padding-bottom: 12px; border-bottom: 2px dashed #cbd5e1; }
  th.r { text-align: right; }
  td { padding: 16px 0; font-size: 14px; border-bottom: 1px dashed #e2e8f0; font-weight: 600; }
  td.r { text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 14px;}
  td.prod-col { color: #1e293b; line-height: 1.4; padding-right: 15px; font-size: 15px; }

  .totals-wrapper { display: flex; justify-content: flex-end; margin-bottom: 60px; }
  .totals { width: 380px; }
  .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; color: #64748b; font-weight: 600; }
  .summary-row span.val { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #334155; }
  
  .grand-total { 
    display: flex; justify-content: space-between; align-items: center; 
    background: #f8fafc; margin: 15px -20px 0 -20px; padding: 24px 20px; 
    border-top: 2px dashed #cbd5e1; border-bottom: 2px dashed #cbd5e1;
  }
  .grand-total span.lbl { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #0f172a; }
  .grand-total span.val { font-size: 22px; font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
  
  .sisa-row { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; font-size: 15px; color: #be123c; font-weight: 800; }
  .sisa-row span.val { font-family: 'JetBrains Mono', monospace; font-size: 18px; }

  .footer { display: flex; justify-content: space-between; border-top: 2px dashed #e2e8f0; padding-top: 50px; text-align: center; }
  .sign-box { width: 240px; }
  .sign-box p.role { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 80px 0; }
  .sign-box p.name { font-size: 15px; color: #0f172a; font-weight: 800; margin: 0; text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 2px; }
  
  .btn-print { 
    display: block; width: 100%; max-width: 800px; margin: 30px auto 0; padding: 16px; border: 0; border-radius: 12px; 
    background: #0f172a; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
    box-shadow: 0 10px 20px -10px rgba(15,23,42,0.4); text-transform: uppercase; letter-spacing: 0.05em; transition: 0.2s;
  }
  .btn-print:hover { background: #1e293b; transform: translateY(-2px); }
  
  @media print { 
    body { background: #fff; padding: 0; display: block; } 
    .invoice-container { box-shadow: none; border: none; padding: 0; width: 100%; max-width: 100%; margin: 0; } 
    .btn-print { display: none; } 
    .grand-total, .status-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .footer { margin-top: 40px; }
  }
</style>
</head>
<body>
  <div>
    <div class="invoice-container">
      
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
            <h2>INVOICE</h2>
            ${statusHTML}
        </div>
      </div>
      
      <div class="info-sections">
        <div class="bill-to">
          <h3>Menagih Kepada Yth:</h3>
          <p>${sale.pembeli || "Pelanggan Terhormat"}</p>
        </div>
        
        <div class="meta-grid">
          <span class="lbl">No. Tagihan</span> <span class="val monospace">#${sale.nota_no}</span>
          <span class="lbl">Tanggal</span> <span class="val">${tgl}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Deskripsi Item</th>
            <th class="r">Qty</th>
            <th class="r">Harga Satuan</th>
            <th class="r">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="prod-col">${sale.nama}</td>
            <td class="r">${sale.qty}</td>
            <td class="r">${formatRupiah(sale.harga_satuan)}</td>
            <td class="r">${formatRupiah(sale.harga_satuan * sale.qty)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="totals-wrapper">
        <div class="totals">
          ${sale.diskon ? `
            <div class="summary-row">
              <span>Subtotal Nominal</span>
              <span class="val">${formatRupiah(sale.harga_satuan * sale.qty)}</span>
            </div>
            <div class="summary-row" style="color:#ef4444;">
              <span>Diskon Tambahan</span>
              <span class="val">- ${formatRupiah(sale.diskon)}</span>
            </div>
          ` : ''}
          
          <div class="grand-total">
            <span class="lbl">Total Tagihan</span>
            <span class="val">${formatRupiah(sale.total)}</span>
          </div>
          
          ${sale.is_dp ? `
            <div class="summary-row" style="margin-top: 15px;">
              <span>Telah Dibayar (DP)</span>
              <span class="val">${formatRupiah(sale.dp_amount)}</span>
            </div>
            <div class="sisa-row">
              <span>Sisa yang Terutang</span>
              <span class="val">${formatRupiah(sisaBayar)}</span>
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="footer">
        <div class="sign-box">
          <p class="role">Penerima / Klien</p>
          <p class="name">${sale.pembeli || "..........................."}</p>
        </div>
        <div class="sign-box">
          <p class="role">Hormat Kami,</p>
          <p class="name">${bn}</p>
        </div>
      </div>

    </div>
    
    <button class="btn-print" onclick="window.print()">Cetak Dokumen Profesional (PDF)</button>
  </div>
</body>
</html>`;
}

export function buildSuratJalanHTML(sale, profile = {}) {
  const tgl = formatTanggal(sale.tanggal);
  const bn = profile.nama_usaha || "Bukuku Pro";
  const ba = profile.alamat || "Alamat Usaha";
  const bt = profile.telepon || "";
  const bl = profile.logo || "";

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Surat Jalan - ${sale.nota_no}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px; color: #0f172a; display: flex; flex-direction: column; align-items: center; }
  
  .sj-container { 
    width: 100%; max-width: 800px; background: #fff; border-radius: 12px; 
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); padding: 50px 60px; 
    border: 1px solid #f1f5f9; display: flex; flex-direction: column;
  }
  
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 30px; margin-bottom: 40px; }
  .head-left { display: flex; align-items: center; gap: 20px; }
  .logo { max-height: 80px; max-width: 120px; object-fit: contain; }
  .head-left h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; }
  .head-left p { margin: 0; font-size: 13px; color: #64748b; font-weight: 500; }
  
  .head-right { text-align: right; }
  .head-right h2 { margin: 0 0 8px; font-size: 34px; font-weight: 900; letter-spacing: -0.02em; color: #cbd5e1; text-transform: uppercase; }
  .head-right p { margin: 0; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; }
  
  .info-sections { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
  .deliver-to h3 { font-size: 11px; color: #64748b; text-transform: uppercase; margin: 0 0 6px; letter-spacing: 0.05em; font-weight: 700; }
  .deliver-to p.pembeli { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; }
  .deliver-to p.desc { font-size: 13px; color: #334155; font-weight: 600; margin: 0; }
  
  .meta-grid { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; align-items: baseline; font-size: 13px; }
  .meta-grid .lbl { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; white-space: nowrap; }
  .meta-grid .val { color: #0f172a; font-weight: 700; text-align: right; }
  .meta-grid .val.monospace { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 800; }
  
  table { width: 100%; border-collapse: collapse; margin-bottom: 60px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; padding-bottom: 15px; border-bottom: 2px dashed #cbd5e1; }
  th.c { text-align: center; }
  td { padding: 18px 0; font-size: 14px; border-bottom: 1px dashed #e2e8f0; font-weight: 600; }
  td.c { text-align: center; }
  td.qty-col { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 800; color: #0f172a; text-align: center; }
  td.prod-col { color: #1e293b; line-height: 1.4; padding-right: 15px; font-size: 15px; }

  .footer { display: flex; justify-content: space-between; text-align: center; margin-top: 20px; }
  .sign-box { width: 33%; }
  .sign-box p.role { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 100px 0; }
  .sign-box p.name { font-size: 14px; color: #0f172a; font-weight: 800; margin: 0; text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 2px; }
  
  .btn-print { 
    display: block; width: 100%; max-width: 800px; margin: 30px auto 0; padding: 16px; border: 0; border-radius: 12px; 
    background: #0f172a; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
    box-shadow: 0 10px 20px -10px rgba(15,23,42,0.4); text-transform: uppercase; letter-spacing: 0.05em; transition: 0.2s;
  }
  .btn-print:hover { background: #1e293b; transform: translateY(-2px); }
  
  @media print { 
    body { background: #fff; padding: 0; display: block; } 
    .sj-container { box-shadow: none; border: none; padding: 0; width: 100%; max-width: 100%; margin: 0; } 
    .btn-print { display: none; } 
  }
</style>
</head>
<body>
  <div>
    <div class="sj-container">
      
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
            <h2>SURAT JALAN</h2>
            <p>Delivery Order</p>
        </div>
      </div>
      
      <div class="info-sections">
        <div class="deliver-to">
          <h3>Kirim / Serahkan Kepada Yth:</h3>
          <p class="pembeli">${sale.pembeli || "................................."}</p>
          <p class="desc">Kami kirimkan barang di bawah ini dengan pengiriman ....................</p>
        </div>
        
        <div class="meta-grid">
          <span class="lbl">No. Surat Jalan</span> <span class="val monospace">#SJ-${sale.nota_no.replace('NT-', '')}</span>
          <span class="lbl">Tanggal</span> <span class="val">${tgl}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th width="8%">No.</th>
            <th>Nama Barang / Produk</th>
            <th width="15%" class="c">Qty</th>
            <th width="35%">Keterangan Checklist</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td class="prod-col">${sale.nama}</td>
            <td class="qty-col">${sale.qty}</td>
            <td></td>
          </tr>
          <!-- Spacer baris kosong untuk mengisi sisa tabel -->
          <tr style="height:50px">
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr style="height:50px">
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
      
      <div class="footer">
        <div class="sign-box">
          <p class="role">Penerima Barang</p>
          <p class="name">( .......................... )</p>
        </div>
        <div class="sign-box">
          <p class="role">Bagian Pengiriman</p>
          <p class="name">( .......................... )</p>
        </div>
        <div class="sign-box">
          <p class="role">Hormat Kami,</p>
          <p class="name">${bn}</p>
        </div>
      </div>

    </div>
    
    <button class="btn-print" onclick="window.print()">Cetak Surat Jalan (PDF)</button>
  </div>
</body>
</html>`;
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
