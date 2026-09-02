import React, { useMemo, useState } from "react";
import { formatRupiah, formatTanggal, formatNumberInput, parseNumber, todayISO } from "../lib/format";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "./ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog";
import { Plus, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";

const emptyForm = { tanggal: todayISO(), jenis: "Piutang", nama: "", keterangan: "", nominalStr: "", status: "Belum Lunas" };

const List = ({ title, items, accent, onSettle, onUnsettle, onDelete, totalLabel, total }) => (
  <div className="rounded-2xl border border-slate-200 bg-white">
    <div className={`flex items-center justify-between rounded-t-2xl px-5 py-4 ${accent.header}`}>
      <div>
        <p className="font-heading text-lg font-bold text-white">{title}</p>
        <p className="text-xs text-white/80">{totalLabel}</p>
      </div>
      <p className="font-mono-num text-xl font-bold text-white" data-testid={accent.totalTestId}>{formatRupiah(total)}</p>
    </div>
    <div className="divide-y divide-slate-100">
      {items.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">Belum ada catatan</p>}
      {items.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3" data-testid={`record-row-${r.id}`}>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{r.nama}</p>
            <p className="truncate text-xs text-slate-400">{r.keterangan || "-"} · {formatTanggal(r.tanggal)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className={`font-mono-num font-semibold ${accent.text}`}>{formatRupiah(r.nominal)}</p>
              <span className={`text-xs font-semibold ${r.status === "Lunas" ? "text-emerald-600" : "text-slate-400"}`}>{r.status}</span>
            </div>
            {r.status === "Belum Lunas" ? (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onSettle(r.id)} data-testid={`settle-btn-${r.id}`}>
                <CheckCircle2 size={14} className="mr-1" /> Lunas
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => onUnsettle(r.id)} data-testid={`unsettle-btn-${r.id}`}>
                <RotateCcw size={14} />
              </Button>
            )}
            <button onClick={() => onDelete(r)} className="text-slate-300 hover:text-red-600" data-testid={`delete-record-${r.id}`}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const PiutangUtang = ({ records, onCreate, onSettle, onUnsettle, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toDelete, setToDelete] = useState(null);

  const piutang = useMemo(() => records.filter((r) => r.jenis === "Piutang"), [records]);
  const utang = useMemo(() => records.filter((r) => r.jenis === "Utang"), [records]);
  const totalPiutang = piutang.filter((r) => r.status === "Belum Lunas").reduce((a, r) => a + r.nominal, 0);
  const totalUtang = utang.filter((r) => r.status === "Belum Lunas").reduce((a, r) => a + r.nominal, 0);

  const submit = () => {
    const nominal = parseNumber(form.nominalStr);
    if (!form.nama.trim() || nominal <= 0) return;
    onCreate({
      tanggal: form.tanggal, jenis: form.jenis, nama: form.nama.trim(),
      keterangan: form.keterangan, nominal, status: form.status,
    });
    setForm(emptyForm);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900">Piutang & Utang</h2>
          <p className="text-sm text-slate-500">Kelola tagihan customer & kewajiban ke mitra</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700" data-testid="add-record-btn"><Plus size={16} className="mr-1" /> Tambah</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="record-dialog">
            <DialogHeader><DialogTitle className="font-heading text-xl">Tambah Catatan</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tanggal</Label>
                  <Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} data-testid="record-tanggal" />
                </div>
                <div>
                  <Label>Jenis</Label>
                  <Select value={form.jenis} onValueChange={(v) => setForm({ ...form, jenis: v })}>
                    <SelectTrigger data-testid="record-jenis"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Piutang">Piutang (customer berhutang)</SelectItem>
                      <SelectItem value="Utang">Utang (kita berhutang)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Nama (Customer / Mitra)</Label>
                <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} data-testid="record-nama" />
              </div>
              <div>
                <Label>Keterangan</Label>
                <Input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} data-testid="record-keterangan" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nominal (Rp)</Label>
                  <Input inputMode="numeric" value={form.nominalStr} placeholder="0"
                    onChange={(e) => setForm({ ...form, nominalStr: formatNumberInput(e.target.value) })} data-testid="record-nominal" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger data-testid="record-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Belum Lunas">Belum Lunas</SelectItem>
                      <SelectItem value="Lunas">Lunas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={submit} data-testid="save-record-btn">Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <List
          title="Piutang" items={piutang} totalLabel="Belum lunas (uang masuk)" total={totalPiutang}
          accent={{ header: "bg-gradient-to-r from-teal-500 to-teal-700", text: "text-teal-600", totalTestId: "total-piutang" }}
          onSettle={onSettle} onUnsettle={onUnsettle} onDelete={setToDelete}
        />
        <List
          title="Utang" items={utang} totalLabel="Belum lunas (uang keluar)" total={totalUtang}
          accent={{ header: "bg-gradient-to-r from-amber-500 to-amber-700", text: "text-amber-600", totalTestId: "total-utang" }}
          onSettle={onSettle} onUnsettle={onUnsettle} onDelete={setToDelete}
        />
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus catatan?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.nama}" akan dihapus. Jika sudah lunas, transaksi kas otomatisnya juga ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { onDelete(toDelete.id); setToDelete(null); }} data-testid="confirm-delete-record-btn">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
