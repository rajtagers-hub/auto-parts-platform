"use client";
import React from 'react';
import Link from 'next/link';
import { Phone, Mail, Scale, FileText, Globe, ShieldCheck, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#030303] border-t border-white/5 pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-8">
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-3">
                <img src="/vektra.svg" alt="VEKTRA" className="h-10 w-auto group-hover:scale-105 transition-transform duration-500" />
              </div>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-md italic font-medium">
              Eksperienca premium në kërkimin e pjesëve të këmbimit. Ne transformojmë tregun e aftermarket në Shqipëri duke ofruar siguri, shpejtësi dhe profesionalizëm të pakontestueshëm.
            </p>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                <ShieldCheck size={14} className="text-blue-600" /> Platformë e Verifikuar
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                <Globe size={14} className="text-blue-600" /> Shërbim Kombëtar
              </div>
            </div>
          </div>

          {/* Links Column */}
          <div className="lg:col-span-3 space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-6">Navigimi & Ligji</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/search" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> Kërko Pjesë
                </Link>
              </li>
              <li>
                <Link href="/kushtet" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all flex items-center gap-3">
                  <Scale size={14} className="opacity-50" /> Kushtet e Përdorimit
                </Link>
              </li>
              <li>
                <Link href="/privatesia" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all flex items-center gap-3">
                  <FileText size={14} className="opacity-50" /> Politika e Privatësisë
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-4 space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-6">Asistenca Teknike</h4>
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
              <a href="https://wa.me/355600000000" target="_blank" className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-all duration-300">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">WhatsApp 24/7</p>
                  <p className="text-xs font-black text-white">+355 6X XXX XXXX</p>
                </div>
              </a>
              <a href="mailto:info@vektra.al" className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Email Support</p>
                  <p className="text-xs font-black text-white">info@vektra.al</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center lg:items-start gap-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                Pjesë e ekosistemit <span className="text-white">ENKLAN GROUP</span>
              </div>
              <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest max-w-lg text-center lg:text-left leading-relaxed">
                VEKTRA nuk mban përgjegjësi për gjendjen teknike apo çmimet e produkteve. Përdoruesit janë të detyruar të verifikojnë pjesët para blerjes.
              </p>
            </div>
            
            <div className="flex flex-col items-center lg:items-end gap-3">
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white">© 2026 VEKTRA ALBANIA</div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-700">Powered by</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Enklan Sh.p.k</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
