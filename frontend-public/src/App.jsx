import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Search, ChevronRight, Package, Truck, Printer, Phone, Trash2, ArrowLeft, ShoppingCart, CheckCircle2, Image as ImageIcon, Check, Menu, X, User, Copy } from 'lucide-react';
import { getPublicProducts, createPublicOrder, trackPublicOrder, getPublicSettings, payPublicOrder, uploadImage, requestOTP } from './lib/api';
import { Toaster, toast } from 'sonner';
import { CustomEditor } from './components/CustomEditor';

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
const Navbar = ({ cartCount, settings }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
              <Printer size={24} />
            )}
            <span>{settings?.business_name || "Madatama Print"}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">Katalog</Link>
            <Link to="/track" onClick={() => window.dispatchEvent(new Event('resetTrack'))} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">Lacak Pesanan</Link>
            <Link to="/cart" className="relative text-slate-700 hover:text-indigo-600 p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors mr-2 sm:mr-0">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </Link>
            {/* Hamburger Button */}
            <button
              className="sm:hidden text-slate-600 hover:text-indigo-600 p-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay & Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar */}
          <div className="relative ml-auto w-[280px] max-w-[80%] bg-white h-full shadow-2xl flex flex-col pt-16 px-6">
            <button
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-full"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
            <div className="flex flex-col gap-6 mt-8">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-bold text-slate-700 hover:text-indigo-600 border-b border-slate-100 pb-4"
              >
                Katalog
              </Link>
              <Link
                to="/track"
                onClick={() => { setMobileMenuOpen(false); window.dispatchEvent(new Event('resetTrack')); }}
                className="text-lg font-bold text-slate-700 hover:text-indigo-600 border-b border-slate-100 pb-4"
              >
                Lacak Pesanan
              </Link>
            </div>

            <div className="mt-auto pb-8">
              <p className="text-xs text-slate-400 font-medium">© 2026 {settings?.business_name || "Madatama Pro"}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Footer Component
const Footer = ({ settings }) => (
  <footer className="bg-slate-900 text-slate-400 py-12 text-center mt-auto">
    <p className="text-lg font-bold text-white mb-2">{settings?.business_name || "Madatama Print"}</p>
    <p className="text-sm">Percetakan & Branding Berkualitas, Langsung dari Layar Anda</p>
    <p className="text-xs mt-8 opacity-60">© 2026 {settings?.business_name || "Madatama Pro"}. All rights reserved.</p>
  </footer>
);

