export const formatRupiah = (n) => {
  const num = Number(n || 0);
  const sign = num < 0 ? "-" : "";
  return `${sign}Rp${Math.abs(Math.round(num)).toLocaleString("id-ID")}`;
};

export const parseNumber = (str) => {
  if (typeof str === "number") return str;
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9,-]/g, "").replace(",", ".");
  return Number(cleaned) || 0;
};

// group digits with dot while typing
export const formatNumberInput = (str) => {
  const digits = String(str).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
};

const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const monthLabel = (key) => {
  // key = "YYYY-MM"
  const [y, m] = key.split("-");
  return `${BULAN_ID[Number(m) - 1]} ${y}`;
};

export const formatTanggal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  const day = d.getDate();
  return `${day} ${BULAN_ID[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};

export const monthKey = (iso) => (iso ? iso.slice(0, 7) : "");

export const todayISO = () => new Date().toISOString().slice(0, 10);
