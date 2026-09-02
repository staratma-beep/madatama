import React, { useState, useEffect } from "react";
import { formatRupiah, formatNumberInput, parseNumber } from "../lib/format";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "./ui/dialog";
import { toast } from "sonner";
import { Settings2, Plus, Trash2 } from "lucide-react";

export const FixedCostsBar = ({ fixedCosts, onReload }) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);

  useEffect(() => {
    if (open) {
      setRows(fixedCosts.map((c) => ({ ...c, nominalStr: formatNumberInput(String(c.nominal)) })));
      setDeletedIds([]);
    }
  }, [open, fixedCosts]);

  const total = fixedCosts.reduce((a, c) => a + c.nominal, 0);

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 px-2 text-indigo-600 hover:text-indigo-700" data-testid="manage-fixed-costs-btn">
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
