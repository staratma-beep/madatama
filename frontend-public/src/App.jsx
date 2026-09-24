import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  return (
    <>
      <nav className="w-full sticky top-0 z-50 transition-all bg-white/90 backdrop-blur-xl border-b-[1.5px] border-slate-200">
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-black text-xl text-slate-900 tracking-tight">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
              <Printer size={24} strokeWidth={2.5} />
            )}
            <span className="uppercase">{settings?.business_name || "Madatama Print"}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">Katalog</Link>
            <Link to="/track" onClick={() => window.dispatchEvent(new Event('resetTrack'))} className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">Lacak Pesanan</Link>
            <Link to="/cart" className="relative p-2 rounded-sm transition-colors mr-2 sm:mr-0 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-[1.5px] border-slate-200 hover:border-slate-900">
              <ShoppingCart size={18} strokeWidth={2.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-sm bg-slate-900 text-[10px] font-black text-white ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </Link>
            {/* Hamburger Button */}
            <button
              className="sm:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-50 border-[1.5px] border-slate-200 rounded-sm"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={20} strokeWidth={2.5} />
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
    <>
      {/* Banner Section */}
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        <div className={`relative w-full ${settings.banner_url ? 'h-[25vh] min-h-[240px] bg-slate-900 border-[1.5px] border-slate-900 overflow-hidden' : 'pt-24 pb-8 overflow-hidden border-[1.5px] border-slate-200 ' + getGradientClass(settings.theme_gradient)}`} style={{ borderRadius: '2px' }}>
          {settings.banner_url ? (
            <div className="absolute inset-0">
              <img
                src={settings.banner_url} alt="Banner"
                className={`w-full h-full object-cover ${objPosition}`}
                style={{ opacity: imgOpacity }}
              />
              {/* Dark gradient overlay for text readability */}
              <div className={`absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent`} />
              <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent`} />
            </div>
          ) : (
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
          )}

          {/* Aesthetic Vectors */}
          <div className="absolute -top-16 right-12 w-64 h-64 border border-white/20 rounded-full opacity-60 hidden md:block pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40 font-light">+</div>
          </div>
          <div className="absolute -bottom-8 -left-8 w-48 h-48 border border-white/20 rounded-full opacity-60 hidden md:block pointer-events-none"></div>
          <div className="absolute top-1/2 left-4 w-8 h-8 opacity-50 hidden md:block pointer-events-none">
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/40"></div>
            <div className="absolute top-0 left-1/2 w-px h-full bg-white/40"></div>
          </div>
          <div className="absolute bottom-1/4 right-[20%] w-4 h-4 opacity-30 pointer-events-none">
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/40"></div>
            <div className="absolute top-0 left-1/2 w-px h-full bg-white/40"></div>
          </div>

          <div className="relative z-10 w-full h-full mx-auto px-6 lg:px-10 flex flex-col justify-center pt-8 pb-4">
            <p className="text-white/80 font-bold tracking-[0.2em] text-[9px] sm:text-[11px] mb-2 uppercase drop-shadow-md">
              {settings.subtitle || "FEATURED COLLECTION"}
            </p>
            <h1 className={`text-xl sm:text-2xl md:text-3xl font-black mb-4 tracking-tighter leading-tight max-w-2xl whitespace-pre-wrap ${settings.banner_url ? 'text-white drop-shadow-2xl' : 'text-slate-900'}`}>
              {settings.title || "PUSHING\nBOUNDARIES"}
            </h1>

            <a href="#catalog" className="w-fit text-xs font-black tracking-widest text-white uppercase border-[1.5px] border-white/60 px-6 py-2.5 hover:bg-white hover:text-slate-900 transition-all duration-300 backdrop-blur-sm shadow-xl" style={{ borderRadius: '2px' }}>
              SHOP NOW
            </a>
          </div>
        </div>
      </div >

      <div id="catalog" className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {products.length > 0 && (
          <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-md border border-slate-200 p-2 flex flex-col md:flex-row justify-between md:items-center gap-3 mb-6 shadow-sm transition-all mx-auto" style={{ borderRadius: '2px' }}>
            <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveKategori(c)}
                  className={`px-5 py-2.5 flex-none font-black text-[11px] uppercase tracking-wider transition-all ${activeKategori === c
                    ? 'bg-slate-900 border-[1.5px] border-slate-900 text-white'
                    : 'bg-transparent border-[1.5px] border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  style={{ borderRadius: '2px' }}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80 flex-none group px-1 sm:px-0 pb-1 sm:pb-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} strokeWidth={2.5} />
              <input
                type="text"
                placeholder="CARI KEBUTUHAN CETAK & SABLON..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-[1.5px] border-slate-200 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-bold tracking-wide"
                style={{ borderRadius: '2px' }}
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
              <div key={p.id} className="bg-white border-[1.5px] border-slate-200 hover:border-slate-900 transition-all duration-300 group flex flex-col" style={{ borderRadius: '2px' }}>
                <div className="relative pt-[115%] bg-[#F3F4F6] border-b-[1.5px] border-slate-200 overflow-hidden group-hover:border-slate-900 transition-colors">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.nama} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <ImageIcon size={32} strokeWidth={1.5} />
                    </div>
                  )}
                  {/* Category tag */}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[9px] font-black tracking-widest text-slate-900 uppercase border border-slate-200 shadow-sm" style={{ borderRadius: '2px' }}>
                    {p.kategori}
                  </div>
                </div>
                <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                  <h3 className="font-black text-sm sm:text-base text-slate-900 mb-0.5 leading-snug uppercase tracking-tight line-clamp-2" title={p.nama}>{p.nama}</h3>
                  {p.deskripsi && <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2" title={p.deskripsi}>{p.deskripsi}</p>}

                  <div className="mt-auto pt-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">EST. HARGA</span>
                    <p className="font-black text-slate-900 text-lg sm:text-xl tracking-tight mb-2.5">{formatRupiah(p.harga_jual)}</p>

                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex flex-wrap items-center gap-1.5 w-full">
                        <div className="flex-1 flex border-[1.5px] border-slate-200 h-[36px] group-hover:border-slate-900 transition-colors bg-white min-w-[80px]">
                          <button
                            onClick={() => setCardQtys(prev => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] || 1) - 1) }))}
                            className="w-7 sm:w-8 flex-none flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-lg"
                          >-</button>
                          <input
                            type="number"
                            min="1"
                            value={cardQtys[p.id] || 1}
                            onChange={(e) => setCardQtys(prev => ({ ...prev, [p.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                            className="w-full flex-1 min-w-0 bg-transparent text-center font-black text-slate-900 border-x-[1.5px] border-slate-200 group-hover:border-slate-900 transition-colors focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => setCardQtys(prev => ({ ...prev, [p.id]: (prev[p.id] || 1) + 1 }))}
                            className="w-7 sm:w-8 flex-none flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-lg"
                          >+</button>
                        </div>
                        <div className="flex-[2] flex gap-1.5 h-[36px] min-w-[110px]">
                          <button onClick={() => addToCart(p)} className="flex-1 bg-slate-900 border-[1.5px] border-slate-900 hover:bg-white hover:text-slate-900 text-white flex items-center justify-center gap-1.5 transition-all font-black text-[10px] sm:text-[11px] uppercase tracking-wider min-w-0 px-2" title="Keranjang">
                            <ShoppingCart size={14} strokeWidth={2.5} className="flex-none" /> <span className="truncate">Beli</span>
                          </button>
                          {/(kaos|baju|pakaian|t-?shirt|hoodie|jacket|jaket)/i.test(p.nama + ' ' + (p.kategori || '')) && (
                            <button onClick={() => setEditingProduct(p)} className="flex-none px-2.5 sm:px-3 border-[1.5px] border-slate-200 text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors group-hover:border-slate-900" title="Desain Kustom">
                              <ImageIcon size={15} strokeWidth={2} />
                            </button>
                          )}
                        </div>
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
    </>
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
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-slate-900 border-[1.5px] border-slate-900 py-6 px-5 md:px-8 text-white mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between shadow-sm" style={{ borderRadius: '2px' }}>
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl font-black text-white flex items-center gap-2.5 mb-1.5 tracking-tight uppercase">
              <ShoppingCart className="text-white" size={28} strokeWidth={2.5} /> Keranjang Belanja
            </h1>
            <p className="text-slate-300 max-w-lg text-[10px] md:text-xs font-black uppercase tracking-wider">
              PERIKSA KEMBALI RANCANGAN PRODUK DAN LENGKAPI DETAIL PENGIRIMAN.
            </p>
          </div>
          <div className="flex-none hidden lg:block">
            <span className="bg-white text-slate-900 font-black px-5 py-2.5 text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm" style={{ borderRadius: '2px' }}>
              <ShoppingCart size={16} strokeWidth={2.5} /> {cart.length} PRODUK TERTUNDA
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            {cart.length === 0 ? (
              <div className="bg-white border-[1.5px] border-slate-200 text-center py-16 shadow-sm" style={{ borderRadius: '2px' }}>
                <div className="w-16 h-16 bg-slate-50 border-[1.5px] border-slate-200 flex items-center justify-center mx-auto mb-4" style={{ borderRadius: '2px' }}>
                  <ShoppingCart size={32} className="text-slate-300" strokeWidth={2} />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Keranjang Bag Kosong</h2>
                <p className="text-slate-500 mb-6 text-xs font-bold uppercase tracking-wider">Mulai cari produk cetak & sablon Anda!</p>
                <Link to="/" className="inline-block bg-slate-900 border-[1.5px] border-slate-900 hover:bg-white hover:text-slate-900 text-white font-black py-3 px-8 uppercase tracking-widest text-xs transition-colors shadow-sm" style={{ borderRadius: '2px' }}>Katalog Produk</Link>
              </div>
            ) : (
              <div className="bg-white border-[1.5px] border-slate-200 overflow-hidden shadow-sm" style={{ borderRadius: '2px' }}>
                <div className="hidden md:flex items-center gap-4 bg-slate-50 border-b-[1.5px] border-slate-200 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-800">
                  <div className="flex-1 pl-1">PRODUK</div>
                  <div className="w-28 text-center">HARGA SATUAN</div>
                  <div className="w-28 text-center">KUANTITAS</div>
                  <div className="w-28 text-right pr-4">TOTAL</div>
                  <div className="w-16 text-center">AKSI</div>
                </div>
                <div className="divide-y-[1.5px] divide-slate-100">
                  {cart.map((item, idx) => (
                    <div key={idx} className="px-5 py-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex flex-1 gap-4 items-center">
                        <div className="w-[72px] h-[72px] flex-none border-[1.5px] border-slate-200 bg-[#F3F4F6] relative overflow-hidden" style={{ borderRadius: '2px' }}>
                          {item.custom_image ? (
                            <img src={item.custom_image} alt="custom" className="w-full h-full object-cover" />
                          ) : item.product?.image_url ? (
                            <img src={item.product?.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-slate-300"><ImageIcon size={24} strokeWidth={1.5} /></div>
                          )}
                          {item.custom_image && <span className="absolute top-1 right-1 bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.5 tracking-wider border-[1.5px] border-slate-900">CUSTOM</span>}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                          <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 line-clamp-2 leading-snug">{item.product?.nama}</h3>
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 text-[10px] font-black text-slate-400 uppercase tracking-widest">CATATAN:</span>
                            <input type="text" value={item.catatan} onChange={e => updateItem(idx, 'catatan', e.target.value)} placeholder="(OPSIONAL)" className="flex-1 bg-transparent border-b-[1.5px] border-dashed border-slate-300 focus:outline-none focus:border-slate-900 py-1 text-xs font-bold text-slate-800 uppercase tracking-wide placeholder:text-slate-300 rounded-none transition-colors" />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row items-center justify-between md:w-[440px] flex-none gap-2 sm:gap-4 mt-2 md:mt-0 pt-3 md:pt-0 border-t-[1.5px] md:border-0 border-slate-200">
                        <div className="w-28 text-center font-black text-slate-500 text-xs hidden md:block tracking-wide">
                          {formatRupiah(item.product?.harga_jual)}
                        </div>
                        <div className="w-28 flex justify-center">
                          <div className="flex items-center border-[1.5px] border-slate-200 bg-white hover:border-slate-900 transition-colors" style={{ borderRadius: '2px' }}>
                            <button onClick={() => updateItem(idx, 'qty', Math.max(1, item.qty - 1))} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-lg">-</button>
                            <input type="number" min="1" value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 1)} className="w-10 h-8 border-x-[1.5px] border-slate-200 bg-transparent text-center text-xs font-black text-slate-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            <button onClick={() => updateItem(idx, 'qty', item.qty + 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-lg">+</button>
                          </div>
                        </div>
                        <div className="w-28 text-right font-black text-slate-900 text-sm tracking-wide">
                          {formatRupiah(item.product?.harga_jual * item.qty)}
                        </div>
                        <div className="w-16 text-center">
                          <button onClick={() => removeItem(idx)} className="text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-slate-900 transition-colors">HAPUS</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[360px] flex-none">
            <div className="bg-white border-[1.5px] border-slate-200 p-6 shadow-sm sticky top-24" style={{ borderRadius: '2px' }}>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-5">RINGKASAN BELANJA</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DETAIL PEMESANAN</p>

                  {savedIdentities.length > 0 && (
                    <div className="bg-slate-50 p-3 border-[1.5px] border-slate-200" style={{ borderRadius: '2px' }}>
                      <p className="text-[9px] text-slate-400 font-black uppercase mb-2 tracking-widest">PILIH PROFIL TERSIMPAN</p>
                      <div className="flex gap-1.5 w-full">
                        {savedIdentities.slice(0, 3).map((id, idx) => {
                          const isSelected = formData.nama === id.nama && formData.kontak === id.kontak;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFormData({ nama: id.nama, kontak: id.kontak })}
                              className={`px-2 py-2.5 text-center border-[1.5px] transition-all group flex-1 min-w-0 flex items-center justify-center ${isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-900 text-slate-500'}`} style={{ borderRadius: '2px' }}
                            >
                              <span className={`font-black text-[10px] uppercase tracking-wider truncate w-full px-1 ${isSelected ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`}>{id.nama}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5">
                    <input required type="text" className="w-full bg-slate-50 border-[1.5px] border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-bold" placeholder="NAMA LENGKAP..." value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} style={{ borderRadius: '2px' }} />
                    <input required type="tel" className="w-full bg-slate-50 border-[1.5px] border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-bold" placeholder="NOMOR WHATSAPP AKTIF..." value={formData.kontak} onChange={e => setFormData({ ...formData, kontak: e.target.value })} style={{ borderRadius: '2px' }} />
                  </div>
                </div>

                <div className="pt-2 border-t-[1.5px] border-slate-200">
                  <div className="flex justify-between items-end mb-5">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ESTIMASI TOTAL</div>
                      <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">{formatRupiah(estTotal)}</div>
                    </div>
                    <div className="bg-slate-900 text-white p-2 text-[9px] uppercase tracking-widest font-black max-w-[120px] text-right" style={{ borderRadius: '2px' }}>
                      WA PEMBAYARAN FINAL
                    </div>
                  </div>

                  <button type="submit" disabled={loading || cart.length === 0} className="w-full bg-slate-900 border-[1.5px] border-slate-900 hover:bg-white hover:text-slate-900 text-white text-[11px] font-black uppercase tracking-widest py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50 group" style={{ borderRadius: '2px' }}>
                    {loading ? 'MEMPROSES...' : 'CHECKOUT SEKARANG'} {!loading && <ChevronRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={confirmOrder} className="bg-white border-[1.5px] border-slate-900 w-full max-w-sm p-7 shadow-2xl relative overflow-hidden text-center" style={{ borderRadius: '2px' }}>
            <div className="w-16 h-16 bg-slate-50 border-[1.5px] border-slate-200 mx-auto flex items-center justify-center mb-5" style={{ borderRadius: '2px' }}>
              <CheckCircle2 size={32} strokeWidth={2.5} className="text-slate-900" />
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Verifikasi WhatsApp</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 mb-6 font-bold uppercase tracking-widest leading-relaxed">
              KAMI MENGIRIM KODE PIN KE <br /><strong className="text-slate-900">{formData.kontak}</strong>
            </p>

            <input
              type="text"
              value={otpPin}
              onChange={(e) => setOtpPin(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={4}
              className="w-full text-center tracking-[1.5em] text-3xl font-black mb-5 bg-slate-50 border-[1.5px] border-slate-200 px-6 py-4 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300"
              placeholder="••••"
              required
              autoFocus
              style={{ borderRadius: '2px' }}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 border-[1.5px] border-slate-900 hover:bg-white hover:text-slate-900 text-white text-[11px] font-black uppercase tracking-widest py-4 transition-all mb-5 disabled:opacity-50"
              style={{ borderRadius: '2px' }}
            >
              {loading ? "MEMVERIFIKASI..." : "KONFIRMASI SEKARANG"}
            </button>

            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              BELUM MENERIMA KODE?{" "}
              {otpCooldown > 0 ? (
                <span className="text-slate-300 ml-1">TUNGGU ({otpCooldown}S)</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-slate-900 hover:underline transition-colors ml-1"
                >
                  KIRIM ULANG
                </button>
              )}
            </div>

            <button type="button" onClick={() => setShowOtp(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors">
              <X size={20} strokeWidth={2.5} />
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">
      <div className={`relative overflow-hidden ${result ? 'py-4 px-5' : 'py-6 px-5 md:px-8'} bg-slate-900 border-[1.5px] border-slate-900 text-white shadow-sm mb-6 transition-all duration-500`} style={{ borderRadius: '2px' }}>
        <div className={`relative flex ${result ? 'flex-row items-center gap-4' : 'flex-col lg:flex-row lg:items-center justify-between gap-4'}`}>
          <div className={result ? 'hidden sm:block flex-1' : 'flex-1'}>
            <h1
              onClick={() => { setTrackId(''); setResult(null); setError(''); setSearchParams({}, { replace: true }); }}
              className={`cursor-pointer hover:text-slate-300 transition-colors uppercase ${result ? 'text-lg mb-0' : 'text-xl md:text-3xl mb-1.5'} font-black flex items-center gap-2.5 tracking-tight`}
              title="Kembali ke Riwayat"
            >
              <Truck size={result ? 20 : 28} strokeWidth={2.5} /> Lacak Pesanan
            </h1>
            {!result && (
              <p className="text-slate-300 max-w-2xl text-[10px] md:text-xs font-black uppercase tracking-wider">
                KETIK NOMOR RESI/ID ATAU NAMA ANDA UNTUK MELIHAT STATUS DAN DETAIL PESANAN.
              </p>
            )}
          </div>

          <div className={`w-full flex-none ${result ? 'sm:w-[350px] lg:w-[400px]' : 'lg:w-[450px]'}`}>
            <form onSubmit={doTrack} className="relative shadow-sm group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={16} strokeWidth={2.5} className="text-slate-400 group-focus-within:text-slate-900 transition-colors" />
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
                placeholder="ID TRANSAKSI (ORD-...) ATAU NAMA"
                className="w-full pl-10 pr-24 py-3 bg-white hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border-[1.5px] border-slate-200 focus:border-slate-900 outline-none transition-colors uppercase font-black tracking-wide text-xs"
                style={{ borderRadius: '2px' }}
              />
              <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 bg-slate-900 text-white px-5 hover:bg-white hover:text-slate-900 border-[1.5px] border-slate-900 transition-colors font-black tracking-widest text-[10px] uppercase shadow-sm" style={{ borderRadius: '2px' }}>
                LACAK
              </button>
            </form>
          </div>
        </div>
      </div>

      {!result && historyOrders.length === 0 && recentOrders.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          <p className="w-full text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 text-center">MEMUAT RIWAYAT PERANGKAT...</p>
        </div>
      )}

      {(() => {
        const displayedHistory = historyOrders.filter(o =>
          o.id.toLowerCase().includes(trackId.toLowerCase()) ||
          (o.nama && o.nama.toLowerCase().includes(trackId.toLowerCase()))
        );

        return !result && historyOrders.length > 0 && (
          <div className="mt-8">
            <h3 className="font-black text-slate-900 text-base uppercase tracking-widest mb-5 text-center">RIWAYAT PERANGKAT INI</h3>

            {displayedHistory.length === 0 ? (
              <p className="text-center text-slate-400 text-xs font-black tracking-widest uppercase py-10 bg-slate-50 border-[1.5px] border-dashed border-slate-200" style={{ borderRadius: '2px' }}>TIDAK ADA HASIL UNTUK "{trackId}"</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
                {displayedHistory.map(order => (
                  <div key={order.id} className="bg-white border-[1.5px] border-slate-200 hover:border-slate-900 overflow-hidden transition-all cursor-pointer group flex flex-col shadow-sm hover:shadow-md" style={{ borderRadius: '2px' }} onClick={() => { doTrack(null, order.id); }}>
                    <div className="relative pt-[115%] bg-[#F3F4F6] border-b-[1.5px] border-slate-200 overflow-hidden group-hover:border-slate-900 transition-colors">
                      {(() => {
                        const firstItem = order.items?.[0];
                        const customImgMatch = firstItem?.catatan?.match(/\[LINK DESAIN KUSTOM: (.*?)\]/);
                        const customImgUrl = customImgMatch ? customImgMatch[1] : null;

                        if (customImgUrl) {
                          return <img src={customImgUrl} alt="custom" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                        } else if (firstItem?.product?.image_url) {
                          return <img src={firstItem.product.image_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                        } else {
                          return <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-slate-300"><ImageIcon size={32} strokeWidth={1.5} /></div>
                        }
                      })()}

                      <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[9px] font-black tracking-widest text-slate-900 border border-slate-200 uppercase shadow-sm" style={{ borderRadius: '2px' }}>
                        {new Date(order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>

                      {order.items && order.items.length > 1 && (
                        <div className="absolute bottom-2 left-2 bg-slate-900 text-white font-black text-[9px] px-2 py-1 uppercase tracking-widest border-[1.5px] border-slate-900" style={{ borderRadius: '2px' }}>
                          +{order.items.length - 1} PRODUK LAIN
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                      <p className="text-[10px] bg-slate-100 text-slate-500 font-black tracking-widest w-fit px-1.5 py-0.5 mb-1.5 uppercase">
                        {order.id}
                      </p>
                      <p className="font-black text-sm uppercase tracking-tight text-slate-900 mb-2 truncate" title={order.nama}>{order.nama}</p>

                      <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t-[1.5px] border-slate-100">
                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">STATUS: <span className="text-indigo-600">{order.status}</span></span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                          BAYAR: {order.payment_status === 'Lunas' ? <span className="text-emerald-600">LUNAS</span> : order.payment_status === 'Menunggu Konfirmasi' ? <span className="text-indigo-600">DIPERIKSA</span> : <span className="text-rose-600">BELUM BAYAR</span>}
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
        <div className="mt-8 text-center bg-white border-[1.5px] border-slate-200 max-w-sm mx-auto py-4 shadow-sm" style={{ borderRadius: '2px' }}>
          <p className="inline-flex items-center gap-2 text-slate-900 font-black uppercase tracking-widest text-xs animate-pulse"><span className="w-2 h-2 bg-slate-900"></span> MENCARI PESANAN...</p>
        </div>
      )}

      {error && (
        <div className="mt-8 mx-auto max-w-lg bg-rose-50 border-[1.5px] border-rose-200 text-rose-600 p-4 font-black uppercase tracking-wider text-center text-xs flex items-center justify-center gap-2 shadow-sm" style={{ borderRadius: '2px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error}
        </div>
      )}

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-8 mt-2">
          <div className="bg-white overflow-hidden flex flex-col w-full border-[1.5px] border-slate-200 shadow-sm" style={{ borderRadius: '2px' }}>

            {(() => {
              const st = (result.status || '').toLowerCase();
              let theme = { bg: "bg-slate-900", text: "text-slate-400", badge: "bg-slate-50 text-slate-800 border-slate-200", dot: "bg-slate-400" };

              if (st.includes('diambil') && !st.includes('siap')) {
                theme = { bg: "bg-slate-800", text: "text-slate-400", badge: "bg-slate-50 border-slate-300 text-slate-600", dot: "bg-slate-400" };
              } else if (st.includes('siap')) {
                theme = { bg: "bg-emerald-950", text: "text-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
              } else if (st.includes('finishing')) {
                theme = { bg: "bg-purple-950", text: "text-purple-400", badge: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" };
              } else if (st.includes('cetak')) {
                theme = { bg: "bg-orange-950", text: "text-orange-400", badge: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" };
              } else if (st.includes('desain') || st.includes('proses')) {
                theme = { bg: "bg-indigo-950", text: "text-indigo-400", badge: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" };
              } else if (st.includes('selesai')) {
                theme = { bg: "bg-emerald-950", text: "text-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
              } else if (st.includes('bayar') || st.includes('konfirmasi')) {
                theme = { bg: "bg-slate-900", text: "text-slate-400", badge: "bg-white text-slate-900 border-slate-900", dot: "bg-slate-900" };
              } else if (st.includes('batal') || st.includes('tolak')) {
                theme = { bg: "bg-rose-950", text: "text-rose-400", badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" };
              }

              return (
                <div className={`relative ${theme.bg} px-5 sm:px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-colors duration-500 border-b-[1.5px] border-slate-900`}>
                  <div className="relative z-10 w-full">
                    <p className={`${theme.text} text-[10px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5`}><Truck size={14} strokeWidth={2.5} /> ID & PEMESAN</p>
                    <div className="flex items-center gap-2.5">
                      <h2 className="font-mono font-black text-lg sm:text-xl text-white tracking-tight leading-none break-all flex items-center gap-2">
                        {result.id}
                        <button onClick={() => { navigator.clipboard.writeText(result.id); toast.success("ID Transaksi disalin ke clipboard!", { icon: "📋" }); }} className="text-white/40 hover:text-white transition-colors bg-white/10 p-1" title="Salin ID" style={{ borderRadius: '2px' }}>
                          <Copy size={16} />
                        </button>
                      </h2>
                      <span className="text-white/20 text-xl font-light leading-none -mt-1">|</span>
                      <p className="font-sans font-black text-sm sm:text-base text-white truncate max-w-[140px] sm:max-w-[250px] tracking-wide uppercase" title={result.nama}>
                        <User size={14} strokeWidth={2.5} className="inline mr-1 opacity-70 mb-0.5" />{result.nama}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 sm:text-right flex-none">
                    <p className={`${theme.text} text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 hidden sm:block`}>STATUS PESANAN</p>
                    <div className={`inline-flex items-center gap-2 ${theme.badge} border-[1.5px] font-black px-3 py-1.5 text-xs uppercase tracking-widest shadow-sm transition-colors duration-500`} style={{ borderRadius: '2px' }}>
                      <span className={`w-2 h-2 ${theme.dot} animate-pulse border border-white/50`} style={{ borderRadius: '2px' }}></span>
                      {result.status}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="p-5 sm:p-7">
              {result.items && result.items.length > 0 && (
                <div className="mb-6">
                  <div className="overflow-x-auto border-[1.5px] border-slate-200" style={{ borderRadius: '2px' }}>
                    <table className="w-full border-collapse text-left min-w-[500px] bg-white">
                      <thead className="bg-slate-50 border-b-[1.5px] border-slate-200 text-[10px] uppercase font-black text-slate-800 tracking-widest">
                        <tr>
                          <th className="p-4 px-5">ITEM PESANAN</th>
                          <th className="p-4 w-28 text-center">JUMLAH</th>
                          <th className="p-4 w-44 text-center">PROGRES PRODUKSI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-[1.5px] divide-slate-100">
                        {result.items && result.items.map((it, i) => {
                          const saleItem = result.sales_items?.find(s => s.nama === (it.product?.nama || "Produk Web"));
                          const statusProduksi = saleItem ? saleItem.status : (result.status === "Selesai" ? "Selesai" : "Menunggu");

                          return (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 px-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-[60px] h-[60px] bg-slate-50 relative overflow-hidden flex-none border-[1.5px] border-slate-200" style={{ borderRadius: '2px' }}>
                                    {it.custom_image ? <img src={it.custom_image} className="w-full h-full object-cover" /> :
                                      it.product?.image_url ? <img src={it.product?.image_url} className="w-full h-full object-cover" /> :
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><ImageIcon size={20} /></div>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-slate-900 uppercase tracking-tight line-clamp-1 mb-1 leading-snug">{it.product?.nama || "Produk"}</p>
                                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 uppercase tracking-widest inline-block border-[1.5px] border-slate-200" style={{ borderRadius: '2px' }}>
                                      {it.catatan ? it.catatan.replace(/\[LINK DESAIN KUSTOM:.*?\]/g, '').trim() || 'DESAIN TERLAMPIR' : 'KATALOG STANDAR'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <span className="font-black text-slate-900 bg-white border-[1.5px] border-slate-200 px-3 py-1.5 text-xs shadow-sm uppercase tracking-wide" style={{ borderRadius: '2px' }}>{it.qty} <span className="text-[10px] text-slate-400 ml-1">PCS</span></span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border-[1.5px] shadow-sm ${statusProduksi === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : statusProduksi === 'Menunggu' ? 'bg-white text-slate-700 border-slate-200' : statusProduksi === 'Desain' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'}`} style={{ borderRadius: '2px' }}>
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
                <div className="border-[1.5px] border-slate-900 bg-white p-5 md:p-6 mt-6 relative shadow-sm" style={{ borderRadius: '2px' }}>
                  <div className="absolute top-0 left-0 bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1">AKSI DIBUTUHKAN</div>
                  <h3 className="font-black text-slate-900 text-lg sm:text-xl uppercase tracking-tight mb-1 mt-3">Penyelesaian Pembayaran</h3>
                  <p className="text-[11px] font-bold text-slate-500 mb-5 uppercase tracking-wide leading-relaxed">PESANAN DISETUJUI. SELESAIKAN PEMBAYARAN SESUAI TOTAL TAGIHAN AGAR SEGERA DIPROSES.</p>

                  <div className="bg-slate-50 border-[1.5px] border-slate-200 shadow-sm p-5 mb-5 text-center relative overflow-hidden" style={{ borderRadius: '2px' }}>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">TOTAL TAGIHAN FINAL ANDA</span>
                    <span className="block text-3xl font-black text-slate-900 tracking-tight">{formatRupiah(result.total_tagihan)}</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2.5">PILIH CARA BAYAR</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['QRIS', 'BCA', 'Mandiri'].map(m => (
                          <button key={m} onClick={() => setPayMethod(m)} type="button" className={`px-2 py-3.5 border-[1.5px] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${payMethod === m ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-900 hover:text-slate-900'}`} style={{ borderRadius: '2px' }}>{m === 'QRIS' ? 'E-WALLET' : m}</button>
                        ))}
                      </div>
                    </div>

                    {payMethod && (
                      <div className="bg-slate-50 p-4 border-[1.5px] border-slate-200 text-center text-sm shadow-sm fade-in" style={{ borderRadius: '2px' }}>
                        {payMethod === 'QRIS' ? (
                          <p className="font-black text-slate-900 uppercase tracking-wide text-xs">Silakan scan kode QRIS kami.<br /><span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-1 mt-2 inline-block border-[1.5px] border-slate-300">(PEMBAYARAN DENGAN SEMUA APLIKASI)</span></p>
                        ) : (
                          <p className="font-black text-slate-500 uppercase tracking-wide text-[10px]">Tujuan Transfer {payMethod}: <br /><span className="text-xl sm:text-2xl font-black text-slate-900 bg-white border-[1.5px] border-slate-200 px-3 py-1 my-2 inline-block">1234 5678 90</span><br /><span className="text-slate-900 tracking-widest">A.N. MADATAMA PRINT</span></p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2.5">UNGGAH BUKTI BAYAR</label>
                      {!payProofUrl ? (
                        <label className="flex items-center justify-center gap-2 w-full h-16 bg-white border-[1.5px] border-dashed border-slate-400 text-slate-600 cursor-pointer hover:bg-slate-50 hover:border-slate-900 hover:text-slate-900 transition-colors" style={{ borderRadius: '2px' }}>
                          <ImageIcon size={20} strokeWidth={2.5} />
                          <span className="text-[11px] font-black uppercase tracking-widest">PILIH GAMBAR</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                        </label>
                      ) : (
                        <div className="relative border-[1.5px] border-slate-200 bg-white p-3 flex items-center gap-3 shadow-sm zoom-in-95" style={{ borderRadius: '2px' }}>
                          <img src={payProofUrl} alt="Bukti" className="w-16 h-16 object-cover bg-slate-50 border-[1.5px] border-slate-200" style={{ borderRadius: '2px' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest truncate">BUKTI TERLAMPIR</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5"><Check size={14} strokeWidth={3} className="text-emerald-500" /> SIAP KIRIM</p>
                          </div>
                          <button type="button" onClick={() => setPayProofUrl('')} className="p-2.5 bg-slate-100 text-slate-500 hover:text-white hover:bg-rose-600 transition-colors border-[1.5px] border-slate-200 hover:border-rose-600" style={{ borderRadius: '2px' }}><Trash2 size={16} strokeWidth={2.5} /></button>
                        </div>
                      )}
                    </div>

                    <button onClick={submitPayment} disabled={payLoading || !payMethod || !payProofUrl} className="w-full mt-2 bg-slate-900 hover:bg-white hover:text-slate-900 hover:border-slate-900 border-[1.5px] border-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-xs py-4 shadow-sm transition-colors flex justify-center items-center gap-2" style={{ borderRadius: '2px' }}>
                      {payLoading ? 'MENGIRIM...' : 'KIRIM BUKTI PEMBAYARAN'} {!payLoading && <ChevronRight size={18} strokeWidth={3} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t-[1.5px] border-slate-200">
                {result.bukti_bayar && result.status !== "SELESAI" && (
                  <div className="flex-1 bg-white border-[1.5px] border-slate-900 px-5 py-4 flex gap-3 flex-col sm:flex-row sm:items-center shadow-sm relative overflow-hidden group" style={{ borderRadius: '2px' }}>
                    <div className="w-8 h-8 bg-slate-900 border-[1.5px] border-slate-900 flex items-center justify-center text-white flex-none relative z-10 zoom-in" style={{ borderRadius: '2px' }}><CheckCircle2 size={16} strokeWidth={2.5} /></div>
                    <div className="relative z-10">
                      <h5 className="text-[10px] font-black uppercase tracking-widest mb-0.5 text-slate-900">PEMBAYARAN DITERIMA</h5>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">MENUNGGU VERIFIKASI ADMIN.</p>
                    </div>
                  </div>
                )}
                <div className="flex-1 bg-white border-[1.5px] border-slate-200 px-5 py-4 flex gap-3 flex-col sm:flex-row sm:items-center hover:border-slate-900 transition-colors group relative" style={{ borderRadius: '2px' }}>
                  <div className="w-8 h-8 bg-slate-50 border-[1.5px] border-slate-200 group-hover:border-slate-900 flex items-center justify-center text-slate-900 flex-none relative z-10 transition-colors" style={{ borderRadius: '2px' }}><Phone size={16} strokeWidth={2} /></div>
                  <div className="relative z-10">
                    <h5 className="text-[10px] font-black uppercase tracking-widest mb-0.5 text-slate-900">CUSTOMER SERVICE</h5>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">BANTUAN VIA WHATSAPP.</p>
                  </div>
                </div>
              </div>

              <a
                href={`https://wa.me/6281234567890?text=Halo%20Admin%20Madatama,%20saya%20mengecek%20pesanan%20saya%20dengan%20nomor%20resi%20*${result.id}*.%20Apakah%20bisa%20dibantu?`}
                target="_blank" rel="noopener noreferrer"
                className="w-full mt-4 bg-[#25D366] hover:bg-white hover:text-[#25D366] text-white border-[1.5px] border-[#25D366] font-black py-3.5 shadow-sm transition-colors flex justify-center items-center gap-2 text-[11px] uppercase tracking-widest"
                style={{ borderRadius: '2px' }}
              >
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                HUBUNGI ADMIN VIA WHATSAPP
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
