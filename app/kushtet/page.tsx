import React from 'react';
import { Shield, Scale, FileText } from 'lucide-react';
import Link from 'next/link';

export default function Kushtet() {
  return (
    <div className="min-h-screen bg-black text-zinc-400 p-6 md:p-20 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-block mb-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition">
          ← Kthehu në fillim
        </Link>
        <h1 className="text-white text-5xl md:text-7xl font-black italic mb-10 tracking-tighter">KUSHTET E PËRDORIMIT</h1>
        <div className="space-y-8 text-sm leading-relaxed uppercase tracking-wide">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-white font-bold italic mb-2">1. Platforma Ndërmjetësuese</h2>
              <p>Auto Forms është një platformë ndërmjetësuese sipas legjislacionit shqiptar. Ne nuk jemi pronarë të pjesëve të listuara dhe nuk mbajmë përgjegjësi për cilësinë, garancinë apo çmimet e vendosura nga shitësit.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Scale className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-white font-bold italic mb-2">2. Përgjegjësia e Shitësve</h2>
              <p>Shitësit (pikat e skrapit dhe individët) janë përgjegjës për vërtetësinë e origjinës së pjesëve sipas Ligjit Nr. 9754. Auto Forms nuk garanton origjinalitetin apo funksionalitetin e produkteve.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <FileText className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-white font-bold italic mb-2">3. Të Dhënat Personale</h2>
              <p>Të dhënat tuaja përdoren vetëm për të lehtësuar komunikimin me shitësit. Ne nuk i shesim të dhënat tuaja palëve të treta. Për më shumë, lexoni <Link href="/privatesia" className="text-blue-500 hover:underline">Politikën e Privatësisë</Link>.</p>
            </div>
          </div>
        </div>
        <footer className="mt-20 pt-8 border-t border-white/5 text-[9px] font-black tracking-[0.3em] text-zinc-700 uppercase">
          <p>Auto Forms © 2026 – Të gjitha të drejtat e rezervuara</p>
          <p className="mt-2">Powered by Enklan Sh.p.k</p>
        </footer>
      </div>
    </div>
  );
}