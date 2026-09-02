# PRD — Bukuku Pro (Pembukuan Percetakan & Branding)

## Problem Statement
Aplikasi web pembukuan sederhana (single page, responsif HP & desktop) untuk usaha percetakan/branding/advertising, menggantikan pencatatan manual Excel. Data tersimpan di server (bisa diakses dari HP & PC).

## Architecture
- Frontend: React (single page, 4 tab + dashboard), Tailwind + shadcn/ui, recharts, sonner.
- Backend: FastAPI + MongoDB. Semua route diprefix `/api`.
- Tanpa autentikasi/login (sesuai permintaan, tapi data di server, bukan localStorage).

## User Persona
Pemilik/pengelola usaha percetakan kecil yang sering input transaksi lewat HP.

## Core Requirements (static)
- Biaya tetap bulanan: KUR Rp1.600.000 + Internet Rp400.000 + Listrik Rp400.000 + Operasional Rp750.000 (Total Rp3.150.000).
- Bagi hasil 50% Pemilik : 50% Pengelola dari laba bersih; rugi = tidak dibagi.
- Format angka Rp1.500.000 (dot ribuan), Bahasa Indonesia, hijau=pemasukan/laba, merah=pengeluaran/rugi.

## Implemented (2026-06)
- Dashboard ringkas: Saldo Kas, Laba bulan berjalan, Total Piutang & Utang belum lunas.
- Tab Buku Kas Harian: form tambah (tanggal, keterangan, kategori, jenis dinamis, nominal, keterangan tambahan), tabel riwayat + saldo berjalan, edit/hapus, filter tanggal/kategori/jenis, badge warna.
- Tab Rekap Bulanan: agregasi per bulan (pemasukan, bahan/mitra, KUR, internet+listrik+ops, total pengeluaran, laba/rugi, margin%), pilih rentang bulan, bar chart tren laba/rugi.
- Tab Laba Rugi & Bagi Hasil: dropdown bulan, ringkasan + breakdown, laba bersih besar hijau/merah, bagi hasil 50:50 (Rp0 saat rugi), tombol Tandai Sudah Dibagi + histori.
- Tab Piutang & Utang: form, list terpisah warna, total belum lunas, tombol Lunas satu klik (otomatis buat transaksi kas), unsettle & hapus (cascade transaksi otomatis).
- Saldo Kas Awal (settings), Export/Import CSV, Backup/Restore JSON.
- FAB tambah transaksi di mobile.
- Tested end-to-end: backend 13/13, frontend all critical flows pass.

## Backlog (P1/P2)
- P2: PUT /api/profit-shares/{bulan} untuk update laba jika transaksi bulan itu diedit setelah ditandai dibagi.
- P2: Validasi Pydantic (enum kategori, nominal>=0) di backend.
- P2: Migrasi on_event('shutdown') ke lifespan handler.

## Next Tasks
- Tunggu feedback user.

## Update Log
- 2026-06: Biaya Tetap Bulanan kini CRUD (collection fixed_costs, endpoint /api/fixed-costs) + tombol "Catat ke Kas" untuk posting biaya tetap jadi transaksi Pengeluaran sekali klik.
- 2026-06: Form Tambah Transaksi auto-fill Nominal & Keterangan saat memilih Jenis yang cocok dengan biaya tetap (KUR/Internet/Listrik/Operasional).
- 2026-06: Tab baru "Kalkulator HPP Produk" (collection products, endpoint /api/products). 3 kategori (Branding/Printing/Advertising) dengan produk seed default. Tabel editable: nama, jenis (Sendiri/Mitra/Campuran), bahan baku, jasa mitra, tambahan, Total HPP (auto), harga jual, laba (auto), margin% (auto), rata-rata margin per kategori. Tambah/hapus baris. Tombol "Jual" mencatat produk ke Buku Kas sebagai Pemasukan (jenis sesuai kategori) tanpa mengetik. Semua tersimpan di server; termasuk backup/restore.
- 2026-06: Penjualan produk kini pakai collection `sales` (endpoint /api/sales). Fitur: (1) Jual Banyak — dialog qty, total = harga×qty; (2) Cetak/Unduh Nota — nota HTML per penjualan (No. Nota otomatis NT-YYYYMMDD-seq, bisa print/simpan PDF, ada nama pembeli); (3) Produk Terlaris bulan berjalan — ringkasan paling sering dijual (qty) & paling menguntungkan (laba) di atas tab HPP. Setiap sale membuat transaksi Pemasukan terkait & ikut backup/restore. Hapus sale juga menghapus transaksi kasnya.
- 2026-06: Lanjutan penjualan: (1) Diskon Nota — kolom diskon opsional di dialog Jual, total & nota otomatis menyesuaikan (total = harga×qty − diskon, laba dikurangi diskon); (2) Riwayat Nota — panel daftar semua nota di tab HPP, bisa unduh/cetak ulang & hapus (hapus juga menghapus transaksi kas); (3) Laba Produk — kartu dashboard baru menampilkan total laba kotor penjualan produk bulan berjalan.
