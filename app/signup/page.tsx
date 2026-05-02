"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ChevronLeft, Shield, Upload } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import Turnstile to avoid SSR issues
const Turnstile = dynamic(
  () => import("@marsidev/react-turnstile").then((mod) => mod.Turnstile),
  { ssr: false }
);

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    userType: "Graveyard",
    phone: "",
    city: "",
    nipt: "",
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Ju lutemi plotësoni CAPTCHA.");
      return;
    }
    if (form.userType === "Graveyard" && !licenseFile) {
      setError("Ju lutemi ngarkoni licencën e biznesit.");
      return;
    }
    setLoading(true);
    setError("");

    // Verify Turnstile token
    try {
      const verifyRes = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        setError(verifyData.error || "CAPTCHA verification failed. Please try again.");
        setTurnstileToken(null); // Reset token so user must complete CAPTCHA again
        setLoading(false);
        return;
      }
    } catch (err) {
      setError("CAPTCHA verification error. Please refresh the page.");
      setLoading(false);
      return;
    }

    // Upload license if exists
    let licenseUrl = null;
    if (licenseFile) {
      const fileName = `license_${Date.now()}_${licenseFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('licenses')
        .upload(fileName, licenseFile);
      if (uploadError) {
        setError("Gabim gjatë ngarkimit të licencës: " + uploadError.message);
        setLoading(false);
        return;
      }
      licenseUrl = supabase.storage.from('licenses').getPublicUrl(fileName).data.publicUrl;
    }

    // Sign up with Supabase
    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { 
        data: { 
          name: form.name,
          user_type: form.userType,
          phone: form.phone,
          city: form.city,
          nipt: form.nipt,
          business_license: licenseUrl,
          license_verified: !!licenseUrl
        } 
      },
    });
    if (authError) {
      setError(authError.message);
    } else {
      router.push("/login?message=Regjistrimi u krye! Tani mund të kyçeni.");
      return;
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 md:p-6 py-12">
      <div className="w-full max-w-md">
        <button 
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
        >
          <ChevronLeft size={16} /> Kthehu
        </button>
        <form onSubmit={handleSignup} className="bg-[#0A0A0A] p-6 md:p-10 rounded-3xl border border-white/10 w-full shadow-2xl">
          <h1 className="text-3xl font-black italic mb-8">Regjistrohu</h1>

        <input
          type="text"
          name="name"
          placeholder="Emri i Biznesit"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-white/5 p-4 rounded-xl mb-4"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-white/5 p-4 rounded-xl mb-4"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Fjalëkalimi"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-white/5 p-4 rounded-xl mb-4"
          required
        />
        <select
          name="userType"
          value={form.userType}
          onChange={(e) => setForm({ ...form, userType: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-white outline-none focus:border-blue-500 transition-all"
        >
          <option value="Graveyard">Pikë Skrapi (Biznes i Autorizuar)</option>
        </select>
        <input
          type="text"
          name="phone"
          placeholder="WhatsApp/Telefon"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full bg-white/5 p-4 rounded-xl mb-4"
        />
        <input
          type="text"
          name="city"
          placeholder="Qyteti"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="w-full bg-white/5 p-4 rounded-xl mb-4"
        />
        {form.userType === "Graveyard" && (
          <input
            type="text"
            name="nipt"
            placeholder="NIPT (Numri Identifikues)"
            value={form.nipt}
            onChange={(e) => setForm({ ...form, nipt: e.target.value })}
            className="w-full bg-white/5 p-4 rounded-xl mb-4"
            required
          />
        )}

        {form.userType === "Graveyard" && (
          <div className="mb-6">
            <label className="block text-[10px] font-black uppercase text-zinc-600 mb-2 ml-1 tracking-widest">Ngarko Licencën e Biznesit (QKL)*</label>
            <div 
              onClick={() => document.getElementById('license_upload')?.click()}
              className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-600/50 transition-all bg-white/[0.02]"
            >
              {licensePreview ? (
                <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase italic">
                  <Shield size={16}/> File i ngarkuar
                </div>
              ) : (
                <>
                  <Upload size={24} className="text-zinc-600"/>
                  <p className="text-[10px] mt-2 text-zinc-500 font-bold uppercase">Kliko për të ngarkuar PDF ose Foto</p>
                </>
              )}
            </div>
            <input 
              id="license_upload"
              type="file" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setLicenseFile(file);
                  setLicensePreview(URL.createObjectURL(file));
                }
              }}
              className="hidden" 
              accept="image/*,application/pdf"
            />
          </div>
        )}

        {/* Turnstile widget */}
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={(token) => {
            setTurnstileToken(token);
            setTurnstileError(false);
          }}
          onError={() => {
            setTurnstileError(true);
            setError("CAPTCHA error. Refresh the page and try again.");
          }}
          onExpire={() => setTurnstileToken(null)}
          options={{ theme: "dark" }}
          className="mb-4"
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading || !turnstileToken || turnstileError}
          className="w-full bg-blue-600 py-4 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? "Duke regjistruar..." : "Regjistrohu"}
        </button>
        <p className="text-center text-zinc-500 mt-6 text-sm">
          Ke llogari? <a href="/login" className="text-blue-500">Kyçu</a>
        </p>
      </form>
      </div>
    </div>
  );
}