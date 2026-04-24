import React from 'react';
import { Shield, Lock, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function Privatesia() {
  return (
    <div className="min-h-screen bg-black text-zinc-400 p-6 md:p-20 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-block mb-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition">
          ← Kthehu në fillim
        </Link>
        <h1 className="text-white text-5xl md:text-7xl font-black italic mb-10 tracking-tighter">POLITIKA E PRIVATËSISË</h1>
        <div className="space-y-8 text-sm leading-relaxed uppercase tracking-wide">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-white font-bold italic mb-2">Mbrojtja e të Dhënave</h2>
              <p>Në përputhje me Ligjin Nr. 9887 "Për mbrojtjen e të dhënave personale", AUTO PJESË mbledh vetëm informacionin e nevojshëm për të lehtësuar kontaktin midis blerësve dhe shitësve. Këto të dhëna përfshijnë emrin, numrin e telefonit, dhe adresën e emailit (vetëm për shitësit).</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Lock className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-white font-bold italic mb-2">Përdorimi i Informacionit</h2>
              <p>Informacioni i mbledhur përdoret ekskluzivisht për:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Verifikimin e kërkesave për pjesë këmbimi</li>
                <li>Lehtësimin e komunikimit në WhatsApp ose telefon</li>
                <li>Përmirësimin e përvojës së përdoruesit në platformë</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <EyeOff className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-white font-bold italic mb-2">Siguria</h2>
              <p>Ne nuk shesim dhe nuk transferojmë të dhënat tuaja te palët e treta për qëllime marketingu. Serverat tanë monitorohen vazhdimisht për të parandaluar aksesin e paautorizuar. Të dhënat ruhen vetëm për aq kohë sa është e nevojshme për të ofruar shërbimin.</p>
            </div>
          </div>
        </div>
        <footer className="mt-20 pt-8 border-t border-white/5 text-[9px] font-black tracking-[0.3em] text-zinc-700 uppercase">
          <p>Auto Pjesë Shqipëri © 2026 – Të gjitha të drejtat e rezervuara</p>
          <p className="mt-2">Powered by Enklan Sh.p.k</p>
        </footer>
      </div>
    </div>
  );
}