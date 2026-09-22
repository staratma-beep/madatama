import React, { useState, useRef } from "react";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { X, Image as ImageIcon, Type, Trash2, CheckCircle2, Palette } from "lucide-react";

export const CustomEditor = ({ product, onClose, onAddToCart }) => {
    const [elements, setElements] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [baseColor, setBaseColor] = useState("#ffffff");
    const [isRendering, setIsRendering] = useState(false);

    // Memoized timestamp for cache-busting CORS images without triggering re-renders
    const cbCache = React.useMemo(() => Date.now(), []);

    const canvasRef = useRef(null);

    const addText = () => {
        setElements([
            ...elements,
            { id: Date.now(), type: 'text', content: 'Atma', x: 100, y: 150, width: 150, height: 'auto', color: '#ffffff', font: 'Inter', fontSize: 28, textTransform: 'none' }
        ]);
    };

    const addImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setElements([
                ...elements,
                { id: Date.now(), type: 'image', src: ev.target.result, x: 20, y: 20, width: 100, height: 100 }
            ]);
        };
        reader.readAsDataURL(file);
        e.target.value = null; // reset
    };

    const updateElement = (id, changes) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...changes } : el));
    };

    const removeElement = (id) => {
        setElements(elements.filter(el => el.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const handleFinish = async () => {
        setSelectedId(null); // deselect to hide handles
        setIsRendering(true);
        // Give time for selection handles to disappear
        setTimeout(async () => {
            let dataUrl = null;

            // Strategi 1: html2canvas dengan useCORS (butuh header CORS dari server)
            try {
                const canvas = await html2canvas(canvasRef.current, {
                    backgroundColor: null,
                    scale: 2,
                    useCORS: true,
                    allowTaint: false,
                    logging: false,
                    imageTimeout: 5000,
                });
                dataUrl = canvas.toDataURL("image/png");
            } catch (err) {
                console.warn("html2canvas gagal, coba fallback canvas manual:", err);
            }

            // Strategi 2: Fallback — canvas HTML5 manual (render elemen satu per satu)
            if (!dataUrl) {
                try {
                    const W = 400, H = 500;
                    const fallbackCanvas = document.createElement('canvas');
                    fallbackCanvas.width = W * 2;
                    fallbackCanvas.height = H * 2;
                    const ctx = fallbackCanvas.getContext('2d');
                    ctx.scale(2, 2);

                    // Background warna dasar
                    ctx.fillStyle = baseColor;
                    ctx.fillRect(0, 0, W, H);

                    // Gambar produk jika ada (lewat Image() crossOrigin)
                    const imgSrc = product.color_images?.[baseColor] || product.image_url;
                    if (imgSrc) {
                        try {
                            await new Promise((res, rej) => {
                                const img = new Image();
                                img.crossOrigin = 'anonymous';
                                img.onload = () => {
                                    ctx.globalCompositeOperation = baseColor !== '#ffffff' ? 'multiply' : 'source-over';
                                    ctx.drawImage(img, 0, 0, W, H);
                                    ctx.globalCompositeOperation = 'source-over';
                                    res();
                                };
                                img.onerror = rej;
                                img.src = imgSrc + '?cors=' + Date.now();
                                setTimeout(rej, 3000);
                            });
                        } catch (e) {
                            console.warn("Gambar produk tidak bisa dimuat ke canvas:", e);
                        }
                    }

                    // Render elemen desain (teks & logo)
                    for (const el of elements) {
                        if (el.type === 'text') {
                            ctx.save();
                            ctx.font = `900 ${el.fontSize || 28}px ${el.font || 'Inter'}`;
                            ctx.fillStyle = el.color || '#ffffff';
                            ctx.textBaseline = 'top';
                            // Render multi-line
                            const lines = (el.content || '').split('\n');
                            lines.forEach((line, i) => {
                                let text = line;
                                if (el.textTransform === 'uppercase') text = text.toUpperCase();
                                else if (el.textTransform === 'lowercase') text = text.toLowerCase();
                                else if (el.textTransform === 'capitalize') text = text.replace(/\b\w/g, c => c.toUpperCase());
                                ctx.fillText(text, el.x, el.y + i * ((el.fontSize || 28) * 1.2));
                            });
                            ctx.restore();
                        } else if (el.type === 'image' && el.src) {
                            try {
                                await new Promise((res, rej) => {
                                    const img = new Image();
                                    img.onload = () => {
                                        ctx.drawImage(img, el.x, el.y, parseFloat(el.width) || 100, parseFloat(el.height) || 100);
                                        res();
                                    };
                                    img.onerror = rej;
                                    img.src = el.src;
                                    setTimeout(rej, 3000);
                                });
                            } catch (e) { /* skip element */ }
                        }
                    }

                    dataUrl = fallbackCanvas.toDataURL('image/png');
                } catch (fbErr) {
                    console.error("Fallback canvas juga gagal:", fbErr);
                    toast.error("Gagal membuat desain. Silakan coba lagi.");
                    setIsRendering(false);
                    return;
                }
            }

            try {
                onAddToCart(product, ``, dataUrl);
                toast.success("Desain berhasil dimasukkan ke Keranjang!");
                onClose();
            } catch (e) {
                console.error("Gagal menyimpan ke Keranjang", e);
                toast.error("Gagal menambahkan ke keranjang sistem.");
                setIsRendering(false);
            }
        }, 300);
    };

    return (
        <div className="fixed inset-0 z-50 flex p-2 sm:p-8 bg-slate-900/40 backdrop-blur-md">
            <div className="w-full max-w-[1400px] mx-auto my-auto bg-white flex flex-col md:flex-row-reverse overflow-hidden rounded-2xl sm:rounded-[2.5rem] shadow-2xl h-[calc(100vh-1rem)] sm:h-[calc(100vh-3rem)] border border-white/50 ring-1 ring-slate-900/5">

                {/* Mobile Header (Hidden on Desktop) */}
                <div className="md:hidden p-4 border-b border-slate-100 flex justify-between items-center bg-white z-20 shrink-0">
                    <div>
                        <h3 className="font-black text-slate-800 text-lg tracking-tight leading-tight">Editor Desain</h3>
                        <p className="text-[11px] font-semibold text-indigo-600 line-clamp-1">{product.nama}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white hover:bg-red-50 hover:text-red-600 rounded-full text-slate-400 transition-all shadow-sm border border-slate-200">
                        <X size={18} />
                    </button>
                </div>

                {/* Canvas Area (Top on Mobile, Right on Desktop) */}
                <div
                    className="flex-1 min-h-[40vh] md:min-h-0 relative bg-slate-100/40 flex items-center justify-center overflow-auto p-4 sm:p-12 z-0"
                    onClick={() => setSelectedId(null)}
                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '16px 16px' }}
                >
                    {/* Mockup Container Wrapper for drop shadow without breaking html2canvas */}
                    <div className="relative rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-2 sm:p-3 bg-white/50 backdrop-blur-sm border border-white/60 transform scale-[0.8] sm:scale-100 origin-center">
                        {/* Actual html2canvas target container (Needs to be transparent base for PNG mode) */}
                        <div
                            ref={canvasRef}
                            className="relative rounded-[1.5rem] overflow-hidden bg-transparent"
                            style={{ width: 400, height: 500 }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Layer 1: Colored Mask (Only shows color if NO variant image is uploaded, fallback CSS mode) */}
                            {product.image_url && !product.color_images?.[baseColor] && baseColor !== '#ffffff' && (
                                <div
                                    className="absolute inset-0 w-full h-full transition-colors duration-500 z-0"
                                    style={{
                                        backgroundColor: baseColor,
                                        WebkitMaskImage: `url('${product.image_url}?cb=${cbCache}')`,
                                        WebkitMaskSize: 'cover',
                                        WebkitMaskPosition: 'center',
                                        WebkitMaskRepeat: 'no-repeat',
                                        maskImage: `url('${product.image_url}?cb=${cbCache}')`,
                                        maskSize: 'cover',
                                        maskPosition: 'center',
                                        maskRepeat: 'no-repeat',
                                    }}
                                ></div>
                            )}

                            {/* Layer 2: Real Variant Photo OR Fallback Original Image */}
                            {product.color_images?.[baseColor] ? (
                                <img
                                    src={product.color_images[baseColor] + '?cb=' + cbCache}
                                    crossOrigin="anonymous"
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                                />
                            ) : product.image_url ? (
                                <img
                                    src={product.image_url + '?cb=' + cbCache}
                                    crossOrigin="anonymous"
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                                    style={{ mixBlendMode: baseColor !== '#ffffff' ? 'multiply' : 'normal' }}
                                />
                            ) : (
                                <div className="absolute inset-0 w-full h-full border-4 border-dashed border-slate-300/50 pointer-events-none bg-slate-100/50 z-10"></div>
                            )}

                            {/* Bounding Box Title */}
                            <div className="absolute top-6 left-0 right-0 text-center pointer-events-none opacity-50 z-20">
                                <span className="text-[9px] uppercase tracking-[0.3em] font-black text-slate-600 border border-slate-400 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">Area Desain / Cetak</span>
                            </div>

                            {/* Elements Map (z-30 so it sits above image) */}
                            <div className="absolute inset-0 z-30">
                                {elements.map(el => (
                                    <Rnd
                                        key={el.id}
                                        bounds="parent"
                                        size={{ width: el.width, height: el.type === 'text' ? 'auto' : el.height }}
                                        position={{ x: el.x, y: el.y }}
                                        onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                                        onResizeStop={(e, direction, ref, delta, position) => {
                                            const changes = {
                                                width: ref.style.width,
                                                height: el.type === 'text' ? 'auto' : ref.style.height,
                                                ...position
                                            };
                                            if (el.type === 'text' && ['topRight', 'bottomRight', 'bottomLeft', 'topLeft'].includes(direction)) {
                                                const oldW = parseFloat(el.width);
                                                const newW = parseFloat(ref.style.width);
                                                if (oldW && newW) {
                                                    const scale = newW / oldW;
                                                    changes.fontSize = Math.round((el.fontSize || 28) * scale);
                                                }
                                            }
                                            updateElement(el.id, changes);
                                        }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                                        className={`group ${selectedId === el.id ? 'ring-2 ring-indigo-500/80 ring-offset-2 ring-offset-transparent' : 'hover:ring-2 hover:ring-indigo-300/40'} transition-all absolute rounded-sm`}
                                        enableResizing={selectedId === el.id}
                                        disableDragging={selectedId !== el.id}
                                    >
                                        {/* Delete quickly top right */}
                                        {selectedId === el.id && (
                                            <button onClick={(e) => { e.stopPropagation(); removeElement(el.id); }} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-lg shadow-red-500/30 z-10 hover:bg-red-600 transition-colors"><X size={12} strokeWidth={3} /></button>
                                        )}

                                        {el.type === 'text' && (
                                            <div style={{ color: el.color, fontFamily: el.font, fontSize: `${el.fontSize || 28}px`, textTransform: el.textTransform || 'none', width: '100%', height: '100%', wordBreak: 'break-word', fontWeight: '900', lineHeight: 1.2, whiteSpace: 'pre-wrap' }}>
                                                {el.content}
                                            </div>
                                        )}

                                        {el.type === 'image' && (
                                            <img src={el.src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} alt="custom" className="drop-shadow-sm" />
                                        )}
                                    </Rnd>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Sidebar Tools (Bottom on Mobile, Left on Desktop because of md:order-first) */}
                <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-r border-slate-100 flex flex-col shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-[55%] md:h-full md:order-first">
                    {/* Desktop Header (Hidden on Mobile) */}
                    <div className="hidden md:flex p-6 border-b border-slate-100 justify-between items-start bg-slate-50/50">
                        <div>
                            <h3 className="font-black text-slate-800 text-xl tracking-tight mb-1">Editor Desain</h3>
                            <p className="text-sm font-semibold text-indigo-600 line-clamp-1">{product.nama}</p>
                        </div>
                        <button onClick={onClose} className="p-2.5 bg-white hover:bg-red-50 hover:text-red-600 rounded-full text-slate-400 transition-all shadow-sm border border-slate-200"><X size={18} /></button>
                    </div>

                    <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-6 md:space-y-8">
                        {/* General Tools */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                                <span className="w-4 h-0.5 bg-indigo-500 rounded-full"></span> Elemen Baru
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={addText} className="flex flex-col items-center justify-center gap-3 bg-white hover:bg-indigo-50/50 text-slate-600 hover:text-indigo-600 py-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md font-bold text-xs group">
                                    <Type size={24} className="text-slate-400 group-hover:text-indigo-500 transition-colors" /> Teks Baru
                                </button>
                                <label className="flex flex-col items-center justify-center gap-3 bg-white hover:bg-indigo-50/50 text-slate-600 hover:text-indigo-600 py-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md font-bold text-xs cursor-pointer group">
                                    <ImageIcon size={24} className="text-slate-400 group-hover:text-indigo-500 transition-colors" /> Upload Logo
                                    <input type="file" accept="image/*" className="hidden" onChange={addImage} />
                                </label>
                            </div>
                        </div>

                        {/* Color Overlay Tool */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                                <span className="w-4 h-0.5 bg-indigo-500 rounded-full"></span> Warna Dasar
                            </h4>
                            <div className="flex flex-wrap gap-3">
                                {['#ffffff', '#000000', '#dc2626', '#1d4ed8', '#16a34a', '#f59e0b', '#8b5cf6'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setBaseColor(c)}
                                        className={`w-10 h-10 rounded-full border border-slate-200/50 shadow-sm transition-all duration-300 relative flex items-center justify-center ${baseColor === c ? 'scale-110 shadow-md z-10' : 'hover:scale-105 hover:shadow-md'}`}
                                        style={{ backgroundColor: c }}
                                    >
                                        {baseColor === c && <div className={`absolute inset-0 rounded-full border-[3px] border-white mix-blend-difference opacity-50`}></div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Properties of Selected Element */}
                        {selectedId && (() => {
                            const el = elements.find(e => e.id === selectedId);
                            if (!el) return null;
                            return (
                                <div className="space-y-4 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                                            <span className="w-4 h-0.5 bg-emerald-500 rounded-full"></span> Edit Elemen
                                        </h4>
                                        <button onClick={() => removeElement(el.id)} className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"><Trash2 size={12} /> Hapus</button>
                                    </div>

                                    {el.type === 'text' && (
                                        <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-inner">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-2">Teks (Bisa Multi-baris)</label>
                                                <textarea value={el.content} onChange={e => updateElement(el.id, { content: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all resize-none h-20" />
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Gaya Font</label>
                                                    <select value={el.font || 'Inter'} onChange={e => updateElement(el.id, { font: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                                                        <option value="Inter">Modern (Inter)</option>
                                                        <option value="ui-serif, Georgia, serif">Klasik (Serif)</option>
                                                        <option value="ui-monospace, monospace">Ketik (Mono)</option>
                                                        <option value="Impact, fantasy">Tebal (Impact)</option>
                                                        <option value="'Comic Sans MS', cursive">Santai (Comic)</option>
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 capitalize">Karakter</label>
                                                    <select value={el.textTransform || 'none'} onChange={e => updateElement(el.id, { textTransform: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                                                        <option value="none">Normal</option>
                                                        <option value="uppercase">UPPERCASE</option>
                                                        <option value="lowercase">lowercase</option>
                                                        <option value="capitalize">Capitalize</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <label className="flex justify-between block text-[10px] font-bold text-slate-500 mb-1">
                                                        <span>Ukuran Font</span>
                                                        <span className="text-indigo-600">{el.fontSize || 28}px</span>
                                                    </label>
                                                    <input type="range" min="12" max="120" value={el.fontSize || 28} onChange={e => updateElement(el.id, { fontSize: parseInt(e.target.value) })} className="w-full accent-indigo-500" />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Warna Tulisan</label>
                                                <div className="flex items-center gap-3">
                                                    <input type="color" value={el.color} onChange={e => updateElement(el.id, { color: e.target.value })} className="w-10 h-10 cursor-pointer rounded-xl border border-slate-200 p-1 bg-white shadow-sm" />
                                                    <span className="font-mono text-xs font-bold text-slate-400 uppercase">{el.color}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
                        <button onClick={handleFinish} disabled={isRendering} className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-extrabold py-3 md:py-4 rounded-xl md:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-indigo-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 md:gap-3 transition-all duration-300 text-sm tracking-wide">
                            {isRendering ? 'Mempersiapkan File...' : <><CheckCircle2 size={20} /> Selesai & Pakai Desain</>}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
