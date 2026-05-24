"use client";
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, MapPin, Phone, MessageCircle, Package, Filter, X, ArrowLeft, ArrowRight, Mail, SlidersHorizontal, ChevronDown, Clock, CheckCircle2, ExternalLink, Heart
} from 'lucide-react';
import Footer from '@/components/Footer';
import Image from 'next/image';

const ALBANIAN_CITIES = [
  "Tiranë", "Durrës", "Vlorë", "Elbasan", "Shkodër", "Fier", "Korçë", "Berat",
  "Lushnjë", "Pogradec", "Kavajë", "Gjirokastër", "Sarandë", "Kukës", "Lezhë"
];

interface Part {
  id: string;
  seller_id: string;
  title: string;
  price: number;
  model: string;
  year: number;
  image_url: string;
  created_at: string;
  leads?: number;
  description?: string;
  users?: {
    name?: string;
    city?: string;
    address?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    user_type?: string;
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
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Infinite Loading States
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 12;

  const observerTarget = useRef(null);

  const handleLead = async (partId: string, sellerId: string, partTitle: string) => {
    try {
      await supabase.rpc('increment_leads', { row_id: partId });
      // Create notification for seller
      await supabase.from('notifications').insert({
        user_id: sellerId,
        type: 'lead',
        message: `Një klient kërkoi kontakt për pjesën tuaj: ${partTitle}`,
        link: '/dashboard/graveyard',
        is_read: false
      });

      if (currentUser) {
        await supabase.from('buyer_leads').insert({
          buyer_id: currentUser.id,
          seller_id: sellerId,
          part_id: partId,
          status: 'contacted'
        });
      }

      // Silent success for leads since it opens whatsapp/dialer anyway
    } catch (err: any) {
      showToast("Pati një problem gjatë regjistrimit të kërkesës.", "error");
    }
  };

  const handleWishlist = async (partId: string) => {
    if (!currentUser) {
      showToast("Duhet të jeni të loguar për të ruajtur pjesë.", "error");
      return;
    }
    try {
      const { error } = await supabase.from('saved_parts').insert({
        user_id: currentUser.id,
        part_id: partId
      });
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          showToast("Kjo pjesë është ruajtur tashmë.", "error");
        } else {
          throw error;
        }
      } else {
        showToast("Pjesa u ruajt në listën tuaj!");
      }
    } catch (err: any) {
      showToast("Pati një problem gjatë ruajtjes.", "error");
    }
  };

  const fetchParts = async (pageNum: number, isNewSearch: boolean = false) => {
    if (isNewSearch) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let query = supabase
      .from('parts')
      .select('*, users!seller_id!inner(name, city, address, phone, whatsapp, email, user_type)')
      .eq('status', 'Active')
      .eq('users.user_type', 'Graveyard')
      .gt('created_at', thirtyDaysAgo.toISOString());

    if (initialBrand) query = query.ilike('category', `%${initialBrand}%`);
    if (initialModel) query = query.ilike('model', `%${initialModel}%`);
    if (initialPartType) query = query.ilike('title', `%${initialPartType}%`);
    
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,oem_number.ilike.%${searchTerm}%`);
    }

    if (selectedCity) {
      query = query.eq('users.city', selectedCity);
    }

    // Apply sorting
    if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
    else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    // Pagination
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error } = await query;
    
    if (!error && data) {
      if (isNewSearch) {
        setParts(data);
      } else {
        setParts(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    // Add debounce for search term
    const timeoutId = setTimeout(() => {
      fetchParts(0, true);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [initialBrand, initialModel, initialPartType, sortBy, searchTerm, selectedCity]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchParts(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading]);

  const filteredParts = useMemo(() => {
    const filtered = parts.filter(part => {
      const matchesPrice = part.price >= priceRange.min && part.price <= priceRange.max;
      return matchesPrice;
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

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">Duke ngarkuar VEKTRA...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl border text-sm font-bold uppercase tracking-wider transition-all animate-pulse ${
          toast.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => router.push('/')} 
            className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white group-hover:bg-white group-hover:text-black transition-all">
              <ArrowLeft size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Kthehu</span>
          </button>
          
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image src="/vektra.svg" alt="VEKTRA" width={100} height={28} className="h-7 w-auto" />
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Sistemi LIVE
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        {/* Title Section */}
        <div className="relative mb-16 md:mb-24">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-600/10 blur-[100px] rounded-full"></div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-6 relative">
            Zbuloni<span className="text-blue-600"> Pjesën Tuaj</span>
          </h1>
          <div className="flex items-center gap-4 text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">
            <Clock size={14} className="text-blue-600" />
            Përditësuar në kohë reale • {filteredParts.length} rezultate të gjetura
          </div>
        </div>

        {/* Professional Filter Bar (Desktop) */}
        <div className="hidden lg:block mb-12 animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
          <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-4 shadow-2xl">
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={18}/>
                <input 
                  placeholder="Kërkoni me emër, model, ose kod OEM..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full lg:w-96 bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:bg-white/10 focus:border-blue-500/50 outline-none transition-all"
                />
              </div>

              <div className="flex gap-3">
                <div className="relative">
                  <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14}/>
                  <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="appearance-none bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-10 text-[10px] font-black uppercase tracking-widest text-zinc-400 outline-none cursor-pointer">
                    <option value="newest">Më të rejat</option>
                    <option value="price_asc">Çmimi: Ulët</option>
                    <option value="price_desc">Çmimi: Lart</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={14}/>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14}/>
                  <select value={selectedCity} onChange={e=>setSelectedCity(e.target.value)} className="appearance-none bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-10 text-[10px] font-black uppercase tracking-widest text-zinc-400 outline-none cursor-pointer">
                    <option value="">Qyteti</option>
                    {ALBANIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={14}/>
                </div>

                <div className="flex items-center gap-2 px-4 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-zinc-600">€</span>
                  <input type="number" placeholder="MIN" value={priceRange.min===0 ? '' : priceRange.min} onChange={e=>setPriceRange({...priceRange, min: parseInt(e.target.value)||0})} className="w-16 bg-transparent py-4 text-xs font-bold text-white outline-none" />
                  <span className="text-zinc-800">•</span>
                  <input type="number" placeholder="MAX" value={priceRange.max===10000 ? '' : priceRange.max} onChange={e=>setPriceRange({...priceRange, max: parseInt(e.target.value)||10000})} className="w-16 bg-transparent py-4 text-xs font-bold text-white outline-none" />
                </div>

                {(searchTerm || selectedCity || priceRange.min>0 || priceRange.max<10000 || sortBy!=='newest') && (
                  <button onClick={clearFilters} className="px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                    Pastro
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filter Options (Stacked for readability) */}
        <div className="lg:hidden space-y-4 mb-10">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={18}/>
            <input 
              placeholder="Kërkoni emër, model, OEM..." 
              value={searchTerm} 
              onChange={e=>setSearchTerm(e.target.value)} 
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl py-4 pl-16 pr-6 text-sm text-white outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14}/>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="w-full appearance-none bg-[#0A0A0A] border border-white/10 rounded-2xl py-4 pl-12 pr-10 text-[10px] font-black uppercase tracking-widest text-zinc-400 outline-none">
                <option value="newest">Më të rejat</option>
                <option value="price_asc">Çmimi: Ulët</option>
                <option value="price_desc">Çmimi: Lart</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={14}/>
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14}/>
              <select value={selectedCity} onChange={e=>setSelectedCity(e.target.value)} className="w-full appearance-none bg-[#0A0A0A] border border-white/10 rounded-2xl py-4 pl-12 pr-10 text-[10px] font-black uppercase tracking-widest text-zinc-400 outline-none">
                <option value="">Qyteti</option>
                {ALBANIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={14}/>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 bg-[#0A0A0A] border border-white/10 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Çmimi:</span>
            <input type="number" placeholder="MIN" value={priceRange.min===0 ? '' : priceRange.min} onChange={e=>setPriceRange({...priceRange, min: parseInt(e.target.value)||0})} className="flex-1 bg-transparent py-4 text-xs font-bold text-white outline-none" />
            <span className="text-zinc-800">•</span>
            <input type="number" placeholder="MAX" value={priceRange.max===10000 ? '' : priceRange.max} onChange={e=>setPriceRange({...priceRange, max: parseInt(e.target.value)||10000})} className="flex-1 bg-transparent py-4 text-xs font-bold text-white outline-none" />
          </div>
          {(searchTerm || selectedCity || priceRange.min>0 || priceRange.max<10000 || sortBy!=='newest') && (
            <button onClick={clearFilters} className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">
              Pastro të gjitha filtrat
            </button>
          )}
        </div>

        {/* Results Grid */}
        {filteredParts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Package size={32} className="text-zinc-700"/>
            </div>
            <h3 className="text-2xl font-black italic uppercase text-zinc-400 tracking-tight">Asnjë rezultat</h3>
            <p className="text-zinc-600 text-xs mt-2 uppercase tracking-widest">Provoni të ndryshoni filtrat e kërkimit</p>
            <button onClick={clearFilters} className="mt-8 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase italic text-[11px] hover:bg-blue-600 hover:text-white transition-all">Rivendos kërkimin</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {filteredParts.map(part => (
              <div 
                key={part.id} 
                onClick={() => setSelectedPart(part)}
                className="group relative bg-[#080808] rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-blue-600/40 transition-all duration-500 cursor-pointer shadow-2xl"
              >
                {/* Image Container */}
                <div className="aspect-square relative overflow-hidden">
                  {part.image_url ? (
                    <Image src={part.image_url} fill sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" alt={part.title} className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-800"><Package size={48} /></div>
                  )}
                  
                  <div className="absolute top-3 left-3 md:top-6 md:left-6">
                    <div className="bg-black/50 backdrop-blur-md border border-white/10 text-white px-2 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase italic tracking-widest">
                      {part.model}
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 md:top-6 md:right-6">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleWishlist(part.id); }}
                      className="p-2 bg-black/50 backdrop-blur-md border border-white/10 text-white rounded-full hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all shadow-xl"
                    >
                      <Heart size={16} className="md:w-5 md:h-5" />
                    </button>
                  </div>
                  
                  <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6 bg-blue-600 text-white px-3 py-1.5 md:px-6 md:py-3 rounded-lg md:rounded-2xl font-black italic text-lg md:text-2xl shadow-2xl">
                    {part.price}€
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-8">
                  <h3 className="text-sm md:text-xl font-black italic uppercase leading-tight line-clamp-2 min-h-[2.5rem] md:min-h-[3rem] group-hover:text-blue-500 transition-colors">
                    {part.title}
                  </h3>
                  <div className="mt-4 md:mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest">{part.users?.name}</span>
                    <ArrowRight size={14} className="text-zinc-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={observerTarget} className="h-20 w-full flex items-center justify-center mt-10">
          {loadingMore && (
            <div className="flex items-center gap-3 text-zinc-600 animate-pulse">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] ml-2">Duke ngarkuar më shumë...</span>
            </div>
          )}
          {!hasMore && parts.length > 0 && (
            <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em] italic">Fundi i listës</p>
          )}
        </div>
      </main>

      {/* Premium Detail Modal */}
      {selectedPart && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-0 md:p-6 lg:p-10 backdrop-blur-3xl bg-black/90 animate-in fade-in duration-300">
          <div className="bg-zinc-950 w-full h-full md:h-auto md:max-w-7xl md:rounded-[4rem] border-white/10 border-0 md:border shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row relative">
            {/* Close Button Mobile/Desktop */}
            <button 
              onClick={() => setSelectedPart(null)}
              className="absolute top-6 right-6 z-150 p-4 bg-black/50 backdrop-blur-xl border border-white/10 text-white rounded-full hover:bg-red-600 transition-all shadow-2xl"
            >
              <X size={24} />
            </button>

            {/* Modal Image Area */}
            <div className="w-full md:w-1/2 bg-zinc-950 relative h-[40vh] md:h-auto min-h-[300px]">
              {selectedPart.image_url ? (
                <Image src={selectedPart.image_url} fill sizes="(max-width: 768px) 100vw, 50vw" alt={selectedPart.title} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-900"><Package size={120} /></div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                <div className="bg-blue-600 text-white px-6 py-3 md:px-10 md:py-6 rounded-2xl md:rounded-[2rem] font-black italic text-3xl md:text-5xl shadow-2xl shadow-blue-600/40">
                  {selectedPart.price}€
                </div>
              </div>
            </div>

            {/* Modal Info Area */}
            <div className="w-full md:w-1/2 p-6 md:p-16 overflow-y-auto flex flex-col bg-zinc-950">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                  <div className="px-3 py-1 md:px-4 md:py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[8px] md:text-[10px] font-black uppercase italic tracking-widest rounded-full">
                    SHTESË E RE
                  </div>
                  <div className="text-[9px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    REF: {selectedPart.id.substring(0, 8)}
                  </div>
                </div>

                <h2 className="text-3xl md:text-6xl font-black italic uppercase leading-none tracking-tighter mb-6 md:mb-8 text-white">
                  {selectedPart.title}
                </h2>

                <div className="flex gap-4 mb-8">
                  <button onClick={() => handleWishlist(selectedPart.id)} className="flex items-center gap-2 bg-pink-500/10 text-pink-500 border border-pink-500/20 px-6 py-3 rounded-xl font-black uppercase italic text-sm hover:bg-pink-500 hover:text-white transition-all shadow-[0_0_20px_rgba(236,72,153,0.1)]">
                    <Heart size={18} /> Ruaj
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-8 md:mb-12">
                  {[
                    { label: "Modeli", value: selectedPart.model },
                    { label: "Viti", value: selectedPart.year },
                    { label: "Qyteti", value: selectedPart.users?.city },
                    { label: "Gjendja", value: "E Mirë" },
                    { 
                      label: "Lokacioni", 
                      value: selectedPart.users?.address || selectedPart.users?.city,
                      isLink: true,
                      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((selectedPart.users?.address || '') + ", " + (selectedPart.users?.city || ''))}`
                    },
                  ].map((item, i) => (
                    <div key={i} className="p-3 md:p-4 bg-white/[0.03] border border-white/5 rounded-xl md:rounded-2xl relative group/item">
                      <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">{item.label}</p>
                      {item.isLink ? (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase flex items-center gap-1 hover:text-white transition-colors"
                        >
                          HARTA <ExternalLink size={10}/>
                        </a>
                      ) : (
                        <p className="text-[10px] md:text-xs font-black text-white uppercase">{item.value}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
                  <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Specifikimet Teknike</h4>
                  <p className="text-zinc-400 leading-relaxed italic text-sm md:text-lg">
                    {selectedPart.description || "Kjo pjesë origjinale është testuar dhe verifikuar për performancë maksimale. Ofrohet me garanci funksionale nga shitësi i autorizuar."}
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 mb-8 md:mb-12">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-lg md:text-xl font-black italic shadow-lg shadow-blue-600/20">
                      {selectedPart.users?.name?.[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-blue-500">Shitësi i Autorizuar</p>
                      <p className="text-lg md:text-xl font-black uppercase italic text-white">{selectedPart.users?.name}</p>
                    </div>
                  </div>
                  <p className="text-[10px] md:text-xs text-zinc-500 leading-relaxed mb-6">
                    Ky biznes është i verifikuar nga platforma VEKTRA. Çdo transaksion monitorohet për sigurinë tuaj.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        window.location.href = `tel:${selectedPart.users?.phone}`;
                        handleLead(selectedPart.id, selectedPart.seller_id, selectedPart.title);
                      }}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                    >
                      <Phone size={16}/> Thirr
                    </button>
                    <button 
                      onClick={() => {
                        window.open(`https://wa.me/${selectedPart.users?.whatsapp?.replace(/\+/g, '')}`, '_blank');
                        handleLead(selectedPart.id, selectedPart.seller_id, selectedPart.title);
                      }}
                      className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-green-600/20"
                    >
                      <MessageCircle size={16}/> WhatsApp
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-center pb-6 md:pb-0">
                <p className="text-[8px] md:text-[10px] font-black text-zinc-700 uppercase tracking-widest">ID e Referencës: {selectedPart.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}