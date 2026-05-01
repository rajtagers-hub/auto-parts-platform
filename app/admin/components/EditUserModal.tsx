"use client";
import { useState } from "react";
import { X } from "lucide-react";

interface EditUserModalProps {
  user: any;
  onClose: () => void;
  onSave: (updatedUser: any) => void;
}

export default function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    whatsapp: user.whatsapp || "",
    city: user.city || "",
    nipt: user.nipt || "",
    user_type: user.user_type || "Individual",
    status: user.status || "Active",
    license_verified: user.license_verified || false,
    current_debt: user.current_debt || 0,
    total_paid: user.total_paid || 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      onSave({ ...user, ...form });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "name", label: "Emri", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Telefon", type: "text" },
    { key: "whatsapp", label: "WhatsApp", type: "text" },
    { key: "city", label: "Qyteti", type: "text" },
    { key: "nipt", label: "NIPT", type: "text" },
    { key: "current_debt", label: "Borxhi Aktual (€)", type: "number" },
    { key: "total_paid", label: "Total Paguar (€)", type: "number" },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-lg font-black italic uppercase tracking-wider">Ndrysho Përdoruesin</h2>
            <p className="text-zinc-600 text-xs mt-1">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">{f.label}</label>
              <input
                type={f.type}
                value={(form as any)[f.key]}
                onChange={e => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          ))}

          {/* User Type Select */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Tipi</label>
            <select
              value={form.user_type}
              onChange={e => setForm({ ...form, user_type: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="Individual">Individual</option>
              <option value="Graveyard">Graveyard</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Statusi</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="Active">Aktiv</option>
              <option value="Suspended">Pezulluar</option>
              <option value="Pending">Në Pritje</option>
            </select>
          </div>

          {/* License Verified Toggle */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-bold text-sm">Licensa e Verifikuar</p>
              <p className="text-zinc-600 text-xs mt-1">A është verifikuar licensa e biznesit</p>
            </div>
            <button
              onClick={() => setForm({ ...form, license_verified: !form.license_verified })}
              className={`w-12 h-6 rounded-full transition-all relative ${form.license_verified ? "bg-blue-600" : "bg-zinc-700"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${form.license_verified ? "left-6" : "left-0.5"}`} />
            </button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-bold uppercase tracking-wider text-zinc-400 hover:bg-white/5 transition-all">
            Anulo
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-black uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {saving ? "Duke ruajtur..." : "Ruaj"}
          </button>
        </div>
      </div>
    </div>
  );
}
