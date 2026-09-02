import React, { useState, useEffect } from "react";
import { formatRupiah, formatNumberInput, parseNumber, todayISO } from "../lib/format";
import { api, JENIS_PENGELUARAN } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "./ui/dialog";
import { toast } from "sonner";
import { Settings2, Plus, Trash2, ReceiptText } from "lucide-react";

export const FixedCostsBar = ({ fixedCosts, onReload }) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [postOpen, setPostOpen] = useState(false);
  const [postDate, setPostDate] = useState(todayISO());
  const [selected, setSelected] = useState({});

  useEffect(() => {
    if (open) {
      setRows(fixedCosts.map((c) => ({ ...c, nominalStr: formatNumberInput(String(c.nominal)) })));
      setDeletedIds([]);
    }
  }, [open, fixedCosts]);

  const total = fixedCosts.reduce((a, c) => a + c.nominal, 0);

  useEffect(() => {
    if (postOpen) {
      const init = {};
      fixedCosts.forEach((c) => (init[c.id] = true));
      setSelected(init);
      setPostDate(todayISO());
    }
  }, [postOpen, fixedCosts]);

  const jenisFor = (nama) => (JENIS_PENGELUARAN.includes(nama) ? nama : "Lain-lain");
  const selectedList = fixedCosts.filter((c) => selected[c.id]);
  const postTotal = selectedList.reduce((a, c) => a + c.nominal, 0);

  const postToKas = async () => {
    if (selectedList.length === 0) return;
    await Promise.all(
      selectedList.map((c) =>
        api.createTransaction({
          tanggal: postDate,
          keterangan: c.nama,
          kategori: "Pengeluaran",
          jenis: jenisFor(c.nama),
          nominal: c.nominal,
          keterangan_tambahan: "Biaya tetap bulanan",
        })
      )
    );
    toast.success(`${selectedList.length} biaya tetap dicatat ke Buku Kas`);
    setPostOpen(false);
    onReload();
  };

  const addRow = () =>
    setRows((r) => [...r, { id: `new-${Date.now()}-${r.length}`, nama: "", nominalStr: "", isNew: true }]);

  const updateRow = (id, patch) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const removeRow = (row) => {
    if (!row.isNew) setDeletedIds((d) => [...d, row.id]);
    setRows((r) => r.filter((x) => x.id !== row.id));
  };

  const save = async () => {
    const tasks = [];
    deletedIds.forEach((id) => tasks.push(api.deleteFixedCost(id)));
    rows.forEach((row) => {
      const nominal = parseNumber(row.nominalStr);
      if (!row.nama.trim() || nominal <= 0) return;
      if (row.isNew) tasks.push(api.createFixedCost({ nama: row.nama.trim(), nominal }));
      else tasks.push(api.updateFixedCost(row.id, { nama: row.nama.trim(), nominal }));
    });
    await Promise.all(tasks);
    toast.success("Biaya tetap bulanan disimpan");
    setOpen(false);
    onReload();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm" data-testid="fixed-costs-bar">
      <span className="font-semibold text-slate-700">Biaya Tetap Bulanan:</span>
      {fixedCosts.length === 0 && <span className="text-slate-400">Belum ada</span>}
      {fixedCosts.map((c) => (
        <span key={c.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600" data-testid={`fixed-cost-badge-${c.id}`}>
          {c.nama} {formatRupiah(c.nominal)}
        </span>
      ))}
      <span className="font-semibold text-indigo-600" data-testid="fixed-costs-total">Total {formatRupiah(total)}</span>

      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="ml-auto h-7 gap-1 bg-emerald-600 px-2 hover:bg-emerald-700" data-testid="post-fixed-costs-btn">
            <ReceiptText size={14} /> Catat ke Kas
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md" data-testid="post-fixed-costs-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Catat Biaya Tetap ke Buku Kas</DialogTitle>
            <DialogDescription>Otomatis membuat transaksi Pengeluaran — nominal &amp; keterangan sudah terisi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Tanggal Pencatatan</Label>
              <Input type="date" value={postDate} onChange={(e) => setPostDate(e.target.value)} data-testid="post-date-input" />
            </div>
            <div className="max-h-60 space-y-1.5 overflow-y-auto">
              {fixedCosts.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50" data-testid={`post-item-${c.id}`}>
                  <span className="flex items-center gap-2">
                    <Checkbox checked={!!selected[c.id]} onCheckedChange={(v) => setSelected((s) => ({ ...s, [c.id]: !!v }))} data-testid={`post-check-${c.id}`} />
                    <span className="text-sm font-medium text-slate-700">{c.nama}</span>
                  </span>
                  <span className="font-mono-num text-sm text-red-600">{formatRupiah(c.nominal)}</span>
                </label>
              ))}
              {fixedCosts.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Belum ada biaya tetap.</p>}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-700">Total dicatat</span>
              <span className="font-mono-num font-bold text-red-600" data-testid="post-total">{formatRupiah(postTotal)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostOpen(false)}>Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={postToKas} disabled={selectedList.length === 0} data-testid="confirm-post-btn">
              Catat {selectedList.length} Biaya
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-indigo-600 hover:text-indigo-700" data-testid="manage-fixed-costs-btn">
            <Settings2 size={14} /> Kelola
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md" data-testid="fixed-costs-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Kelola Biaya Tetap Bulanan</DialogTitle>
            <DialogDescription>Tambah, ubah, atau hapus komponen biaya tetap.</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 space-y-2 overflow-y-auto py-2">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-2" data-testid={`fixed-cost-editor-${row.id}`}>
                <Input
                  placeholder="Nama biaya"
                  value={row.nama}
                  onChange={(e) => updateRow(row.id, { nama: e.target.value })}
                  className="flex-1"
                  data-testid={`fixed-cost-nama-${row.id}`}
                />
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  value={row.nominalStr}
                  onChange={(e) => updateRow(row.id, { nominalStr: formatNumberInput(e.target.value) })}
                  className="w-32"
                  data-testid={`fixed-cost-nominal-${row.id}`}
                />
                <button onClick={() => removeRow(row)} className="text-slate-400 hover:text-red-600" data-testid={`fixed-cost-delete-${row.id}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {rows.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Belum ada biaya. Tambahkan di bawah.</p>}
            <Button variant="outline" size="sm" className="mt-1 w-full border-dashed" onClick={addRow} data-testid="add-fixed-cost-row-btn">
              <Plus size={14} className="mr-1" /> Tambah Biaya
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={save} data-testid="save-fixed-costs-btn">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
