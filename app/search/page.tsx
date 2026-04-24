export const dynamic = 'force-dynamic';
"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, MapPin, Phone, MessageCircle, Package, Filter, X, 
  SlidersHorizontal, ChevronDown, Star, TrendingUp, Clock, ArrowLeft
} from 'lucide-react';

// Predefined list of Albanian cities
const ALBANIAN_CITIES = [
  "Tiranë", "Durrës", "Vlorë", "Elbasan", "Shkodër", "Fier", "Korçë", "Berat", 
  "Lushnjë", "Pogradec", "Kavajë", "Gjirokastër", "Sarandë", "Kukës", "Lezhë", 
  "Dibër", "Mirditë", "Pukë", "Krujë", "Burrel", "Rrëshen", "Peqin", "Bilisht", 
  "Librazhd", "Tepelenë", "Gramsh", "Bulqizë", "Përmet", "Delvinë", "Himarë"
];

export default function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBrand = searchParams.get('brand') || '';
  const initialModel = searchParams.get('model') || '';
  const initialPartType = searchParams.get('partType') || '';

  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    const fetchParts = async () => {
      setLoading(true);
      let query = supabase
        .from('parts')
        .select(`
          *,
          users!seller_id (
            name, city, phone, whatsapp
          )
        `)
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

  // Filter and sort logic
  const filteredParts = useMemo(() => {
    let filtered = parts.filter(part => {
      const matchesSearch = part.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.users?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = part.price >= priceRange.min && part.price <= priceRange.max;
      const matchesCity = !selectedCity || part.users?.city === selectedCity;
      return matchesSearch && matchesPrice && matchesCity;
    });

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    }
    return filtered;
  }, [parts, searchTerm, priceRange, selectedCity, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: 0, max: 10000 });
    setSelectedCity('');
    setSortBy('newest');
  };

  const hasActiveFilters = searchTerm !== '' || selectedCity !== '' || priceRange.min > 0 || priceRange.max < 10000 || sortBy !== 'newest';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500 font-black uppercase italic text-xs tracking-widest">Duke ngarkuar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Kthehu</span>
          </button>
          <div className="text-xl font-black italic tracking-tighter uppercase">AUTO PJESË</div>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Title and Count */}
        <div className="mb-10">
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
            REZULTATET<span className="text-blue-600"> E KËRKIMIT</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-4">{filteredParts.length} pjesë të gjetura</p>
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-3 mb-6 text-sm font-black uppercase italic"
        >
          <Filter size={16} /> Filtro & Rendit
          {hasActiveFilters && <span className="w-2 h-2 bg-blue-500 rounded-full ml-1"></span>}
        </button>

        {/* Desktop Filters Bar */}
        <div className="hidden md:flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-white/5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input
              type="text"
              placeholder="Kërko në rezultate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-blue-600 transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600"
          >
            <option value="newest">Më të rejat</option>
            <option value="price_asc">Çmimi: Nga më i ulëti</option>
            <option value="price_desc">Çmimi: Nga më i larti</option>
          </select>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600"
          >
            <option value="">Të gjitha qytetet</option>
            {ALBANIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-500">Çmimi:</span>
            <input
              type="number"
              placeholder="Min €"
              value={priceRange.min === 0 ? '' : priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
              className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max €"
              value={priceRange.max === 10000 ? '' : priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 10000 })}
              className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
              <X size={14} /> Pastro filtrat
            </button>
          )}
        </div>

        {/* Mobile Filters Panel */}
        {showFilters && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-xl p-6 animate-in slide-in-from-bottom-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black italic uppercase">Filtro & Rendit</h3>
              <button onClick={() => setShowFilters(false)}><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Kërko</label>
                <input type="text" placeholder="Kërko në rezultate..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Rendit sipas</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white">
                  <option value="newest">Më të rejat</option>
                  <option value="price_asc">Çmimi: Nga më i ulëti</option>
                  <option value="price_desc">Çmimi: Nga më i larti</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Qyteti</label>
                <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white">
                  <option value="">Të gjitha qytetet</option>
                  {ALBANIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Gama e çmimit (€)</label>
                <div className="flex gap-4">
                  <input type="number" placeholder="Min" value={priceRange.min === 0 ? '' : priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })} className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
                  <input type="number" placeholder="Max" value={priceRange.max === 10000 ? '' : priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 10000 })} className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
                </div>
              </div>
              <button onClick={clearFilters} className="w-full bg-white/5 py-3 rounded-xl text-sm">Pastro filtrat</button>
              <button onClick={() => setShowFilters(false)} className="w-full bg-blue-600 py-4 rounded-xl font-black uppercase italic">Shfaq rezultatet</button>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {filteredParts.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
            <Package size={64} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-500 font-black uppercase italic text-sm tracking-widest">Nuk u gjet asnjë pjesë</p>
            <button onClick={() => router.push('/')} className="mt-6 text-blue-500 text-xs underline">Kthehu në faqen kryesore</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredParts.map((part) => (
              <div key={part.id} className="group bg-[#0A0A0A] rounded-4xl overflow-hidden border border-white/5 transition-all duration-300 hover:border-blue-600/30 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-600/10">
                {/* Image */}
                <div className="aspect-square bg-zinc-900 relative overflow-hidden">
                  {part.image_url ? (
                    <img src={part.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={part.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={48} className="text-zinc-800" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-2xl font-black italic text-lg shadow-lg shadow-blue-600/30">
                    {part.price}€
                  </div>
                  {part.views > 100 && (
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-wider">
                      <TrendingUp size={10} className="inline mr-1" /> Popullor
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-6">
                  <h3 className="text-xl font-black italic uppercase tracking-tight leading-tight line-clamp-2">
                    {part.title}
                  </h3>
                  <p className="text-[10px] text-blue-500 font-black uppercase tracking-wider mt-1">
                    {part.model || 'Model'} • {part.year || 'Viti'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-3 line-clamp-2">
                    {part.description?.substring(0, 100)}...
                  </p>

                  {/* Seller Info */}
                  <div className="flex items-center gap-3 mt-6 p-4 bg-zinc-900/30 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black italic shadow-lg">
                      {part.users?.name?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase italic">{part.users?.name || 'Shitës'}</p>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-500 mt-1">
                        <MapPin size={10} /> {part.users?.city || 'Shqipëri'}
                      </div>
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <a
                      href={`tel:${part.users?.phone}`}
                      className="flex items-center justify-center gap-2 bg-white text-black py-3 rounded-2xl font-black uppercase text-[9px] hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-md"
                    >
                      <Phone size={12} /> Thirr
                    </a>
                    <a
                      href={`https://wa.me/${part.users?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Përshëndetje ${part.users?.name}! Jam i interesuar për pjesën: ${part.title}. A është ende e disponueshme?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-2xl font-black uppercase text-[9px] hover:bg-green-600 transition-all active:scale-95 shadow-md shadow-green-500/20"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}