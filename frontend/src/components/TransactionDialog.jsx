import React, { useState, useEffect, useMemo } from "react";
import { formatNumberInput, parseNumber, todayISO, formatRupiah } from "../lib/format";
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
import {
  Popover, PopoverContent, PopoverTrigger,
} from "./ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "./ui/command";
import { Package, PencilLine, ShoppingCart, ChevronsUpDown, Check } from "lucide-react";

const empty = {
  tanggal: todayISO(),
  keterangan: "",
  kategori: "Pemasukan",
  jenis: "Penjualan Branding",
  nominalStr: "",
  keterangan_tambahan: "",
};

export const TransactionDialog = ({ open, onOpenChange, onSubmit, onSale, editing, fixedCosts = [], products = [] }) => {
  const [form, setForm] = useState(empty);

  // 3 Modes: "manual" | "produk"
  const [mode, setMode] = useState("manual");

  // Produk mode state
  const [selProductId, setSelProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [diskonMode, setDiskonMode] = useState("rp");
  const [diskonStr, setDiskonStr] = useState("0");
  const [pembeli, setPembeli] = useState("");
  const [openCombobox, setOpenCombobox] = useState(false);
  const [jualIsDp, setJualIsDp] = useState(false);
  const [jualDpAmount, setJualDpAmount] = useState("");

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
        setMode("manual");
      } else {
        setForm(empty);
        setMode("manual");
        setSelProductId("");
        setQty("1");
        setDiskonMode("rp");
        setDiskonStr("0");
        setPembeli("");
        setJualIsDp(false);
        setJualDpAmount("");
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
    if (val === "Pengeluaran") setMode("manual");
  };

  const selectedProduct = useMemo(() => products.find((p) => p.id === selProductId), [products, selProductId]);

  const calcSale = () => {
    if (!selectedProduct) return { harga: 0, hpp: 0, subtotal: 0, diskonRp: 0, total: 0 };
    const harga = selectedProduct.harga_jual || 0;
    const hpp = (selectedProduct.bahan_baku || 0) + (selectedProduct.jasa_mitra || 0) + (selectedProduct.tambahan || 0);
    const q = Math.max(1, parseInt(qty, 10) || 1);
    const subtotal = harga * q;
    let diskonRp = 0;
    if (diskonMode === "persen") {
      diskonRp = Math.round(subtotal * (parseNumber(diskonStr) / 100));
    } else {
      diskonRp = parseNumber(diskonStr);
    }
    const total = Math.max(0, subtotal - diskonRp);
    return { harga, hpp, q, subtotal, diskonRp, total };
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
    if (mode === "produk") {
      if (!selectedProduct) return;
      const { harga, hpp, q, diskonRp } = calcSale();
      onSale({
        product_id: selectedProduct.id,
        nama: selectedProduct.nama,
        kategori: selectedProduct.kategori,
        qty: q,
        harga_satuan: harga,
        hpp_satuan: hpp,
        diskon: diskonRp,
        pembeli,
        tanggal: form.tanggal, // bisa pake tanggal dari form
        is_dp: jualIsDp,
        dp_amount: parseNumber(jualDpAmount) || 0,
      });
    } else {
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
    }
  };

  const saleInfo = calcSale();
  const qNum = parseInt(qty, 10) || 1;
  const stokTersedia = selectedProduct ? (parseInt(selectedProduct.stok, 10) || 0) : 0;
  const isStockEnough = mode === "produk" ? (qNum > 0 && qNum <= stokTersedia) : true;
  const allowSubmit = mode === "produk" ? (!!selectedProduct && isStockEnough) : !!(form.keterangan.trim() && parseNumber(form.nominalStr) > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto no-scrollbar" data-testid="transaction-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {editing ? "Edit Transaksi" : "Tambah Transaksi"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Header Tanggal & Kategori */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                data-testid="input-tanggal"
              />
            </div>
            {!editing && (
              <div>
                <Label>Kategori Masuk/Keluar</Label>
                <Select value={form.kategori} onValueChange={handleKategori}>
                  <SelectTrigger data-testid="select-kategori"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pemasukan">Pemasukan (Uang Masuk)</SelectItem>
                    <SelectItem value="Pengeluaran">Pengeluaran (Uang Keluar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Mode Switcher: Manual vs HPP Produk (Hanya muncul jika tambah Pemasukan & BUKAN mode Edit) */}
          {!editing && form.kategori === "Pemasukan" && (
            <div className="flex overflow-hidden rounded-lg border border-indigo-100 bg-slate-50 p-1 text-sm font-medium shadow-sm">
              <button
                className={`flex-1 rounded-md py-1.5 transition-colors flex items-center justify-center gap-1.5 ${mode === "manual" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => setMode("manual")}
              >
                <PencilLine size={15} /> Pemasukan Manual
              </button>
              <button
                className={`flex-1 rounded-md py-1.5 transition-colors flex items-center justify-center gap-1.5 ${mode === "produk" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => setMode("produk")}
              >
                <Package size={15} /> Dari HPP Produk
              </button>
            </div>
          )}

          {/* === CONTENT MODE PRODUK HPP === */}
          {mode === "produk" ? (
            <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-3 pt-2">
              <div>
                <Label>Pilih Produk (Tarik dari HPP)</Label>
                <div className="mt-1">
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between bg-white px-3 font-normal"
                      >
                        {selectedProduct ? (
                          <div className="flex w-full min-w-0 justify-between items-center gap-2">
                            <span className="truncate flex-1 text-left text-indigo-900 font-medium">{selectedProduct.nama}</span>
                            <span className="text-slate-400 shrink-0 tabular-nums text-xs font-semibold">
                              {formatRupiah(selectedProduct.harga_jual || 0)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-- Cari & Pilih Produk --</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-0 shadow-xl border-slate-200"
                      align="start"
                      style={{ width: "var(--radix-popover-trigger-width)", minWidth: "100%" }}
                    >
                      <Command>
                        <CommandInput placeholder="Ketik nama produk..." className="h-10 border-none focus:ring-0" />
                        <CommandList className="max-h-[220px]">
                          <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {products.map((p) => {
                              const isEligible = (p.harga_jual || 0) > 0;
                              return (
                                <CommandItem
                                  key={p.id}
                                  value={p.nama} // CommandItem matches by value text
                                  className={!isEligible ? "opacity-60" : "cursor-pointer"}
                                  onSelect={(val) => {
                                    if (isEligible) {
                                      setSelProductId(p.id);
                                      setOpenCombobox(false);
                                    }
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${selProductId === p.id ? "opacity-100 text-indigo-600" : "opacity-0"}`}
                                  />
                                  <div className="flex flex-1 items-center justify-between">
                                    <span className={!isEligible ? "opacity-50" : ""}>{p.nama}</span>
                                    {isEligible ? (
                                      <span className="text-xs text-slate-400 tabular-nums">
                                        {formatRupiah(p.harga_jual || 0)}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-red-500 uppercase tracking-widest font-semibold">
                                        Harga Kosong
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {selectedProduct ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center">
                        <Label>Jumlah (Qty)</Label>
                        {selectedProduct && <span className="text-[10px] text-slate-500 font-medium">Stok: {stokTersedia}</span>}
                      </div>
                      <Input
                        type="number"
                        min="1"
                        max={Math.max(1, stokTersedia)}
                        value={qty}
                        onChange={(e) => {
                          const val = Math.min(parseInt(e.target.value) || 1, stokTersedia);
                          setQty(e.target.value === "" ? "" : String(val));
                        }}
                        className={`bg-white mt-0.5 ${!isStockEnough && qNum > 0 ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                      {!isStockEnough && qNum > 0 && (
                        <p className="text-[10px] text-red-600 mt-1 font-medium">Qty melebihi stok yang ada!</p>
                      )}
                    </div>
                    <div>
                      <Label>Harga Satuan</Label>
                      <Input value={formatRupiah(selectedProduct.harga_jual)} disabled className="bg-white font-mono-num" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Pembeli (opsional)</Label>
                      <Input value={pembeli} onChange={(e) => setPembeli(e.target.value)} placeholder="Toko Bu Ani" className="bg-white" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>Diskon (opsional)</Label>
                        <div className="flex overflow-hidden rounded border text-xs">
                          <button type="button" onClick={() => setDiskonMode("rp")} className={`px-1.5 py-0.5 ${diskonMode === "rp" ? "bg-indigo-600 text-white" : "bg-white text-slate-500"}`}>Rp</button>
                          <button type="button" onClick={() => setDiskonMode("persen")} className={`px-1.5 py-0.5 ${diskonMode === "persen" ? "bg-indigo-600 text-white" : "bg-white text-slate-500"}`}>%</button>
                        </div>
                      </div>
                      <Input inputMode="numeric" value={diskonStr} onChange={(e) => setDiskonStr(diskonMode === "persen" ? e.target.value.replace(/[^0-9.]/g, "") : formatNumberInput(e.target.value))} className="bg-white" />
                    </div>
                  </div>
                  {saleInfo.diskonRp > 0 && (
                    <p className="px-1 text-xs text-slate-500 font-medium text-right">Subtotal {formatRupiah(saleInfo.subtotal)} − Diskon {formatRupiah(saleInfo.diskonRp)}</p>
                  )}

                  <div className="flex items-center gap-2 mt-4 px-1">
                    <input type="checkbox" id="dlg-is-dp" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" checked={jualIsDp} onChange={(e) => setJualIsDp(e.target.checked)} />
                    <Label htmlFor="dlg-is-dp" className="font-semibold text-slate-700">Pembayaran Uang Muka (DP)</Label>
                  </div>

                  {jualIsDp && (() => {
                    const dpNum = parseNumber(jualDpAmount);
                    const sisa = saleInfo.total - dpNum;
                    return (
                      <div className="mt-2 pl-6 space-y-2">
                        <div>
                          <Label className="text-xs text-slate-500 mb-1 block">Nominal DP Dibayarkan</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
                            <Input
                              inputMode="numeric"
                              placeholder="0"
                              value={jualDpAmount}
                              onChange={(e) => {
                                let val = parseNumber(e.target.value);
                                if (val > saleInfo.total) val = saleInfo.total;
                                setJualDpAmount(e.target.value === "" && val === 0 ? "" : formatNumberInput(val.toString()));
                              }}
                              className="bg-white font-mono-num pl-9 border-indigo-200 focus-visible:ring-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="bg-amber-50 rounded-lg py-2.5 px-3 border border-amber-100 flex items-center justify-between shadow-sm">
                          <span className="text-[11px] font-semibold text-amber-800">Sisa Tagihan (Masuk Piutang)</span>
                          <span className={`text-sm font-bold font-mono-num ${sisa <= 0 ? "text-emerald-600" : "text-amber-700"}`}>
                            {sisa <= 0 ? "LUNAS" : formatRupiah(Math.abs(sisa))}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 border border-emerald-100 shadow-sm mt-3">
                    <span className="text-sm font-semibold text-emerald-800">{jualIsDp ? "Pemasukan Kas (DP)" : "Total Tagihan"}</span>
                    <span className="font-mono-num text-xl font-bold text-emerald-700">{formatRupiah(jualIsDp ? parseNumber(jualDpAmount) : saleInfo.total)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[11px] text-indigo-600/80 font-medium">
                    <Check size={13} className="text-emerald-500" />
                    Otomatis potong stok & buat Nota di HPP
                  </div>
                </>
              ) : (
                <div className="py-4 text-center text-sm text-slate-400">Pilih produk berharga jual untuk melanjutkan</div>
              )}
            </div>
          ) : (
            // === CONTENT MODE MANUAL ===
            <div className="space-y-4 pt-1">
              <div>
                <Label>Keterangan Transaksi</Label>
                <Input
                  value={form.keterangan}
                  placeholder="cth: Bayar listrik / Nota custom"
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
          )}

        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="cancel-transaction-btn">
            Batal
          </Button>
          <Button
            onClick={submit}
            disabled={!allowSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 min-w-[100px]"
            data-testid="save-transaction-btn"
          >
            {mode === "produk" ? <><ShoppingCart size={15} className="mr-1.5" /> Jual & Catat</> : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
