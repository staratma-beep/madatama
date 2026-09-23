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
import { Plus, CheckCircle2, RotateCcw, Trash2, HandCoins } from "lucide-react";

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
    <div className="rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.1)] bg-white overflow-hidden flex flex-col h-full relative">
      <div className={`flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white`}>
        <div>
          <p className="font-semibold text-[14px] text-slate-800">{title}</p>
          <p className="text-[12px] text-slate-500">{totalLabel}</p>
        </div>
        <p className="font-mono-num text-[16px] font-bold text-slate-800" data-testid={accent.totalTestId}>{formatRupiah(total)}</p>
      </div>

      <div className="overflow-auto flex-1 pb-16">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-20 bg-[#f7f7f7] border-b border-slate-200 text-slate-600 text-[13px] font-medium shadow-none">
            <tr>
              <th className="px-4 py-2.5 w-10 text-center border-r border-slate-100/50">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => selectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400 cursor-pointer"
                />
              </th>
              <th className="px-4 py-2.5 border-r border-slate-100/50">Nama / Keterangan</th>
              <th className="px-4 py-2.5 text-right w-[120px] border-r border-slate-100/50">Nominal</th>
              <th className="px-4 py-2.5 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px]">
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-slate-400 font-medium">Belum ada catatan</p>
                  </div>
                </td>
              </tr>
            )}
            {items.map((r) => {
              const isSelected = selectedIds.includes(r.id);
              return (
                <tr key={r.id} className={`group hover:bg-[#f9fafb] transition-all duration-150 ${isSelected ? 'bg-[#f4f5f7]' : 'bg-white'}`} data-testid={`record-row-${r.id}`}>
                  <td className="px-4 py-3 align-middle text-center w-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleSelect(r.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 max-w-[120px] lg:max-w-[180px]">
                    <p className="font-semibold text-slate-800 truncate leading-snug" title={r.nama}>{r.nama}</p>
                    <p className="text-[12px] font-medium text-slate-500 truncate mt-0.5" title={r.keterangan ? `${formatTanggal(r.tanggal)} · ${r.keterangan}` : formatTanggal(r.tanggal)}>
                      {formatTanggal(r.tanggal)} {r.keterangan && `· ${r.keterangan}`}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className={`font-mono-num font-semibold text-[13px] ${accent.text}`}>{formatRupiah(r.nominal)}</p>
                    <span className={`inline-flex rounded-md px-2 py-0.5 mt-1 text-[11px] font-medium tracking-wide ${r.status === "Lunas" ? "bg-[#bbf7d0] text-[#14532d]" : "bg-[#fef08a] text-[#713f12]"}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center w-24">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {r.status === "Belum Lunas" ? (
                        <button onClick={() => onSettle(r.id)} className="grid shrink-0 h-7 w-7 place-items-center rounded bg-white border border-slate-200 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-all shadow-sm" title="Tandai Lunas">
                          <CheckCircle2 size={13} />
                        </button>
                      ) : (
                        <button onClick={() => onUnsettle(r.id)} className="grid shrink-0 h-7 w-7 place-items-center rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all shadow-sm" title="Batal Lunas">
                          <RotateCcw size={13} />
                        </button>
                      )}
                      <button onClick={() => onDelete(r)} className="grid shrink-0 h-7 w-7 place-items-center rounded bg-white border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-all shadow-sm" title="Hapus">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
      {/* Page Header */}
      <div className="flex-none flex items-center justify-between pb-2 bg-transparent">
        <div>
          <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2">
            <HandCoins size={20} className="text-slate-700" /> Catatan Piutang & Utang
          </h2>
        </div>
        <div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a1a1a] text-white hover:bg-black font-medium shadow-sm px-4 py-2 rounded-lg border-0 h-auto transition-colors" data-testid="add-record-btn">
                Tambah Catatan
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
                <Button className="bg-[#1a1a1a] text-white hover:bg-black" onClick={submit} data-testid="save-record-btn">Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 flex-1 min-h-0">
        <List
          title="Catatan Piutang" items={piutang} totalLabel="Uang yang akan masuk" total={totalPiutang}
          accent={{ text: "text-slate-800", totalTestId: "total-piutang" }}
          onSettle={onSettle} onUnsettle={onUnsettle} onDelete={setToDelete}
          onDeleteMultiple={setToDeleteBulk} onSettleMultiple={onSettle}
        />
        <List
          title="Catatan Utang" items={utang} totalLabel="Uang yang harus keluar" total={totalUtang}
          accent={{ text: "text-slate-800", totalTestId: "total-utang" }}
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
    </div >
  );
};
