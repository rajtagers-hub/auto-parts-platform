"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
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
    userType: "Individual",
    phone: "",
    city: "",
    nipt: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);

  // Reset turnstile token when component mounts (to avoid expired token)
  useEffect(() => {
    setTurnstileToken(null);
    setTurnstileError(false);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Ju lutemi plotësoni CAPTCHA.");
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

    // Sign up with Supabase
    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
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
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <form onSubmit={handleSignup} className="bg-[#0A0A0A] p-10 rounded-3xl border border-white/10 w-full max-w-md">
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
          className="w-full bg-white/5 p-4 rounded-xl mb-4"
        >
          <option value="Individual">Individ (Shitës i pavarur)</option>
          <option value="Graveyard">Pikë Skrapi (Graveyard)</option>
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
          />
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
          options={{ appearance: "interaction-only" }} // forces visible checkbox (optional)
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
  );
}