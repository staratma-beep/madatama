import React, { useRef, useState, useEffect } from "react";
import { formatRupiah, formatNumberInput, parseNumber } from "../lib/format";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "./ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "./ui/dropdown-menu";
import { toast } from "sonner";
import { Settings, Download, Upload, Database, FileSpreadsheet, MoreVertical, Image as ImageIcon } from "lucide-react";

const CSV_HEADER = ["tanggal", "keterangan", "kategori", "jenis", "nominal", "keterangan_tambahan"];

function toCSV(transactions) {
  const rows = transactions.map((t) =>
    CSV_HEADER.map((h) => {
      const v = t[h] ?? "";
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [CSV_HEADER.join(","), ...rows].join("\n");
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const parseLine = (line) => {
    const out = []; let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (c === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };
  const header = parseLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = parseLine(line);
    const obj = {};
    header.forEach((h, i) => (obj[h] = cols[i]));
    return {
      tanggal: obj.tanggal,
      keterangan: obj.keterangan || "",
      kategori: obj.kategori || "Pemasukan",
      jenis: obj.jenis || "Lain-lain",
      nominal: parseNumber(obj.nominal),
      keterangan_tambahan: obj.keterangan_tambahan || "",
    };
  }).filter((r) => r.tanggal && r.nominal > 0);
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export const Toolbar = ({ transactions, saldoAwal, onReload }) => {
  const csvRef = useRef();
  const jsonRef = useRef();
  const logoRef = useRef();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cfg, setCfg] = useState({ saldo_awal: "0", nama_usaha: "", alamat: "", telepon: "", logo: "" });

  useEffect(() => {
    if (settingsOpen) {
      api.getSettings().then((s) => setCfg({
        saldo_awal: formatNumberInput(String(s.saldo_awal || 0)),
        nama_usaha: s.nama_usaha || "",
        alamat: s.alamat || "",
        telepon: s.telepon || "",
        logo: s.logo || "",
      }));
    }
  }, [settingsOpen]);

  const exportCSV = () => {
    download(`buku-kas-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(transactions), "text/csv;charset=utf-8;");
    toast.success("Data diekspor ke CSV");
  };

  const importCSV = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text();
    const items = parseCSV(text);
    if (!items.length) { toast.error("File CSV tidak valid / kosong"); return; }
    await api.importTransactions(items);
    toast.success(`${items.length} transaksi diimpor`);
    onReload();
    e.target.value = "";
  };

  const backupJSON = async () => {
    const data = await api.backup();
    download(`backup-pembukuan-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");
    toast.success("Backup JSON diunduh");
  };

  const restoreJSON = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      await api.restore(data);
      toast.success("Data berhasil dipulihkan");
      onReload();
    } catch {
      toast.error("File backup tidak valid");
    }
    e.target.value = "";
  };

  const saveSettings = async () => {
    await api.updateSettings({
      saldo_awal: parseNumber(cfg.saldo_awal),
      nama_usaha: cfg.nama_usaha,
      alamat: cfg.alamat,
      telepon: cfg.telepon,
      logo: cfg.logo,
    });
    toast.success("Pengaturan disimpan");
    setSettingsOpen(false);
    onReload();
  };

  const onLogo = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 500 * 1024) { toast.error("Logo maksimal 500KB"); e.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => setCfg((c) => ({ ...c, logo: reader.result }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-2">
      <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={importCSV} data-testid="import-csv-input" />
      <input ref={jsonRef} type="file" accept=".json" className="hidden" onChange={restoreJSON} data-testid="restore-json-input" />
      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} data-testid="logo-input" />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5" data-testid="settings-btn">
            <Settings size={15} /> <span className="hidden sm:inline">Pengaturan</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Pengaturan</DialogTitle>
            <DialogDescription>Saldo awal & profil usaha (tampil di nota).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Saldo Kas Awal (Rp)</Label>
              <Input inputMode="numeric" value={cfg.saldo_awal} onChange={(e) => setCfg({ ...cfg, saldo_awal: formatNumberInput(e.target.value) })} data-testid="saldo-awal-input" />
            </div>
            <div className="border-t pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Profil Usaha (untuk Nota)</p>
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-xl border bg-slate-50">
                  {cfg.logo ? <img src={cfg.logo} alt="logo" className="h-full w-full object-contain" data-testid="logo-preview" /> : <ImageIcon size={22} className="text-slate-300" />}
                </div>
                <div className="flex flex-col items-start gap-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()} data-testid="upload-logo-btn"><Upload size={14} className="mr-1" />Unggah Logo</Button>
                  {cfg.logo && <Button type="button" variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => setCfg({ ...cfg, logo: "" })} data-testid="remove-logo-btn">Hapus logo</Button>}
                </div>
              </div>
            </div>
            <div>
              <Label>Nama Usaha</Label>
              <Input value={cfg.nama_usaha} onChange={(e) => setCfg({ ...cfg, nama_usaha: e.target.value })} placeholder="Bukuku Pro" data-testid="nama-usaha-input" />
            </div>
            <div>
              <Label>Alamat</Label>
              <Input value={cfg.alamat} onChange={(e) => setCfg({ ...cfg, alamat: e.target.value })} placeholder="Jl. ..." data-testid="alamat-input" />
            </div>
            <div>
              <Label>Telepon</Label>
              <Input value={cfg.telepon} onChange={(e) => setCfg({ ...cfg, telepon: e.target.value })} placeholder="08xx-xxxx-xxxx" data-testid="telepon-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Batal</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={saveSettings} data-testid="save-settings-btn">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5" data-testid="data-menu-btn">
            <Database size={15} /> <span className="hidden sm:inline">Data</span> <MoreVertical size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Ekspor / Impor</DropdownMenuLabel>
          <DropdownMenuItem onClick={exportCSV} data-testid="export-csv-btn"><FileSpreadsheet size={15} className="mr-2" /> Export ke CSV/Excel</DropdownMenuItem>
          <DropdownMenuItem onClick={() => csvRef.current?.click()} data-testid="import-csv-btn"><Upload size={15} className="mr-2" /> Import dari CSV</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Backup</DropdownMenuLabel>
          <DropdownMenuItem onClick={backupJSON} data-testid="backup-json-btn"><Download size={15} className="mr-2" /> Backup (JSON)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => jsonRef.current?.click()} data-testid="restore-json-btn"><Database size={15} className="mr-2" /> Restore dari Backup</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
