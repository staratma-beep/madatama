import React, { useRef, useState } from "react";
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
import { Settings, Download, Upload, Database, FileSpreadsheet, MoreVertical } from "lucide-react";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saldoStr, setSaldoStr] = useState(formatNumberInput(String(saldoAwal || 0)));

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

  const saveSaldo = async () => {
    await api.updateSettings({ saldo_awal: parseNumber(saldoStr) });
    toast.success("Saldo awal disimpan");
    setSettingsOpen(false);
    onReload();
  };

  return (
    <div className="flex items-center gap-2">
      <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={importCSV} data-testid="import-csv-input" />
      <input ref={jsonRef} type="file" accept=".json" className="hidden" onChange={restoreJSON} data-testid="restore-json-input" />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5" data-testid="settings-btn">
            <Settings size={15} /> <span className="hidden sm:inline">Saldo Awal</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Saldo Kas Awal</DialogTitle>
            <DialogDescription>Saldo kas sebelum transaksi pertama dicatat.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Nominal (Rp)</Label>
            <Input inputMode="numeric" value={saldoStr} onChange={(e) => setSaldoStr(formatNumberInput(e.target.value))} data-testid="saldo-awal-input" />
            <p className="mt-2 text-xs text-slate-500">Saat ini: {formatRupiah(saldoAwal)}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Batal</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={saveSaldo} data-testid="save-saldo-btn">Simpan</Button>
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
