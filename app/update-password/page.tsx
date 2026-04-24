"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we have a session (user clicked the reset link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    checkSession();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Fjalëkalimet nuk përputhen.");
      return;
    }
    if (password.length < 6) {
      setError("Fjalëkalimi duhet të ketë të paktën 6 karaktere.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setMessage("Fjalëkalimi u ndryshua me sukses! Ju lutemi kyquni përsëri.");
      setTimeout(() => router.push('/login'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="bg-[#0A0A0A] p-8 rounded-3xl border border-white/10 w-full max-w-md">
        <h1 className="text-3xl font-black italic text-white mb-2">Vendosni fjalëkalimin e ri</h1>
        <form onSubmit={handleUpdate} className="space-y-6 mt-6">
          <input
            type="password"
            placeholder="Fjalëkalimi i ri"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Konfirmo fjalëkalimin"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Duke ndryshuar...' : 'Ndrysho fjalëkalimin'}
          </button>
        </form>
      </div>
    </div>
  );
}