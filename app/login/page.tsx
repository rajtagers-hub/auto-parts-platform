"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="bg-[#0A0A0A] p-10 rounded-3xl border border-white/10 w-full max-w-md">
        <h1 className="text-3xl font-black italic text-white mb-8">Hyr</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-white outline-none focus:border-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Fjalëkalimi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-white outline-none focus:border-blue-500"
          required
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase italic transition-all disabled:opacity-50"
        >
          {loading ? 'Duke hyrë...' : 'Kyçu'}
        </button>
        <div className="text-center mt-4">
          <a href="/forgot-password" className="text-blue-500 text-sm hover:underline">
            Harruat fjalëkalimin?
          </a>
        </div>
        <p className="text-center text-zinc-500 mt-4 text-sm">
          Nuk ke llogari? <a href="/signup" className="text-blue-500 hover:underline">Regjistrohu</a>
        </p>
      </form>
    </div>
  );
}