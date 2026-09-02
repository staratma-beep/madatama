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
