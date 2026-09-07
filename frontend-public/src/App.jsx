import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Search, ChevronRight, Package, Truck, Printer, Phone, Trash2, ArrowLeft, ShoppingCart, CheckCircle2, Image as ImageIcon, Check } from 'lucide-react';
import { getPublicProducts, createPublicOrder, trackPublicOrder, getPublicSettings, payPublicOrder, uploadImage } from './lib/api';
import { Toaster, toast } from 'sonner';

const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

// --- Context & LocalStorage Helper ---
const useCart = () => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("madatama_cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem("madatama_cart", JSON.stringify(cart));
  }, [cart]);
  return [cart, setCart];
};

const useRecentOrders = () => {
  const [recent, setRecent] = useState(() => {
    try {
      const saved = localStorage.getItem("madatama_recent_orders");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem("madatama_recent_orders", JSON.stringify(recent));
  }, [recent]);
  return [recent, setRecent];
};

// Navbar Component
const Navbar = ({ cartCount }) => (
  <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
        <Printer size={24} />
        <span>Madatama <span className="font-light text-slate-800">Print</span></span>
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">Katalog</Link>
        <Link to="/track" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors bg-indigo-50 px-3 py-1.5 rounded-full text-indigo-700 hidden sm:block">Lacak Pesanan</Link>
        <Link to="/cart" className="relative text-slate-700 hover:text-indigo-600 p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  </nav>
);

// Footer Component
const Footer = () => (
  <footer className="bg-slate-900 text-slate-400 py-12 text-center mt-auto">
    <p className="text-lg font-bold text-white mb-2">Madatama Print</p>
    <p className="text-sm">Percetakan & Branding Berkualitas, Langsung dari Layar Anda</p>
    <p className="text-xs mt-8 opacity-60">© 2026 Madatama Pro. All rights reserved.</p>
  </footer>
);

// Home (Catalog)
const Catalog = ({ cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ title: 'Kualitas Terbaik, Harga Masuk Akal.', subtitle: 'Dari spanduk besar hingga stempel kecil, semua kebutuhan promosi dan bisnis Anda ada di sini.' });
  const [loading, setLoading] = useState(true);
  const [activeKategori, setActiveKategori] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([getPublicProducts(), getPublicSettings()]).then(([prodData, setSettingsData]) => {
      setProducts(prodData);
      setSettings(setSettingsData);
      setLoading(false);
    });
  }, []);

  const categories = ['Semua', ...new Set(products.map(p => p.kategori))];
  const filteredProducts = products.filter(p => {
    const matchCategory = activeKategori === 'Semua' || p.kategori === activeKategori;
    const matchSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const addToCart = (p) => {
    setCart(curr => {
      const exist = curr.find(x => x.product_id === p.id);
      if (exist) {
        return curr.map(x => x.product_id === p.id ? { ...x, qty: x.qty + 1 } : x);
      }
      return [...curr, { product_id: p.id, product: p, qty: 1, catatan: "" }];
    });
    toast.success(`${p.nama} ditambahkan ke Keranjang`, {
      icon: <CheckCircle2 className="text-emerald-500" size={18} />
    });
  };

  const getGradientClass = (theme) => {
    switch (theme) {
      case 'emerald-teal': return 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100';
      case 'rose-orange': return 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-100';
      case 'blue-cyan': return 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100';
      case 'slate-gray': return 'bg-gradient-to-br from-slate-100 to-gray-50 border-slate-200';
      default: return 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100';
    }
  };

  const getOverlayGradient = (theme) => {
    switch (theme) {
      case 'emerald-teal': return 'bg-gradient-to-t from-teal-900/70 to-emerald-900/20';
      case 'rose-orange': return 'bg-gradient-to-t from-red-900/70 to-orange-900/20';
      case 'blue-cyan': return 'bg-gradient-to-t from-slate-900/70 to-blue-900/20';
      case 'slate-gray': return 'bg-gradient-to-t from-gray-900/70 to-slate-800/20';
      default: return 'bg-gradient-to-t from-slate-900/70 to-indigo-900/20';
    }
  };

  const objPosition = settings.banner_position === 'top' ? 'object-top' : settings.banner_position === 'bottom' ? 'object-bottom' : 'object-center';
  const imgOpacity = (settings.banner_opacity !== undefined ? settings.banner_opacity : 40) / 100;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className={`text-center mb-12 py-16 rounded-3xl border shadow-sm relative overflow-hidden ${settings.banner_url ? 'bg-slate-900 border-slate-800' : getGradientClass(settings.theme_gradient)}`}>
        {settings.banner_url && (
          <div className="absolute inset-0">
            <img
              src={settings.banner_url} alt="Banner"
              className={`w-full h-full object-cover ${objPosition}`}
              style={{ opacity: imgOpacity }}
            />
            <div className={`absolute inset-0 ${getOverlayGradient(settings.theme_gradient)}`} />
          </div>
        )}
        <h1 className={`text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight max-w-3xl mx-auto relative z-10 whitespace-pre-wrap ${settings.banner_url ? 'text-white' : 'text-slate-900'}`}>{settings.title}</h1>
        <p className={`max-w-lg mx-auto relative z-10 leading-relaxed font-medium ${settings.banner_url ? 'text-slate-300' : 'text-slate-600'}`}>{settings.subtitle}</p>
      </div>

      {products.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setActiveKategori(c)}
                className={`px-4 py-2 flex-none rounded-full text-sm font-bold transition-all ${activeKategori === c
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72 flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari kebutuhan Anda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-3xl">
          <Search className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-500 font-medium">Tidak ada produk yang sesuai dengan pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col">
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <Package size={40} />
                    <span className="text-xs font-medium uppercase tracking-widest mt-2">{p.kategori}</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                  {p.kategori}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-slate-900 mb-1">{p.nama}</h3>
                {p.deskripsi && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.deskripsi}</p>}
                <div className="flex items-center gap-1 mt-auto">
                  <span className="text-xs font-semibold text-slate-400">Est.</span>
                  <p className="font-black text-indigo-600 text-lg">{formatRupiah(p.harga_jual)}</p>
                </div>
                <button onClick={() => addToCart(p)} className="mt-4 w-full bg-slate-900 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors group-hover:bg-indigo-600 shadow-sm">
                  <ShoppingCart size={16} /> Tambah
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Cart / Checkout Page
const Cart = ({ cart, setCart, setRecentOrders }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nama: '',
    kontak: '',
  });

  const updateItem = (index, field, val) => {
    const newCart = [...cart];
    newCart[index][field] = val;
    setCart(newCart);
  };

  const removeItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Keranjang masih kosong!");
      return;
    }
    setLoading(true);
    try {
      // Map frontend cart format to backend expected items format
      const payload = {
        nama: formData.nama,
        kontak: formData.kontak,
        items: cart.map(c => ({ product_id: c.product_id, qty: c.qty, catatan: c.catatan }))
      };
      const res = await createPublicOrder(payload);
      setCart([]); // Clear cart
      setRecentOrders(curr => {
        const _new = [res.order_id, ...curr.filter(x => x !== res.order_id)].slice(0, 5);
        return _new;
      });
      toast.success("Pesanan berhasil dibuat!");
      navigate(`/track?id=${res.order_id}`);
    } catch (e) {
      toast.error("Gagal membuat pesanan.");
    } finally {
      setLoading(false);
    }
  };

  // Kalkulasi est total
  const estTotal = cart.reduce((acc, c) => acc + ((c.product?.harga_jual * c.qty) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 font-semibold mb-6 hover:underline"><ArrowLeft size={16} /> Lanjut Belanja</Link>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Keranjang Pesanan.</h1>
          {cart.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
              <ShoppingCart size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Belum ada barang di keranjang.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 shadow-sm relative group">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-none">
                    {item.product?.image_url ?
                      <img src={item.product?.image_url} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full grid place-items-center text-slate-300"><Package /></div>
                    }
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{item.product?.nama}</h3>
                    <p className="text-indigo-600 font-bold text-sm mb-3">{formatRupiah(item.product?.harga_jual)}</p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-none">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Jumlah</label>
                        <input type="number" min="1" value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 1)} className="w-20 h-9 border border-slate-200 rounded-lg px-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Catatan / Link Desain Khusus</label>
                        <input type="text" value={item.catatan} onChange={e => updateItem(idx, 'catatan', e.target.value)} placeholder="Warna biru tua, link gdrive..." className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeItem(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-1.5 rounded-md transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-[350px] flex-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Detail Pengirim</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Budi Santoso" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp Aktif</label>
                <input required type="tel" className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" placeholder="08..." value={formData.kontak} onChange={e => setFormData({ ...formData, kontak: e.target.value })} />
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-500">Estimasi Total</span>
                </div>
                <div className="text-2xl font-black text-slate-900 mb-6">{formatRupiah(estTotal)}</div>

                <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                  Harga final dapat disesuaikan oleh admin melalui konsultasi via WhatsApp tergantung dari spesifikasi bahan dan desain.
                </p>

                <button type="submit" disabled={loading || cart.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50">
                  {loading ? 'Memproses...' : 'Kirim Pesanan Sekarang'} <ChevronRight size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Track Order Page
const TrackOrder = ({ recentOrders }) => {
  const [searchParams] = useSearchParams();
  const [trackId, setTrackId] = useState(searchParams.get('id') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [payProofUrl, setPayProofUrl] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  const doTrack = async (e) => {
    e && e.preventDefault();
    if (!trackId.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await trackPublicOrder(trackId.trim());
      setResult(res);
    } catch (err) {
      setError("Pesanan tidak ditemukan. Pastikan Nomor Resi / Nota benar.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading("Mengunggah bukti...", { id: "up-proof" });
      const url = await uploadImage(file);
      setPayProofUrl(url);
      toast.success("Berhasil diunggah!", { id: "up-proof" });
    } catch {
      toast.error("Gagal mengunggah", { id: "up-proof" });
    }
  };

  const submitPayment = async () => {
    if (!payMethod || !payProofUrl) {
      toast.error("Pilih metode & unggah bukti bayar");
      return;
    }
    setPayLoading(true);
    try {
      await payPublicOrder(trackId, { payment_method: payMethod, bukti_bayar: payProofUrl });
      toast.success("Pembayaran berhasil dikirim!");
      doTrack(); // refresh
    } catch {
      toast.error("Gagal mengirim pembayaran");
    } finally {
      setPayLoading(false);
    }
  };

  useEffect(() => {
    if (trackId) doTrack();
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
          <Truck size={32} />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Lacak Pesanan</h1>
        <p className="text-slate-500 mt-2 text-sm">Masukkan ID Pesanan / Resi Anda</p>
      </div>

      <form onSubmit={doTrack} className="relative mb-6">
        <input
          type="text"
          value={trackId}
          onChange={e => setTrackId(e.target.value)}
          placeholder="ORD-..."
          className="w-full pl-5 pr-14 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-lg font-mono placeholder:font-sans focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
        />
        <button type="submit" className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-3 rounded-xl hover:bg-indigo-700 transition-colors">
          <Search size={18} />
        </button>
      </form>

      {!result && recentOrders.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          <p className="w-full text-xs text-slate-500 font-bold mb-1 text-center">Tersimpan di Perangkat Anda</p>
          {recentOrders.map(orderId => (
            <button
              key={orderId}
              onClick={() => { setTrackId(orderId); window.location.href = `/track?id=${orderId}`; }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 text-xs font-mono font-bold rounded-lg transition-colors shadow-sm"
            >
              {orderId}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-center text-slate-500 font-medium animate-pulse">Mencari Data...</p>}

      {error && <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-center text-sm font-semibold">{error}</div>}

      {result && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-100/50 mt-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <span className="text-sm font-bold text-slate-400">STATUS TERKINI</span>
            <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">{result.status}</span>
          </div>
          <div className="mb-4 text-center py-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">ID Transaksi</p>
            <p className="font-mono font-bold text-2xl text-slate-800">{result.id}</p>
          </div>

          {result.items && result.items.length > 0 && (
            <div className="border-t border-slate-100 pt-4 mt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Rincian Produksi</p>
              <div className="space-y-2">
                {result.items.map((it, i) => (
                  <div key={i} className="flex justify-between items-center text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="font-medium text-slate-700">{it.nama} <span className="text-slate-400">x{it.qty}</span></span>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${it.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' :
                      it.status === 'Menunggu' ? 'bg-slate-200 text-slate-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                      {it.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.status === "Menunggu Pembayaran" && result.total_tagihan > 0 && (
            <div className="border border-indigo-100 bg-indigo-50/50 rounded-2xl p-5 mt-6 animate-in slide-in-from-top-2">
              <h3 className="font-black text-indigo-900 text-lg mb-1">Menunggu Pembayaran</h3>
              <p className="text-[11px] text-indigo-700/80 mb-5 leading-relaxed">Pesanan Anda telah disetujui. Selesaikan pembayaran sesuai total tagihan agar segera kami proses ke tahap produksi.</p>

              <div className="bg-white shadow-sm rounded-xl p-4 border border-indigo-100/50 mb-5 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-400"></div>
                <span className="block text-xs font-bold text-slate-400 mb-1">Total Tagihan Final</span>
                <span className="block text-3xl font-black text-indigo-700 tracking-tight">{formatRupiah(result.total_tagihan)}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-2">Pilih Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['QRIS', 'BCA', 'Mandiri'].map(m => (
                      <button key={m} onClick={() => setPayMethod(m)} type="button" className={`px-2 py-3 rounded-xl border text-xs font-bold transition-all ${payMethod === m ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>{m}</button>
                    ))}
                  </div>
                </div>

                {payMethod && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center text-sm shadow-sm animate-in fade-in">
                    {payMethod === 'QRIS' ? (
                      <p className="font-bold text-slate-700">Silakan scan kode QRIS Madatama Print.<br /><span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 mt-2 inline-block">(Contoh Demo)</span></p>
                    ) : (
                      <p className="font-bold text-slate-700">Transfer ke Rekening {payMethod}: <br /><span className="text-xl font-mono text-indigo-600 block my-1">1234567890</span>a.n Madatama Print</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-2">Unggah Bukti Pembayaran / Trufer</label>
                  {!payProofUrl ? (
                    <label className="flex items-center justify-center gap-2 w-full h-14 bg-white border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-400 transition-colors">
                      <ImageIcon size={20} />
                      <span className="text-sm font-bold">Pilih Gambar dari Galeri</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    </label>
                  ) : (
                    <div className="relative rounded-xl border border-indigo-200 overflow-hidden bg-white p-2.5 flex items-center gap-3 shadow-sm animate-in zoom-in-95">
                      <img src={payProofUrl} alt="Bukti" className="w-14 h-14 rounded-lg object-cover bg-slate-100" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">Bukti terlampir</p>
                        <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5"><Check size={12} /> Gambar siap dikirim</p>
                      </div>
                      <button type="button" onClick={() => setPayProofUrl('')} className="p-2.5 bg-red-50 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>

                <button onClick={submitPayment} disabled={payLoading || !payMethod || !payProofUrl} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2">
                  {payLoading ? 'Mengirim...' : 'Kirim Bukti Pembayaran'} {!payLoading && <ChevronRight size={18} />}
                </button>
              </div>
            </div>
          )}

          {result.bukti_bayar && result.status !== "SELESAI" && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3 items-start mt-6 text-sm text-emerald-900 shadow-sm leading-relaxed">
              <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-none" />
              <div>
                <p className="font-bold mb-1">Bukti Pembayaran Diterima</p>
                <p className="text-xs text-emerald-700/80">Silakan tunggu konfirmasi Admin untuk merubah status dari (Menunggu Konfirmasi Bayar) ke (Lunas / Masuk Produksi). Terima kasih!</p>
              </div>
            </div>
          )}

          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 items-start mt-6 text-sm text-indigo-900 shadow-sm leading-relaxed">
            <Phone size={16} className="text-indigo-500 mt-1 flex-none" />
            <p>Admin Madatama akan menghubungi Anda via WhatsApp untuk konfirmasi penyesuaian harga dan pengiriman berkas desain jika diperlukan.</p>
          </div>

          <a
            href={`https://wa.me/6281234567890?text=Halo%20Admin%20Madatama,%20saya%20mengecek%20pesanan%20saya%20dengan%20nomor%20resi%20*${result.id}*.%20Apakah%20bisa%20dibantu?`}
            target="_blank" rel="noopener noreferrer"
            className="mt-4 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all font-sans"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.093 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
            Tanya Admin via WA
          </a>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [cart, setCart] = useCart();
  const [recentOrders, setRecentOrders] = useRecentOrders();
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors theme="light" />
      <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-100">
        <Navbar cartCount={cartCount} />
        <main className="flex-1 bg-slate-50/50">
          <Routes>
            <Route path="/" element={<Catalog cart={cart} setCart={setCart} />} />
            <Route path="/cart" element={<Cart cart={cart} setCart={setCart} setRecentOrders={setRecentOrders} />} />
            <Route path="/track" element={<TrackOrder recentOrders={recentOrders} />} />
          </Routes>
        </main>
        <Footer />

        {/* Global Floating WA Button */}
        <a
          href="https://wa.me/6281234567890?text=Halo%20Admin%20Madatama,%20saya%20butuh%20bantuan%20terkait%20pesanan%20saya"
          target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-full shadow-xl shadow-emerald-200/50 transition-transform hover:scale-110 z-50 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.093 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
        </a>
      </div>
    </BrowserRouter>
  );
}
