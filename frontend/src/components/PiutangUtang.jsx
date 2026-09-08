import React, { useMemo, useState } from "react";
import { formatRupiah, formatTanggal, formatNumberInput, parseNumber, todayISO } from "../lib/format";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
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
import { Plus, CheckCircle2, RotateCcw, Trash2, PlusSquare } from "lucide-react";

const emptyForm = { tanggal: todayISO(), jenis: "Piutang", nama: "", keterangan: "", nominalStr: "", status: "Belum Lunas" };

const List = ({ title, items, accent, onSettle, onUnsettle, onDelete, onDeleteMultiple, onSettleMultiple, totalLabel, total }) => {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id, checked) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const selectAll = (checked) => {
    if (checked) setSelectedIds(items.map(r => r.id));
    else setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    onDeleteMultiple(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkSettle = () => {
    onSettleMultiple(selectedIds);
    setSelectedIds([]);
  };

  const pendingCount = items.filter(r => selectedIds.includes(r.id) && r.status === "Belum Lunas").length;
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col h-full relative">
      <div className={`flex items-center justify-between px-5 py-4 ${accent.header}`}>
        <div>
          <p className="font-heading text-lg font-bold text-white shadow-sm">{title}</p>
          <p className="text-xs text-white/90">{totalLabel}</p>
        </div>
        <p className="font-mono-num text-xl font-bold text-white shadow-sm" data-testid={accent.totalTestId}>{formatRupiah(total)}</p>
      </div>

      <div className="overflow-auto flex-1 pb-16">
        <table className="w-full text-left text-sm relative">
          <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur shadow-sm border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5 w-10">
                <Checkbox checked={isAllSelected} onCheckedChange={selectAll} className="rounded-full data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" />
              </th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-400">Nama / Keterangan</th>
              <th className="px-4 py-3.5 text-right w-[110px] text-xs font-bold uppercase tracking-widest text-slate-400">Nominal</th>
              <th className="px-4 py-3.5 text-right w-24 text-xs font-bold uppercase tracking-widest text-slate-400">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-slate-400 font-medium">Belum ada catatan</p>
                  </div>
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id} className={`group transition-colors ${selectedIds.includes(r.id) ? "bg-indigo-50/70" : "hover:bg-indigo-50/40"}`} data-testid={`record-row-${r.id}`}>
                <td className="px-4 py-3.5 w-10">
                  <Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={(c) => toggleSelect(r.id, c)} className="rounded-full data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" />
                </td>
                <td className="px-4 py-3.5 max-w-[200px]">
                  <p className="font-semibold text-slate-800 truncate">{r.nama}</p>
                  <p className="text-xs text-slate-400 truncate">{formatTanggal(r.tanggal)} {r.keterangan && `· ${r.keterangan}`}</p>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <p className={`font-mono-num font-bold text-sm ${accent.text}`}>{formatRupiah(r.nominal)}</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 mt-1 text-[10px] font-bold tracking-wider ${r.status === "Lunas" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3.5 text-right w-24">
                  <div className="flex items-center justify-end gap-1 text-slate-400">
                    {r.status === "Belum Lunas" ? (
                      <button onClick={() => onSettle(r.id)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 transition-colors" title="Tandai Lunas">
                        <CheckCircle2 size={15} />
                      </button>
                    ) : (
                      <button onClick={() => onUnsettle(r.id)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors" title="Batal Lunas">
                        <RotateCcw size={15} />
                      </button>
                    )}
                    <button onClick={() => onDelete(r)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors" title="Hapus">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-800 p-3 flex items-center justify-between animate-in slide-in-from-bottom-2 px-5 z-10 shadow-lg">
          <p className="text-sm font-semibold text-white">{selectedIds.length} dipilih</p>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 h-8 shadow-sm font-semibold text-white" onClick={handleBulkSettle}>
                <CheckCircle2 size={14} className="mr-1.5" /> Lunas ({pendingCount})
              </Button>
            )}
            <Button size="sm" variant="destructive" className="h-8 bg-red-500 hover:bg-red-600 shadow-sm font-semibold text-white" onClick={handleBulkDelete}>
              <Trash2 size={14} className="mr-1.5" /> Hapus
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const PiutangUtang = ({ records, onCreate, onSettle, onUnsettle, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toDelete, setToDelete] = useState(null);
  const [toDeleteBulk, setToDeleteBulk] = useState(null);

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
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-7xl mx-auto space-y-4">
      {/* Banner Section */}
      <div className="flex-none relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-indigo-900/20 blur-xl"></div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <PlusSquare className="text-indigo-100" /> Piutang & Utang
            </h2>
            <p className="mt-1 text-sm text-indigo-100 max-w-lg opacity-90">Kelola tagihan customer & kewajiban ke mitra untuk kelancaran arus kas.</p>
          </div>
          <div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-md px-4 py-2.5 rounded-lg border-0 h-auto" data-testid="add-record-btn">
                  <Plus size={16} className="mr-1.5" /> Tambah Catatan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md text-slate-900" data-testid="record-dialog">
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 flex-1 min-h-0">
        <List
          title="Piutang" items={piutang} totalLabel="Belum lunas (uang masuk)" total={totalPiutang}
          accent={{ header: "bg-gradient-to-r from-teal-500 to-teal-700", text: "text-teal-600", totalTestId: "total-piutang" }}
          onSettle={onSettle} onUnsettle={onUnsettle} onDelete={setToDelete}
          onDeleteMultiple={setToDeleteBulk} onSettleMultiple={onSettle}
        />
        <List
          title="Utang" items={utang} totalLabel="Belum lunas (uang keluar)" total={totalUtang}
          accent={{ header: "bg-gradient-to-r from-amber-500 to-amber-700", text: "text-amber-600", totalTestId: "total-utang" }}
          onSettle={onSettle} onUnsettle={onUnsettle} onDelete={setToDelete}
          onDeleteMultiple={setToDeleteBulk} onSettleMultiple={onSettle}
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
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { onDelete(toDelete.id); setToDelete(null); }}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!toDeleteBulk} onOpenChange={(o) => !o && setToDeleteBulk(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {toDeleteBulk?.length} catatan terpilih?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua catatan dan riwayat kas yang berkaitan akan dihapus permanen dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { onDelete(toDeleteBulk); setToDeleteBulk(null); }}>Hapus Semua</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
