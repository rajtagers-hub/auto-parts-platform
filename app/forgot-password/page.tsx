"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Ne kemi dërguar një link për rivendosjen e fjalëkalimit në emailin tuaj.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Link href="/login" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 text-sm">
          <ArrowLeft size={16} /> Kthehu te hyrja
        </Link>
        <div className="bg-[#0A0A0A] p-8 rounded-3xl border border-white/10">
          <h1 className="text-3xl font-black italic text-white mb-2">Harruat fjalëkalimin?</h1>
          <p className="text-sm text-zinc-500 mb-6">Shkruani emailin tuaj dhe ne do t'ju dërgojmë një link për ta rivendosur.</p>
          <form onSubmit={handleReset} className="space-y-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500"
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase italic transition-all disabled:opacity-50"
            >
              {loading ? 'Duke dërguar...' : 'Dërgo linkun'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}