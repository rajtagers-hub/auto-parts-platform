"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, MapPin, Phone, MessageCircle, Package, Filter, X, ArrowLeft, Mail
} from 'lucide-react';

const ALBANIAN_CITIES = [
  "Tiranë", "Durrës", "Vlorë", "Elbasan", "Shkodër", "Fier", "Korçë", "Berat",
  "Lushnjë", "Pogradec", "Kavajë", "Gjirokastër", "Sarandë", "Kukës", "Lezhë"
];

interface Part {
  id: string;
  title: string;
  price: number;
  model: string;
  year: number;
  image_url: string;
  created_at: string;
  description?: string;
  users?: {
    name?: string;
    city?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
}

const formatWhatsAppNumber = (phone: string) => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '355' + cleaned.substring(1);
  } else if (cleaned.length === 9 && (cleaned.startsWith('67') || cleaned.startsWith('68') || cleaned.startsWith('69'))) {
    cleaned = '355' + cleaned;
  }
  return cleaned;
};

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBrand = searchParams.get('brand') || '';
  const initialModel = searchParams.get('model') || '';
  const initialPartType = searchParams.get('partType') || '';

  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    const fetchParts = async () => {
      setLoading(true);
      let query = supabase
        .from('parts')
        .select('*, users!seller_id(name, city, phone, whatsapp, email)')
        .eq('status', 'Active');

      if (initialBrand) query = query.ilike('category', `%${initialBrand}%`);
      if (initialModel) query = query.ilike('model', `%${initialModel}%`);
      if (initialPartType) query = query.ilike('title', `%${initialPartType}%`);

      const { data } = await query.order('created_at', { ascending: false });
      setParts(data || []);
      setLoading(false);
    };
    fetchParts();
  }, [initialBrand, initialModel, initialPartType]);

  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  const filteredParts = useMemo(() => {
    const filtered = parts.filter(part => {
      const matchesSearch = part.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.users?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = part.price >= priceRange.min && part.price <= priceRange.max;
      const matchesCity = !selectedCity || part.users?.city === selectedCity;
      return matchesSearch && matchesPrice && matchesCity;
    });
    if (sortBy === 'newest') filtered.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === 'price_asc') filtered.sort((a,b) => a.price - b.price);
    else if (sortBy === 'price_desc') filtered.sort((a,b) => b.price - a.price);
    return filtered;
  }, [parts, searchTerm, priceRange, selectedCity, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: 0, max: 10000 });
    setSelectedCity('');
    setSortBy('newest');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500">Duke ngarkuar...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={18} /> <span className="text-[10px] font-black uppercase">Kthehu</span>
          </button>
          <Link href="/">
            <img src="/autoforms.svg" alt="Auto Forms" className="h-8 w-auto" />
          </Link>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-6">
          REZULTATET<span className="text-blue-600"> E KËRKIMIT</span>
        </h1>
        <p className="text-zinc-500 text-sm mb-8">{filteredParts.length} pjesë të gjetura</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b border-white/5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16}/>
            <input placeholder="Kërko në rezultate..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white"/>
          </div>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as 'newest' | 'price_asc' | 'price_desc')} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
            <option value="newest">Më të rejat</option>
            <option value="price_asc">Çmimi: Nga më i ulëti</option>
            <option value="price_desc">Çmimi: Nga më i larti</option>
          </select>
          <select value={selectedCity} onChange={e=>setSelectedCity(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
            <option value="">Të gjitha qytetet</option>
            {ALBANIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-500">Çmimi:</span>
            <input type="number" placeholder="Min €" value={priceRange.min===0 ? '' : priceRange.min} onChange={e=>setPriceRange({...priceRange, min: parseInt(e.target.value)||0})} className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"/>
            <span>-</span>
            <input type="number" placeholder="Max €" value={priceRange.max===10000 ? '' : priceRange.max} onChange={e=>setPriceRange({...priceRange, max: parseInt(e.target.value)||10000})} className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"/>
          </div>
          {(searchTerm || selectedCity || priceRange.min>0 || priceRange.max<10000 || sortBy!=='newest') && (
            <button onClick={clearFilters} className="text-xs text-blue-500 flex items-center gap-1"><X size={14}/> Pastro filtrat</button>
          )}
        </div>

        {/* Results grid */}
        {filteredParts.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
            <Package size={64} className="mx-auto text-zinc-800 mb-4"/>
            <p className="text-zinc-500 font-black uppercase italic">Nuk u gjet asnjë pjesë</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredParts.map(part => (
              <div 
                key={part.id} 
                onClick={() => setSelectedPart(part)}
                className="group bg-[#0A0A0A] rounded-4xl overflow-hidden border border-white/5 hover:border-blue-600/30 transition-all cursor-pointer"
              >
                <div className="aspect-square bg-zinc-900 relative">
                  {part.image_url ? <img src={part.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/> : <Package size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-800"/>}
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-2xl font-black italic text-lg shadow-lg">{part.price}€</div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black italic uppercase line-clamp-2">{part.title}</h3>
                  <p className="text-[10px] text-blue-500 font-black mt-1">{part.model} • {part.year}</p>
                  <div className="flex items-center gap-3 mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg">
                      {part.users?.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-white">{part.users?.name || 'Shitës i Verifikuar'}</p>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-500">
                        <MapPin size={10}/> {part.users?.city || 'Shqipëri'}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-6">
                    <a 
                      href={`tel:${part.users?.phone}`} 
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 bg-white text-black py-3 rounded-2xl font-black uppercase text-[9px] hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Phone size={12}/> Thirr
                    </a>
                    <a 
                      href={`https://api.whatsapp.com/send?phone=${formatWhatsAppNumber(part.users?.whatsapp || '')}&text=${encodeURIComponent(`Përshëndetje! Jam i interesuar për pjesën: ${part.title} (${part.price}€). A është ende në gjendje?`)}`}
                      target="_blank" 
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-2xl font-black uppercase text-[9px] hover:bg-green-600 transition-all"
                    >
                      <MessageCircle size={12}/> WhatsApp
                    </a>
                  </div>
                  <div className="mt-4 flex items-center justify-center">
                    <div className="text-[8px] font-black uppercase text-zinc-500 italic tracking-widest group-hover:text-blue-600 transition-colors">Shtyp për detaje</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Part Detail Modal */}
      {selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 backdrop-blur-xl bg-black/80 animate-in fade-in duration-300">
          <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-5xl rounded-[2.5rem] overflow-hidden relative max-h-[90vh] flex flex-col md:flex-row shadow-2xl">
            <button 
              onClick={() => setSelectedPart(null)}
              className="absolute top-6 right-6 z-10 p-3 bg-black/50 hover:bg-black rounded-full text-white backdrop-blur-md transition-all"
            >
              <X size={24} />
            </button>

            {/* Image Area */}
            <div className="md:w-1/2 bg-zinc-900 relative min-h-[300px]">
              {selectedPart.image_url ? (
                <img src={selectedPart.image_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-800"><Package size={80} /></div>
              )}
              <div className="absolute bottom-6 left-6 bg-blue-600 text-white px-8 py-4 rounded-3xl font-black italic text-4xl shadow-2xl shadow-blue-600/40">
                {selectedPart.price}€
              </div>
            </div>

            {/* Info Area */}
            <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto flex flex-col">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase italic tracking-widest rounded-full mb-6">
                  ID: {selectedPart.id.substring(0, 8)}
                </div>
                <h2 className="text-4xl md:text-5xl font-black italic uppercase leading-none tracking-tighter mb-4">
                  {selectedPart.title}
                </h2>
                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="px-4 py-2 bg-white/5 rounded-xl text-xs font-black uppercase italic text-zinc-400">
                    Modeli: <span className="text-white">{selectedPart.model}</span>
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-xl text-xs font-black uppercase italic text-zinc-400">
                    Viti: <span className="text-white">{selectedPart.year}</span>
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-xl text-xs font-black uppercase italic text-zinc-400">
                    Qyteti: <span className="text-white">{selectedPart.users?.city}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Përshkrimi i Pjesës</h4>
                  <p className="text-zinc-400 leading-relaxed italic text-sm md:text-base">
                    {selectedPart.description || "Nuk ka përshkrim shtesë për këtë pjesë."}
                  </p>
                </div>

                <div className="p-6 bg-white/5 rounded-3xl mb-10 border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black shadow-lg">
                      {selectedPart.users?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Shitësi i Autorizuar</p>
                      <h4 className="text-xl font-black italic uppercase">{selectedPart.users?.name}</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <a 
                    href={`tel:${selectedPart.users?.phone}`}
                    className="flex items-center justify-center gap-3 bg-white text-black py-5 rounded-2xl font-black uppercase italic text-[11px] tracking-wider hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                  >
                    <Phone size={18} /> Thirr Shitësin
                  </a>
                  <a 
                    href={`https://api.whatsapp.com/send?phone=${formatWhatsAppNumber(selectedPart.users?.whatsapp || '')}&text=${encodeURIComponent(`Përshëndetje! Jam i interesuar për pjesën: ${selectedPart.title} (${selectedPart.price}€). A është ende në gjendje?`)}`}
                    target="_blank"
                    className="flex items-center justify-center gap-3 bg-[#25D366] text-white py-5 rounded-2xl font-black uppercase italic text-[11px] tracking-wider hover:bg-green-600 transition-all shadow-xl"
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                </div>
                <a 
                  href={`mailto:${selectedPart.users?.email || 'info@autoforms.al'}?subject=${encodeURIComponent(`Porosi Pjesë: ${selectedPart.title}`)}&body=${encodeURIComponent(`Përshëndetje ${selectedPart.users?.name},\n\nJam i interesuar për të blerë pjesën "${selectedPart.title}" të cilën e keni postuar në Auto Forms.\n\nModeli: ${selectedPart.model}\nÇmimi: ${selectedPart.price}€\n\nJu lutem më kontaktoni për hapat e mëtejshëm.`)}`}
                  className="flex items-center justify-center gap-3 bg-zinc-800 text-white py-5 rounded-2xl font-black uppercase italic text-[11px] tracking-wider hover:bg-zinc-700 transition-all"
                >
                  <Mail size={18} /> Porosit përmes Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}