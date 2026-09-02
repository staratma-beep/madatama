import React, { useState, useEffect, useMemo } from "react";
import { formatNumberInput, parseNumber, todayISO } from "../lib/format";
import { JENIS_PEMASUKAN, JENIS_PENGELUARAN } from "../lib/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";

const empty = {
  tanggal: todayISO(),
  keterangan: "",
  kategori: "Pemasukan",
  jenis: "Penjualan Branding",
  nominalStr: "",
  keterangan_tambahan: "",
};

export const TransactionDialog = ({ open, onOpenChange, onSubmit, editing, fixedCosts = [] }) => {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          tanggal: editing.tanggal,
          keterangan: editing.keterangan,
          kategori: editing.kategori,
          jenis: editing.jenis,
          nominalStr: formatNumberInput(String(editing.nominal)),
          keterangan_tambahan: editing.keterangan_tambahan || "",
        });
      } else {
        setForm(empty);
      }
    }
  }, [open, editing]);

  const jenisOptions = useMemo(
    () => (form.kategori === "Pemasukan" ? JENIS_PEMASUKAN : JENIS_PENGELUARAN),
    [form.kategori]
  );

  const handleKategori = (val) => {
    const opts = val === "Pemasukan" ? JENIS_PEMASUKAN : JENIS_PENGELUARAN;
    setForm((f) => ({ ...f, kategori: val, jenis: opts[0] }));
  };

  const handleJenis = (val) => {
    setForm((f) => {
      const next = { ...f, jenis: val };
      if (f.kategori === "Pengeluaran") {
        const fc = fixedCosts.find((c) => c.nama === val);
        if (fc) {
          next.nominalStr = formatNumberInput(String(fc.nominal));
          next.keterangan = fc.nama;
        }
      }
      return next;
    });
  };

  const submit = () => {
    const nominal = parseNumber(form.nominalStr);
    if (!form.keterangan.trim() || nominal <= 0) return;
    onSubmit({
      tanggal: form.tanggal,
      keterangan: form.keterangan.trim(),
      kategori: form.kategori,
      jenis: form.jenis,
      nominal,
      keterangan_tambahan: form.keterangan_tambahan,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="transaction-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {editing ? "Edit Transaksi" : "Tambah Transaksi"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-1">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                data-testid="input-tanggal"
              />
            </div>
            <div className="col-span-1">
              <Label>Kategori</Label>
              <Select value={form.kategori} onValueChange={handleKategori}>
                <SelectTrigger data-testid="select-kategori"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                  <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Keterangan Transaksi</Label>
            <Input
              value={form.keterangan}
              placeholder="cth: Spanduk 3x1m warung bu Ani"
              onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
              data-testid="input-keterangan"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Jenis</Label>
              <Select value={form.jenis} onValueChange={handleJenis}>
                <SelectTrigger data-testid="select-jenis"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {jenisOptions.map((j) => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nominal (Rp)</Label>
              <Input
                inputMode="numeric"
                value={form.nominalStr}
                placeholder="0"
                onChange={(e) => setForm((f) => ({ ...f, nominalStr: formatNumberInput(e.target.value) }))}
                data-testid="input-nominal"
              />
            </div>
          </div>
          <div>
            <Label>Keterangan Tambahan (opsional)</Label>
            <Textarea
              rows={2}
              value={form.keterangan_tambahan}
              onChange={(e) => setForm((f) => ({ ...f, keterangan_tambahan: e.target.value }))}
              data-testid="input-keterangan-tambahan"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="cancel-transaction-btn">
            Batal
          </Button>
          <Button
            onClick={submit}
            className="bg-indigo-600 hover:bg-indigo-700"
            data-testid="save-transaction-btn"
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