// Home (Catalog)
const Catalog = ({ cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ title: 'Kualitas Terbaik, Harga Masuk Akal.', subtitle: 'Dari spanduk besar hingga stempel kecil, semua kebutuhan promosi dan bisnis Anda ada di sini.' });
  const [loading, setLoading] = useState(true);
  const [activeKategori, setActiveKategori] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [cardQtys, setCardQtys] = useState({});
  const [editingProduct, setEditingProduct] = useState(null);

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

  const addToCart = (p, customCatatan = "", customImage = null) => {
    const qtyToAdd = cardQtys[p.id] || 1;
    setCart(curr => {
      // If customized, just append to keep customizations distinct
      if (customImage || customCatatan) {
        return [...curr, { product_id: p.id, product: p, qty: qtyToAdd, catatan: customCatatan, custom_image: customImage }];
      }
      const exist = curr.find(x => x.product_id === p.id && !x.custom_image);
      if (exist) {
        return curr.map(x => x.product_id === p.id && !x.custom_image ? { ...x, qty: x.qty + qtyToAdd } : x);
      }
      return [...curr, { product_id: p.id, product: p, qty: qtyToAdd, catatan: "" }];
    });
    toast.success(`${qtyToAdd}x ${p.nama} ditambahkan ke Keranjang`, {
      icon: <CheckCircle2 className="text-emerald-500" size={18} />
    });
    // Reset qty after add
    setCardQtys(prev => ({ ...prev, [p.id]: 1 }));
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
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div className={`text-center mb-4 py-4 md:py-6 rounded-3xl border shadow-sm relative overflow-hidden ${settings.banner_url ? 'bg-slate-900 border-slate-800' : getGradientClass(settings.theme_gradient)}`}>
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
        <h1 className={`text-xl md:text-3xl font-black mb-1 px-4 md:px-8 tracking-tight leading-tight max-w-3xl mx-auto relative z-10 whitespace-pre-wrap ${settings.banner_url ? 'text-white' : 'text-slate-900'}`}>{settings.title}</h1>
        <p className={`max-w-lg mx-auto px-4 md:px-8 relative z-10 text-xs md:text-sm leading-relaxed font-medium ${settings.banner_url ? 'text-slate-300' : 'text-slate-600'}`}>{settings.subtitle}</p>
      </div>

      {products.length > 0 && (
        <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-lg rounded-2xl border border-slate-200 p-3 sm:px-4 flex flex-col md:flex-row justify-between md:items-center gap-3 mb-5 shadow-sm transition-all duration-300 mx-auto">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col">
              <div className="aspect-[4/3] sm:aspect-[5/4] bg-slate-100 relative overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <Package size={32} />
                    <span className="text-[10px] font-medium uppercase tracking-widest mt-1.5">{p.kategori}</span>
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-700 shadow-sm">
                  {p.kategori}
                </div>
              </div>
              <div className="p-3 sm:p-4 flex flex-col flex-1">
                <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug line-clamp-2" title={p.nama}>{p.nama}</h3>
                {p.deskripsi && <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-1 mb-2" title={p.deskripsi}>{p.deskripsi}</p>}

                <div className="flex flex-wrap items-center gap-1 mt-auto pb-2.5 border-b border-slate-50">
                  <span className="text-[10px] font-semibold text-slate-400 relative top-px">Est.</span>
                  <p className="font-black text-indigo-600 text-sm sm:text-[15px]">{formatRupiah(p.harga_jual)}</p>
                </div>

                <div className="flex flex-col gap-2 pt-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-none flex bg-slate-50 border border-slate-200 rounded-lg h-[34px] overflow-hidden shadow-sm">
                      <button
                        onClick={() => setCardQtys(prev => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] || 1) - 1) }))}
                        className="w-8 flex-none flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors font-bold"
                      >-</button>
                      <input
                        type="number"
                        min="1"
                        value={cardQtys[p.id] || 1}
                        onChange={(e) => setCardQtys(prev => ({ ...prev, [p.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-8 flex-none bg-transparent text-center font-bold text-slate-700 border-x border-slate-200 focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setCardQtys(prev => ({ ...prev, [p.id]: (prev[p.id] || 1) + 1 }))}
                        className="w-8 flex-none flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors font-bold"
                      >+</button>
                    </div>

                    <div className="flex-1 flex gap-1.5 h-[34px]">
                      <button onClick={() => addToCart(p)} className="flex-1 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm" title="Tambah ke Keranjang">
                        <ShoppingCart size={14} />
                      </button>

                      {/(kaos|baju|pakaian)/i.test(p.nama + ' ' + (p.kategori || '')) && (
                        <button onClick={() => setEditingProduct(p)} className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm" title="Desain Kustom">
                          <ImageIcon size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingProduct && (
        <CustomEditor product={editingProduct} onClose={() => setEditingProduct(null)} onAddToCart={addToCart} />
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
  const [savedIdentities, setSavedIdentities] = useState([]);

  // States for OTP Modal
  const [showOtp, setShowOtp] = useState(false);
  const [otpPin, setOtpPin] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setInterval(() => setOtpCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('madatama_identity');
      let parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) parsed = [parsed];

      setSavedIdentities(parsed);
      if (parsed.length > 0) {
        setFormData({ nama: parsed[0].nama, kontak: parsed[0].kontak });
      }
    } catch (e) { }
  }, []);

  const updateItem = (index, field, val) => {
    const newCart = [...cart];
    newCart[index][field] = val;
    setCart(newCart);
  };

  const removeItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Handle 1: Minta OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Keranjang masih kosong!");
      return;
    }

    setLoading(true);
    try {
      const data = await requestOTP(formData.kontak);
      toast.success(`[MODE DEV] PIN ANDA: ${data.dev_pin}`, { duration: 10000 });
      setShowOtp(true);
      setOtpCooldown(60);
      setOtpPin("");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal meminta OTP. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpCooldown > 0) return;
    try {
      await requestOTP(formData.kontak);
      toast.success("Kode ulang telah dikirim!");
      setOtpCooldown(60);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal kirim ulang OTP.");
    }
  };

  // Handle 2: Buat Pesanan Asli Sesudah OTP valid
  const confirmOrder = async (e) => {
    e.preventDefault();
    if (!otpPin || otpPin.length !== 4) {
      toast.error("Masukkan 4-digit PIN dengan benar.");
      return;
    }

    setLoading(true);
    try {
      // Helper: convert base64 dataURL to Blob tanpa menggunakan fetch (lebih reliable)
      const dataURLToBlob = (dataURL) => {
        const [header, base64] = dataURL.split(',');
        const mime = header.match(/:(.*?);/)[1];
        const binary = atob(base64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        return new Blob([arr], { type: mime });
      };

      // Map frontend cart format to backend expected items format
      const processedItems = await Promise.all(cart.map(async c => {
        let finalCatatan = c.catatan;
        let finalImage = "";
        if (c.custom_image) {
          try {
            let blob;
            if (c.custom_image.startsWith('data:')) {
              // Base64 dataURL dari editor desain — konversi langsung ke Blob
              blob = dataURLToBlob(c.custom_image);
            } else {
              // URL eksternal biasa — fetch dulu
              const res = await fetch(c.custom_image);
              blob = await res.blob();
            }
            const file = new File([blob], "custom_design.png", { type: "image/png" });
            const url = await uploadImage(file);
            finalCatatan += `\n[LINK DESAIN KUSTOM: ${url}]`;
            finalImage = url;
          } catch (err) {
            console.warn("Gagal upload custom image:", err);
          }
        }
        return { product_id: c.product_id, qty: c.qty, catatan: finalCatatan.trim(), custom_image: finalImage };
      }));

      const payload = {
        nama: formData.nama,
        kontak: formData.kontak,
        otp_pin: otpPin,
        items: processedItems
      };

      const res = await createPublicOrder(payload);

      // Save identity array for next time auto-fill (up to 5 profiles)
      let currentIdentities = [];
      try {
        const saved = localStorage.getItem('madatama_identity');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) currentIdentities = parsed;
          else currentIdentities = [parsed];
        }
      } catch (err) { }

      const newId = { nama: formData.nama, kontak: formData.kontak };
      const nonDups = currentIdentities.filter(i => i.nama !== newId.nama || i.kontak !== newId.kontak);
      const nextIdentities = [newId, ...nonDups].slice(0, 3);
      localStorage.setItem('madatama_identity', JSON.stringify(nextIdentities));
      setSavedIdentities(nextIdentities);

      setShowOtp(false);
      setCart([]); // Clear cart
      setRecentOrders(curr => {
        const _new = [res.order_id, ...curr.filter(x => x !== res.order_id)].slice(0, 5);
        return _new;
      });

      toast.success("Pesanan berhasil dibuat!");
      navigate(`/track?id=${res.order_id}`);

    } catch (e) {
      toast.error(e?.response?.data?.detail || "PIN Salah atau Kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  };

  // Kalkulasi est total
  const estTotal = cart.reduce((acc, c) => acc + ((c.product?.harga_jual * c.qty) || 0), 0);

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 py-4 md:py-6 px-5 md:px-8 text-white shadow-sm mb-4">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 right-40 h-48 w-48 rounded-full bg-indigo-900/20 blur-2xl pointer-events-none"></div>
          <div className="absolute left-1/2 -top-16 h-56 w-56 rounded-full bg-purple-400/20 blur-2xl pointer-events-none"></div>

          <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-xl md:text-3xl font-black text-white flex items-center gap-2.5 mb-1.5 tracking-tight">
                <ShoppingCart className="text-white/90" size={28} strokeWidth={2.5} /> Keranjang Belanja
              </h1>
              <p className="text-indigo-100 opacity-90 max-w-lg text-xs md:text-sm leading-relaxed font-medium">
                Periksa kembali rancangan produk Anda dan lengkapi detail pengiriman sebelum melanjutkan ke konfirmasi.
              </p>
            </div>
            <div className="flex-none hidden lg:block">
              <span className="bg-white/20 backdrop-blur-sm border border-white/20 text-white font-bold px-5 py-2 rounded-xl text-sm shadow-sm flex items-center gap-2">
                <ShoppingCart size={16} /> {cart.length} Produk Tertunda
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1">

            {cart.length === 0 ? (
              <div className="bg-white border text-center py-16 rounded-2xl shadow-sm border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart size={36} className="text-slate-300" />
                </div>
                <h2 className="text-xl font-black text-slate-700 mb-2">Keranjang Anda kosong</h2>
                <p className="text-slate-500 mb-6 text-sm">Yuk, mulai cari produk kebutuhan promosi Anda!</p>
                <Link to="/" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-sm transition-colors text-sm">Mulai Belanja</Link>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="hidden md:flex items-center gap-4 bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-500">
                  <div className="flex-1 pl-1.5">Produk</div>
                  <div className="w-28 text-center">Harga Satuan</div>
                  <div className="w-28 text-center">Kuantitas</div>
                  <div className="w-28 text-right pr-4">Total Harga</div>
                  <div className="w-16 text-center">Aksi</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {cart.map((item, idx) => (
                    <div key={idx} className="px-4 py-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex flex-1 gap-3 items-center">
                        <div className="w-16 h-16 flex-none border border-slate-200 bg-slate-50 p-0.5 relative rounded-lg overflow-hidden">
                          {item.custom_image ? (
                            <img src={item.custom_image} alt="custom" className="w-full h-full object-cover" />
                          ) : item.product?.image_url ? (
                            <img src={item.product?.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-slate-300"><Package size={20} /></div>
                          )}
                          {item.custom_image && <span className="absolute bottom-0 left-0 right-0 bg-indigo-600/90 text-white text-[7px] font-bold py-[1px] text-center">CUSTOM</span>}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="font-bold text-sm text-slate-800 line-clamp-1 leading-tight mb-1.5">{item.product?.nama}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="shrink-0 font-medium">Catatan:</span>
                            <input type="text" value={item.catatan} onChange={e => updateItem(idx, 'catatan', e.target.value)} placeholder="(Kosong)" className="flex-1 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-indigo-400 py-0.5" />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row items-center justify-between md:w-[440px] flex-none gap-2 sm:gap-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-0 border-slate-100">
                        <div className="w-28 text-center font-semibold text-slate-600 text-sm hidden md:block">
                          {formatRupiah(item.product?.harga_jual)}
                        </div>
                        <div className="w-28 flex justify-center">
                          <div className="flex items-center border border-slate-300 bg-white rounded-lg overflow-hidden">
                            <button onClick={() => updateItem(idx, 'qty', Math.max(1, item.qty - 1))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors font-bold">-</button>
                            <input type="number" min="1" value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 1)} className="w-10 h-8 border-x border-slate-300 bg-transparent text-center text-sm font-bold text-slate-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            <button onClick={() => updateItem(idx, 'qty', item.qty + 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors font-bold">+</button>
                          </div>
                        </div>
                        <div className="w-28 text-right font-bold text-rose-500 text-sm">
                          {formatRupiah(item.product?.harga_jual * item.qty)}
                        </div>
                        <div className="w-16 text-center">
                          <button onClick={() => removeItem(idx)} className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors">Hapus</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[320px] xl:w-[340px] flex-none">
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm sticky top-24">
              <h2 className="text-xl font-black text-slate-900 mb-4">Ringkasan Belanja</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-sm relative">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Detail Pemesan</p>

                  {savedIdentities.length > 0 && (
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-2.5 px-0.5 tracking-wider">Pilih Profil Tersimpan</p>
                      {/* Flex horizontal equal stretch format to prevent clipping */}
                      <div className="flex gap-1.5 w-full">
                        {savedIdentities.slice(0, 3).map((id, idx) => {
                          const isSelected = formData.nama === id.nama && formData.kontak === id.kontak;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFormData({ nama: id.nama, kontak: id.kontak })}
                              className={`px-2 py-2.5 rounded-lg text-center border transition-all shadow-sm relative overflow-hidden group flex-1 min-w-0 flex items-center justify-center ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'}`}
                            >
                              <span className={`font-extrabold text-xs truncate w-full z-10 px-1 ${isSelected ? 'text-indigo-800' : 'text-slate-700'}`}>{id.nama}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inputs set side-by-side to save 1 whole vertical row */}
                  <div className="flex gap-2">
                    <input required type="text" className="w-1/2 bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm placeholder:font-normal placeholder:text-slate-400" placeholder="Nama..." value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} />
                    <input required type="tel" className="w-1/2 bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm placeholder:font-normal placeholder:text-slate-400" placeholder="No. WA..." value={formData.kontak} onChange={e => setFormData({ ...formData, kontak: e.target.value })} />
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <div className="text-sm font-bold text-slate-500 mb-1">Estimasi Total</div>
                      <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">{formatRupiah(estTotal)}</div>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 p-2 rounded-lg text-xs leading-tight font-medium max-w-[130px] text-right border border-indigo-100">
                      WA <b>pembayaran final</b>
                    </div>
                  </div>

                  <button type="submit" disabled={loading || cart.length === 0} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 group">
                    {loading ? 'Memproses...' : 'Beli Sekarang'} {!loading && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4">
          <form onSubmit={confirmOrder} className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden text-center border border-slate-100">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-indigo-600" />
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-1 tracking-tight">Verifikasi WhatsApp</h2>
            <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed px-2">
              Demi keamanan, kami telah mengirimkan 4-Digit PIN ke WhatsApp <strong className="text-slate-700">{formData.kontak}</strong>.
            </p>

            <input
              type="text"
              value={otpPin}
              onChange={(e) => setOtpPin(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={4}
              className="w-full text-center tracking-[1.5em] text-3xl font-black mb-5 bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-inner"
              placeholder="••••"
              required
              autoFocus
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all mb-4 disabled:opacity-50"
            >
              {loading ? "Memverifikasi..." : "Konfirmasi & Beli Sekarang"}
            </button>

            <div className="text-xs font-semibold text-slate-500">
              Belum menerima kode?{" "}
              {otpCooldown > 0 ? (
                <span className="text-slate-400">Kirim ulang dalam {otpCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-indigo-600 hover:text-indigo-700 font-bold underline cursor-pointer transition-colors"
                >
                  Kirim Ulang
                </button>
              )}
            </div>

            <button type="button" onClick={() => setShowOtp(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

// Track Order Page
const TrackOrder = ({ recentOrders, setRecentOrders }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackId, setTrackId] = useState(searchParams.get('id') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [payProofUrl, setPayProofUrl] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [historyOrders, setHistoryOrders] = useState([]);

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (!idParam) {
      setResult(null);
      setTrackId('');
      setError('');
    }
  }, [searchParams]);

  useEffect(() => {
    const handleReset = () => {
      setResult(null);
      setTrackId('');
      setError('');
      setSearchParams({}, { replace: true });
    };
    window.addEventListener('resetTrack', handleReset);
    return () => window.removeEventListener('resetTrack', handleReset);
  }, [setSearchParams]);

  useEffect(() => {
    const demo = ['ORD-17F4E9D6', 'ORD-89AC81F0', 'ORD-3C6C011F', 'ORD-95BBC4A5', 'ORD-E8B4A48E'];
    // Merge demo automatically into React state, saving locally seamlessly via useRecentOrders hook!
    if (setRecentOrders) {
      setRecentOrders(curr => {
        const hasDemo = demo.every(id => curr.includes(id));
        if (!hasDemo) {
          return [...new Set([...demo, ...curr])];
        }
        return curr;
      });
    }
  }, [setRecentOrders]);

  const doTrack = async (e = null, overrideId = null) => {
    if (e) e.preventDefault();
    const idToTrack = overrideId || trackId.trim();
    if (!idToTrack) return;

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await trackPublicOrder(idToTrack);
      setResult(res);
      setTrackId(idToTrack);
      if (!overrideId) setSearchParams({ id: idToTrack }, { replace: true });
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

    // Tarik secara bersamaan detail semua ID yang tersimpan di perangkat lokal
    if (recentOrders.length > 0) {
      Promise.allSettled(recentOrders.map(id => trackPublicOrder(id)))
        .then(results => {
          const valid = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
          // Urutkan yang terbaru di atas berdasarkan tanggal
          setHistoryOrders(valid.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        });
    }
  }, [recentOrders]); // intentionally re-fetch if recentOrders changes

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">

      <div className={`relative overflow-hidden ${result ? 'rounded-xl p-3 mb-4' : 'rounded-3xl py-4 md:py-6 px-5 md:px-8 mb-4'} bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-sm transition-all duration-500`}>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 right-40 h-48 w-48 rounded-full bg-indigo-900/20 blur-2xl pointer-events-none"></div>

        <div className={`relative flex ${result ? 'flex-row items-center justify-between gap-4' : 'flex-col lg:flex-row lg:items-center lg:justify-between gap-4'}`}>
          <div className={result ? 'hidden sm:block flex-1' : 'flex-1'}>
            <h1
              onClick={() => { setTrackId(''); setResult(null); setError(''); setSearchParams({}, { replace: true }); }}
              className={`cursor-pointer hover:opacity-80 transition-opacity ${result ? 'text-lg mb-1' : 'text-xl md:text-3xl mb-1.5 md:mb-2 tracking-tight'} font-black text-white flex items-center gap-2`}
              title="Kembali ke Riwayat"
            >
              <Truck className={result ? "text-indigo-100" : "text-white/90"} size={result ? 20 : 28} strokeWidth={result ? 2 : 2.5} /> Lacak Pesanan
            </h1>
            {!result && (
              <p className="text-indigo-100 opacity-90 max-w-2xl text-xs md:text-sm leading-relaxed font-medium">
                Ketik ID pesanan atau nama Anda untuk memantau status pesanan, melihat visual produk, dan mengecek rincian riwayat transaksi secara aktual.
              </p>
            )}
          </div>

          <div className={`w-full flex-none ${result ? 'sm:w-[350px] lg:w-[400px]' : 'lg:w-[450px]'}`}>
            <form onSubmit={doTrack} className="relative shadow-xl rounded-xl group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                type="text"
                value={trackId}
                onChange={e => {
                  setTrackId(e.target.value);
                  if (e.target.value === '') {
                    setResult(null);
                    setError('');
                    setSearchParams({}, { replace: true });
                  }
                }}
                placeholder="ID (ORD-...) atau Nama..."
                className="w-full pl-9 pr-20 py-2.5 bg-white/95 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 rounded-xl outline-none transition-all focus:ring-2 focus:ring-white/30 uppercase font-mono font-bold text-[11px] sm:text-xs"
              />
              <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 bg-slate-900 text-white px-4 rounded-lg hover:bg-slate-800 transition-colors font-bold tracking-wider text-[11px] shadow-sm">
                LACAK
              </button>
            </form>
          </div>
        </div>
      </div>

      {!result && historyOrders.length === 0 && recentOrders.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          <p className="w-full text-xs text-slate-500 font-bold mb-1 text-center">Memuat Riwayat Perangkat...</p>
        </div>
      )}

      {(() => {
        const displayedHistory = historyOrders.filter(o =>
          o.id.toLowerCase().includes(trackId.toLowerCase()) ||
          (o.nama && o.nama.toLowerCase().includes(trackId.toLowerCase()))
        );

        return !result && historyOrders.length > 0 && (
          <div className="mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-5">
            <h3 className="font-extrabold text-slate-800 text-lg mb-6 text-center">Riwayat Belanja di Perangkat Ini</h3>

            {displayedHistory.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">Tidak ada riwayat yang cocok dengan "{trackId}"</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
                {displayedHistory.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col" onClick={() => { doTrack(null, order.id); }}>
                    <div className="aspect-[4/3] sm:aspect-[5/4] bg-slate-100 relative overflow-hidden">
                      {(() => {
                        const firstItem = order.items?.[0];
                        const customImgMatch = firstItem?.catatan?.match(/\[LINK DESAIN KUSTOM: (.*?)\]/);
                        const customImgUrl = customImgMatch ? customImgMatch[1] : null;

                        if (customImgUrl) {
                          return <img src={customImgUrl} alt="custom" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        } else if (firstItem?.product?.image_url) {
                          return <img src={firstItem.product.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        } else {
                          return <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><Package size={32} /></div>
                        }
                      })()}

                      <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest text-slate-700 shadow-sm">
                        {new Date(order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>

                      {order.items && order.items.length > 1 && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-white font-bold text-xs bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">+{order.items.length - 1} Item Tambahan</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                      <p className="text-[10px] font-mono text-slate-400 font-bold tracking-wider mb-1">
                        {order.id}
                      </p>
                      <p className="font-bold text-sm text-slate-900 mb-3 truncate" title={order.nama}>{order.nama}</p>

                      <div className="flex flex-wrap gap-1.5 mt-auto pt-2.5 border-t border-slate-50">
                        <span className="text-[9px] bg-slate-100 border border-slate-200 px-1.5 py-1 rounded font-bold text-slate-600 uppercase tracking-widest">{order.status}</span>
                        <span className={`text-[9px] px-1.5 py-1 rounded border font-bold uppercase tracking-widest ${order.payment_status === 'Lunas' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : order.payment_status === 'Menunggu Konfirmasi' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                          {order.payment_status || 'BELUM BAYAR'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {loading && (
        <div className="mt-10 text-center">
          <p className="inline-flex items-center gap-2 text-indigo-600 font-bold animate-pulse bg-indigo-50 px-5 py-2.5 rounded-full"><span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Mencari Data Pesanan...</p>
        </div>
      )}

      {error && (
        <div className="mt-10 mx-auto max-w-lg bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error}
        </div>
      )}

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 mt-6">
          <div className="bg-slate-50 overflow-hidden flex flex-col w-full rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border border-slate-200/60 ring-2 ring-white">

            {(() => {
              const st = (result.status || '').toLowerCase();
              let theme = { bg: "bg-slate-900", text: "text-slate-400", badge: "bg-slate-500/20 text-slate-300 border-slate-500/30", dot: "bg-slate-400", blur: "bg-slate-500" };

              if (st.includes('diambil') && !st.includes('siap')) {
                // Already picked up
                theme = { bg: "bg-slate-800", text: "text-slate-400/80", badge: "bg-slate-500/30 text-slate-300 border-slate-500/40", dot: "bg-slate-400", blur: "bg-slate-500" };
              } else if (st.includes('siap')) {
                // Ready to pick up
                theme = { bg: "bg-teal-950", text: "text-teal-400/80", badge: "bg-teal-500/30 text-teal-300 border-teal-500/40", dot: "bg-teal-400", blur: "bg-teal-500" };
              } else if (st.includes('finishing')) {
                theme = { bg: "bg-purple-950", text: "text-purple-400/80", badge: "bg-purple-500/30 text-purple-300 border-purple-500/40", dot: "bg-purple-400", blur: "bg-purple-500" };
              } else if (st.includes('cetak')) {
                theme = { bg: "bg-orange-950", text: "text-orange-400/80", badge: "bg-orange-500/30 text-orange-300 border-orange-500/40", dot: "bg-orange-400", blur: "bg-orange-500" };
              } else if (st.includes('desain') || st.includes('proses')) {
                theme = { bg: "bg-indigo-950", text: "text-indigo-400/80", badge: "bg-indigo-500/30 text-indigo-300 border-indigo-500/40", dot: "bg-indigo-400", blur: "bg-indigo-500" };
              } else if (st.includes('selesai')) {
                theme = { bg: "bg-emerald-950", text: "text-emerald-400/80", badge: "bg-emerald-500/30 text-emerald-300 border-emerald-500/40", dot: "bg-emerald-400", blur: "bg-emerald-500" };
              } else if (st.includes('bayar') || st.includes('konfirmasi')) {
                // Waiting for payment
                theme = { bg: "bg-amber-950", text: "text-amber-400/80", badge: "bg-amber-500/30 text-amber-300 border-amber-500/40", dot: "bg-amber-400", blur: "bg-amber-500" };
              } else if (st.includes('batal') || st.includes('tolak')) {
                theme = { bg: "bg-rose-950", text: "text-rose-400/80", badge: "bg-rose-500/30 text-rose-300 border-rose-500/40", dot: "bg-rose-400", blur: "bg-rose-500" };
              }

              return (
                <div className={`relative ${theme.bg} px-4 sm:px-5 py-2.5 sm:py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 overflow-hidden rounded-t-xl transition-colors duration-500`}>
                  <div className={`absolute top-0 right-0 w-48 h-48 ${theme.blur} opacity-20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-colors duration-500`}></div>
                  <div className="relative z-10 w-full">
                    <p className={`${theme.text} text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-0.5 flex items-center gap-1.5`}><Truck size={13} /> ID & PEMESAN</p>
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <h2 className="font-mono font-black text-base sm:text-lg text-white tracking-tight leading-none break-all flex items-center gap-1.5">
                        {result.id}
                        <button onClick={() => { navigator.clipboard.writeText(result.id); toast.success("ID Transaksi disalin ke clipboard!", { icon: "📋" }); }} className="text-white/40 hover:text-white transition-colors" title="Salin ID">
                          <Copy size={14} className="mt-0.5" />
                        </button>
                      </h2>
                      <span className="text-white/20 text-lg font-light leading-none -mt-0.5">|</span>
                      <p className="font-sans font-bold text-sm sm:text-base text-white/95 truncate max-w-[140px] sm:max-w-[250px]" title={result.nama}>
                        <User size={13} className="inline mr-1 opacity-70 mb-0.5" />{result.nama}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 sm:text-right flex-none">
                    <p className={`${theme.text} text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-0.5 hidden sm:block`}>STATUS PESANAN</p>
                    <div className={`inline-flex items-center gap-1.5 ${theme.badge} font-extrabold px-3 py-1.5 rounded-md text-xs uppercase tracking-wider backdrop-blur-sm shadow-inner transition-colors duration-500`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} animate-pulse`}></span>
                      {result.status}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="p-5 sm:p-7">
              {result.items && result.items.length > 0 && (
                <div className="mt-2 mb-6">
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full border-collapse text-left min-w-[500px] bg-white">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-extrabold text-slate-400 tracking-widest">
                        <tr>
                          <th className="p-4">ITEM PESANAN</th>
                          <th className="p-4 w-24">JUMLAH</th>
                          <th className="p-4 w-40 text-center">PROGRES PRODUKSI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.items && result.items.map((it, i) => {
                          const saleItem = result.sales_items?.find(s => s.nama === (it.product?.nama || "Produk Web"));
                          const statusProduksi = saleItem ? saleItem.status : (result.status === "Selesai" ? "Selesai" : "Menunggu");

                          return (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-slate-100 rounded-lg relative overflow-hidden flex-none border border-slate-200/50">
                                    {it.custom_image ? <img src={it.custom_image} className="w-full h-full object-cover" /> :
                                      it.product?.image_url ? <img src={it.product?.image_url} className="w-full h-full object-cover" /> :
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><Package size={20} /></div>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-extrabold text-sm text-slate-800 line-clamp-1 mb-1 leading-snug">{it.product?.nama || "Produk"}</p>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider inline-block">
                                      {it.catatan ? it.catatan.replace(/\[LINK DESAIN KUSTOM:.*?\]/g, '').trim() || 'Desain Terlampir' : 'Katalog Standar'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-sm">{it.qty} <span className="text-xs opacity-60 ml-0.5">PCS</span></span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider ${statusProduksi === 'Selesai' ? 'bg-emerald-50 text-emerald-700' : statusProduksi === 'Menunggu' ? 'bg-slate-100 text-slate-600' : statusProduksi === 'Desain' ? 'bg-indigo-100 text-indigo-700 animate-pulse' : 'bg-amber-50 text-amber-700 animate-pulse'}`}>
                                  {statusProduksi}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.status === "Menunggu Pembayaran" && result.total_tagihan > 0 && (
                <div className="border border-indigo-100 bg-indigo-50/50 rounded-2xl p-5 mt-6 animate-in slide-in-from-top-2 relative">
                  <h3 className="font-black text-indigo-900 text-lg mb-1">Penyelesaian Pembayaran</h3>
                  <p className="text-sm text-indigo-700/80 mb-5 leading-relaxed">Pesanan Anda telah disetujui. Selesaikan pembayaran sesuai total tagihan agar segera kami proses ke tahap produksi.</p>

                  <div className="bg-white shadow-sm rounded-xl p-4 border border-indigo-100/50 mb-5 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-400"></div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">Total Tagihan Final Anda</span>
                    <span className="block text-3xl font-black text-indigo-600 tracking-tight">{formatRupiah(result.total_tagihan)}</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-indigo-900 mb-2">Pilih Cara Bayar</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['QRIS', 'BCA', 'Mandiri'].map(m => (
                          <button key={m} onClick={() => setPayMethod(m)} type="button" className={`px-2 py-3 rounded-xl border text-xs font-bold transition-all ${payMethod === m ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>{m === 'QRIS' ? 'QRIS/E-Wallet' : m}</button>
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

              <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-slate-200/50">
                {result.bukti_bayar && result.status !== "SELESAI" && (
                  <div className="flex-1 bg-gradient-to-r from-emerald-50 to-emerald-100/30 border border-emerald-100 px-4 py-3.5 rounded-xl flex gap-3 flex-col sm:flex-row sm:items-center shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200 rounded-full blur-3xl -mr-12 -mt-12 opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-none relative z-10 animate-in zoom-in"><CheckCircle2 size={14} strokeWidth={2.5} /></div>
                    <div className="relative z-10">
                      <h5 className="text-xs font-black uppercase tracking-[0.1em] mb-0.5 text-emerald-900">Pembayaran Terverifikasi</h5>
                      <p className="text-xs font-medium leading-relaxed text-emerald-700/80">Menunggu konfirmasi pelunasan oleh pihak toko.</p>
                    </div>
                  </div>
                )}
                <div className="flex-1 bg-white border border-slate-200/70 px-4 py-3.5 rounded-xl flex gap-3 flex-col sm:flex-row sm:items-center shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 hover:shadow-lg hover:border-slate-300 transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-200 rounded-full blur-3xl -mr-12 -mt-12 opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-none relative z-10"><Phone size={14} strokeWidth={2.5} /></div>
                  <div className="relative z-10">
                    <h5 className="text-xs font-black uppercase tracking-[0.1em] mb-0.5 text-slate-800">CS Representative</h5>
                    <p className="text-xs font-medium leading-relaxed text-slate-500">Admin akan segera menghubungi via WhatsApp terkait info lanjut.</p>
                  </div>
                </div>
              </div>

              <a
                href={`https://wa.me/6281234567890?text=Halo%20Admin%20Madatama,%20saya%20mengecek%20pesanan%20saya%20dengan%20nomor%20resi%20*${result.id}*.%20Apakah%20bisa%20dibantu?`}
                target="_blank" rel="noopener noreferrer"
                className="w-full mt-4 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da851] text-white font-extrabold py-3.5 rounded-xl shadow-[0_8px_20px_-6px_rgba(37,211,102,0.5)] hover:shadow-[0_12px_24px_-6px_rgba(37,211,102,0.6)] transition-all flex justify-center items-center gap-2 text-sm tracking-wide transform hover:-translate-y-0.5"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                Konsultasi Resi dengan WhatsApp CS
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [cart, setCart] = useCart();
  const [recentOrders, setRecentOrders] = useRecentOrders();
  const [settings, setSettings] = useState(null);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  useEffect(() => {
    getPublicSettings().then(res => {
      setSettings(res);
      if (res.business_name) document.title = res.business_name;
      if (res.favicon_url) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = res.favicon_url;
      }
    }).catch(() => { });
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors theme="light" />
      <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-100">
        <Navbar cartCount={cartCount} settings={settings} />
        <main className="flex-1 bg-slate-50/50">
          <Routes>
            <Route path="/" element={<Catalog cart={cart} setCart={setCart} />} />
            <Route path="/cart" element={<Cart cart={cart} setCart={setCart} setRecentOrders={setRecentOrders} />} />
            <Route path="/track" element={<TrackOrder recentOrders={recentOrders} setRecentOrders={setRecentOrders} />} />
          </Routes>
        </main>
        <Footer settings={settings} />

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
